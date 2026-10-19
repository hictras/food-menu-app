/**
 * Compress all recipe images in R2.
 *
 * For each recipe with an image_url pointing at our R2 public domain:
 *   1. Download the original
 *   2. If under 500KB, skip (already small)
 *   3. Otherwise, compress with sharp:
 *      - Resize if wider than 1600px
 *      - JPEG quality 82
 *      - Convert to WebP?  (no — keep original format to avoid 404 on old links)
 *   4. Re-upload to same key
 *   5. Log old vs new size
 *
 * Safe to re-run. Skips images already under threshold.
 *
 * Usage:
 *   node --env-file=.env.local scripts/compress-existing-images.mjs
 *   node --env-file=.env.local scripts/compress-existing-images.mjs --dry-run
 */

import { createClient } from "@libsql/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const DRY_RUN = process.argv.includes("--dry-run");
const SIZE_THRESHOLD = 500 * 1024; // 500KB — skip if already smaller
const MAX_WIDTH = 1600;
const QUALITY = 82;

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;
if (!tursoUrl) { console.error("❌ TURSO_DATABASE_URL not set"); process.exit(1); }

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const db = createClient({ url: tursoUrl, authToken: tursoToken });

const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
if (!publicBase) { console.error("❌ NEXT_PUBLIC_R2_PUBLIC_URL not set"); process.exit(1); }

console.log("Public base:", publicBase);
console.log("Dry run:", DRY_RUN ? "YES (no writes)" : "no");
console.log("Skip if under:", Math.round(SIZE_THRESHOLD / 1024), "KB");
console.log("Max width:", MAX_WIDTH, "px");
console.log("Quality:", QUALITY);
console.log("");

const result = await db.execute("SELECT id, name, image_url FROM recipes WHERE image_url IS NOT NULL AND image_url != ''");
const rows = result.rows;
console.log(`Found ${rows.length} recipe(s) with images\n`);

let processed = 0, skipped = 0, failed = 0;
let bytesBefore = 0, bytesAfter = 0;

for (const row of rows) {
  const url = String(row.image_url);
  if (!url.startsWith(publicBase)) {
    console.log(`#${row.id} SKIP (not our R2): ${url.slice(0, 60)}`);
    skipped++;
    continue;
  }

  const key = url.slice(publicBase.length + 1);
  const label = `#${row.id} ${(row.name || "").toString().slice(0, 30)}`;

  try {
    console.log(`${label} → ${key}`);

    // Download
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download ${res.status}`);
    const original = Buffer.from(await res.arrayBuffer());
    bytesBefore += original.length;

    if (original.length < SIZE_THRESHOLD) {
      console.log(`  SKIP (already ${Math.round(original.length / 1024)}KB)`);
      bytesAfter += original.length;
      skipped++;
      continue;
    }

    // Detect content type
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const isJpeg = contentType.includes("jpeg") || key.endsWith(".jpg") || key.endsWith(".jpeg");
    const isPng = contentType.includes("png") || key.endsWith(".png");
    const isWebp = contentType.includes("webp") || key.endsWith(".webp");

    // Compress
    let pipeline = sharp(original).resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
    });

    let outputBuf, outputType;
    if (isJpeg) {
      outputBuf = await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
      outputType = "image/jpeg";
    } else if (isPng) {
      outputBuf = await pipeline.png({ quality: QUALITY, compressionLevel: 9 }).toBuffer();
      outputType = "image/png";
    } else if (isWebp) {
      outputBuf = await pipeline.webp({ quality: QUALITY }).toBuffer();
      outputType = "image/webp";
    } else {
      console.log(`  SKIP (unknown format: ${contentType})`);
      bytesAfter += original.length;
      skipped++;
      continue;
    }

    const savings = original.length - outputBuf.length;
    const pct = Math.round((savings / original.length) * 100);
    console.log(`  ${Math.round(original.length / 1024)}KB → ${Math.round(outputBuf.length / 1024)}KB (−${pct}%)`);

    if (DRY_RUN) {
      console.log(`  [dry-run] would upload to ${key}`);
      bytesAfter += outputBuf.length;
      processed++;
      continue;
    }

    // Re-upload (same key, so URL doesn't change)
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: outputBuf,
      ContentType: outputType,
    }));

    console.log(`  ✅ uploaded`);
    bytesAfter += outputBuf.length;
    processed++;
  } catch (err) {
    console.error(`  ❌ ERROR: ${err.message}`);
    failed++;
  }
}

console.log("\n===== SUMMARY =====");
console.log(`Processed: ${processed}`);
console.log(`Skipped:   ${skipped}`);
console.log(`Failed:    ${failed}`);
console.log(`Before:    ${(bytesBefore / 1024 / 1024).toFixed(2)} MB`);
console.log(`After:     ${(bytesAfter / 1024 / 1024).toFixed(2)} MB`);
if (bytesBefore > 0) {
  const pct = Math.round(((bytesBefore - bytesAfter) / bytesBefore) * 100);
  console.log(`Saved:     ${((bytesBefore - bytesAfter) / 1024 / 1024).toFixed(2)} MB (${pct}%)`);
}
