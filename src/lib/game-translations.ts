export const GAME_DICT = {
  back: { en: "← Back to Recipes", ar: "→ العودة للوصفات" },
  newRecipe: { en: "New Recipe", ar: "وصفة جديدة" },
  title1: { en: "Guess the", ar: "خمّن" },
  title2: { en: "Ingredients", ar: "المكونات" },
  subtitle: { en: "Can you identify what goes into this dish?", ar: "هل يمكنك معرفة ما يدخل في هذا الطبق؟" },
  
  remaining: { en: "Remaining", ar: "متبقي" },
  lives: { en: "Lives", ar: "محاولات" },
  hints: { en: "Hints", ar: "تلميحات" },
  
  hintBtn: { en: "Hint", ar: "تلميح" },
  eliminateBtn: { en: "Eliminate Selected", ar: "حذف المحدد" },
  checkBtn: { en: "Check Recipe", ar: "تأكيد الوصفة" },
  revealBtn: { en: "Reveal", ar: "كعيت" },
  
  modalPerfect: { en: "Perfect!", ar: "ممتاز!" },
  modalText: { en: "You successfully guessed all the ingredients for", ar: "لقد خمّنت كل المكونات بنجاح لـ" },
  modalCancel: { en: "Cancel", ar: "إلغاء" },
  modalPlayAgain: { en: "Play Again", ar: "العب مجدداً" },
  
  msgNoRecipes: { en: "No recipes with ingredients found.", ar: "لم يتم العثور على وصفات." },
  msgFailLoad: { en: "Failed to load recipes.", ar: "فشل تحميل الوصفات." },
  msgSelectFirst: { en: "Select ingredients first.", ar: "اختر المكونات أولاً." },
  msgCorrect: { en: "Correct. Keep going!", ar: "صحيح. استمر!" },
  msgLostLife: { en: "That was a real ingredient! You lost 1 life.", ar: "كان هذا مكوناً حقيقياً! خسرت محاولة." },
  msgGameOver: { en: "You lost all 5 lives! Game over.", ar: "لقد خسرت كل المحاولات! انتهت اللعبة." },
  msgWin: { en: "You guessed all the ingredients!", ar: "لقد خمنت كل المكونات!" },
  msgNotQuite: { en: "Not quite — keep trying.", ar: "ليس تماماً — استمر في المحاولة." },
  msgNoHint: { en: "No more hidden correct ingredients to reveal!", ar: "لا توجد مكونات صحيحة مخفية لكشفها!" },
  msgHintUsed: { en: "Hint used! One correct ingredient is revealed.", ar: "تم استخدام التلميح! تم كشف مكون صحيح." },
  msgGameEnded: { en: "Game ended. The correct ingredients are revealed.", ar: "انتهت اللعبة. تم كشف المكونات الصحيحة." },
  msgWrongLeft: { en: "Still X wrong ingredient(s) left.", ar: "لا يزال هناك X مكونات خاطئة." },
};

// Helper function to get the word in the current language
export function gt(key: keyof typeof GAME_DICT, lang: "en" | "ar"): string {
  return GAME_DICT[key][lang];
}
