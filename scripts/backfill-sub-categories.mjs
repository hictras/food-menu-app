import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("missing TURSO_DATABASE_URL"); process.exit(1); }

const db = createClient({ url, authToken });

console.log("Fetching existing products...");
const result = await db.execute("SELECT id, category FROM store_products");
const rows = result.rows;
console.log(`Found ${rows.length} products to process.`);

let updated = 0;

for (const row of rows) {
  const categoryStr = row.category;
  if (!categoryStr) continue;

  const parts = String(categoryStr).split(",").map(s => s.trim());
  const mainCat = parts[0] || null;
  const subCat = parts.length > 1 ? parts[1] : null;

  await db.execute({
    sql: "UPDATE store_products SET category = ?, sub_category = ? WHERE id = ?",
    args: [mainCat, subCat, row.id]
  });
  updated++;
}

console.log(`✅ Successfully updated ${updated} products.`);
console.log("Main category and sub_category are now split safely.");
