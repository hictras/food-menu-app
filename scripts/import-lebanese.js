const fs = require("fs");
const path = require("path");

const target = process.argv[2] || "http://127.0.0.1:3000";
const filePath = path.join(__dirname, "lebanese-recipes.json");

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
const list = Array.isArray(raw) ? raw : raw.lebanese_recipes || raw.recipes || [raw];

if (!Array.isArray(list) || list.length === 0) {
  console.error("❌ No recipes found in the file");
  process.exit(1);
}

const ADMIN_USER = process.env.ADMIN_USERNAME;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;

async function getSessionCookie() {
  if (!ADMIN_USER || !ADMIN_PASS) {
    console.warn("⚠️  ADMIN_USERNAME/ADMIN_PASSWORD not set — request will likely 401.");
    return "";
  }
  const res = await fetch(`${target}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const m = (res.headers.get("set-cookie") || "").match(/admin_session=[^;]+/);
  return m ? m[0] : "";
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
  if (typeof s !== "string") return { amount: "", unit: "", name: String(s) };
  const m = s.match(/^([½¼¾⅓⅔⅛⅜⅝⅞]|\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?|\d+\/\d+)\s*([a-zA-Z\u0600-\u06FF]+)?\s*(.*)$/);
  if (!m) return { amount: "", unit: "", name: s };
  return { amount: (m[1] || "").trim(), unit: (m[2] || "").trim(), name: (m[3] || "").trim() };
}

function makeIngredient(en, ar) {
  if (typeof en === "object" && en !== null) {
    return {
      name: en.name || en.name_en || "",
      nameAr: en.nameAr || en.name_ar || "",
      amount: String(en.amount || ""),
      unit: en.unit || en.unit_en || "",
      unitAr: en.unitAr || en.unit_ar || "",
      preparation: en.preparation || en.notes || "",
      preparationAr: en.preparationAr || en.preparation_ar || "",
    };
  }
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
      const e = ing[i];
      const a = ar[i];
      if (e == null && a == null) continue;
      if (typeof e === "object" && e !== null) {
        out.push(makeIngredient(e, a));
      } else {
        const es = (e || "").toString().trim();
        const as = (a || "").toString().trim();
        if (es || as) out.push(makeIngredient(es, as));
      }
    }
    return out;
  }

  if (ing && typeof ing === "object") {
    for (const sec of Object.keys(ing).filter((k) => !k.endsWith("_arabic"))) {
      const en = ing[sec] || [];
      const ar = ing[sec + "_arabic"] || [];
      const len = Math.max(en.length, ar.length);
      for (let i = 0; i < len; i++) {
        const e = en[i];
        const a = ar[i];
        if (e == null && a == null) continue;
        if (typeof e === "object" && e !== null) {
          out.push(makeIngredient(e, a));
        } else {
          const es = (e || "").toString().trim();
          const as = (a || "").toString().trim();
          if (es || as) out.push(makeIngredient(es, as));
        }
      }
    }
  }

  return out;
}

const recipes = list.map((r) => {
  const totalTime =
    Number(r.prepTime) || Number(r.prep_time_minutes) || parseMinutes(r.preparation_time) || 0;
  const cookTime =
    Number(r.cookTime) || Number(r.cook_time_minutes) || 0;
  const servings =
    Number(r.servings) || parseServings(r.servings);

  return {
    name: r.name || r.name_en || r.title_en || r.title || r.name_arabic || r.nameAr || "",
    nameAr: r.nameAr || r.name_arabic || r.title || "",
    description: r.description || r.description_en || "",
    descriptionAr: r.descriptionAr || r.description_arabic || (r.title ? r.description : "") || "",
    cuisine: r.cuisine || "Lebanese",
    cuisineAr: r.cuisineAr || "لبناني",
    category: r.category || "Main Dish",
    categoryAr: r.categoryAr || r.category_ar || "",
    servedWith: r.servedWith || r.served_with || "",
    servedWithAr: r.servedWithAr || r.served_with_ar || "",
    howToServe: r.howToServe || r.how_to_serve || "",
    howToServeAr: r.howToServeAr || r.how_to_serve_ar || "",
    prepTime: totalTime,
    cookTime,
    servings,
    dietaryTags: r.dietaryTags || r.dietary_tags || [],
    imageUrl: r.imageUrl || r.image_url || null,
    videoUrl: r.videoUrl || r.video_url || null,
    ingredients: flattenIngredients(r.ingredients, r.ingredients_arabic || r.ingredientsAr),
    instructions: (r.instructions || r.preparation || []).map((s) => {
      if (typeof s === "string") return { text: s, textAr: "" };
      return {
        text: s.text || s.text_en || s.step || "",
        textAr: s.textAr || s.text_ar || "",
      };
    }),
  };
});

(async () => {
  try {
    const cookie = await getSessionCookie();
    console.log(`Sending ${recipes.length} recipes to ${target}/api/recipes/bulk ...`);
    const res = await fetch(`${target}/api/recipes/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(recipes),
    });
    const data = await res.json();
    if (res.status >= 400) {
      console.error("❌ Failed:", res.status, JSON.stringify(data, null, 2));
      process.exit(1);
    }
    console.log("✅ Succeeded:", data);
  } catch (err) {
    console.error("❌ Network:", err.message);
    process.exit(1);
  }
})();
