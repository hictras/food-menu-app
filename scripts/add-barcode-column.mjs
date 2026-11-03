import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("❌ Missing TURSO_DATABASE_URL. Check your .env.local file.");
  process.exit(1);
}

const db = createClient({ url, authToken });

console.log("Adding barcode column...");
try {
  await db.execute(`ALTER TABLE store_products ADD COLUMN barcode TEXT`);
  console.log("✅ Column added safely.");
} catch (err) {
  if (String(err).includes("duplicate column name")) {
    console.log("⚠️ Column already exists. Skipping.");
  } else {
    console.error(err);
  }
}
