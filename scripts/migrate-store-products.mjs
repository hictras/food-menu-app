import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("missing TURSO_DATABASE_URL"); process.exit(1); }

const db = createClient({ url, authToken });

console.log("Creating store_products table...");

await db.execute(`
  CREATE TABLE IF NOT EXISTS store_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id INTEGER NOT NULL UNIQUE,
    sku TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("✅ store_products table created");

const cols = await db.execute("PRAGMA table_info(store_products)");
console.log("\nColumns:");
for (const row of cols.rows) {
  console.log(`  ${row.name} (${row.type})`);
}
