"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGameStats } from "@/hooks/useGameStats";

type Ingredient = { name: string };
type Recipe = {
  id: number;
  name: string;
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
  const { stats, saveStats } = useGameStats("guess", { guessed: 0, played: 0 });

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set());
  const [cards, setCards] = useState<{ name: string; eliminated: boolean; correct: boolean; wrong: boolean }[]>([]);
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
        setMessage("No recipes with ingredients found.");
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

      setCards(shuffled.map(name => ({
        name,
        eliminated: false,
        correct: false,
        wrong: false
      })));
    } catch (err) {
      setMessage("Failed to load recipes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    startGame();
  }, []);

  useEffect(() => {
    if (finished) {
      saveStats((prev) => ({
        guessed: (prev.guessed || 0) + (won ? 1 : 0),
        played: (prev.played || 0) + 1
      }));
    }
  }, [finished]);

  function handleCardClick(index: number) {
    if (finished) return;
    const card = cards[index];
    if (card.correct || card.wrong || card.eliminated) return;

    if (correctSet.has(card.name)) {
      const nextCards = cards.map((c, i) => i === index ? { ...c, correct: true } : c);
      setCards(nextCards);
      const remainingCorrect = nextCards.filter(c => correctSet.has(c.name) && !c.correct).length;

      if (remainingCorrect === 0 && !isRevealed) {
        setFinished(true); setWon(true); setMessage("You guessed all the ingredients!"); setMsgType("win");
        setCards(nextCards.map(c => !correctSet.has(c.name) ? { ...c, eliminated: true } : c));
      } else {
        setMessage("Correct. Keep going!"); setMsgType("win");
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      const nextCards = cards.map((c, i) => i === index ? { ...c, wrong: true } : c);

      if (newLives <= 0) {
        setFinished(true); setMessage("You lost all 5 lives! Game over."); setMsgType("fail");
        setCards(nextCards.map(c => correctSet.has(c.name) ? { ...c, correct: true } : c));
      } else {
        setCards(nextCards); setMessage("That was a real ingredient! You lost 1 life."); setMsgType("fail");
      }
    }
  }

  function useHint() {
    if (finished || hints <= 0) return;
    const hiddenCorrectIndices = cards.map((c, i) => ({ c, i })).filter(({ c }) => correctSet.has(c.name) && !c.correct && !c.eliminated).map(({ i }) => i);

    if (hiddenCorrectIndices.length === 0) {
      setMessage("No more hidden correct ingredients to reveal!"); setMsgType("info"); return;
    }

    const randomIndex = hiddenCorrectIndices[Math.floor(Math.random() * hiddenCorrectIndices.length)];
    setHints(h => h - 1);
    const nextCards = cards.map((c, i) => i === randomIndex ? { ...c, correct: true, wrong: false } : c);
    setCards(nextCards);

    const remainingCorrect = nextCards.filter(c => correctSet.has(c.name) && !c.correct).length;
    if (remainingCorrect === 0 && !isRevealed) {
      setFinished(true); setWon(true); setMessage("You guessed all the ingredients!"); setMsgType("win");
      setCards(nextCards.map(c => !correctSet.has(c.name) ? { ...c, eliminated: true } : c));
    } else {
      setMessage(""); setMsgType("info");
    }
  }

  function imDone() {
    if (finished) return;
    setIsRevealed(true); setFinished(true);
    const nextCards = cards.map(card => {
      if (correctSet.has(card.name)) return { ...card, correct: true, eliminated: false, wrong: false };
      return { ...card, eliminated: true, wrong: false };
    });
    setCards(nextCards); setWon(false); setMessage("Game ended. The correct ingredients are revealed."); setMsgType("info");
  }

  const remainingCorrect = cards.filter(c => correctSet.has(c.name) && !c.correct && !c.wrong).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", fontFamily: "system-ui, sans-serif", paddingBottom: 40 }}>
      
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 16px" }}>
        
        {/* HEADER SECTION WITH EXIT, TITLE, AND ALL 3 BUTTONS */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, position: "relative" }}>
          
          {/* Exit button moved to top right, padding to avoid overlap */}
          <Link href="/games" style={{ position: "absolute", top: -10, right: 0, background: "white", color: "#1a1a1a", padding: "6px 12px", borderRadius: 8, textDecoration: "none", fontWeight: 700, border: "1px solid #e0e0e0", fontSize: 13 }}>
            ✕ Exit
          </Link>

          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 16px 0", color: "#1a1a1a", textAlign: "center" }}>
            Guess the <span style={{ color: "#d4af37" }}>Ingredients</span>
          </h1>
          
          {/* Single line buttons with nowrap */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "nowrap" }}>
            <button onClick={startGame} style={{ background: "#1a1a1a", color: "white", padding: "8px 16px", borderRadius: 30, fontSize: 14, fontWeight: 700, border: "2px solid #d4af37", cursor: "pointer", whiteSpace: "nowrap" }}>
              ▶ New Game
            </button>
            <button onClick={() => setShowRules(true)} style={{ background: "white", color: "#1a1a1a", padding: "8px 16px", borderRadius: 30, fontSize: 14, fontWeight: 700, border: "2px solid #e0e0e0", cursor: "pointer", whiteSpace: "nowrap" }}>
              Rules
            </button>
            <Link href="/games/leaderboard" style={{ background: "white", color: "#1a1a1a", padding: "8px 16px", borderRadius: 30, fontSize: 14, fontWeight: 700, border: "2px solid #e0e0e0", textDecoration: "none", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
              🏆 Leaderboard
            </Link>
          </div>
        </div>

        {/* STATS BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", background: "white", borderRadius: 16, padding: "12px 24px", marginBottom: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #e0e0e0" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28, color: "#d4af37" }}>★</span>
            <div>
              <div style={{ color: "#888", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>SCORE</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{remainingCorrect}</div>
            </div>
          </div>

          <div style={{ width: 1, background: "#e0e0e0" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28, color: "#ff4b4b" }}>♥</span>
            <div>
              <div style={{ color: "#888", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>LIVES</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#ff4b4b", lineHeight: 1 }}>{lives}</div>
            </div>
          </div>

          <div style={{ width: 1, background: "#e0e0e0" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28, color: "#2e7d32" }}>✓</span>
            <div>
              <div style={{ color: "#888", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>WINS</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#2e7d32", lineHeight: 1 }}>{stats.guessed || 0} / {stats.played || 0}</div>
            </div>
          </div>

        </div>

        {/* RECIPE CARD (Text moved below image) */}
        <div style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          
          <div style={{ height: 220, position: "relative" }}>
            {recipe?.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "56px", background: "#f0f0f0" }}>🍽️</div>
            )}
          </div>

          <div style={{ padding: "16px 20px" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 12px 0", color: "#1a1a1a" }}>
              {loading ? "Loading..." : recipe?.name || "Unknown Recipe"}
            </h2>
            
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#666" }}>
                {recipe?.ingredients?.length || 0} ingredients
              </span>
              <button onClick={finished ? startGame : imDone} style={{ background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {finished ? "Play Again" : "Reveal"}
              </button>
              <button onClick={useHint} disabled={finished || hints === 0} style={{ background: "#f5f5f5", color: "#666", border: "1px solid #e0e0e0", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: (finished || hints === 0) ? "not-allowed" : "pointer", opacity: (finished || hints === 0) ? 0.5 : 1 }}>
                💡 Hint ({hints})
              </button>
            </div>
          </div>
        </div>

        {/* INGREDIENTS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
          {cards.map((card, i) => {
            let bg = "white";
            let color = "#1a1a1a";
            let border = "1px solid #e0e0e0";

            if (card.wrong) { bg = "#ffebee"; border = "1px solid #ffcdd2"; color = "#c62828"; }
            if (card.eliminated) { bg = "#f5f5f5"; color = "#bdbdbd"; border = "1px dashed #e0e0e0"; }
            if (card.correct) { bg = "#e8f5e9"; border = "1px solid #c8e6c9"; color = "#2e7d32"; }

            return (
              <div key={i} onClick={() => handleCardClick(i)} style={{ background: bg, color, border, borderRadius: 12, padding: "12px 6px", textAlign: "center", fontSize: 12, fontWeight: 600, cursor: (card.eliminated || card.correct || card.wrong) ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 90, opacity: card.eliminated ? 0.6 : 1, userSelect: "none", transition: "all 0.2s" }}>
                <span style={{ fontSize: 24, filter: card.eliminated ? "grayscale(1)" : "none" }}>{getEmoji(card.name)}</span>
                <span style={{ wordBreak: "break-word", lineHeight: 1.1 }}>{card.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* WIN MODAL */}
      {won && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "40px", textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", margin: "0 0 12px" }}>Perfect!</h2>
            <p style={{ color: "#666", fontSize: 16, marginBottom: 32, lineHeight: 1.5 }}>You successfully guessed all the ingredients for <strong style={{ color: "#1a1a1a" }}>{recipe?.name}</strong>.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setWon(false)} style={{ flex: 1, background: "#f5f5f5", color: "#1a1a1a", border: "none", padding: "14px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={startGame} style={{ flex: 1, background: "#2e7d32", color: "white", border: "none", padding: "14px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Play Again</button>
            </div>
          </div>
        </div>
      )}

      {/* RULES MODAL */}
      {showRules && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "white", padding: 32, borderRadius: 24, maxWidth: 400, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h2 style={{ marginTop: 0, fontSize: 24, fontWeight: 800 }}>Game Rules</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#666", marginBottom: 24 }}>
              Click the ingredients you think belong to the recipe. Wrong picks cost a life. You have 5 lives and 5 hints.
            </p>
            <button onClick={() => setShowRules(false)} style={{ width: "100%", background: "#1a1a1a", color: "white", border: "none", padding: "14px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Got it</button>
          </div>
        </div>
      )}

    </div>
  );
}
