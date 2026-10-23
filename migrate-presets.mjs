import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

console.log("▶ Creating push_presets table...");
await db.execute(`
  CREATE TABLE IF NOT EXISTS push_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log("✅ push_presets created");
