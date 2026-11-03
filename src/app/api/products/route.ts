import { NextRequest, NextResponse, connection } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { eq, like, or, and, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = page === 1 ? 8 : 24;
    const offset = page === 1 ? 0 : 8 + (page - 2) * 24;
    
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
    if (search && search.length > 0) {
      const lowerSearch = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`lower(${storeProducts.title})`, lowerSearch),
          like(storeProducts.titleAr, `%${search}%`),
          like(sql`lower(${storeProducts.sku})`, lowerSearch),
          like(sql`lower(${storeProducts.barcode})`, lowerSearch),
          like(sql`lower(${storeProducts.brand})`, lowerSearch)
        )
      );
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
      totalPages: Math.ceil((totalCount - 8) / 24) + 1,
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });

  } catch (err) {
    console.error("Failed to load products:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}