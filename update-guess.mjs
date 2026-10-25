import fs from "fs";
const p = "src/app/games/guess/page.tsx";
let src = fs.readFileSync(p, "utf8");

if (!src.includes('import GameHeader')) {
  // 1. Add import
  src = src.replace(
    'import { useLang } from "@/components/LanguageProvider";',
    'import { useLang } from "@/components/LanguageProvider";\nimport GameHeader from "@/components/GameHeader";'
  );
  
  // 2. Replace the old header block with the new GameHeader
  // We will look for the main <div style={{ maxWidth: 1000 ... }}> and inject the header
  src = src.replace(
    /<div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>/,
    `<div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <GameHeader 
          title="Guess the Ingredients" 
          titleAr="خمن المكونات" 
          onNewGame={startGame} 
          onShowRules={() => alert("Rules coming soon!")} 
          score={remainingCorrect} 
          best={lives} 
        />`
  );

  fs.writeFileSync(p, src, "utf8");
  console.log("✅ Updated Guess header");
}
