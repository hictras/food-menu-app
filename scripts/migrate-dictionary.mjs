import { createClient } from "@libsql/client";
import { AR_TO_EN } from "../src/lib/store-dictionary.js";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

console.log("Creating store_dictionary table...");
await db.execute(`
  CREATE TABLE IF NOT EXISTS store_dictionary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ar TEXT NOT NULL UNIQUE,
    en TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("Seeding initial words...");
let inserted = 0;
for (const [ar, en] of Object.entries(AR_TO_EN)) {
  try {
    await db.execute({
      sql: "INSERT OR IGNORE INTO store_dictionary (ar, en) VALUES (?, ?)",
      args: [ar, en]
    });
    inserted++;
  } catch (e) {}
}
console.log(`✅ Dictionary table ready with ${inserted} words.`);
