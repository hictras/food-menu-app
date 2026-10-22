import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("missing TURSO_DATABASE_URL"); process.exit(1); }

const db = createClient({ url, authToken });

console.log("▶ Creating day_reviews table...");

await db.execute(`
  CREATE TABLE IF NOT EXISTS day_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    phone TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (date, phone)
  )
`);

console.log("✅ day_reviews created");
