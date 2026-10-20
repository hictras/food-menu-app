/**
 * Create the meal_plan table in Turso.
 *
 * Columns:
 *   id, date (YYYY-MM-DD), slot (breakfast|lunch|dinner|snack),
 *   recipe_id (FK to recipes, cascade delete), created_at
 *
 * Unique constraint: one row per (date, slot).
 *
 * Safe to re-run — uses CREATE TABLE IF NOT EXISTS.
 */
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("missing TURSO_DATABASE_URL");
  process.exit(1);
}

const db = createClient({ url, authToken });

console.log("Creating meal_plan table...");

await db.execute(`
  CREATE TABLE IF NOT EXISTS meal_plan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    slot TEXT NOT NULL,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, slot)
  )
`);

console.log("✅ meal_plan table created");

// Verify columns
const cols = await db.execute("PRAGMA table_info(meal_plan)");
console.log("\nColumns:");
for (const row of cols.rows) {
  console.log(`  ${row.name} (${row.type})${row.notnull ? " NOT NULL" : ""}${row.pk ? " PK" : ""}`);
}

// Verify indexes
const idx = await db.execute("PRAGMA index_list(meal_plan)");
console.log("\nIndexes:");
for (const row of idx.rows) {
  console.log(`  ${row.name} — unique: ${row.unique}`);
}
