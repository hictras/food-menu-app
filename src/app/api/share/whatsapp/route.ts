import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { recipes, ingredients, instructions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://food-menu-app-xet2.onrender.com";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const lang = (req.nextUrl.searchParams.get("lang") || "en") as "en" | "ar";

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const db = getDb();
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, numericId)).limit(1);
  if (!recipe) return NextResponse.json({ error: "not found" }, { status: 404 });

  const ings = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.recipeId, numericId))
    .orderBy(asc(ingredients.id));

  const steps = await db
    .select()
    .from(instructions)
    .where(eq(instructions.recipeId, numericId))
    .orderBy(asc(instructions.stepNumber));

  const totalTime = recipe.prepTime + recipe.cookTime;
  const link = `${BASE_URL}/recipes/${recipe.id}`;

  const isAr = lang === "ar";

  const name = isAr ? (recipe.nameAr || recipe.name) : recipe.name;
  const desc = isAr ? (recipe.descriptionAr || recipe.description || "") : (recipe.description || "");
  const cuisine = isAr ? (recipe.cuisineAr || recipe.cuisine || "") : (recipe.cuisine || "");
  const servedWith = isAr ? (recipe.servedWithAr || recipe.servedWith || "") : (recipe.servedWith || "");
  const howToServe = isAr ? (recipe.howToServeAr || recipe.howToServe || "") : (recipe.howToServe || "");

  const topIngs = ings
    .slice(0, 4)
    .map((i) => (isAr ? (i.nameAr || i.name) : i.name))
    .filter(Boolean);

  const firstStep = steps[0]
    ? (isAr ? (steps[0].textAr || steps[0].text) : steps[0].text)
    : "";

  const message = isAr
    ? buildArabic({ name, desc, cuisine, totalTime, servings: recipe.servings, topIngs, firstStep, servedWith, howToServe, link })
    : buildEnglish({ name, desc, cuisine, totalTime, servings: recipe.servings, topIngs, firstStep, servedWith, howToServe, link });

  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/?text=${encoded}`;

  return NextResponse.json({ message, url });
}

function buildEnglish(d: {
  name: string; desc: string; cuisine: string; totalTime: number;
  servings: number; topIngs: string[]; firstStep: string;
  servedWith: string; howToServe: string; link: string;
}) {
  const ingLine = d.topIngs.length ? d.topIngs.join(" • ") : "";
  return `╭─────────────────────╮
   ✦  NEW RECIPE  ✦
╰─────────────────────╯

🍽️ *${d.name}*
_${[d.cuisine, `${d.totalTime} min`, `serves ${d.servings}`].filter(Boolean).join(" • ")}_

─────────────────────

${d.desc ? `_${d.desc}_\n\n` : ""}🛒 *You'll need*
${ingLine}

${d.firstStep ? `👨‍🍳 *How it starts*\n${d.firstStep}\n\n` : ""}─────────────────────
${d.servedWith ? `\n🍽️ *Serve with*\n${d.servedWith}\n` : ""}${d.howToServe ? `\n📌 *Tip*\n${d.howToServe}\n` : ""}
─────────────────────

👉 Full recipe with photos & steps:
${d.link}

━━━━━━━━━━━━━━━━━━━━
🕌 _Menu — your cookbook_`;
}

function buildArabic(d: {
  name: string; desc: string; cuisine: string; totalTime: number;
  servings: number; topIngs: string[]; firstStep: string;
  servedWith: string; howToServe: string; link: string;
}) {
  const ingLine = d.topIngs.length ? d.topIngs.join(" • ") : "";
  return `╭─────────────────────╮
   ✦  وصفة جديدة  ✦
╰─────────────────────╯

🍽️ *${d.name}*
_${[d.cuisine, `${d.totalTime} دقيقة`, `يكفي ${d.servings}`].filter(Boolean).join(" • ")}_

─────────────────────

${d.desc ? `_${d.desc}_\n\n` : ""}🛒 *المكونات الأساسية*
${ingLine}

${d.firstStep ? `👨‍🍳 *الطريقة*\n${d.firstStep}\n\n` : ""}─────────────────────
${d.servedWith ? `\n🍽️ *يقدم مع*\n${d.servedWith}\n` : ""}${d.howToServe ? `\n📌 *طريقة التقديم*\n${d.howToServe}\n` : ""}
─────────────────────

👉 الوصفة كاملة بالصور:
${d.link}

━━━━━━━━━━━━━━━━━━━━
🕌 _منيو — كتاب وصفاتك_`;
}
