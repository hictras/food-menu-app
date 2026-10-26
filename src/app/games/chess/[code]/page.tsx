"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
type Piece = [PieceType, "w" | "b"];
type Square = Piece | null;
type Board = Square[][];
type Pos = { r: number; c: number };

type Room = {
  id: number;
  code: string;
  whitePhone: string;
  blackPhone: string | null;
  board: string;
  turn: "w" | "b";
  status: "waiting" | "active" | "finished";
  winner: string | null;
};

const PIECES: Record<"w" | "b", Record<PieceType, string>> = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

const START: Board = [
  [["r","b"],["n","b"],["b","b"],["q","b"],["k","b"],["b","b"],["n","b"],["r","b"]],
  Array(8).fill(["p","b"] as Piece),
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  Array(8).fill(["p","w"] as Piece),
  [["r","w"],["n","w"],["b","w"],["q","w"],["k","w"],["b","w"],["n","w"],["r","w"]],
];

function cloneBoard(b: Board): Board { return b.map((row) => row.map((sq) => (sq ? [...sq] as Piece : null))); }
function inside(r: number, c: number): boolean { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function findKing(board: Board, color: "w" | "b"): Pos | null {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p && p[0] === "k" && p[1] === color) return { r, c };
  }
  return null;
}

function isInCheck(board: Board, color: "w" | "b"): boolean {
  const king = findKing(board, color);
  if (!king) return false;
  const opp: "w" | "b" = color === "w" ? "b" : "w";
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (!p || p[1] !== opp) continue;
    if (canReach(board, { r, c }, king)) return true;
  }
  return false;
}

function canReach(board: Board, from: Pos, to: Pos): boolean {
  const p = board[from.r][from.c];
  if (!p) return false;
  const type = p[0];
  const color = p[1];
  const dr = to.r - from.r, dc = to.c - from.c;
  const absR = Math.abs(dr), absC = Math.abs(dc);
  const clearPath = () => {
    const stepR = Math.sign(dr), stepC = Math.sign(dc);
    let r = from.r + stepR, c = from.c + stepC;
    while (r !== to.r || c !== to.c) { if (board[r][c]) return false; r += stepR; c += stepC; }
    return true;
  };
  switch (type) {
    case "p": {
      const dir = color === "w" ? -1 : 1;
      const startRow = color === "w" ? 6 : 1;
      if (dc === 0 && dr === dir && !board[to.r][to.c]) return true;
      if (dc === 0 && dr === dir * 2 && from.r === startRow && !board[to.r][to.c] && !board[from.r + dir][from.c]) return true;
      if (absC === 1 && dr === dir && board[to.r][to.c] && board[to.r][to.c]![1] !== color) return true;
      return false;
    }
    case "n": return (absR === 2 && absC === 1) || (absR === 1 && absC === 2);
    case "b": return absR === absC && absR > 0 && clearPath();
    case "r": return ((dr === 0 && dc !== 0) || (dc === 0 && dr !== 0)) && clearPath();
    case "q": return ((absR === absC && absR > 0) || (dr === 0 && dc !== 0) || (dc === 0 && dr !== 0)) && clearPath();
    case "k": return absR <= 1 && absC <= 1 && (absR + absC > 0);
  }
}

function isLegalMove(board: Board, from: Pos, to: Pos): boolean {
  const p = board[from.r][from.c];
  if (!p) return false;
  const target = board[to.r][to.c];
  if (target && target[1] === p[1]) return false;
  if (!canReach(board, from, to)) return false;
  const test = cloneBoard(board);
  test[to.r][to.c] = test[from.r][from.c];
  test[from.r][from.c] = null;
  return !isInCheck(test, p[1]);
}

function hasAnyLegalMove(board: Board, color: "w" | "b"): boolean {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (!p || p[1] !== color) continue;
    for (let tr = 0; tr < 8; tr++) for (let tc = 0; tc < 8; tc++) {
      if (isLegalMove(board, { r, c }, { r: tr, c: tc })) return true;
    }
  }
  return false;
}

