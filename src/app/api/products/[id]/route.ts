import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const productId = Number(id);
    if (Number.isNaN(productId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const { titleAr, price, isPromotion } = body;

    const updateData: any = {};
    if (titleAr !== undefined) updateData.titleAr = titleAr || null;
    if (price !== undefined) updateData.price = Number(price) || 0;
    if (isPromotion !== undefined) updateData.isPromotion = isPromotion ? 1 : 0;

    const db = getDb();
    await db.update(storeProducts)
      .set(updateData)
      .where(eq(storeProducts.id, productId));
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update product error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const productId = Number(id);
    if (Number.isNaN(productId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = getDb();
    await db.delete(storeProducts).where(eq(storeProducts.id, productId));
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete product error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
