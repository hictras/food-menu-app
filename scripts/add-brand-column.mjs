import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

console.log("Adding brand column...");
try {
  await db.execute(`ALTER TABLE store_products ADD COLUMN brand TEXT`);
  console.log("✅ Column added safely.");
} catch (err) {
  if (String(err).includes("duplicate column name")) {
    console.log("⚠️ Column already exists. Skipping.");
  } else {
    console.error(err);
  }
}
