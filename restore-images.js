const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
});
(async () => {
  const res = await client.execute(`
    UPDATE recipes 
    SET image_url = COALESCE(image_2_url, image_1_url, image_url)
    WHERE image_url IS NULL
  `);
  console.log('✅ Restored', res.rowsAffected, 'recipes');
  process.exit(0);
})();
