const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
});
(async () => {
  const res = await client.execute({
    sql: "SELECT id, name, image_url, image_1_url, image_2_url, use_image_2 FROM recipes WHERE name LIKE ?",
    args: ["%Fasolia%"]
  });
  console.log(res.rows);
  process.exit(0);
})();
