import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("missing TURSO_DATABASE_URL"); process.exit(1); }

const db = createClient({ url, authToken });

console.log("Adding sub_category column...");
try {
  await db.execute(`ALTER TABLE store_products ADD COLUMN sub_category TEXT`);
  console.log("✅ Column added.");
} catch (err) {
  if (String(err).includes("duplicate column name")) {
    console.log("⚠️ Column already exists. Skipping.");
  } else {
    console.error(err);
    process.exit(1);
  }
}
