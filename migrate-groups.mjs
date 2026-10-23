import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });
await db.execute(`CREATE TABLE IF NOT EXISTS recipient_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
await db.execute(`CREATE TABLE IF NOT EXISTS recipient_group_members (id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER NOT NULL REFERENCES recipient_groups(id) ON DELETE CASCADE, phone TEXT NOT NULL, UNIQUE(group_id, phone))`);
console.log("✅ Tables created");
