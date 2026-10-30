import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("missing TURSO_DATABASE_URL"); process.exit(1); }

const db = createClient({ url, authToken });

console.log("Creating recipe_likes table...");

await db.execute(`
  CREATE TABLE IF NOT EXISTS recipe_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    phone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

await db.execute(`
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_like_recipe_visitor
  ON recipe_likes(recipe_id, visitor_id)
`);

const cols = await db.execute("PRAGMA table_info(recipe_likes)");
console.log("\nColumns:");
for (const r of cols.rows) console.log(`  ${r.name} (${r.type})`);

const idx = await db.execute("PRAGMA index_list(recipe_likes)");
console.log("\nIndexes:");
for (const r of idx.rows) console.log(`  ${r.name} — unique: ${r.unique}`);

console.log("\n✅ recipe_likes ready");
