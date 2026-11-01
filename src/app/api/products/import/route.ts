import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { sql } from "drizzle-orm";

const ALLOWED_MAIN_CATEGORIES = [
  "Offers & Promotions", "Meat & Poultry", "Fresh Fish", "Back To School",
  "Produce", "Dairy & Eggs", "Bakery", "Ready To Eat", "Grocery Food",
  "Frozen Food", "Snack & Sweet", "Beverages", "Coffee & Tea",
  "Organic & Healthy", "Toys", "Baby Care", "Home Care", "Personal Care",
  "Pet Care", "Tobacco", "Kitchen Accessories", "Phone & Home electronics"
];

// Helper to fix Minim's missing spaces and typos
function normalizeCategory(cat: string) {
  return cat
    .replace(/&Home/gi, "& Home")
    .replace(/&Promotions/gi, "& Promotions")
    .replace(/&Sweet/gi, "& Sweet")
    .replace(/&Poultry/gi, "& Poultry")
    .replace(/&Eggs/gi, "& Eggs")
    .replace(/&Creams/gi, "& Creams")
    .replace(/&Crackers/gi, "& Crackers")
    .replace(/&Tea/gi, "& Tea")
    .replace(/&Healthy/gi, "& Healthy")
    .replace(/&Toilet/gi, "& Toilet")
    .replace(/&Floor/gi, "& Floor")
    .replace(/&Body/gi, "& Body")
    .trim();
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const body = await req.json();
    const list = body.products || (Array.isArray(body) ? body : []);

    if (!Array.isArray(list) || list.length === 0) {
      return NextResponse.json({ error: "Expected non-empty products array" }, { status: 400 });
    }

    let processed = 0;
    let skipped = 0;
    const valuesToInsert: any[] = [];

    for (const p of list) {
      if (!p.id || !p.sku || !p.title) { skipped++; continue; }

      const catStr = p.categories ? String(p.categories).trim() : "";
      const isPromotion = /promotion/i.test(catStr) ? 1 : 0;

      // NORMALIZE THE CATEGORIES BEFORE SPLITTING
      const normalizedCatStr = normalizeCategory(catStr);
      const parts = normalizedCatStr.split(",").map((s: string) => s.trim());
      
      let mainCategory = parts[0] || null;
      let subCategory = parts.length > 1 ? parts[1] : null;

      // SMART SWAP LOGIC
      if (subCategory && ALLOWED_MAIN_CATEGORIES.includes(subCategory) && !ALLOWED_MAIN_CATEGORIES.includes(mainCategory || "")) {
        const temp = mainCategory;
        mainCategory = subCategory;
        subCategory = temp;
      }

      if (mainCategory && !ALLOWED_MAIN_CATEGORIES.includes(mainCategory)) {
        const foundValid = parts.find((part: string) => ALLOWED_MAIN_CATEGORIES.includes(part));
        if (foundValid) {
          const oldMain = mainCategory;
          mainCategory = foundValid;
          subCategory = oldMain; 
        } else {
          subCategory = mainCategory;
          mainCategory = "Grocery Food";
        }
      }

      valuesToInsert.push({
        externalId: Number(p.id),
        sku: String(p.sku).trim(),
        title: String(p.title).trim(),
        category: mainCategory,
        subCategory: subCategory,
        brand: p.brandTitle ? String(p.brandTitle).trim() : null,
        price: Number(p.finalPrice) || 0,
        imageUrl: p.imgSrc || p.localImgSrc || null,
        isPromotion: isPromotion,
        updatedAt: new Date().toISOString(),
      });
      processed++;
    }

    // Use SQLite Transaction for massive speed boost
    if (valuesToInsert.length > 0) {
      await db.transaction(async (tx) => {
        const chunkSize = 500;
        for (let i = 0; i < valuesToInsert.length; i += chunkSize) {
          const chunk = valuesToInsert.slice(i, i + chunkSize);
          await tx.insert(storeProducts)
            .values(chunk)
            .onConflictDoUpdate({
              target: storeProducts.sku,
              set: {
                title: sql`excluded.title`,
                category: sql`excluded.category`,
                subCategory: sql`excluded.sub_category`,
                brand: sql`excluded.brand`,
                price: sql`excluded.price`,
                imageUrl: sql`excluded.image_url`,
                isPromotion: sql`excluded.is_promotion`,
                updatedAt: sql`excluded.updated_at`,
              }
            });
        }
      });
    }

    return NextResponse.json({ success: true, total: list.length, processed, skipped });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed: " + String(err) }, { status: 500 });
  }
}
