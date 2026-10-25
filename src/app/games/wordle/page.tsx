"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import GameHeader from "@/components/GameHeader";
import { ar } from "@/lib/ar";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
];

export default function WordleGamePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [targetWord, setTargetWord] = useState("");
  const [wordLength, setWordLength] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  
  // Track keyboard states
  const [keyStates, setKeyStates] = useState<Record<string, "correct" | "present" | "absent">>({});
  // Track grid states (to re-render correctly)
  const [gridData, setGridData] = useState<{ letter: string; state: string }[][]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  async function startGame() {
    setLoading(true);
    setGameOver(false);
    setIsWon(false);
    setCurrentRow(0);
    setCurrentGuess("");
    setKeyStates({});

    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();
      
      // Filter valid words (between 4 and 10 letters)
      let validNames = (Array.isArray(data) ? data : [])
        .map((r: any) => {
          const name = isAr ? (r.nameAr || r.name) : r.name;
          return name ? name.toUpperCase().replace(/[^A-Z\u0600-\u06FF]/g, "") : "";
        })
        .filter((name: string) => name.length >= 4 && name.length <= 10);

      if (isAr) {
        // For Arabic, we just use the word as is (no scramble)
        validNames = validNames.map((n: string) => n);
      }

      if (validNames.length === 0) {
        setLoading(false);
        return;
      }

      const randomWord = validNames[Math.floor(Math.random() * validNames.length)];
      setTargetWord(randomWord);
      setWordLength(randomWord.length);

      // Initialize empty grid
      const emptyGrid = Array(6).fill(null).map(() => 
        Array(randomWord.length).fill(null).map(() => ({ letter: "", state: "" }))
      );
      setGridData(emptyGrid);
      setLoading(false);
      
      // Focus the hidden input
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      setLoading(false);
    }
  }

  useEffect(() => {
    startGame();
  }, [lang]);

  function handleKeyPress(key: string) {
    if (gameOver || loading) return;

    if (key === "ENTER") {
      submitGuess();
    } else if (key === "BACKSPACE") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (currentGuess.length < wordLength) {
      setCurrentGuess((prev) => prev + key);
    }
  }

  function submitGuess() {
    if (currentGuess.length !== wordLength) return;

    const targetChars = targetWord.split("");
    const guessChars = currentGuess.split("");
    const letterCounts: Record<string, number> = {};
    
    for (const char of targetChars) {
      letterCounts[char] = (letterCounts[char] || 0) + 1;
    }

    const newGrid = [...gridData];
    const newKeyStates = { ...keyStates };
    let allCorrect = true;

    // First pass: Exact matches (Green)
    for (let i = 0; i < wordLength; i++) {
      const letter = guessChars[i];
      if (letter === targetChars[i]) {
        newGrid[currentRow][i] = { letter, state: "correct" };
        letterCounts[letter]--;
        newKeyStates[letter] = "correct";
      } else {
        allCorrect = false;
      }
    }

    // Second pass: Present (Orange) or Absent (Gray)
    for (let i = 0; i < wordLength; i++) {
      const letter = guessChars[i];
      if (newGrid[currentRow][i].state !== "correct") {
        if (letterCounts[letter] > 0) {
          newGrid[currentRow][i] = { letter, state: "present" };
          letterCounts[letter]--;
          if (newKeyStates[letter] !== "correct") newKeyStates[letter] = "present";
        } else {
          newGrid[currentRow][i] = { letter, state: "absent" };
          if (newKeyStates[letter] !== "correct" && newKeyStates[letter] !== "present") {
            newKeyStates[letter] = "absent";
          }
        }
      }
    }

    setGridData(newGrid);
    setKeyStates(newKeyStates);

    if (allCorrect) {
      setGameOver(true);
      setIsWon(true);
      return;
    }

    if (currentRow === 5) {
      setGameOver(true);
      return;
    }

    setCurrentRow((r) => r + 1);
    setCurrentGuess("");
  }

  // Handle physical keyboard
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (showRules) return;
      if (e.key === "Enter") handleKeyPress("ENTER");
      else if (e.key === "Backspace") handleKeyPress("BACKSPACE");
      else {
        const letter = e.key.toUpperCase();
        if (/^[A-Z\u0600-\u06FF]$/.test(letter)) handleKeyPress(letter);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentGuess, gameOver, loading, showRules, wordLength]);

  if (loading) return <div className="container" style={{ padding: 40 }}>{isAr ? ar.wordle.loading : "Loading..."}</div>;

  if (wordLength === 0) return <div className="container" style={{ padding: 40 }}>{isAr ? ar.wordle.noRecipes : "No recipes available."}</div>;

  const currentRowData = gridData[currentRow] || [];
  const activeLetters = currentGuess.split("");

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", padding: 10, background: "var(--bg)", overflow: "hidden", position: "relative" }} dir={isAr ? "rtl" : "ltr"}>
      <Link href="/games" style={{ position: "absolute", top: 12, insetInlineEnd: 12, zIndex: 50, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 600, textDecoration: "none", color: "var(--ink)" }}>✕ {isAr ? "خروج" : "Exit"}</Link>
      
      {/* Hidden Input to trigger mobile keyboard */}
      <input 
        ref={inputRef} 
        type="text" 
        style={{ position: "absolute", opacity: 0, height: 0, width: 0 }} 
        autoFocus
      />

      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
        
        {/* HEADER */}
        <GameHeader 
        title="Recipe Wordle" 
        titleAr="خمن الوصفة" 
        onNewGame={startGame} 
        onShowRules={() => setShowRules(true)} 
        
        
      />

        {/* GRID */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 400, height: "100%", maxHeight: 400 }}>
            {gridData.map((row, r) => (
              <div key={r} style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${wordLength}, 1fr)`, gap: 4 }}>
                {row.map((cell, c) => {
                  let letter = cell.letter;
                  let state = cell.state;
                  
                  // Live preview for the active row
                  if (r === currentRow && !gameOver) {
                    letter = activeLetters[c] || "";
                    state = "";
                  }

                  return (
                    <div key={c} style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid",
                      borderColor: state === "correct" ? "var(--olive)" : state === "present" ? "var(--accent)" : state === "absent" ? "var(--line-strong)" : (letter ? "var(--muted)" : "var(--line)"),
                      background: state === "correct" ? "var(--olive)" : state === "present" ? "var(--accent)" : state === "absent" ? "rgba(255,255,255,0.05)" : "transparent",
                      color: state ? "#fff" : "var(--ink)",
                      borderRadius: 6,
                      fontSize: "clamp(1rem, 4vw, 1.5rem)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      transition: "all 0.2s",
                    }}>
                      {letter}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* KEYBOARD */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, marginBottom: "env(safe-area-inset-bottom, 10px)" }}>
          {KEYBOARD_ROWS.map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "center", gap: 4 }}>
              {row.map((key) => {
                const kState = keyStates[key];
                const isWide = key === "ENTER" || key === "BACKSPACE";
                const isDisabled = kState === "absent";

                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    disabled={isDisabled}
                    style={{
                      height: 44,
                      flex: isWide ? 1.5 : 1,
                      maxWidth: isWide ? 65 : 45,
                      borderRadius: 4,
                      border: "none",
                      background: kState === "correct" ? "var(--olive)" : kState === "present" ? "var(--accent)" : kState === "absent" ? "var(--line-strong)" : "var(--surface-2)",
                      color: kState === "absent" ? "var(--muted)" : "var(--ink)",
                      fontSize: isWide ? "0.75rem" : "0.9rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.5 : 1,
                      transition: "all 0.1s",
                    }}
                  >
                    {key === "BACKSPACE" ? "⌫" : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* RULES MODAL */}
      {showRules && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 20, maxWidth: 400, width: "100%" }}>
            <h2 style={{ marginTop: 0 }}>{isAr ? ar.wordle.rulesTitle : "Game Rules"}</h2>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--ink-soft)" }} dangerouslySetInnerHTML={{ __html: isAr ? ar.wordle.rulesText : "<strong>Goal:</strong> Guess the Recipe Name in 6 tries.<br><br><strong>Colors:</strong><br>🟩 Green = Correct letter in the correct spot.<br>🟧 Orange = Correct letter but in the wrong spot.<br>⬛ Gray = Letter is not in the word.<br><br><em>The keyboard will disable letters that are not in the word!</em>" }} />
            <button className="btn btn-primary" onClick={() => setShowRules(false)} style={{ width: "100%", marginTop: 16 }}>
              {isAr ? ar.wordle.gotIt : "Got it"}
            </button>
          </div>
        </div>
      )}

      {/* WIN/LOSS MODAL */}
      {gameOver && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 20, maxWidth: 400, width: "100%", textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: "2rem", margin: "0 0 8px 0" }}>
              {isWon ? (isAr ? ar.wordle.youWin : "🎉 You Win!") : (isAr ? ar.wordle.gameOver : "😢 Game Over")}
            </h2>
            <p style={{ color: "var(--muted)", marginBottom: 24 }}>
              {isWon 
                ? (isAr ? ar.wordle.youWinMsg : "You guessed the recipe!") 
                : (isAr ? `${ar.wordle.gameOverMsg} ${targetWord}` : `The recipe was: ${targetWord}`)}
            </p>
            <button className="btn btn-primary" onClick={startGame} style={{ width: "100%" }}>
              {isAr ? ar.wordle.playAgain : "Play Again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
