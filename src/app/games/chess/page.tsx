"use client";

import Link from "next/link";
import { useRef } from "react";

export default function ChessPage() {
    const iframeRef = useRef<HTMLIFrameElement>(null);

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
                        background: "var(--surface, #1f2716)",
                        border: "1px solid var(--line, #2f3a24)",
                        borderRadius: 10,
                        padding: "8px 14px",
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: "none",
                        color: "var(--ink, #f1f4e8)",
                        cursor: "pointer",
                    }}
                >
                    ← Back
                </Link>

                <button
                    onClick={() => {
                        // Attempt to tell the iframe to go back, then go back in React
                        if (iframeRef.current?.contentWindow) {
                            iframeRef.current.contentWindow.history.back();
                        }
                        window.history.back();
                    }}
                    style={{
                        background: "rgba(224, 104, 79, 0.15)",
                        border: "1px solid rgba(224, 104, 79, 0.4)",
                        borderRadius: 10,
                        padding: "8px 14px",
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: "none",
                        color: "#e0684f",
                        cursor: "pointer",
                    }}
                >
                    ✕ Close
                </button>
            </div>

            <iframe
                ref={iframeRef}
                src="https://chess-v7v5.onrender.com"
                title="Online Chess"
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                allow="clipboard-write; fullscreen"
            />
        </div>
    );
}