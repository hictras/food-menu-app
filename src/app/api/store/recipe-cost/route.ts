import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { like, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { ingredients } = await req.json();
    
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const db = getDb();
    const results = [];

    for (const ing of ingredients) {
      const searchTerm = ing.trim();
      if (searchTerm.length < 3) {
        results.push({ name: searchTerm, price: null, storeTitle: null, unit: "" });
        continue;
      }

      const lowerSearch = `%${searchTerm.toLowerCase()}%`;
      
      // Find the cheapest match to be safe, or just the first one
      const match = await db.select({
        title: storeProducts.title,
        price: storeProducts.price
      })
      .from(storeProducts)
      .where(
        like(sql`lower(${storeProducts.title})`, lowerSearch)
      )
      .limit(1);

      if (match.length > 0) {
        results.push({
          name: searchTerm,
          price: match[0].price,
          storeTitle: match[0].title,
          unit: "unit" // We don't know the exact unit, the user will input quantity
        });
      } else {
        results.push({ name: searchTerm, price: null, storeTitle: null, unit: "" });
      }
    }

    return NextResponse.json({ matches: results });
  } catch (err) {
    console.error("Recipe cost match error:", err);
    return NextResponse.json({ error: "Failed to match" }, { status: 500 });
  }
}
