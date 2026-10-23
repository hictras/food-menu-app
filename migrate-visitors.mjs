import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });
console.log("▶ Creating visitors table...");
await db.execute(`CREATE TABLE IF NOT EXISTS visitors (id TEXT PRIMARY KEY, last_seen TEXT DEFAULT CURRENT_TIMESTAMP)`);
console.log("✅ visitors table created");
