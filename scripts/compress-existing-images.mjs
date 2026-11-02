import { createClient } from "@libsql/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const DRY_RUN = process.argv.includes("--dry-run");
const TARGET_SIZE_BYTES = 30 * 1024; // 30 KB target

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
console.log("Target size:", Math.round(TARGET_SIZE_BYTES / 1024), "KB");
console.log("");

// Fetch all 3 image columns
const result = await db.execute("SELECT id, name, image_url, image_1_url, image_2_url FROM recipes");
const rows = result.rows;
console.log(`Found ${rows.length} recipe(s)\n`);

// Extract all unique image URLs into a Set to avoid processing duplicates
const allUrls = new Set();
for (const row of rows) {
  if (row.image_url) allUrls.add(String(row.image_url));
  if (row.image_1_url) allUrls.add(String(row.image_1_url));
  if (row.image_2_url) allUrls.add(String(row.image_2_url));
}

console.log(`Found ${allUrls.size} unique image(s) to process\n`);

let processed = 0, skipped = 0, failed = 0;
let bytesBefore = 0, bytesAfter = 0;

for (const url of Array.from(allUrls)) {
  if (!url.startsWith(publicBase)) continue;

  const key = url.slice(publicBase.length + 1);
  const label = `Image: ${key}`;

  try {
    console.log(`${label}`);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download ${res.status}`);
    const original = Buffer.from(await res.arrayBuffer());
    bytesBefore += original.length;

    // If under 30KB, skip
    if (original.length < TARGET_SIZE_BYTES) {
      console.log(`  SKIP (already ${Math.round(original.length / 1024)}KB)`);
      bytesAfter += original.length;
      skipped++;
      continue;
    }

    // Aggressive compression
    const outputBuf = await sharp(original)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

    const savings = original.length - outputBuf.length;
    const pct = Math.round((savings / original.length) * 100);
    console.log(`  ${Math.round(original.length / 1024)}KB → ${Math.round(outputBuf.length / 1024)}KB (−${pct}%)`);

    if (DRY_RUN) {
      bytesAfter += outputBuf.length;
      processed++;
      continue;
    }

    // Upload back to R2 (overwriting the original)
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: outputBuf,
      ContentType: "image/webp",
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
