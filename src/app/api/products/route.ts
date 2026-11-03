import { NextRequest, NextResponse, connection } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { eq, like, or, and, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    
    const isAdminQuery = searchParams.get("admin") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    
    const limit = isAdminQuery ? 10000 : (page === 1 ? 8 : 24);
    const offset = isAdminQuery ? 0 : (page === 1 ? 0 : 8 + (page - 2) * 24);
    
    const category = searchParams.get("category");
    const subCategory = searchParams.get("subCategory");
    const search = searchParams.get("search")?.trim();
    const random = searchParams.get("random") === "true";

    const conditions = [];
    
    if (category && category !== "All") {
      conditions.push(eq(storeProducts.category, category));
    }
    if (subCategory && subCategory !== "All") {
      conditions.push(eq(storeProducts.subCategory, subCategory));
    }
    
    // --- SMART SEARCH LOGIC ---
    if (search && search.length >= 3) {
      // 1. Split the search by spaces (e.g., "milk shake" -> ["milk", "shake"])
      const words = search.toLowerCase().split(/\s+/).filter(Boolean);
      
      // 2. For EVERY word, the title must match it somewhere (AND logic)
      const wordConditions = words.map(word => {
        const lowerWord = `%${word}%`;
        return or(
          like(sql`lower(${storeProducts.title})`, lowerWord),
          like(storeProducts.titleAr, `%${word}%`),
          like(sql`lower(${storeProducts.sku})`, lowerWord),
          like(sql`lower(${storeProducts.barcode})`, lowerWord),
          like(sql`lower(${storeProducts.brand})`, lowerWord)
        );
      });
      
      // Push all the word conditions into the main query
      conditions.push(and(...wordConditions));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(storeProducts)
      .where(whereClause);
    const totalCount = countResult[0]?.count || 0;

    const orderByClause = random ? sql`RANDOM()` : desc(storeProducts.id);
    
    const products = await db.select()
      .from(storeProducts)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      products,
      totalCount,
      totalPages: isAdminQuery ? 1 : Math.ceil((totalCount - 8) / 24) + 1,
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });

  } catch (err) {
    console.error("Failed to load products:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
