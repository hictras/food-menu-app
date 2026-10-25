"use client";

import { useEffect, useState, useRef } from "react";
import { useLang } from "@/components/LanguageProvider";
import Link from "next/link";
import { ar } from "@/lib/ar";
import GameHeader from "@/components/GameHeader";
import { useGameStats } from "@/hooks/useGameStats";

const AR_KEYBOARD_ROWS = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج"],
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "د"],
  ["ENTER", "ذ", "ط", "ظ", "ر", "ز", "و", "ة", "ى", "ء", "BACKSPACE"],
];

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
];

export default function WordleGamePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const keyboardRows = isAr ? AR_KEYBOARD_ROWS : KEYBOARD_ROWS;

  const { stats, saveStats } = useGameStats("wordle", { wins: 0, played: 0 });

  const [targetWord, setTargetWord] = useState("");
  const [wordLength, setWordLength] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  const [keyStates, setKeyStates] = useState<Record<string, "correct" | "present" | "absent">>({});
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

      let validNames = (Array.isArray(data) ? data : [])
        .map((r: any) => {
          const name = isAr ? (r.nameAr || r.name) : r.name;
          return name ? name.toUpperCase().replace(/[^A-Z\u0600-\u06FF]/g, "") : "";
        })
        .filter((name: string) => name.length >= 4 && name.length <= 10);

      if (validNames.length === 0) {
        setLoading(false);
        return;
      }

      const randomWord = validNames[Math.floor(Math.random() * validNames.length)];
      setTargetWord(randomWord);
      setWordLength(randomWord.length);

      const emptyGrid = Array(6).fill(null).map(() =>
        Array(randomWord.length).fill(null).map(() => ({ letter: "", state: "" }))
      );
      setGridData(emptyGrid);
      setLoading(false);

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      setLoading(false);
    }
  }

  useEffect(() => {
    startGame();
  }, []);

  // Save stats when game over
  useEffect(() => {
    if (gameOver) {
      saveStats((prev) => ({
        wins: (prev.wins || 0) + (isWon ? 1 : 0),
        played: (prev.played || 0) + 1
      }));
    }
  }, [gameOver]);

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

  if (loading) return <div className="container" style={{ padding: 40 }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>;
  if (wordLength === 0) return <div className="container" style={{ padding: 40 }}>{isAr ? "لا توجد وصفات" : "No recipes available."}</div>;

  const activeLetters = currentGuess.split("");

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", padding: 10, background: "var(--bg)", overflow: "hidden", position: "relative" }}>
      <Link href="/games" style={{ position: "absolute", top: 12, insetInlineEnd: 12, zIndex: 50, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 600, textDecoration: "none", color: "var(--ink)" }}>
        ✕ {isAr ? "خروج" : "Exit"}
      </Link>

      <input ref={inputRef} type="text" style={{ position: "absolute", opacity: 0, height: 0, width: 0 }} autoFocus />

      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
        
        <GameHeader
          title={isAr ? "خمن الوصفة" : "Recipe Wordle"}
          titleAr="خمن الوصفة"
          onNewGame={startGame}
          onShowRules={() => setShowRules(true)}
          best={`${stats.wins || 0} / ${stats.played || 0}`}
          bestLabel="WINS"
          bestLabelAr="فوز"
        />

        {/* GRID */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 400, height: "100%", maxHeight: 400 }}>
            {gridData.map((row, r) => (
              <div key={r} style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${wordLength}, 1fr)`, gap: 4 }}>
                {row.map((cell, c) => {
                  let letter = cell.letter;
                  let state = cell.state;

                  if (r === currentRow && !gameOver) {
                    letter = activeLetters[c] || "";
                    state = "";
                  }

                  return (
                    <div key={c} style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid",
                      borderColor: state === "correct" ? "var(--olive)" : state === "present" ? "var(--accent)" : state === "absent" ? "var(--line-strong)" : (letter ? "var(--muted)" : "var(--line)"),
                      background: state === "correct" ? "var(--olive)" : state === "present" ? "var(--accent)" : state === "absent" ? "var(--line-strong)" : "transparent",
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, paddingBottom: 16, marginBottom: "env(safe-area-inset-bottom, 10px)" }}>
          {keyboardRows.map((row, i) => (
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
            <h2 style={{ marginTop: 0 }}>Game Rules</h2>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--ink-soft)" }} dangerouslySetInnerHTML={{ __html: "<strong>Goal:</strong> Guess the Recipe Name in 6 tries.<br><br><strong>Colors:</strong><br>🟩 Green = Correct letter in the correct spot.<br>🟧 Orange = Correct letter but in the wrong spot.<br>⬛ Gray = Letter is not in the word.<br><br><em>The keyboard will disable letters that are not in the word!</em>" }} />
            <button className="btn btn-primary" onClick={() => setShowRules(false)} style={{ width: "100%", marginTop: 16 }}>Got it</button>
          </div>
        </div>
      )}

      {/* WIN/LOSS MODAL */}
      {gameOver && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "white", padding: 32, borderRadius: 24, maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>{isWon ? "🎉" : "😢"}</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", margin: "0 0 12px" }}>
              {isWon ? (isAr ? "!لقد فزت" : "You Win!") : (isAr ? "!انتهت اللعبة" : "Game Over")}
            </h2>
            <p style={{ color: "#666", fontSize: 16, marginBottom: 24 }}>
              {isWon 
                ? (isAr ? "لقد خمنت الوصفة بنجاح" : "You guessed the recipe!") 
                : (isAr ? `الوصفة كانت: ${targetWord}` : `The recipe was: ${targetWord}`)}
            </p>
            <button onClick={startGame} style={{ width: "100%", background: "#2e7d32", color: "white", border: "none", padding: "14px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              {isAr ? "العب مجدداً" : "Play Again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
