const CUISINE_FLAGS: Record<string, string> = {
  // Middle East
  Lebanese: "🇱🇧", Syrian: "🇸🇾", Palestinian: "🇵🇸", Jordanian: "🇯🇴",
  Egyptian: "🇪🇬", Saudi: "🇸🇦", Yemeni: "🇾🇪", Iraqi: "🇮🇶",
  // North Africa
  Moroccan: "🇲🇦", Tunisian: "🇹🇳", Algerian: "🇩🇿",
  // Mediterranean
  Turkish: "🇹🇷", Greek: "🇬🇷", Italian: "🇮🇹", Spanish: "🇪🇸",
  // European
  French: "🇫🇷", German: "🇩🇪", British: "🇬🇧",
  // Asian
  Indian: "🇮🇳", Pakistani: "🇵🇰", Chinese: "🇨🇳", Japanese: "🇯🇵",
  Korean: "🇰🇷", Thai: "🇹🇭", Vietnamese: "🇻🇳", Indonesian: "🇮🇩",
  Filipino: "🇵🇭",
  // Americas
  Mexican: "🇲🇽", American: "🇺🇸", Brazilian: "🇧🇷", Peruvian: "🇵🇪",
};

const ARABIC_TO_FLAG: Record<string, string> = {
  "لبناني": "🇱🇧", "سوري": "🇸🇾", "فلسطيني": "🇵🇸", "أردني": "🇯🇴",
  "مصري": "🇪🇬", "سعودي": "🇸🇦", "يمني": "🇾🇪", "عراقي": "🇮🇶",
  "مغربي": "🇲🇦", "تونسي": "🇹🇳", "جزائري": "🇩🇿",
  "تركي": "🇹🇷", "يوناني": "🇬🇷", "إيطالي": "🇮🇹", "إسباني": "🇪🇸",
  "فرنسي": "🇫🇷", "ألماني": "🇩🇪", "بريطاني": "🇬🇧",
  "هندي": "🇮🇳", "باكستاني": "🇵🇰", "صيني": "🇨🇳", "ياباني": "🇯🇵",
  "كوري": "🇰🇷", "تايلندي": "🇹🇭", "فيتنامي": "🇻🇳", "إندونيسي": "🇮🇩",
  "فلبيني": "🇵🇭",
  "مكسيكي": "🇲🇽", "أمريكي": "🇺🇸", "برازيلي": "🇧🇷", "بيروفي": "🇵🇪",
};

export function cuisineFlag(cuisine: string | null | undefined): string {
  if (!cuisine) return "";
  const trimmed = cuisine.trim();
  return CUISINE_FLAGS[trimmed] || ARABIC_TO_FLAG[trimmed] || "";
}
