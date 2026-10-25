"use client";
import Link from "next/link";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";
import GameHeader from "@/components/GameHeader";
import { ar } from "@/lib/ar";

const GRID_SIZE = 20;
const FOOD_EMOJIS = ["🥔", "🧅", "🍅", "🥕", "🥦", "🌽", "🍄", "🫑"];

type Point = { x: number; y: number };

export default function SnakeGamePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const snakeRef = useRef<Point[]>([]);
  const dirRef = useRef<Point>({ x: 0, y: -1 });
  const nextDirRef = useRef<Point>({ x: 0, y: -1 });
  const foodRef = useRef<{ x: number; y: number; emoji: string }>({ x: 0, y: 0, emoji: "🍅" });
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<Point>({ x: 0, y: 0 });
  const isRunningRef = useRef(false);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tileSize = canvas.width / GRID_SIZE;

    ctx.fillStyle = "#16161a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * tileSize, 0);
      ctx.lineTo(i * tileSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * tileSize);
      ctx.lineTo(canvas.width, i * tileSize);
      ctx.stroke();
    }

    ctx.font = `${tileSize - 4}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      foodRef.current.emoji,
      foodRef.current.x * tileSize + tileSize / 2,
      foodRef.current.y * tileSize + tileSize / 2
    );

    snakeRef.current.forEach((seg, i) => {
      if (i === 0) {
        ctx.font = `${tileSize}px Arial`;
        ctx.fillText("🍴", seg.x * tileSize + tileSize / 2, seg.y * tileSize + tileSize / 2);
      } else {
        ctx.fillStyle = "#7ba05b";
        const x = seg.x * tileSize + 2;
        const y = seg.y * tileSize + 2;
        const w = tileSize - 4;
        const h = tileSize - 4;
        const r = Math.min(4, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
      }
    });
  }, []);

  const spawnFood = useCallback(() => {
    let newFood: { x: number; y: number; emoji: string } = { x: 0, y: 0, emoji: "🍅" };
    for (let attempts = 0; attempts < 200; attempts++) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
      };
      const onSnake = snakeRef.current.some((s) => s.x === newFood.x && s.y === newFood.y);
      if (!onSnake) break;
    }
    foodRef.current = newFood;
  }, []);

  const endGame = useCallback(() => {
    isRunningRef.current = false;
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    setGameOver(true);
    if (scoreRef.current > bestRef.current) {
      bestRef.current = scoreRef.current;
      setBest(scoreRef.current);
      try {
        localStorage.setItem("fork_snake_best", String(scoreRef.current));
      } catch {}
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (!isRunningRef.current) return;

    dirRef.current = nextDirRef.current;
    const head = {
      x: snakeRef.current[0].x + dirRef.current.x,
      y: snakeRef.current[0].y + dirRef.current.y,
    };

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      endGame();
      return;
    }

    for (let i = 0; i < snakeRef.current.length - 1; i++) {
      if (head.x === snakeRef.current[i].x && head.y === snakeRef.current[i].y) {
        endGame();
        return;
      }
    }

    snakeRef.current.unshift(head);

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      spawnFood();
    } else {
      snakeRef.current.pop();
    }

    draw();
  }, [endGame, spawnFood, draw]);

  const startGame = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    isRunningRef.current = true;

    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    dirRef.current = { x: 0, y: -1 };
    nextDirRef.current = { x: 0, y: -1 };

    let fx = 5;
    let fy = 5;
    let guard = 0;
    while (snakeRef.current.some((s) => s.x === fx && s.y === fy) && guard++ < 200) {
      fx = Math.floor(Math.random() * GRID_SIZE);
      fy = Math.floor(Math.random() * GRID_SIZE);
    }
    foodRef.current = {
      x: fx,
      y: fy,
      emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
    };

    draw();

    loopRef.current = setInterval(gameLoop, 130);
  }, [draw, gameLoop]);

  useEffect(() => {
    let storedBest = 0;
    try {
      const stored = localStorage.getItem("fork_snake_best");
      if (stored) storedBest = Number(stored) || 0;
    } catch {}
    bestRef.current = storedBest;
    setBest(storedBest);
    startGame();

    return () => {
      isRunningRef.current = false;
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [startGame]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (gameOver) return;
      const { x, y } = dirRef.current;
      if (e.key === "ArrowUp" && y === 0) nextDirRef.current = { x: 0, y: -1 };
      if (e.key === "ArrowDown" && y === 0) nextDirRef.current = { x: 0, y: 1 };
      if (e.key === "ArrowLeft" && x === 0) nextDirRef.current = { x: -1, y: 0 };
      if (e.key === "ArrowRight" && x === 0) nextDirRef.current = { x: 1, y: 0 };
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameOver]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (gameOver) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartRef.current.x;
    const dy = touchEndY - touchStartRef.current.y;
    const { x, y } = dirRef.current;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && x === 0) nextDirRef.current = { x: 1, y: 0 };
      if (dx < 0 && x === 0) nextDirRef.current = { x: -1, y: 0 };
    } else {
      if (dy > 0 && y === 0) nextDirRef.current = { x: 0, y: 1 };
      if (dy < 0 && y === 0) nextDirRef.current = { x: 0, y: -1 };
    }
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", padding: 12, background: "var(--bg)", overflow: "hidden", position: "relative" }}>
      <Link href="/games" style={{ position: "absolute", top: 12, insetInlineEnd: 12, zIndex: 50, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 600, textDecoration: "none", color: "var(--ink)" }}>✕ {isAr ? "خروج" : "Exit"}</Link>

      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
        <GameHeader
          title="Fork Snake"
          titleAr="ثعبان الشوكة"
          onNewGame={startGame}
          onShowRules={() => setShowRules(true)}
          score={score}
          best={best}
        />

        <div
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, position: "relative" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", maxWidth: "100%", maxHeight: "100%", aspectRatio: "1/1", touchAction: "none" }}
          />

          {gameOver && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: "var(--radius)" }}>
              <h2 style={{ fontFamily: "var(--font-head)", fontSize: "2rem", margin: "0 0 8px 0" }}>
                {isAr ? ar.snake.gameOver : "Game Over"}
              </h2>
              <p style={{ color: "var(--muted)", marginBottom: 24 }}>
                {isAr ? ar.snake.gameOverMsg : "You hit the wall or your tail!"}
              </p>
              <div style={{ fontSize: "3rem", fontWeight: 700, color: "var(--accent)", marginBottom: 24 }}>{score}</div>
              <button className="btn btn-primary" onClick={startGame} style={{ padding: "14px 28px" }}>
                {isAr ? ar.snake.playAgain : "Play Again"}
              </button>
            </div>
          )}
        </div>
      </div>

      {showRules && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 20, maxWidth: 400, width: "100%" }}>
            <h2 style={{ marginTop: 0 }}>{isAr ? ar.snake.rulesTitle : "Game Rules"}</h2>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--ink-soft)" }} dangerouslySetInnerHTML={{ __html: isAr ? ar.snake.rulesText : "<strong>Goal:</strong> Eat as many ingredients as possible.<br><br><strong>How to play:</strong> Swipe on mobile or use Arrow keys to move.<br><br><strong>⚠️ Warning:</strong> Do not hit the wall or your own tail, or the game is over!" }} />
            <button className="btn btn-primary" onClick={() => setShowRules(false)} style={{ width: "100%", marginTop: 16 }}>
              {isAr ? ar.snake.gotIt : "Got it"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
