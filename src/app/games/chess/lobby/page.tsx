"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

type Room = {
  id: number;
  code: string;
  whitePhone: string;
  blackPhone: string | null;
  status: string;
  createdAt: string;
};

export default function ChessLobbyPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/chess/rooms")
      .then((r) => r.json())
      .then((d) => {
        setRooms(d.rooms || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function createRoom() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/chess/rooms", { method: "POST" });
      const data = await res.json();
      if (data.room) {
        router.push(`/games/chess/${data.room.code}`);
      } else {
        setError(data.error || "Failed to create room");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setCreating(false);
    }
  }

  async function joinRoom() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setError("");
    try {
      const res = await fetch(`/api/chess/rooms/${code}`, { method: "POST" });
      const data = await res.json();
      if (data.room) {
        router.push(`/games/chess/${code}`);
      } else {
        setError(data.error === "room_full" ? (isAr ? "الغرفة ممتلئة" : "Room is full") : (isAr ? "لم يتم العثور على الغرفة" : "Room not found"));
      }
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 16px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Link href="/games" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", marginBottom: 24, display: "inline-block" }}>
          ← {isAr ? "الألعاب" : "Games"}
        </Link>

        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 8px", color: "var(--ink)" }}>
          ♔ {isAr ? "شطرنج أونلاين" : "Online Chess"}
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: 32 }}>
          {isAr ? "العب مع صديق على جهاز آخر" : "Play with a friend on another device"}
        </p>

        {/* CREATE ROOM */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 12px", color: "var(--ink)" }}>
            {isAr ? "إنشاء غرفة جديدة" : "Create a new room"}
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>
            {isAr ? "ستحصل على رمز لمشاركته مع صديقك" : "You'll get a code to share with your friend"}
          </p>
          <button
            onClick={createRoom}
            disabled={creating}
            style={{
              width: "100%",
              background: "var(--accent)",
              color: "white",
              border: "none",
              padding: "14px",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: creating ? "wait" : "pointer",
              opacity: creating ? 0.6 : 1,
            }}
          >
            {creating ? (isAr ? "جارٍ الإنشاء..." : "Creating...") : (isAr ? "➕ إنشاء غرفة" : "➕ Create room")}
          </button>
        </div>

        {/* JOIN ROOM */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 12px", color: "var(--ink)" }}>
            {isAr ? "الانضمام إلى غرفة" : "Join a room"}
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>
            {isAr ? "أدخل رمز الغرفة الذي شاركه صديقك" : "Enter the room code your friend shared"}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              placeholder={isAr ? "مثال: ABC123" : "e.g. ABC123"}
              maxLength={6}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "1px solid var(--line)",
                borderRadius: 10,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 4,
                textAlign: "center",
                background: "var(--bg)",
                color: "var(--ink)",
                textTransform: "uppercase",
                fontFamily: "monospace",
              }}
            />
            <button
              onClick={joinRoom}
              disabled={!joinCode.trim()}
              style={{
                background: "var(--olive)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: joinCode.trim() ? "pointer" : "not-allowed",
                opacity: joinCode.trim() ? 1 : 0.4,
              }}
            >
              {isAr ? "دخول" : "Join"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: 12, background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* MY ROOMS */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 12px", color: "var(--ink)" }}>
            {isAr ? "غرفي" : "My rooms"}
          </h2>
          {loading ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
          ) : rooms.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0, fontSize: 14 }}>{isAr ? "لا توجد غرف بعد" : "No rooms yet"}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/games/chess/${room.code}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, fontFamily: "monospace", color: "var(--ink)" }}>{room.code}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      {room.status === "waiting" ? (isAr ? "⏳ في الانتظار" : "⏳ Waiting") : room.status === "active" ? (isAr ? "🎮 نشطة" : "🎮 Active") : (isAr ? "✅ انتهت" : "✅ Finished")}
                    </span>
                  </div>
                  <span style={{ fontSize: 20 }}>→</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
