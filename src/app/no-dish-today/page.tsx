import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getDb } from "@/db";
import { settings } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> {
  const db = getDb();
  const rows = await db.select().from(settings);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const image =
    s.no_dish_image_url ||
    s.logo_url ||
    "https://food-menu-app-xxww.onrender.com/icon-512.png";

  return {
    title: "No dish today",
    description: "Check back tomorrow — something delicious is coming.",
    openGraph: {
      title: "No dish today",
      description: "Check back tomorrow — something delicious is coming.",
      images: [{ url: image }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "No dish today",
      description: "Check back tomorrow — something delicious is coming.",
      images: [image],
    },
  };
}

async function NoDishContent() {
  await connection();
  const db = getDb();
  const rows = await db.select().from(settings);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const imageUrl = s.no_dish_image_url || "";
  const logoUrl = s.logo_url || "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 200px)",
        textAlign: "center",
        padding: "40px 24px",
        gap: 24,
      }}
    >
      {(imageUrl || logoUrl) && (
        <img
          src={imageUrl || logoUrl}
          alt="No dish today"
          style={{
            maxWidth: 360,
            width: "100%",
            height: "auto",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        />
      )}

      <h1
        style={{
          fontSize: 36,
          margin: 0,
          fontFamily: "var(--font-head)",
          fontWeight: 400,
          letterSpacing: "-0.02em",
        }}
      >
        Sorry, no dish today
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "var(--ink-soft)",
          maxWidth: 480,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Check back tomorrow — something delicious is coming.
      </p>

      <Link
        href="/recipes"
        className="btn btn-primary"
        style={{ marginTop: 8, padding: "12px 24px", fontSize: 14 }}
      >
        ← Browse recipes
      </Link>
    </div>
  );
}

export default function NoDishTodayPage() {
  return (
    <main className="container">
      <NoDishContent />
    </main>
  );
}
