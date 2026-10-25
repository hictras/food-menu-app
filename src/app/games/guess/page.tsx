"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ar } from "@/lib/ar";
import { useLang } from "@/components/LanguageProvider";
import GameHeader from "@/components/GameHeader";

type Ingredient = { name: string };
type Recipe = {
  id: number;
  name: string;
  nameAr: string | null;
  imageUrl: string | null;
  ingredients: Ingredient[];
};

const DECOY_POOL = [
  "sugar", "flour", "baking powder", "vanilla extract", "honey", "soy sauce", "mayonnaise",
  "mustard", "ketchup", "paprika", "cumin", "coriander", "cinnamon", "nutmeg", "chili powder",
  "beef broth", "chicken broth", "red wine", "balsamic vinegar", "worcestershire", "tabasco",
  "cornstarch", "breadcrumbs", "almonds", "walnuts", "pecans", "raisins", "coconut", "spinach",
  "mushrooms", "zucchini", "eggplant", "cauliflower", "peas", "corn", "potato", "sweet potato",
  "bacon", "ham", "sausage", "tofu", "lentils", "chickpeas", "black beans", "quinoa",
  "feta", "cheddar", "brie", "blue cheese", "cream cheese", "sour cream", "pesto",
  "hot sauce", "maple syrup", "molasses", "cocoa powder", "dark chocolate", "white chocolate",
  "peanut butter", "jam", "capers", "pickles", "artichoke", "asparagus", "beets",
  "radish", "celery", "cabbage", "kale", "arugula", "bean sprouts", "water", "salt", "pepper", "oil"
];

function getEmoji(name: string) {
  const n = name.toLowerCase();
  if (n.includes("pepper") || n.includes("chili")) return "🌶️";
  if (n.includes("tomato")) return "🍅";
  if (n.includes("onion")) return "🧅";
  if (n.includes("garlic")) return "🧄";
  if (n.includes("meat") || n.includes("beef") || n.includes("lamb") || n.includes("steak")) return "🥩";
  if (n.includes("chicken")) return "🍗";
  if (n.includes("fish") || n.includes("shrimp") || n.includes("seafood")) return "🐟";
  if (n.includes("cheese") || n.includes("parmesan") || n.includes("mozzarella")) return "🧀";
  if (n.includes("egg")) return "🥚";
  if (n.includes("milk") || n.includes("cream") || n.includes("yogurt")) return "🥛";
  if (n.includes("flour") || n.includes("bread") || n.includes("dough")) return "🌾";
  if (n.includes("rice")) return "🍚";
  if (n.includes("oil") || n.includes("butter")) return "🫒";
  if (n.includes("water")) return "💧";
  if (n.includes("lemon") || n.includes("lime")) return "🍋";
  if (n.includes("potato")) return "🥔";
  if (n.includes("carrot")) return "🥕";
  if (n.includes("herb") || n.includes("parsley") || n.includes("cilantro") || n.includes("mint")) return "🌿";
  if (n.includes("spice") || n.includes("cumin") || n.includes("cinnamon") || n.includes("powder")) return "🥣";
  if (n.includes("sugar") || n.includes("honey") || n.includes("syrup")) return "🍯";
  if (n.includes("nut") || n.includes("almond") || n.includes("pine")) return "🥜";
  return "🥄";
}

