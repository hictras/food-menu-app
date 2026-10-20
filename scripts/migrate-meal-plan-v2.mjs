/**
 * Migrate meal_plan to support multiple recipes per (date, slot).
 *
 * Changes:
 *   - Add `position` column (1 or 2) — recipe slot per day/slot
 *   - Drop UNIQUE(date, slot) — now UNIQUE(date, slot, position)
 *
 * SQLite can't ALTER TABLE to drop constraints, so we:
 *   1. Create new table meal_plan_new
 *   2. Copy data with position=1 for existing rows
 *   3. Drop old table
 *   4. Rename new to meal_plan
 */
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("missing TURSO_DATABASE_URL"); process.exit(1); }

const db = createClient({ url, authToken });

console.log("Starting meal_plan v2 migration...");

// 1. Check existing columns
const cols = await db.execute("PRAGMA table_info(meal_plan)");
const colNames = cols.rows.map((r) => r.name);
console.log("Current columns:", colNames.join(", "));

const hasPosition = colNames.includes("position");
const hasUnique = (await db.execute("PRAGMA index_list(meal_plan)")).rows
  .some((r) => r.unique === 1);

console.log("Has position column:", hasPosition);
console.log("Has unique index:", hasUnique);

if (hasPosition && !hasUnique) {
  console.log("✅ Already migrated. Nothing to do.");
  process.exit(0);
}

// 2. Create new table
console.log("Creating meal_plan_new...");
await db.execute(`
  CREATE TABLE IF NOT EXISTS meal_plan_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    slot TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 1,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, slot, position)
  )
`);

// 3. Copy existing data
console.log("Copying data...");
const insertResult = await db.execute(`
  INSERT INTO meal_plan_new (date, slot, position, recipe_id, created_at)
  SELECT date, slot, 1, recipe_id, created_at FROM meal_plan
`);
console.log("Copied rows:", insertResult.rowsAffected ?? "?");

// 4. Drop old, rename new
console.log("Swapping tables...");
await db.execute("DROP TABLE meal_plan");
await db.execute("ALTER TABLE meal_plan_new RENAME TO meal_plan");

// 5. Verify
const newCols = await db.execute("PRAGMA table_info(meal_plan)");
console.log("\nNew columns:");
for (const r of newCols.rows) {
  console.log(`  ${r.name} (${r.type})${r.notnull ? " NOT NULL" : ""}`);
}

const newIdx = await db.execute("PRAGMA index_list(meal_plan)");
console.log("\nIndexes:");
for (const r of newIdx.rows) {
  console.log(`  ${r.name} — unique: ${r.unique}`);
}

const count = await db.execute("SELECT COUNT(*) as n FROM meal_plan");
console.log("\nRows in new table:", count.rows[0].n);

console.log("\n✅ Migration complete");
