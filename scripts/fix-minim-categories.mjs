import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("missing TURSO_DATABASE_URL"); process.exit(1); }

const db = createClient({ url, authToken });

const ALLOWED_MAIN_CATEGORIES = [
  "Offers & Promotions", "Meat & Poultry", "Fresh Fish", "Back To School",
  "Produce", "Dairy & Eggs", "Bakery", "Ready To Eat", "Grocery Food",
  "Frozen Food", "Snack & Sweet", "Beverages", "Coffee & Tea",
  "Organic & Healthy", "Toys", "Baby Care", "Home Care", "Personal Care",
  "Pet Care", "Tobacco", "Kitchen Accessories", "Phone & Home electronics"
];

console.log("Fetching all products to fix...");
const result = await db.execute("SELECT id, category, sub_category FROM store_products");
const rows = result.rows;

let fixedCount = 0;

for (const row of rows) {
  let main = row.category ? String(row.category).trim() : "";
  let sub = row.sub_category ? String(row.sub_category).trim() : "";

  // Check if they are flipped
  if (ALLOWED_MAIN_CATEGORIES.includes(sub) && !ALLOWED_MAIN_CATEGORIES.includes(main)) {
    // Swap them
    const temp = main;
    main = sub;
    sub = temp;
    
    // Update the database
    await db.execute({
      sql: "UPDATE store_products SET category = ?, sub_category = ? WHERE id = ?",
      args: [main, sub, row.id]
    });
    fixedCount++;
  }
}

console.log(`\n✅ Success! Permanently fixed ${fixedCount} products in the database.`);
console.log("You can now remove the auto-swap logic from your frontend code if you want.");
