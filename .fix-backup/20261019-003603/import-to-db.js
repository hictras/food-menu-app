const fs = require("fs");
const path = require("path");

const target = process.argv[2] || "http://localhost:3000";
const file = path.join(__dirname, "ramadan-recipes.json");

const recipes = JSON.parse(fs.readFileSync(file, "utf8"));
console.log(`Posting ${recipes.length} recipes to ${target}/api/recipes/bulk ...`);

fetch(`${target}/api/recipes/bulk`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(recipes),
})
  .then((r) => r.json().then((data) => ({ status: r.status, data })))
  .then(({ status, data }) => {
    if (status >= 400) {
      console.error("❌ Import failed:", status, data);
      process.exit(1);
    }
    console.log("✅ Import succeeded:", data);
  })
  .catch((err) => {
    console.error("❌ Network error:", err.message);
    process.exit(1);
  });
