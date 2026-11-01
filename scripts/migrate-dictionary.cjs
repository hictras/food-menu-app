const { createClient } = require("@libsql/client");
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

(async () => {
  console.log("Creating table...");
  await db.execute(`CREATE TABLE IF NOT EXISTS store_dictionary (id INTEGER PRIMARY KEY AUTOINCREMENT, ar TEXT NOT NULL UNIQUE, en TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  console.log("Table created.");
})();
