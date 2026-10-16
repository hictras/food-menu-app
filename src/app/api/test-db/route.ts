import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const tables = await db.all(
      sql`SELECT name FROM sqlite_master WHERE type='table'`
    );
    return Response.json({ ok: true, tables });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
