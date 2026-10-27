"use client";

import Link from "next/link";

export default function ChessPage() {
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#0f1110", position: "relative" }}>
      {/* Exit button overlays the iframe */}
      <Link
        href="/games"
        style={{
          position: "absolute",
          top: 12,
          insetInlineEnd: 12,
          zIndex: 50,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: "8px 14px",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          color: "var(--ink)",
        }}
      >
        ✕ Exit
      </Link>

      <iframe
        src="https://chess-v7v5.onrender.com"
        title="Online Chess"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="clipboard-write; fullscreen"
      />
    </div>
  );
}
