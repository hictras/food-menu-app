import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

const existing = await db.execute("SELECT * FROM settings WHERE key = 'infinite_scroll'");
if (existing.rows.length === 0) {
  await db.execute("INSERT INTO settings (key, value) VALUES ('infinite_scroll', '0')");
  console.log("✅ infinite_scroll setting added (default: 0 / pagination).");
} else {
  console.log("⚠️ Setting already exists.");
}
