import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });
console.log("▶ Adding is_hidden to recipes...");
try {
  await db.execute("ALTER TABLE recipes ADD COLUMN is_hidden INTEGER DEFAULT 0;");
  console.log("✅ Column added");
} catch (e) {
  console.log("✅ Column already exists");
}
