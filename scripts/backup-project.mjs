import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, `PROJECT-BACKUP-${new Date().toISOString().slice(0, 10)}.txt`);

// Folders to skip entirely
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".turbo",
  ".vercel",
  "coverage",
  ".expo",
  ".cache",
]);

// Files to skip
const SKIP_FILES = new Set([
  ".DS_Store",
  "Thumbs.db",
]);

// Extensions to include (add more if needed)
const INCLUDE_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".css", ".scss", ".html",
  ".md", ".txt",
  ".env", ".env.local", ".env.example",
  ".yml", ".yaml", ".toml",
  ".svg", ".ico", ".png", ".jpg", ".jpeg", ".webp", ".gif",
]);

const lines = [];
lines.push("=".repeat(80));
lines.push(`PROJECT BACKUP — ${new Date().toISOString()}`);
lines.push(`Root: ${ROOT}`);
lines.push("=".repeat(80));
lines.push("");

let fileCount = 0;
let totalBytes = 0;

function walk(dir, relBase = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = relBase ? path.join(relBase, entry.name) : entry.name;

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(fullPath, relPath);
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      // Include files with no extension only if they're common config files
      const noExt = ext === "";
      const isConfig = ["Dockerfile", "Procfile", "Makefile", ".gitignore", ".env", ".env.local", ".env.example"].includes(entry.name);
      if (!noExt && !INCLUDE_EXT.has(ext)) continue;
      if (noExt && !isConfig) continue;

      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > 2 * 1024 * 1024) {
          lines.push(`--- SKIPPED (too large): ${relPath} (${Math.round(stat.size / 1024)}KB) ---`);
          lines.push("");
          continue;
        }

        const content = fs.readFileSync(fullPath, "utf8");
        lines.push(`--- FILE: ${relPath.replace(/\\/g, "/")} ---`);
        lines.push(content);
        lines.push(`--- END FILE: ${relPath.replace(/\\/g, "/")} ---`);
        lines.push("");
        fileCount++;
        totalBytes += content.length;
      } catch (err) {
        lines.push(`--- ERROR reading ${relPath}: ${err.message} ---`);
        lines.push("");
      }
    }
  }
}

walk(ROOT);

lines.push("=".repeat(80));
lines.push(`SUMMARY: ${fileCount} files, ${(totalBytes / 1024).toFixed(1)} KB of text`);
lines.push(`Generated: ${new Date().toLocaleString()}`);
lines.push("=".repeat(80));

fs.writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(`✅ Backup written: ${OUT}`);
console.log(`   Files: ${fileCount}`);
console.log(`   Size: ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
