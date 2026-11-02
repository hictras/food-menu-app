import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

console.log("Adding package_size and package_unit columns...");
try {
  await db.execute(`ALTER TABLE store_products ADD COLUMN package_size REAL`);
  await db.execute(`ALTER TABLE store_products ADD COLUMN package_unit TEXT`);
  console.log("✅ Columns added safely.");
} catch (err) {
  if (String(err).includes("duplicate column name")) {
    console.log("⚠️ Columns already exist. Skipping.");
  } else {
    console.error(err);
  }
}
