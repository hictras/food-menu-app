import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT = path.join(ROOT, `PROJECT-BACKUP-${stamp}.txt`);

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build",
  ".turbo", ".vercel", ".cache", "coverage", ".pnp",
]);
const SKIP_FILES = new Set([
  ".DS_Store", "Thumbs.db", ".env", ".env.local",
  "generate-backup.mjs", "package-lock.json",
]);
const SKIP_PREFIXES = [".bak-", ".fix-backup", "all_code.txt", "PROJECT-BACKUP-"];
const SKIP_DIR_PREFIXES = [".bak-", ".fix-backup", "_backup"];

const INCLUDE_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".css", ".scss", ".html", ".md", ".txt",
  ".yml", ".yaml", ".toml", ".svg",
]);
const ALLOW_NO_EXT = new Set([
  "Dockerfile", "Procfile", "Makefile", ".gitignore", ".env.example", ".npmrc",
]);
const MAX_BYTES = 2 * 1024 * 1024;

const lines = [];
const skipped = [];
let fileCount = 0;
let totalBytes = 0;

function isBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}
function shouldSkipDir(name) {
  if (SKIP_DIRS.has(name)) return true;
  return SKIP_DIR_PREFIXES.some((p) => name.startsWith(p));
}
function shouldSkipFile(name) {
  if (SKIP_FILES.has(name)) return true;
  if (SKIP_PREFIXES.some((p) => name.startsWith(p))) return true;
  if (/^PROJECT-BACKUP-.*\.txt$/i.test(name)) return true;
  return false;
}

function walk(dir, relBase = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = relBase ? path.join(relBase, entry.name) : entry.name;

    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) { skipped.push({ path: relPath + "/", reason: "dir-skip" }); continue; }
      walk(fullPath, relPath);
      continue;
    }
    if (!entry.isFile()) continue;
    if (shouldSkipFile(entry.name)) { skipped.push({ path: relPath, reason: "file-skip" }); continue; }

    const ext = path.extname(entry.name).toLowerCase();
    const noExt = ext === "";
    if (noExt && !ALLOW_NO_EXT.has(entry.name)) { skipped.push({ path: relPath, reason: "no-ext" }); continue; }
    if (!noExt && !INCLUDE_EXT.has(ext)) { skipped.push({ path: relPath, reason: "ext" }); continue; }

    try {
      const stat = fs.statSync(fullPath);
      if (stat.size > MAX_BYTES) { skipped.push({ path: relPath, reason: "size" }); continue; }
      const buf = fs.readFileSync(fullPath);
      if (isBinary(buf)) { skipped.push({ path: relPath, reason: "binary" }); continue; }
      const content = buf.toString("utf8");
      lines.push(`--- FILE: ${relPath.replace(/\\/g, "/")} ---`);
      lines.push(content);
      lines.push(`--- END FILE: ${relPath.replace(/\\/g, "/")} ---`);
      lines.push("");
      fileCount++;
      totalBytes += content.length;
    } catch (err) {
      skipped.push({ path: relPath, reason: "read-error" });
    }
  }
}

walk(ROOT);

const header = [
  "=".repeat(80),
  `PROJECT BACKUP — ${new Date().toISOString()}`,
  `Root: ${ROOT}`,
  "=".repeat(80),
  "",
];
const footer = [
  "=".repeat(80),
  `SUMMARY: ${fileCount} files, ${(totalBytes / 1024).toFixed(1)} KB of text`,
  `Generated: ${new Date().toLocaleString()}`,
  "",
  `--- SKIPPED (${skipped.length}) ---`,
  ...skipped.map((s) => `  [${s.reason}] ${s.path}`),
  "=".repeat(80),
];

fs.writeFileSync(OUT, [...header, ...lines, ...footer].join("\n"), "utf8");
console.log(`✅ Backup written: ${OUT}`);
console.log(`   Files:  ${fileCount}`);
console.log(`   Size:   ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
console.log(`   Skipped: ${skipped.length}`);
