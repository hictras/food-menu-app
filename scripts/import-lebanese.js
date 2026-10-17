const fs = require("fs");
const path = require("path");

const target = process.argv[2] || "http://localhost:3000";
const filePath = path.join(__dirname, "lebanese-recipes.json");

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
const list = Array.isArray(raw) ? raw : raw.lebanese_recipes;

if (!Array.isArray(list) || list.length === 0) {
  console.error("❌ No recipes found in the file");
  process.exit(1);
}

console.log(`Found ${list.length} recipes\n`);

function parseServings(s) {
  if (!s) return 4;
  const str = String(s);
  if (/not specified|غير محدد/i.test(str)) return 4;
  const m = str.match(/(\d+)/);
  return m ? Number(m[1]) : 4;
}

function parseMinutes(s) {
  if (!s) return 0;
  const str = String(s).toLowerCase();
  if (/not specified|غير محدد/.test(str)) return 0;
  let total = 0;
  const h = str.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h\b|ساعة)/);
  if (h) total += Math.round(parseFloat(h[1]) * 60);
  const m = str.match(/(\d+)\s*(?:min|minute|دقيقة|دقائق)/);
  if (m) total += parseInt(m[1], 10);
  return total || 0;
}

function splitAmountUnit(s) {
  if (!s) return { amount: "", unit: "", name: "" };
  const m = s.match(/^([½¼¾⅓⅔⅛⅜⅝⅞]|\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?|\d+\/\d+)\s*([a-zA-Z\u0600-\u06FF]+)?\s*(.*)$/);
  if (!m) return { amount: "", unit: "", name: s };
  return { amount: (m[1] || "").trim(), unit: (m[2] || "").trim(), name: (m[3] || "").trim() };
}

function makeIngredient(en, ar) {
  const e = splitAmountUnit(en);
  const a = splitAmountUnit(ar);
  return {
    name: e.name || a.name || "",
    nameAr: a.name || "",
    amount: e.amount || a.amount || "",
    unit: e.unit || "",
    unitAr: a.unit || "",
    preparation: "",
    preparationAr: "",
  };
}

function flattenIngredients(ing, ingAr) {
  const out = [];
  if (Array.isArray(ing)) {
    const ar = Array.isArray(ingAr) ? ingAr : [];
    const len = Math.max(ing.length, ar.length);
    for (let i = 0; i < len; i++) {
      const e = (ing[i] || "").trim(), a = (ar[i] || "").trim();
      if (e || a) out.push(makeIngredient(e, a));
    }
    return out;
  }
  if (ing && typeof ing === "object") {
    for (const sec of Object.keys(ing).filter((k) => !k.endsWith("_arabic"))) {
      const en = ing[sec] || [], ar = ing[sec + "_arabic"] || [];
      const len = Math.max(en.length, ar.length);
      for (let i = 0; i < len; i++) {
        const e = (en[i] || "").trim(), a = (ar[i] || "").trim();
        if (e || a) out.push(makeIngredient(e, a));
      }
    }
  }
  return out;
}

const recipes = list.map((r) => ({
  name: r.name || r.name_arabic || "",
  nameAr: r.name_arabic || "",
  description: r.description || "",
  descriptionAr: r.description_arabic || "",
  cuisine: "Lebanese",
  cuisineAr: "لبناني",
  servedWith: "",
  servedWithAr: "",
  howToServe: "",
  howToServeAr: "",
  prepTime: parseMinutes(r.preparation_time),
  cookTime: 0,
  servings: parseServings(r.servings),
  dietaryTags: [],
  imageUrl: null,
  videoUrl: null,
  ingredients: flattenIngredients(r.ingredients, r.ingredients_arabic),
  instructions: (r.preparation || []).map((t, i) => ({
    text: t,
    textAr: (r.preparation_arabic || [])[i] || "",
  })),
}));

console.log(`Sending ${recipes.length} recipes to ${target}/api/recipes/bulk ...`);

fetch(`${target}/api/recipes/bulk`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(recipes),
})
  .then((r) => r.json().then((d) => ({ status: r.status, data: d })))
  .then(({ status, data }) => {
    if (status >= 400) {
      console.error("❌ Failed:", status, JSON.stringify(data, null, 2));
      process.exit(1);
    }
    console.log("✅ Succeeded:", data);
  })
  .catch((err) => {
    console.error("❌ Network:", err.message);
    process.exit(1);
  });
