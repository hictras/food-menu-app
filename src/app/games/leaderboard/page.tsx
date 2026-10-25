"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const GAMES = [
  { id: "catch", name: "Catch", label: "BEST SCORE" },
  { id: "memory", name: "Memory", label: "BEST TIME" },
  { id: "wordle", name: "Wordle", label: "WINS" },
  { id: "guess", name: "Guess", label: "WINS" },
  { id: "puzzle", name: "Puzzle", label: "SOLVED" },
  { id: "snake", name: "Snake", label: "BEST SCORE" },
];

export default function LeaderboardPage() {
  const [activeGame, setActiveGame] = useState(GAMES[0]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?game=${activeGame.id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.leaderboard || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeGame]);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <Link href="/games" className="btn btn-ghost" style={{ marginBottom: 24 }}>
        ← Games
      </Link>

      <h1 style={{ fontFamily: "var(--font-head)", fontSize: "2.5rem", marginBottom: 8 }}>
        🏆 Leaderboard
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 32 }}>
        Top players across all games
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 16 }}>
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGame(g)}
            className={`btn ${activeGame.id === g.id ? "btn-primary" : "btn-ghost"}`}
            style={{ whiteSpace: "nowrap", padding: "10px 16px" }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            No scores yet. Be the first!
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "16px", fontWeight: 600, color: "var(--muted)", width: 60 }}>#</th>
                <th style={{ padding: "16px", fontWeight: 600, color: "var(--muted)" }}>Player</th>
                <th style={{ padding: "16px", fontWeight: 600, color: "var(--muted)", textAlign: "right" }}>
                  {activeGame.label}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const val = row.stats[activeGame.id === 'catch' ? 'bestCatched' : activeGame.id === 'memory' ? 'bestTime' : activeGame.id === 'wordle' ? 'wins' : activeGame.id === 'guess' ? 'guessed' : activeGame.id === 'puzzle' ? 'solved' : 'bestScore'];
                const displayVal = activeGame.id === "memory" ? `${val}s` : val;
                
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "16px", fontWeight: 700, color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "var(--muted)" }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: "16px", fontWeight: 500, color: "var(--ink)" }}>
                      {row.phone.slice(0, 4)}***{row.phone.slice(-3)}
                    </td>
                    <td style={{ padding: "16px", fontWeight: 700, color: "var(--olive)", textAlign: "right" }}>
                      {displayVal || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