function shuffle(arr: string[]) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function GamePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const t = (en: string, arText: string) => isAr ? arText : en;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set());
  const [cards, setCards] = useState<{ name: string; nameAr: string | null; eliminated: boolean; selected: boolean; correct: boolean; wrong: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"win" | "fail" | "info">("info");
  const [lives, setLives] = useState(5);
  const [hints, setHints] = useState(5);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  async function startGame() {
    setLoading(true);
    setFinished(false);
    setWon(false);
    setMessage("");
    setMsgType("info");
    setLives(5);
    setHints(5);
    setIsRevealed(false);

    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();

      const validRecipes = data.filter((r: any) => r.ingredients && r.ingredients.length >= 3);

      if (validRecipes.length === 0) {
        setMessage(isAr ? ar.game.msgNoRecipes : "No recipes with ingredients found.");
        setLoading(false);
        return;
      }

      const randomRecipe = validRecipes[Math.floor(Math.random() * validRecipes.length)];
      setRecipe(randomRecipe);

      const correct = randomRecipe.ingredients.map((i: any) => i.name.toLowerCase().trim());
      setCorrectSet(new Set(correct));

      const decoys = DECOY_POOL.filter(d => !correct.includes(d));
      const targetTotal = Math.min(18, Math.max(12, correct.length + 6));
      const needDecoys = Math.max(5, targetTotal - correct.length);
      const selectedDecoys = shuffle(decoys).slice(0, needDecoys);

      const allIngredients = Array.from(new Set([...correct, ...selectedDecoys]));
      const shuffled = shuffle(allIngredients);

      const nameMap = new Map<string, string | null>();
      randomRecipe.ingredients.forEach((i: any) => { if (i.nameAr) nameMap.set(i.name.toLowerCase().trim(), i.nameAr); });

      decoys.forEach(d => {
        if (ar.decoys[d as keyof typeof ar.decoys]) {
          nameMap.set(d, ar.decoys[d as keyof typeof ar.decoys]);
        }
      });

      setCards(shuffled.map(name => ({
        name,
        nameAr: nameMap.get(name) || null,
        eliminated: false,
        selected: false,
        correct: false,
        wrong: false
      })));
    } catch (err) {
      setMessage(isAr ? ar.game.msgFailLoad : "Failed to load recipes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    startGame();
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
  }, []);

  function playSound(type: 'correct' | 'wrong' | 'win') {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleCardClick(index: number) {
    if (finished) return;

    const card = cards[index];
    if (card.correct || card.wrong || card.eliminated) return;

    if (correctSet.has(card.name)) {
      playSound("correct");
      const nextCards = cards.map((c, i) => i === index ? { ...c, correct: true } : c);
      setCards(nextCards);

      const remainingCorrect = nextCards.filter(c => correctSet.has(c.name) && !c.correct).length;

      if (remainingCorrect === 0 && !isRevealed) {
        setFinished(true);
        setWon(true);
        setMessage(isAr ? ar.game.msgWin : "You guessed all the ingredients!");
        setMsgType("win");
        playSound("win");
        setCards(nextCards.map(c => !correctSet.has(c.name) ? { ...c, eliminated: true } : c));
      } else {
        setMessage(isAr ? ar.game.correctMsg : "Correct. Keep going!");
        setMsgType("win");
      }
    } else {
      playSound("wrong");
      const newLives = lives - 1;
      setLives(newLives);

      const nextCards = cards.map((c, i) => i === index ? { ...c, wrong: true } : c);

      if (newLives <= 0) {
        setFinished(true);
        setMessage(isAr ? ar.game.gameOverMsg : "You lost all 5 lives! Game over.");
        setMsgType("fail");
        setCards(nextCards.map(c => correctSet.has(c.name) ? { ...c, correct: true } : c));
      } else {
        setCards(nextCards);
        setMessage(isAr ? ar.game.lostLifeMsg : "That was a real ingredient! You lost 1 life.");
        setMsgType("fail");
      }
    }
  }

  function eliminateSelected() {
    if (finished) return;

    let killedCorrectCount = 0;
    let eliminatedDecoyCount = 0;

    const nextCards = cards.map(card => {
      if (card.selected && !card.eliminated && !card.correct) {
        if (correctSet.has(card.name)) {
          killedCorrectCount++;
          return { ...card, selected: false };
        } else {
          eliminatedDecoyCount++;
          return { ...card, selected: false, eliminated: true };
        }
      }
      return card;
    });

    if (killedCorrectCount > 0) {
      const newlives = lives - 1;
      setLives(newlives);

      if (newlives <= 0) {
        setFinished(true);
        setMessage(isAr ? ar.game.gameOverMsg : "You lost all 5 lives! Game over.");
        setMsgType("fail");
        setCards(nextCards.map(c => correctSet.has(c.name) ? { ...c, correct: true } : c));
      } else {
        setMessage(`That was a real ingredient! You lost 1 life.`);
        setMsgType("fail");
        setCards(nextCards);
      }
    } else if (eliminatedDecoyCount > 0) {
      setMessage(isAr ? ar.game.correctMsg : "Correct. Keep going!");
      setMsgType("win");
      setCards(nextCards);
    } else {
      setMessage(isAr ? ar.game.selectFirstMsg : "Select ingredients first.");
      setMsgType("info");
    }
  }

  function useHint() {
    if (finished || hints <= 0) return;

    const hiddenCorrectIndices = cards
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => correctSet.has(c.name) && !c.correct && !c.eliminated)
      .map(({ i }) => i);

    if (hiddenCorrectIndices.length === 0) {
      setMessage(isAr ? ar.game.msgNoHint : "No more hidden correct ingredients to reveal!");
      setMsgType("info");
      return;
    }

    const randomIndex = hiddenCorrectIndices[Math.floor(Math.random() * hiddenCorrectIndices.length)];

    setHints(h => h - 1);

    const nextCards = cards.map((c, i) => i === randomIndex ? { ...c, correct: true, wrong: false } : c);
    setCards(nextCards);

    const remainingCorrect = nextCards.filter(c => correctSet.has(c.name) && !c.correct).length;
    if (remainingCorrect === 0 && !isRevealed) {
      setFinished(true);
      setWon(true);
      setMessage(isAr ? ar.game.msgWin : "You guessed all the ingredients!");
      setMsgType("win");
      setCards(nextCards.map(c => !correctSet.has(c.name) ? { ...c, eliminated: true } : c));
    } else {
      setMessage(isAr ? ar.game.msgHintUsed : "Hint used! One correct ingredient is revealed.");
      setMsgType("info");
    }
  }

  function imDone() {
    if (finished) return;

    setIsRevealed(true);
    setFinished(true);

    const nextCards = cards.map(card => {
      if (correctSet.has(card.name)) {
        return { ...card, correct: true, selected: false, eliminated: false, wrong: false };
      } else {
        return { ...card, eliminated: true, selected: false, wrong: false };
      }
    });

    setCards(nextCards);
    setWon(false);
    setMessage(isAr ? ar.game.msgGameEnded : "Game ended. The correct ingredients are revealed.");
    setMsgType("info");
  }

  const remainingCorrect = cards.filter(c => correctSet.has(c.name) && !c.correct && !c.wrong).length;

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        padding: 12,
        background: "var(--bg)",
        overflow: "hidden",
        position: "relative",
        direction: isAr ? "rtl" : "ltr",
      }}
    >
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
        ✕ {isAr ? "خروج" : "Exit"}
      </Link>

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          height: "100%",
          minHeight: 0,
        }}
      >
        <GameHeader
          title="Guess the Ingredients"
          titleAr="خمن المكونات"
          onNewGame={startGame}
          onShowRules={() => setShowRules(true)}
          score={remainingCorrect}
          best={lives}
        />

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingBottom: 90 }}>
          {/* HERO RECIPE CARD */}
          <div
            className="hero-card-responsive"
            style={{
              display: "flex",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "16px",
              overflow: "hidden",
              marginBottom: "1rem",
              minHeight: "140px",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ width: "40%", background: "var(--bg)", position: "relative", minHeight: 140 }}>
              {recipe?.imageUrl ? (
                <img src={recipe.imageUrl} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>🍽️</div>
              )}
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "center", width: "60%", position: "relative" }}>
              <button
                onClick={finished ? startGame : imDone}
                style={{
                  position: "absolute", top: "16px", insetInlineEnd: "16px",
                  background: finished ? "var(--olive)" : "rgba(123, 160, 91, 0.1)",
                  color: finished ? "#ffffff" : "var(--olive)",
                  border: "1px solid var(--olive)",
                  padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                  cursor: "pointer", zIndex: 10,
                }}
              >
                {finished ? (isAr ? ar.game.playAgainBtn : "Play Again") : (isAr ? ar.game.revealBtn : "Reveal")}
              </button>
              <Link href={recipe ? `/recipes/${recipe.id}` : "#"} style={{ textDecoration: "none" }}>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                  {loading ? "Loading..." : (isAr ? (recipe?.nameAr || recipe?.name) : recipe?.name) || "Unknown Recipe"}
                </h2>
              </Link>
              {recipe && recipe.ingredients && (
                <span
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    color: "var(--muted)",
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "999px",
                    marginTop: "8px",
                    width: "fit-content",
                  }}
                >
                  {recipe.ingredients.length} {isAr ? "مكونات" : "ingredients"}
                </span>
              )}
              <div style={{ display: "flex", gap: "12px", marginTop: "1rem", flexWrap: "wrap" }}>
                <span style={{ color: "var(--muted)", fontSize: "13px" }}>🍴 {isAr ? ar.game.remaining : "Remaining"}: <strong style={{ color: "var(--ink)" }}>{remainingCorrect}</strong></span>
                <span style={{ color: "var(--muted)", fontSize: "13px" }}>❤️ {isAr ? ar.game.lives : "Lives"}: <strong style={{ color: lives > 2 ? "var(--olive)" : "var(--accent)" }}>{lives}</strong></span>
                <span style={{ color: "var(--muted)", fontSize: "13px" }}>💡 {isAr ? ar.game.hints : "Hints"}: <strong style={{ color: "var(--accent)" }}>{hints}</strong></span>
              </div>
            </div>
          </div>

          {/* INGREDIENTS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px" }}>
            {cards.map((card, i) => {
              let bg = "var(--surface)";
              let color = "var(--ink)";
              let border = "1px solid var(--line)";
              let opacity = 1;

              if (card.wrong) {
                bg = "rgba(255, 107, 74, 0.15)";
                border = "1px solid var(--accent)";
                color = "var(--accent)";
              }
              if (card.eliminated) {
                bg = "rgba(22, 27, 34, 0.5)";
                color = "var(--muted)";
                border = "1px dashed var(--line)";
                opacity = 0.5;
              }
              if (card.correct) {
                bg = "rgba(123, 160, 91, 0.1)";
                border = "1px solid var(--olive)";
                color = "var(--olive)";
              }

              return (
                <div
                  key={i}
                  onClick={() => handleCardClick(i)}
                  style={{
                    background: bg,
                    color,
                    border,
                    borderRadius: "12px",
                    padding: "12px 6px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: (card.eliminated || card.correct || card.wrong) ? "default" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    minHeight: "80px",
                    opacity,
                    userSelect: "none",
                  }}
                >
                  <span style={{ fontSize: "22px", filter: card.eliminated ? "grayscale(1)" : "none" }}>{getEmoji(card.name)}</span>
                  <span style={{ wordBreak: "break-word" }}>{isAr ? (card.nameAr || card.name) : card.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM STICKY BAR */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(13, 17, 23, 0.85)", backdropFilter: "blur(16px)",
          borderTop: "1px solid var(--line)",
          padding: "12px 16px", zIndex: 50,
          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
        }}
      >
        {message && (
          <div style={{ fontSize: "13px", fontWeight: 500, color: msgType === "win" ? "var(--olive)" : msgType === "fail" ? "var(--accent)" : "var(--muted)" }}>
            {msgType === "win" ? "✅" : msgType === "fail" ? "❌" : "ℹ️"} {message}
          </div>
        )}
        <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "700px" }}>
          <button
            onClick={useHint}
            disabled={finished || hints === 0}
            style={{
              flex: 1, background: "var(--surface)", color: "var(--accent)",
              border: "1px solid var(--line)", height: "44px", borderRadius: "10px",
              fontSize: "14px", fontWeight: 600,
              cursor: (finished || hints === 0) ? "not-allowed" : "pointer",
              opacity: (finished || hints === 0) ? 0.5 : 1,
              display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
            }}
          >
            💡 {isAr ? ar.game.hintBtn : "Hint"} ({hints})
          </button>
        </div>
      </div>

      {/* WIN MODAL */}
      {won && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "20px", padding: "40px", textAlign: "center", maxWidth: "400px", width: "100%" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "var(--ink)", margin: "0 0 8px" }}>{isAr ? ar.game.modalPerfect : "Perfect!"}</h2>
            <p style={{ color: "var(--muted)", fontSize: "15px", marginBottom: "24px", lineHeight: 1.5 }}>
              {isAr ? ar.game.modalText : "You successfully guessed all the ingredients for"} <strong style={{ color: "var(--ink)" }}>{recipe?.name}</strong>.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setWon(false)} style={{ flex: 1, background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--line)", padding: "12px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
                {isAr ? ar.game.modalCancel : "Cancel"}
              </button>
              <button onClick={startGame} style={{ flex: 1, background: "var(--olive)", color: "#ffffff", border: "none", padding: "12px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
                {isAr ? ar.game.modalPlayAgain : "Play Again"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RULES MODAL */}
      {showRules && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 20, maxWidth: 400, width: "100%" }}>
            <h2 style={{ marginTop: 0 }}>{isAr ? "قواعد اللعبة" : "Game Rules"}</h2>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--ink-soft)" }}>
              {isAr
                ? "اضغط على المكونات التي تظن أنها من الوصفة. المكونات الخاطئة تكلفك قلباً. لديك 5 قلوب و5 تلميحات."
                : "Click the ingredients you think belong to the recipe. Wrong picks cost a life. You have 5 lives and 5 hints."}
            </p>
            <button className="btn btn-primary" onClick={() => setShowRules(false)} style={{ width: "100%", marginTop: 16 }}>
              {isAr ? "فهمت" : "Got it"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hero-card-responsive {
            flex-direction: column !important;
          }
          .hero-card-responsive > div:first-child {
            width: 100% !important;
            height: 140px !important;
            position: relative !important;
          }
          .hero-card-responsive > div:last-child {
            width: 100% !important;
            padding: 1rem !important;
          }
          .hero-card-responsive h2 {
            font-size: 1.4rem !important;
          }
        }
      `}</style>
    </div>
  );
}
