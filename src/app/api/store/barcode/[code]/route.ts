import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = getDb();
  const [product] = await db
    .select()
    .from(storeProducts)
    .where(eq(storeProducts.sku, code))
    .limit(1);
  if (!product) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, product });
}
