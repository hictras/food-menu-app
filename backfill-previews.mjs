import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("missing TURSO_DATABASE_URL"); process.exit(1); }

const db = createClient({ url, authToken });

console.log("▶ Finding notifications that need previews...");
const needs = await db.execute(`
  SELECT id, url FROM notifications
  WHERE (preview_image IS NULL OR preview_image = '')
    AND url IS NOT NULL
    AND url LIKE '%/recipes/%'
  ORDER BY id DESC
`);

console.log(`  ${needs.rows.length} notification(s) need backfill`);
if (needs.rows.length === 0) {
  console.log("✅ nothing to do");
  process.exit(0);
}

let updated = 0;
let skipped = 0;

for (const row of needs.rows) {
  const match = String(row.url).match(/\/recipes\/(\d+)/);
  if (!match) { skipped++; continue; }
  const recipeId = Number(match[1]);

  const rec = await db.execute({
    sql: "SELECT name, image_url FROM recipes WHERE id = ? LIMIT 1",
    args: [recipeId],
  });

  if (rec.rows.length === 0 || !rec.rows[0].image_url) {
    skipped++;
    continue;
  }

  await db.execute({
    sql: "UPDATE notifications SET preview_image = ?, preview_title = COALESCE(preview_title, ?) WHERE id = ?",
    args: [rec.rows[0].image_url, rec.rows[0].name, row.id],
  });
  updated++;
  console.log(`  #${row.id} → recipe ${recipeId} → ${rec.rows[0].name}`);
}

console.log(`\n✅ backfilled: ${updated}, skipped: ${skipped}`);
