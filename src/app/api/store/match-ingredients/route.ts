import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { like, or, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { ingredients } = await req.json();
    
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const db = getDb();
    const matchedProducts = [];

    // For each ingredient, search the store for a matching product
    for (const ing of ingredients) {
      const searchTerm = ing.trim();
      if (searchTerm.length < 3) continue;

      const lowerSearch = `%${searchTerm.toLowerCase()}%`;
      
      const results = await db.select()
        .from(storeProducts)
        .where(
          or(
            like(sql`lower(${storeProducts.title})`, lowerSearch),
            like(storeProducts.titleAr, `%${searchTerm}%`)
          )
        )
        .limit(1); // Just grab the first best match to avoid adding 50 types of milk

      if (results.length > 0) {
        matchedProducts.push(results[0]);
      }
    }

    return NextResponse.json({ matches: matchedProducts });
  } catch (err) {
    console.error("Match ingredients error:", err);
    return NextResponse.json({ error: "Failed to match ingredients" }, { status: 500 });
  }
}
