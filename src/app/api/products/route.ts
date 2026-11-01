import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    // Drizzle fetches all columns including titleAr
    const rows = await db.select().from(storeProducts).orderBy(desc(storeProducts.id));
    
    // Ensure the browser doesn't cache the API response
    return NextResponse.json(rows, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  } catch (err) {
    console.error("Failed to load products:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
