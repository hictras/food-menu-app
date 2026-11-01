import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

// The official Hardcore Main Categories
const ALLOWED_MAIN_CATEGORIES = [
  "Offers & Promotions", "Meat & Poultry", "Fresh Fish", "Back To School",
  "Produce", "Dairy & Eggs", "Bakery", "Ready To Eat", "Grocery Food",
  "Frozen Food", "Snack & Sweet", "Beverages", "Coffee & Tea",
  "Organic & Healthy", "Toys", "Baby Care", "Home Care", "Personal Care",
  "Pet Care", "Tobacco", "Kitchen Accessories", "Phone & Home electronics"
];

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

    for (const p of list) {
      if (!p.id || !p.sku || !p.title) { skipped++; continue; }

      const catStr = p.categories ? String(p.categories).trim() : "";
      const parts = catStr.split(",").map((s: string) => s.trim());
      
      let mainCategory = parts[0] || null;
      let subCategory = parts.length > 1 ? parts[1] : null;

      // SMART SWAP LOGIC: Check if they are flipped
      if (subCategory && ALLOWED_MAIN_CATEGORIES.includes(subCategory) && !ALLOWED_MAIN_CATEGORIES.includes(mainCategory || "")) {
        // Swap them
        const temp = mainCategory;
        mainCategory = subCategory;
        subCategory = temp;
      }

      // If main category is still not in the allowed list, find the first allowed one, or default to "Grocery Food"
      if (mainCategory && !ALLOWED_MAIN_CATEGORIES.includes(mainCategory)) {
        // Sometimes Minim puts the main category in the 2nd or 3rd position
        const foundValid = parts.find((part: string) => ALLOWED_MAIN_CATEGORIES.includes(part));
        if (foundValid) {
          const oldMain = mainCategory;
          mainCategory = foundValid;
          subCategory = oldMain; // Use the previous main as the sub
        } else {
          // If it's completely unknown, put it in Grocery Food and use the old main as sub
          subCategory = mainCategory;
          mainCategory = "Grocery Food";
        }
      }

      // Extract brand
      const brand = p.brandTitle ? String(p.brandTitle).trim() : null;

      const values = {
        externalId: Number(p.id),
        sku: String(p.sku).trim(),
        title: String(p.title).trim(),
        category: mainCategory,
        subCategory: subCategory,
        brand: brand,
        price: Number(p.finalPrice) || 0,
        imageUrl: p.imgSrc || p.localImgSrc || null,
        updatedAt: new Date().toISOString(),
      };

      await db.insert(storeProducts)
        .values(values)
        .onConflictDoUpdate({
          target: storeProducts.sku,
          set: {
            title: values.title,
            category: values.category,
            subCategory: values.subCategory,
            brand: values.brand,
            price: values.price,
            imageUrl: values.imageUrl,
            updatedAt: values.updatedAt,
          }
        });
      
      processed++;
    }

    return NextResponse.json({ success: true, total: list.length, processed, skipped });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed: " + String(err) }, { status: 500 });
  }
}
