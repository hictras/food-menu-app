import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = getDb();
  
  // 1. Look for an exact barcode match
  let [product] = await db
    .select()
    .from(storeProducts)
    .where(eq(storeProducts.barcode, code))
    .limit(1);

  // 2. Fallback: If no barcode is found, try finding it in the SKU column
  if (!product) {
    [product] = await db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.sku, code))
      .limit(1);
  }

  if (!product) return NextResponse.json({ found: false });
  
  return NextResponse.json({ found: true, product });
}