export default function ChessRoomPage() {
  const params = useParams();
  const code = String(params.code || "").toUpperCase();
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [room, setRoom] = useState<Room | null>(null);
  const [board, setBoard] = useState<Board>(cloneBoard(START));
  const [selected, setSelected] = useState<Pos | null>(null);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<"w" | "b" | "spectator">("spectator");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const lastTurnRef = useRef<string>("");

  // Fetch my role + join if possible + initial state
  useEffect(() => {
    async function init() {
      try {
        // Try to join (will succeed if we're not already a player)
        const joinRes = await fetch(`/api/chess/rooms/${code}`, { method: "POST" });
        const joinData = await joinRes.json();

        if (joinData.error === "room_full") {
          // Could be a spectator — try plain GET
          const getRes = await fetch(`/api/chess/rooms/${code}`);
          const getData = await getRes.json();
          if (getData.room) {
            setRoom(getData.room);
            setBoard(JSON.parse(getData.room.board));
            lastTurnRef.current = getData.room.turn;
          } else {
            setError("Room not found");
          }
          setMyColor("spectator");
        } else if (joinData.room) {
          setRoom(joinData.room);
          setBoard(JSON.parse(joinData.room.board));
          lastTurnRef.current = joinData.room.turn;
          // Determine my color from phone
          const phoneCookie = document.cookie.split("; ").find(c => c.startsWith("viewer_phone="))?.split("=")[1] || "";
          if (joinData.room.whitePhone === phoneCookie) setMyColor("w");
          else if (joinData.room.blackPhone === phoneCookie) setMyColor("b");
          else setMyColor("spectator");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    if (code) init();
  }, [code]);

  // Poll for updates
  useEffect(() => {
    if (!code) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chess/rooms/${code}`, { cache: "no-store" });
        const data = await res.json();
        if (data.room) {
          setRoom(data.room);
          if (data.room.turn !== lastTurnRef.current) {
            setBoard(JSON.parse(data.room.board));
            lastTurnRef.current = data.room.turn;
            setSelected(null);
          }
          if (data.room.winner) {
            setGameOver(data.room.winner === "w" ? (isAr ? "كش مات — فاز الأبيض" : "Checkmate — White wins") : (isAr ? "كش مات — فاز الأسود" : "Checkmate — Black wins"));
          }
        }
      } catch {}
    }, 1500);
    return () => clearInterval(interval);
  }, [code, isAr]);

  async function pushMove(newBoard: Board, newTurn: "w" | "b", winner: string | null) {
    try {
      await fetch(`/api/chess/rooms/${code}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newBoard, newTurn, winner }),
      });
      setBoard(newBoard);
      lastTurnRef.current = newTurn;
      setSelected(null);
      if (winner) {
        setGameOver(winner === "w" ? (isAr ? "كش مات — فاز الأبيض" : "Checkmate — White wins") : (isAr ? "كش مات — فاز الأسود" : "Checkmate — Black wins"));
      }
    } catch (e) {
      setError(String(e));
    }
  }

  function handleSquareClick(r: number, c: number) {
    if (!room || room.status !== "active" || gameOver) return;
    if (myColor === "spectator") return;
    const currentTurnColor = room.turn;
    if (myColor !== currentTurnColor) return; // not your turn

    const p = board[r][c];

    if (!selected) {
      if (p && p[1] === myColor) setSelected({ r, c });
      return;
    }
    if (selected.r === r && selected.c === c) { setSelected(null); return; }
    if (p && p[1] === myColor) { setSelected({ r, c }); return; }

    if (isLegalMove(board, selected, { r, c })) {
      const next = cloneBoard(board);
      const piece = next[selected.r][selected.c]!;
      let finalPiece: Piece = piece;
      if (piece[0] === "p" && (r === 0 || r === 7)) finalPiece = ["q", piece[1]];
      next[r][c] = finalPiece;
      next[selected.r][selected.c] = null;

      const nextTurn: "w" | "b" = currentTurnColor === "w" ? "b" : "w";
      const check = isInCheck(next, nextTurn);
      const canMove = hasAnyLegalMove(next, nextTurn);
      let winner: string | null = null;
      if (!canMove) {
        if (check) winner = myColor; // I just won
        // stalemate → no winner, no checkmate; we'll just stop
      }
      pushMove(next, nextTurn, winner);
    } else {
      setSelected(null);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>{isAr ? "جارٍ التحميل..." : "Loading..."}</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "var(--accent)" }}>{error}</div>;
  if (!room) return <div style={{ padding: 40, textAlign: "center" }}>{isAr ? "لم يتم العثور على الغرفة" : "Room not found"}</div>;

  const view: "w" | "b" = myColor === "b" ? "b" : "w";
  const rows = view === "w" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const cols = view === "w" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();

  const highlighted = new Set<string>();
  if (selected) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (isLegalMove(board, selected, { r, c })) highlighted.add(`${r},${c}`);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", padding: 12, background: "var(--bg)" }}>
      <Link href="/games/chess/lobby" style={{ position: "absolute", top: 12, insetInlineEnd: 12, zIndex: 50, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 600, textDecoration: "none", color: "var(--ink)" }}>
        ✕ {isAr ? "خروج" : "Exit"}
      </Link>

      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: "var(--surface)", borderRadius: 12, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
            {isAr ? "رمز الغرفة" : "Room code"}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 6, fontFamily: "monospace", color: "var(--accent)" }}>
            {room.code}
          </div>
        </div>

        {room.status === "waiting" && (
          <div style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: 16, borderRadius: 12, textAlign: "center", fontWeight: 700 }}>
            ⏳ {isAr ? "في انتظار انضمام اللاعب الثاني..." : "Waiting for the second player to join..."}
          </div>
        )}

        {room.status === "active" && (
          <div style={{ background: "var(--surface)", padding: 16, borderRadius: 12, textAlign: "center", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
            {myColor === "spectator"
              ? (isAr ? "أنت مشاهد" : "You are a spectator")
              : room.turn === myColor
                ? (isAr ? "🎮 دورك!" : "🎮 Your turn!")
                : (isAr ? "⏳ دور الخصم..." : "⏳ Opponent's turn...")}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            aspectRatio: "1 / 1",
            width: "100%",
            maxWidth: 560,
            margin: "0 auto",
            border: "4px solid #5c3a1a",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          {rows.map((r) =>
            cols.map((c) => {
              const isLight = (r + c) % 2 === 0;
              const piece = board[r][c];
              const isSelected = selected && selected.r === r && selected.c === c;
              const isHighlighted = highlighted.has(`${r},${c}`);
              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  style={{
                    background: isLight ? "#f0d9b5" : "#b58863",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "clamp(24px, 7vw, 48px)",
                    lineHeight: 1,
                    cursor: "pointer",
                    position: "relative",
                    userSelect: "none",
                    outline: isSelected ? "3px solid #ff6b4a" : "none",
                    outlineOffset: "-3px",
                  }}
                >
                  {isHighlighted && (
                    <div style={{ position: "absolute", inset: "30%", borderRadius: "50%", background: "rgba(63, 185, 80, 0.5)" }} />
                  )}
                  {piece && (
                    <span style={{ color: piece[1] === "w" ? "#ffffff" : "#000000", textShadow: piece[1] === "w" ? "0 0 2px #000, 1px 1px 0 #000" : "0 0 2px #fff, 1px 1px 0 #fff", position: "relative", zIndex: 1 }}>
                      {PIECES[piece[1]][piece[0]]}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {gameOver && (
          <div style={{ background: "var(--olive-soft)", border: "1px solid var(--olive)", padding: 16, borderRadius: 12, textAlign: "center", fontWeight: 700, fontSize: 18, color: "var(--olive)" }}>
            {gameOver}
          </div>
        )}
      </div>
    </div>
  );
}
