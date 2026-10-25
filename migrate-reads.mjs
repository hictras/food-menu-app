import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

console.log("▶ Creating notification_reads table...");
await db.execute(`
  CREATE TABLE IF NOT EXISTS notification_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    read_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(notification_id, phone)
  )
`);
console.log("✅ notification_reads created");
