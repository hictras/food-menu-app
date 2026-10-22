"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ar } from "@/lib/ar";
import { useLang } from "@/components/LanguageProvider";

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

// Helper to get a matching emoji for the ingredient
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

      // Create a map of english -> arabic names
      const nameMap = new Map<string, string | null>();
      randomRecipe.ingredients.forEach((i: any) => { if(i.nameAr) nameMap.set(i.name.toLowerCase().trim(), i.nameAr); });
      
      // Use the centralized dictionary from ar.ts
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
    // Only run on first mount
    startGame();
  }, []); // Empty dependency array ensures this runs only once

  function handleCardClick(index: number) {
    if (finished) return;
    
    const card = cards[index];
    // Ignore if already green (correct), red (wrong), or eliminated
    if (card.correct || card.wrong || card.eliminated) return;

    if (correctSet.has(card.name)) {
      // IT IS CORRECT
      const nextCards = cards.map((c, i) => i === index ? { ...c, correct: true } : c);
      setCards(nextCards);
      
      // Check if this was the last correct ingredient needed to win
      const remainingCorrect = nextCards.filter(c => correctSet.has(c.name) && !c.correct).length;
      
      // If there are no more hidden correct ingredients, you win!
      if (remainingCorrect === 0 && !isRevealed) {
        // WIN GAME!
        setFinished(true);
        setWon(true);
        setMessage(isAr ? ar.game.msgWin : "You guessed all the ingredients!");
        setMsgType("win");
        // Automatically eliminate the remaining wrong ingredients
        setCards(nextCards.map(c => !correctSet.has(c.name) ? { ...c, eliminated: true } : c));
      } else {
        setMessage(isAr ? ar.game.correctMsg : "Correct. Keep going!");
        setMsgType("win");
      }
    } else {
      // IT IS WRONG
      const newLives = lives - 1;
      setLives(newLives);
      
      const nextCards = cards.map((c, i) => i === index ? { ...c, wrong: true } : c);
      
      if (newLives <= 0) {
        setFinished(true);
        setMessage(isAr ? ar.game.gameOverMsg : "You lost all 5 lives! Game over.");
        setMsgType("fail");
        // Reveal all correct
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
    
    // Check if hint won the game
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
    <main style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "system-ui, sans-serif", padding: "80px 1rem 120px 1rem", direction: isAr ? "rtl" : "ltr" }}>
      
      {/* BACKGROUND DECORATION */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle at 50% 0%, rgba(28, 42, 36, 0.5) 0%, rgba(13, 17, 23, 1) 70%)", zIndex: 0, pointerEvents: "none" }}></div>

      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem", gap: "1rem", position: "relative" }}>
          
          {/* Top Row: Back & New Recipe */}
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/recipes" style={{ color: "#8b949e", textDecoration: "none", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
              ← Back
            </Link>
            <button onClick={startGame} style={{ background: "#21262d", color: "#e6edf3", border: "1px solid #30363d", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              ⟳ {isAr ? ar.game.newRecipe : "New Recipe"}
            </button>
          </div>

          {/* Middle Row: Title */}
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              {isAr ? ar.game.title1 : "Guess the "}<span style={{ color: "#3fb950" }}>{isAr ? ar.game.title2 : "Ingredients"}</span>
            </h1>
            <p style={{ color: "#8b949e", fontSize: "13px", margin: "4px 0 0 0" }}>{isAr ? ar.game.subtitle : "Can you identify what goes into this dish?"}</p>
          </div>

          {/* Bottom Row: Stats (Visible on Mobile) */}
          <div style={{ display: "flex", gap: "8px", width: "100%", justifyContent: "center" }}>
             <div style={{ flex: 1, background: "#161b22", border: "1px solid #30363d", padding: "8px", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Remaining</div>
                <div style={{ fontSize: "18px", fontWeight: 700 }}>{remainingCorrect}</div>
             </div>
             <div style={{ flex: 1, background: "#161b22", border: "1px solid #30363d", padding: "8px", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>lives</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: lives > 2 ? "#3fb950" : "#ff6b4a" }}>{lives}</div>
             </div>
             <div style={{ flex: 1, background: "#161b22", border: "1px solid #30363d", padding: "8px", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>hints</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#d97757" }}>{hints}</div>
             </div>
          </div>

        </div>

        {/* HERO RECIPE CARD */}
        <div className="hero-card-responsive" style={{ display: "flex", background: "#161b22", border: "1px solid #30363d", borderRadius: "16px", overflow: "hidden", marginBottom: "2rem", minHeight: "140px", position: "sticky", top: "70px", zIndex: 40, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}>
          <div className="hero-image" style={{ width: "40%", background: "#0d1117", position: "relative" }}>
            {recipe?.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>🍽️</div>
            )}
          </div>
          <div className="hero-content" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "center", width: "60%", position: "relative" }}>
            
            {/* REVEAL BUTTON (Top Right of Card) */}
            <button onClick={imDone} disabled={finished} style={{ position: "absolute", top: "16px", insetInlineEnd: "16px", background: "#21262d", color: "#3fb950", border: "1px solid #3fb950", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: finished ? "not-allowed" : "pointer", opacity: finished ? 0.5 : 1, transition: "all 0.15s", display: "flex", alignItems: "center", gap: "4px", zIndex: 10 }} onMouseEnter={(e) => { if(!finished) e.currentTarget.style.background = "rgba(63, 185, 80, 0.1)" }} onMouseLeave={(e) => { if(!finished) e.currentTarget.style.background = "#21262d" }}>
              {isAr ? ar.game.revealBtn : "Reveal"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <Link href={recipe ? `/recipes/${recipe.id}` : "#"} style={{ textDecoration: "none" }}>
                <h2 style={{ fontSize: "2.2rem", fontWeight: 700, margin: 0, color: "#ffffff", letterSpacing: "-0.02em", transition: "color 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#3fb950"} onMouseLeave={(e) => e.currentTarget.style.color = "#ffffff"}>
                  {loading ? "Loading..." : (isAr ? (recipe?.nameAr || recipe?.name) : recipe?.name) || "Unknown Recipe"}
                </h2>
              </Link>
              {recipe && recipe.ingredients && (
                <span style={{ 
                  background: "#21262d", 
                  border: "1px solid #30363d", 
                  color: "#8b949e", 
                  fontSize: "14px", 
                  fontWeight: 600, 
                  padding: "4px 10px", 
                  borderRadius: "999px",
                  marginTop: "4px"
                }}>
                  {recipe.ingredients.length}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "2.5rem", background: "#0d1117", padding: "8px 16px", borderRadius: "8px", width: "fit-content", border: "1px solid #30363d", alignItems: "center" }}>
              <span style={{ color: "#8b949e", fontSize: "13px" }}>🍴 {isAr ? ar.game.remaining : "Remaining"}: <strong style={{ color: "#e6edf3" }}>{remainingCorrect}</strong></span>
              <span style={{ color: "#30363d" }}>|</span>
              <span style={{ color: "#8b949e", fontSize: "13px" }}>❤️ {isAr ? ar.game.lives : "Lives"}: <strong style={{ color: lives > 2 ? "#3fb950" : "#ff6b4a" }}>{lives}</strong></span>
              <span style={{ color: "#30363d" }}>|</span>
              <span style={{ color: "#8b949e", fontSize: "13px" }}>💡 {isAr ? ar.game.hints : "Hints"}: <strong style={{ color: "#d97757" }}>{hints}</strong></span>
            </div>
          </div>
        </div>

        {/* INGREDIENTS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px", marginBottom: "2rem" }}>
          {cards.map((card, i) => {
            let bg = "#161b22";
            let color = "#e6edf3";
            let border = "1px solid #30363d";
            let textDecoration = "none";
            let opacity = 1;
            let shadow = "0 4px 12px rgba(0,0,0,0.2)";

            if (card.wrong) {
              bg = "rgba(255, 107, 74, 0.15)";
              border = "1px solid #ff6b4a";
              color = "#ff6b4a";
              shadow = "0 0 15px rgba(255, 107, 74, 0.2)";
            }
            if (card.eliminated) {
              bg = "rgba(22, 27, 34, 0.5)";
              color = "#484f58";
              border = "1px dashed #30363d";
              textDecoration = "line-through";
              opacity = 0.5;
              shadow = "none";
            }
            if (card.correct) {
              bg = "rgba(63, 185, 80, 0.1)";
              border = "1px solid #3fb950";
              color = "#3fb950";
              shadow = "0 0 15px rgba(63, 185, 80, 0.2)";
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
                  padding: "16px 8px",
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: (card.eliminated || card.correct || card.wrong) ? "default" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  minHeight: "90px",
                  textDecoration,
                  opacity,
                  userSelect: "none",
                  boxShadow: shadow,
                }}
              >
                <span style={{ fontSize: "24px", filter: card.eliminated ? "grayscale(1)" : "none" }}>{getEmoji(card.name)}</span>
                <span style={{ wordBreak: "break-word" }}>{isAr ? (card.nameAr || card.name) : card.name}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* BOTTOM STICKY BAR */}
      <div style={{ 
        position: "fixed", bottom: 0, left: 0, right: 0, 
        background: "rgba(13, 17, 23, 0.85)", backdropFilter: "blur(16px)", 
        borderTop: "1px solid #30363d",
        padding: "16px", zIndex: 50,
        display: "flex", flexDirection: "column", alignItems: "center", gap: "12px"
      }}>
        
        {message && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 500, color: msgType === "win" ? "#3fb950" : msgType === "fail" ? "#ff6b4a" : "#8b949e" }}>
            {msgType === "win" ? "✅" : msgType === "fail" ? "❌" : "ℹ️"} {message}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "700px" }}>
          <button onClick={useHint} disabled={finished || hints === 0} style={{ flex: 1, background: "#21262d", color: "#d97757", border: "1px solid #30363d", height: "48px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: (finished || hints === 0) ? "not-allowed" : "pointer", opacity: (finished || hints === 0) ? 0.5 : 1, transition: "background 0.15s", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }} onMouseEnter={(e) => { if(!finished && hints > 0) e.currentTarget.style.background = "#30363d" }} onMouseLeave={(e) => { if(!finished && hints > 0) e.currentTarget.style.background = "#21262d" }}>
            💡 {isAr ? ar.game.hintBtn : "Hint"} ({hints})
          </button>
        </div>
      </div>

      {/* WIN MODAL */}
      {won && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "20px", padding: "40px", textAlign: "center", maxWidth: "400px", width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)", animation: "scaleIn 0.3s ease" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#ffffff", margin: "0 0 8px" }}>{isAr ? ar.game.modalPerfect : "Perfect!"}</h2>
            <p style={{ color: "#8b949e", fontSize: "15px", marginBottom: "24px", lineHeight: 1.5 }}>
              {isAr ? ar.game.modalText : "You successfully guessed all the ingredients for"} <strong style={{ color: "#ffffff" }}>{recipe?.name}</strong>.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setWon(false)} style={{ flex: 1, background: "#21262d", color: "#e6edf3", border: "1px solid #30363d", padding: "12px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
                {isAr ? ar.game.modalCancel : "Cancel"}
              </button>
              <button onClick={startGame} style={{ flex: 1, background: "#3fb950", color: "#ffffff", border: "none", padding: "12px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
                {isAr ? ar.game.modalPlayAgain : "Play Again"}
              </button>
            </div>
          </div>
          <style>{`@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}

    
      <style>{`
        @media (max-width: 640px) {
          .hero-card-responsive {
            flex-direction: column !important;
          }
          .hero-card-responsive .hero-image {
            width: 100% !important;
            height: 150px !important;
          }
          .hero-card-responsive .hero-content {
            width: 100% !important;
            padding: 1rem !important;
          }
          .hero-card-responsive .hero-content h2 {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    
    </main>
  );
}
