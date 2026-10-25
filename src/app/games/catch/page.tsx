"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";

type Item = {
  id: number;
  x: number;
  y: number;
  speed: number;
  emoji: string;
  isBad: boolean;
};

const GOOD_ITEMS = ["🥔", "🧅", "🍅", "🥕", "🥦", "🌽", "🍄", "🫑"];
const BAD_ITEM = "👟";

export default function CatchGamePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const basketRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const itemsRef = useRef<Item[]>([]);
  const basketXRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [showRules, setShowRules] = useState(false);

  function startGame() {
    setGameOver(false);
    setScore(0);
    setLives(3);
    itemsRef.current.forEach(i => {
      const el = document.getElementById(`item-${i.id}`);
      if (el) el.remove();
    });
    itemsRef.current = [];
    isPlayingRef.current = true;
    lastTimeRef.current = 0;
    spawnTimerRef.current = 0;

    if (gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      basketXRef.current = rect.width / 2;
      if (basketRef.current) {
        basketRef.current.style.left = `${basketXRef.current}px`;
      }
    }

    requestRef.current = requestAnimationFrame(update);
  }

  function endGame() {
    isPlayingRef.current = false;
    cancelAnimationFrame(requestRef.current);
    setGameOver(true);
  }

  useEffect(() => {
    // Initial start
    startGame();

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Handle resize
  useEffect(() => {
    function handleResize() {
      if (!gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      basketXRef.current = Math.max(40, Math.min(rect.width - 40, basketXRef.current));
      if (basketRef.current) {
        basketRef.current.style.left = `${basketXRef.current}px`;
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function update(time: number) {
    if (!isPlayingRef.current || !gameAreaRef.current) return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Spawn (every 1200ms for slower pace)
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current > 1200) {
      spawnItem();
      spawnTimerRef.current = 0;
    }

    const rect = gameAreaRef.current.getBoundingClientRect();
    const basketTop = rect.height - 70;

    // Update items
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const item = itemsRef.current[i];
      // SLOWER SPEED: 1 to 2 pixels per frame
      item.y += item.speed * (deltaTime / 16);
      
      const el = document.getElementById(`item-${item.id}`);
      if (el) {
        el.style.transform = `translate(${item.x}px, ${item.y}px)`;
      }

      // Collision with basket
      if (item.y > basketTop - 30 && item.y < basketTop + 30) {
        if (Math.abs(item.x - basketXRef.current) < 40) {
          if (el) el.remove();
          itemsRef.current.splice(i, 1);
          
          if (item.isBad) {
            setLives((l) => {
              const next = l - 1;
              if (next <= 0) endGame();
              return next;
            });
          } else {
            setScore((s) => s + 1);
          }
          continue;
        }
      }

      // Missed
      if (item.y > rect.height) {
        if (el) el.remove();
        itemsRef.current.splice(i, 1);
        
        if (!item.isBad) {
          setLives((l) => {
            const next = l - 1;
            if (next <= 0) endGame();
            return next;
          });
        }
      }
    }

    requestRef.current = requestAnimationFrame(update);
  }

  function spawnItem() {
    if (!gameAreaRef.current) return;
    
    const isBad = Math.random() < 0.15;
    const emoji = isBad ? BAD_ITEM : GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)];
    const id = Date.now() + Math.random();
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = Math.random() * (rect.width - 40) + 20;

    const el = document.createElement("div");
    el.id = `item-${id}`;
    el.className = "falling-item";
    el.textContent = emoji;
    el.style.transform = `translate(${x}px, -50px)`;
    
    gameAreaRef.current.appendChild(el);
    itemsRef.current.push({ id, x, y: -50, speed: 1 + Math.random(), emoji, isBad });
  }

  function handleMove(clientX: number) {
    if (!isPlayingRef.current || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(40, Math.min(rect.width - 40, x));
    basketXRef.current = x;
    if (basketRef.current) {
      basketRef.current.style.left = `${x}px`;
    }
  }

  // Keyboard movement for desktop
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isPlayingRef.current) return;
      if (e.key === "ArrowLeft") handleMove(basketXRef.current - 30 + (gameAreaRef.current?.getBoundingClientRect().left || 0));
      if (e.key === "ArrowRight") handleMove(basketXRef.current + 30 + (gameAreaRef.current?.getBoundingClientRect().left || 0));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 style={{ fontFamily: "var(--font-head)", fontSize: "1.5rem", margin: 0 }}>
            {isAr ? ar.catch.title : "Catch the Ingredients"}
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={startGame} style={{ fontSize: "0.7rem", padding: "4px 8px" }}>
              {isAr ? ar.catch.newGame : "↻ New Game"}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowRules(true)} style={{ fontSize: "0.7rem", padding: "4px 8px" }}>
              {isAr ? ar.catch.rules : "? Rules"}
            </button>
          </div>
        </div>
      </div>

      {/* GAME AREA */}
      <div 
        ref={gameAreaRef}
        onMouseMove={(e) => handleMove(e.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
        style={{ position: "relative", flex: 1, width: "100%", overflow: "hidden", touchAction: "none" }}
      >
        {/* HUD */}
        <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", zIndex: 10, pointerEvents: "none" }}>
          <div style={{ background: "rgba(0,0,0,0.5)", padding: "8px 16px", borderRadius: 999, fontWeight: 700, color: "var(--ink)" }}>
            🏆 {score}
          </div>
          <div style={{ background: "rgba(0,0,0,0.5)", padding: "8px 16px", borderRadius: 999, fontWeight: 700, color: "var(--accent)" }}>
            {"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}
          </div>
        </div>

        {/* BASKET */}
        <div 
          ref={basketRef}
          style={{
            position: "absolute",
            bottom: 20,
            width: 80,
            height: 50,
            background: "#8b5a2b",
            borderRadius: "0 0 40px 40px",
            border: "4px solid #5c3a1a",
            borderTop: "none",
            transform: "translateX(-50%)",
            zIndex: 5,
            boxShadow: "inset 0 -10px 20px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.5)",
          }}
        />
      </div>

      {/* RULES MODAL */}
      {showRules && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 20, maxWidth: 400, width: "100%" }}>
            <h2 style={{ marginTop: 0 }}>{isAr ? ar.catch.rulesTitle : "Game Rules"}</h2>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--ink-soft)" }} dangerouslySetInnerHTML={{ __html: isAr ? ar.catch.rulesText : "<strong>Goal:</strong> Move the basket to catch falling ingredients.<br><br><strong>Lives:</strong> You have 3 hearts. If an ingredient falls or you catch a shoe (👟), you lose a heart.<br><br><strong>Score:</strong> Each ingredient you catch gives you a point!" }} />
            <button className="btn btn-primary" onClick={() => setShowRules(false)} style={{ width: "100%", marginTop: 16 }}>
              {isAr ? ar.catch.gotIt : "Got it"}
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameOver && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 20, maxWidth: 400, width: "100%", textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: "2rem", margin: "0 0 8px 0" }}>
              {isAr ? ar.catch.gameOver : "Game Over"}
            </h2>
            <p style={{ color: "var(--muted)", marginBottom: 24 }}>
              {isAr ? ar.catch.youCaught : "You caught"}
            </p>
            <div style={{ fontSize: "3rem", fontWeight: 700, color: "var(--accent)", marginBottom: 24 }}>{score}</div>
            <p style={{ color: "var(--muted)", marginBottom: 24 }}>
              {isAr ? ar.catch.ingredients : "ingredients!"}
            </p>
            <button className="btn btn-primary" onClick={startGame} style={{ width: "100%" }}>
              {isAr ? ar.catch.playAgain : "Play Again"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .falling-item {
          position: absolute;
          font-size: 2.5rem;
          line-height: 1;
          pointer-events: none;
          will-change: transform;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
          z-index: 2;
        }
      `}</style>
    </div>
  );
}
