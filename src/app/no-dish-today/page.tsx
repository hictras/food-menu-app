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
  const videoUrl = s.no_dish_video_url || "";
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
        gap: 28,
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
            borderRadius: 20,
            boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
      )}

      {videoUrl && (
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid var(--line)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
            background: "#000",
            aspectRatio: "16 / 9",
          }}
        >
          <video
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <h1
          style={{
            fontSize: 38,
            margin: 0,
            fontFamily: "var(--font-head)",
            fontWeight: 400,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
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
      </div>

      <Link
        href="/recipes"
        className="btn btn-primary"
        style={{ padding: "14px 28px", fontSize: 14 }}
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
