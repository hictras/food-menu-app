import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

console.log("Fetching products...");
const result = await db.execute("SELECT id, title, package_size FROM store_products");
const rows = result.rows;
console.log(`Found ${rows.length} products.`);

// Only process rows that don't already have a package_size
const rowsToUpdate = rows.filter((r) => !r.package_size);
console.log(`Processing ${rowsToUpdate.length} new items...`);

const regex = /(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilos|g|gr|gram|grams|ml|l|liter|liters|litre|litres|pcs|pc|pieces|piece|oz|lb|lbs)\b/i;

const updates = [];

for (const row of rowsToUpdate) {
  const title = String(row.title).trim();
  const match = title.match(regex);
  
  if (match) {
    let size = parseFloat(match[1].replace(",", "."));
    const rawUnit = match[2].toLowerCase();
    let unit = null;
    
    if (["kg", "kilo", "kilos"].includes(rawUnit)) unit = "kg";
    else if (["g", "gr", "gram", "grams"].includes(rawUnit)) unit = "g";
    else if (["ml"].includes(rawUnit)) unit = "ml";
    else if (["l", "liter", "liters", "litre", "litres"].includes(rawUnit)) unit = "L";
    else if (["pcs", "pc", "pieces", "piece"].includes(rawUnit)) unit = "pcs";
    else if (["oz"].includes(rawUnit)) unit = "oz";
    else if (["lb", "lbs"].includes(rawUnit)) unit = "lb";
    
    if (size && unit) {
      updates.push({ id: row.id, size, unit });
    }
  }
}

console.log(`Found ${updates.length} items with valid sizes. Updating...`);

// Batch updates (100 at a time) to avoid timeouts
const batchSize = 100;
for (let i = 0; i < updates.length; i += batchSize) {
  const batch = updates.slice(i, i + batchSize);
  const statements = batch.map((u) => ({
    sql: "UPDATE store_products SET package_size = ?, package_unit = ? WHERE id = ?",
    args: [u.size, u.unit, u.id]
  }));
  
  await db.batch(statements);
  console.log(`Updated ${i + batch.length} of ${updates.length}...`);
}

console.log("✅ All done!");
