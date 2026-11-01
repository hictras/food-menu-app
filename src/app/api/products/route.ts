import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(storeProducts).orderBy(desc(storeProducts.id));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Failed to load products:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
