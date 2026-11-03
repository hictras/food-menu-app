import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeProducts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const products = await db.select().from(storeProducts);
    let updated = 0;

    const regex = /(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilos|g|gr|gram|grams|ml|l|liter|liters|litre|litres|pcs|pc|pieces|piece|oz|lb|lbs|cl)\b/i;

    for (const p of products) {
      if (p.packageSize && p.packageUnit) continue; // Skip if already parsed

      const match = p.title.match(regex);
      if (match) {
        let size = parseFloat(match[1].replace(",", "."));
        const rawUnit = match[2].toLowerCase();
        let unit = null;

        if (["kg", "kilo", "kilos"].includes(rawUnit)) unit = "kg";
        else if (["g", "gr", "gram", "grams"].includes(rawUnit)) unit = "g";
        else if (["ml"].includes(rawUnit)) unit = "ml";
        else if (["l", "liter", "liters", "litre", "litres"].includes(rawUnit)) unit = "L";
        else if (["pcs", "pc", "pieces", "piece"].includes(rawUnit)) unit = "pcs";
        else if (["oz"].includes(rawUnit)) unit = "oz";
        else if (["lb", "lbs"].includes(rawUnit)) unit = "lb";
        else if (["cl"].includes(rawUnit)) unit = "cl";

        if (Number.isFinite(size) && unit) {
          await db.update(storeProducts)
            .set({ packageSize: size, packageUnit: unit })
            .where(eq(storeProducts.id, p.id));
          updated++;
        }
      }
    }

    return NextResponse.json({ success: true, message: `✅ Fixed sizes for ${updated} products!` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
