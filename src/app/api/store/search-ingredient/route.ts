import { NextRequest, NextResponse, connection } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { like, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const search = req.nextUrl.searchParams.get("q")?.trim();
    if (!search || search.length < 2) return NextResponse.json({ results: [] });

    const db = getDb();
    const lowerSearch = `%${search.toLowerCase()}%`;

    const results = await db.select({
      id: storeProducts.id,
      title: storeProducts.title,
      titleAr: storeProducts.titleAr,
      brand: storeProducts.brand,
      price: storeProducts.price,
      imageUrl: storeProducts.imageUrl,
    })
    .from(storeProducts)
    .where(
      or(
        like(sql`lower(${storeProducts.title})`, lowerSearch),
        like(sql`lower(${storeProducts.brand})`, lowerSearch)
      )
    )
    .limit(5);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
