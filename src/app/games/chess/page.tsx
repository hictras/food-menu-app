"use client";

import Link from "next/link";

export default function ChessPage() {
    return (
        <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#0f1110", position: "relative" }}>

            {/* Control Buttons overlaid on the iframe */}
            <div
                style={{
                    position: "absolute",
                    top: 12,
                    insetInlineEnd: 12,
                    zIndex: 50,
                    display: "flex",
                    gap: 8,
                }}
            >
                <Link
                    href="/games"
                    style={{
                        background: "transparent",
                        border: "1px solid #2f3a24",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 14,
                        fontWeight: "bold",
                        textDecoration: "none",
                        color: "#b8c0a8",
                        cursor: "pointer",
                        marginRight: "12px",
                    }}
                >
                    ← Exit
                </Link>


            </div>

            <iframe
                src="https://chess-v7v5.onrender.com"
                title="Online Chess"
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                allow="clipboard-write; fullscreen"
            />
        </div>
    );
}