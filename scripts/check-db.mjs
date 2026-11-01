import { createClient } from "@libsql/client";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

const result = await db.execute("PRAGMA table_info(store_products)");
console.log("=== CURRENT COLUMNS IN DATABASE ===");
for (const row of result.rows) {
  console.log(`- ${row.name} (${row.type})`);
}

// Try fetching one row to see the actual error
try {
  const test = await db.execute("SELECT * FROM store_products LIMIT 1");
  console.log("\n✅ Fetch successful. Row:", test.rows[0]);
} catch (err) {
  console.error("\n❌ Fetch failed:", err);
}
