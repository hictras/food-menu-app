import fs from "fs";
const p = "src/app/games/puzzle/page.tsx";
let src = fs.readFileSync(p, "utf8");

if (!src.includes('import GameHeader')) {
  src = src.replace(
    'import { useLang } from "@/components/LanguageProvider";',
    'import { useLang } from "@/components/LanguageProvider";\nimport GameHeader from "@/components/GameHeader";'
  );

  // Find the old header container
  src = src.replace(
    /<div style={{ maxWidth: 600, margin: "0 auto" }}>/,
    `<div style={{ maxWidth: 600, margin: "0 auto" }}>
        <GameHeader 
          title="Recipe Puzzle" 
          titleAr="لغز الوصفة" 
          onNewGame={startGame} 
          onShowRules={() => alert("Rules coming soon!")} 
          score={moves} 
        />`
  );

  fs.writeFileSync(p, src, "utf8");
  console.log("✅ Updated Puzzle header");
}
