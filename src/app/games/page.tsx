"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { ar } from "@/lib/ar";

export default function GamesHubPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", fontFamily: "system-ui, sans-serif", padding: "80px 1rem 120px 1rem", direction: isAr ? "rtl" : "ltr" }}>
      
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>
            {isAr ? ar.gamesHub.title : "Games"}
          </h1>
          <p style={{ color: "#8b949e", fontSize: "16px", margin: "8px 0 0 0" }}>
            {isAr ? ar.gamesHub.subtitle : "Choose a game to start playing"}
          </p>
        </div>

        {/* Games Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          
          {/* Game 1: Guess the Ingredients */}
          <Link href="/games/guess" style={{ textDecoration: "none" }}>
            <div style={{ 
              background: "#161b22", 
              border: "1px solid #30363d", 
              borderRadius: "20px", 
              padding: "40px 24px", 
              textAlign: "center",
              transition: "all 0.2s",
              cursor: "pointer",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#3fb950";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(63, 185, 80, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#30363d";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <div style={{ fontSize: "56px", lineHeight: 1 }}>🧠</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                {isAr ? ar.gamesHub.game1Title : "Guess the Ingredients"}
              </h2>
              <p style={{ color: "#8b949e", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                {isAr ? ar.gamesHub.game1Desc : "Can you identify what goes into this dish?"}
              </p>
              <div style={{ marginTop: "8px", color: "#3fb950", fontWeight: 600, fontSize: "14px" }}>
                {isAr ? ar.gamesHub.playBtn : "Play Now"} →
              </div>
            </div>
          </Link>

          {/* Game 2: Recipe Puzzle */}
          <Link href="/games/puzzle" style={{ textDecoration: "none" }}>
            <div style={{ 
              background: "#161b22", 
              border: "1px solid #30363d", 
              borderRadius: "20px", 
              padding: "40px 24px", 
              textAlign: "center",
              transition: "all 0.2s",
              cursor: "pointer",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ff6b4a";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(255, 107, 74, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#30363d";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <div style={{ fontSize: "56px", lineHeight: 1 }}>🧩</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                {isAr ? ar.gamesHub.game2Title : "Recipe Puzzle"}
              </h2>
              <p style={{ color: "#8b949e", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                {isAr ? ar.gamesHub.game2Desc : "Swap pieces to reveal the dish image."}
              </p>
              <div style={{ marginTop: "8px", color: "#ff6b4a", fontWeight: 600, fontSize: "14px" }}>
                {isAr ? ar.gamesHub.playBtn : "Play Now"} →
              </div>
            </div>
          </Link>

          {/* Game 3: Masterchef Memory */}
          <Link href="/games/memory" style={{ textDecoration: "none" }}>
            <div style={{ 
              background: "#161b22", 
              border: "1px solid #30363d", 
              borderRadius: "20px", 
              padding: "40px 24px", 
              textAlign: "center",
              transition: "all 0.2s",
              cursor: "pointer",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ffd700";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(255, 215, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#30363d";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <div style={{ fontSize: "56px", lineHeight: 1 }}>🃏</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                {isAr ? ar.memory.title : "Masterchef Memory"}
              </h2>
              <p style={{ color: "#8b949e", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                {isAr ? ar.memory.memoryDesc : "Match the recipe with its main ingredient."}
              </p>
              <div style={{ marginTop: "8px", color: "#ffd700", fontWeight: 600, fontSize: "14px" }}>
                {isAr ? ar.memory.memoryPlay : "Play Now"} →
              </div>
            </div>
          </Link>

          {/* Game 4: Recipe Wordle */}
          <Link href="/games/wordle" style={{ textDecoration: "none" }}>
            <div style={{ 
              background: "#161b22", border: "1px solid #30363d", borderRadius: "20px", 
              padding: "40px 24px", textAlign: "center", cursor: "pointer", 
              height: "100%", display: "flex", flexDirection: "column", 
              alignItems: "center", justifyContent: "center", gap: "16px" 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#d97757";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(217, 119, 87, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#30363d";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <div style={{ fontSize: "56px", lineHeight: 1 }}>🔤</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                {isAr ? ar.wordle.title : "Recipe Wordle"}
              </h2>
              <p style={{ color: "#8b949e", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                {isAr ? ar.wordle.subtitle : "Guess the recipe name in 6 tries."}
              </p>
              <div style={{ marginTop: "8px", color: "#d97757", fontWeight: 600, fontSize: "14px" }}>
                {isAr ? ar.gamesHub.playBtn : "Play Now"} →
              </div>
            </div>
          </Link>

          {/* Game 5: Catch the Ingredients */}
          <Link href="/games/catch" style={{ textDecoration: "none" }}>
            <div style={{ 
              background: "#161b22", border: "1px solid #30363d", borderRadius: "20px", 
              padding: "40px 24px", textAlign: "center", cursor: "pointer", 
              height: "100%", display: "flex", flexDirection: "column", 
              alignItems: "center", justifyContent: "center", gap: "16px" 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#3fb950";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(63, 185, 80, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#30363d";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <div style={{ fontSize: "56px", lineHeight: 1 }}>🧺</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                {isAr ? ar.catch.title : "Catch the Ingredients"}
              </h2>
              <p style={{ color: "#8b949e", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                {isAr ? ar.catch.subtitle : "Move the basket to catch falling ingredients."}
              </p>
              <div style={{ marginTop: "8px", color: "#3fb950", fontWeight: 600, fontSize: "14px" }}>
                {isAr ? ar.gamesHub.playBtn : "Play Now"} →
              </div>
            </div>
          </Link>

          {/* Game 6: Fork Snake */}
          <Link href="/games/snake" style={{ textDecoration: "none" }}>
            <div style={{ 
              background: "#161b22", border: "1px solid #30363d", borderRadius: "20px", 
              padding: "40px 24px", textAlign: "center", cursor: "pointer", 
              height: "100%", display: "flex", flexDirection: "column", 
              alignItems: "center", justifyContent: "center", gap: "16px" 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#3fb950";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(63, 185, 80, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#30363d";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <div style={{ fontSize: "56px", lineHeight: 1 }}>🍴</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                {isAr ? ar.snake.title : "Fork Snake"}
              </h2>
              <p style={{ color: "#8b949e", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                {isAr ? ar.snake.subtitle : "Collect ingredients with the fork."}
              </p>
              <div style={{ marginTop: "8px", color: "#3fb950", fontWeight: 600, fontSize: "14px" }}>
                {isAr ? ar.gamesHub.playBtn : "Play Now"} →
              </div>
            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}
