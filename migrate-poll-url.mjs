import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("missing TURSO_DATABASE_URL"); process.exit(1); }

const db = createClient({ url, authToken });

console.log("▶ Checking notifications columns...");
const cols = (await db.execute("PRAGMA table_info(notifications)")).rows.map((r) => r.name);
console.log("  existing:", cols.join(", "));

if (cols.includes("poll_url")) {
  console.log("✓ poll_url already exists");
} else {
  await db.execute("ALTER TABLE notifications ADD COLUMN poll_url TEXT");
  console.log("✓ poll_url column added");
}

console.log("▶ Backfilling poll_url for existing poll messages...");
const result = await db.execute(`
  UPDATE notifications
  SET poll_url = (
    SELECT '/poll/' || polls.id
    FROM polls
    WHERE polls.notification_id = notifications.id
  )
  WHERE poll_url IS NULL
    AND id IN (SELECT notification_id FROM polls)
`);
console.log("  rows updated:", result.rowsAffected ?? "?");

const preview = await db.execute(`
  SELECT n.id, n.title, n.url, n.poll_url, p.question
  FROM notifications n
  JOIN polls p ON p.notification_id = n.id
  ORDER BY n.id DESC
  LIMIT 5
`);
console.log("\n▶ Poll-linked notifications:");
for (const r of preview.rows) {
  console.log(`  #${r.id} | url=${r.url} | poll_url=${r.poll_url} | q="${r.question}"`);
}

console.log("\n✅ done");
