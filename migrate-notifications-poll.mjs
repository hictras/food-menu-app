import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });
console.log("▶ Adding poll_question to notifications...");
try {
  await db.execute("ALTER TABLE notifications ADD COLUMN poll_question TEXT;");
  console.log("✅ Column added");
} catch (e) {
  console.log("Note:", e.message);
}
