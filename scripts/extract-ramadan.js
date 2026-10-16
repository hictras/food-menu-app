const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "ramadan.liquid"), "utf8");

function extractArray(name) {
  // Match: {%- assign NAME = "..." | split: "|" -%}
  const re = new RegExp(
    `assign\\s+${name}\\s*=\\s*"([\\s\\S]*?)"\\s*\\|\\s*split:\\s*"\\|"`,
    "m"
  );
  const m = src.match(re);
  if (!m) {
    console.warn(`  ⚠️  Could not find array: ${name}`);
    return [];
  }
  return m[1].split("|").map((s) => s.trim());
}

const fields = [
  "titles",
  "titles_ar",
  "types",
  "sides",
  "sides_ar",
  "drinks",
  "drinks_ar",
  "ingredients",
  "ingredients_ar",
  "methods",
  "methods_ar",
  "shopping",
  "shopping_ar",
];

const data = {};
for (const f of fields) {
  data[f] = extractArray(f);
  console.log(`${f}: ${data[f].length} entries`);
}

// Sanity check lengths
const expected = 30;
for (const f of ["titles", "titles_ar", "types", "sides", "sides_ar", "drinks", "drinks_ar", "ingredients", "ingredients_ar", "methods", "methods_ar"]) {
  if (data[f].length !== expected) {
    console.warn(`  ⚠️  ${f} has ${data[f].length} entries — expected ${expected}`);
  }
}

// Build a recipes array ready for the API
const recipes = [];
for (let i = 0; i < expected; i++) {
  recipes.push({
    name: data.titles[i] || "",
    nameAr: data.titles_ar[i] || "",
    description: data.sides[i] || "",
    descriptionAr: data.sides_ar[i] || "",
    cuisine: "Middle Eastern",
    cuisineAr: "شرق أوسطي",
    prepTime: 30,
    cookTime: 60,
    servings: 4,
    dietaryTags: mapTypeToTag(data.types[i]),
    imageUrl: null,
    videoUrl: null,
    ingredients: parseIngredientList(data.ingredients[i] || "", data.ingredients_ar[i] || ""),
    instructions: splitInstructions(data.methods[i] || "", data.methods_ar[i] || ""),
  });
}

function mapTypeToTag(t) {
  const map = {
    meat: [],
    chicken: [],
    seafood: [],
    veggie: ["Vegetarian"],
  };
  return map[t] || [];
}

// Split "a, b, c" style ingredient lists into rows.
// Arabic uses "،" as a comma separator.
function parseIngredientList(en, ar) {
  const enParts = en.split(/,\s*/).filter(Boolean);
  const arParts = ar.split(/،\s*|\s*,\s*/).filter(Boolean);
  const len = Math.max(enParts.length, arParts.length);
  const out = [];
  for (let i = 0; i < len; i++) {
    const enItem = (enParts[i] || "").trim();
    const arItem = (arParts[i] || "").trim();
    if (!enItem && !arItem) continue;

    // Try to peel off parenthesized quantity: "Basmati rice (3 cups)"
    const { name, amount } = splitAmount(enItem || arItem);

    out.push({
      name,
      nameAr: arItem ? splitAmount(arItem).name : "",
      amount: amount || "",
      unit: "",
      unitAr: "",
      preparation: "",
      preparationAr: "",
    });
  }
  return out;
}

function splitAmount(s) {
  const m = s.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (m) return { name: m[1].trim(), amount: m[2].trim() };
  return { name: s.trim(), amount: "" };
}

// Split instruction text into sentences -> steps.
function splitInstructions(en, ar) {
  const enSentences = en.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const arSentences = ar.split(/(?<=[.!؟])\s+/).map((s) => s.trim()).filter(Boolean);
  const len = Math.max(enSentences.length, arSentences.length);
  const out = [];
  for (let i = 0; i < len; i++) {
    out.push({
      text: enSentences[i] || "",
      textAr: arSentences[i] || "",
    });
  }
  return out;
}

fs.writeFileSync(
  path.join(__dirname, "ramadan-recipes.json"),
  JSON.stringify(recipes, null, 2),
  "utf8"
);

console.log(`\n✅ Wrote ${recipes.length} recipes to scripts/ramadan-recipes.json`);
