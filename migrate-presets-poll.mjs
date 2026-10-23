import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });
console.log("▶ Adding poll_question to push_presets...");
await db.execute("ALTER TABLE push_presets ADD COLUMN poll_question TEXT;");
console.log("✅ Column added");
