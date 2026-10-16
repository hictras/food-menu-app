type FlagInfo = { emoji: string; code: string }; // code = ISO 3166-1 alpha-2, lowercase

const CUISINE_FLAGS: Record<string, FlagInfo> = {
  // Middle East
  Lebanese:      { emoji: "🇱🇧", code: "lb" },
  Syrian:        { emoji: "🇸🇾", code: "sy" },
  Palestinian:   { emoji: "🇵🇸", code: "ps" },
  Jordanian:     { emoji: "🇯🇴", code: "jo" },
  Egyptian:      { emoji: "🇪🇬", code: "eg" },
  Saudi:         { emoji: "🇸🇦", code: "sa" },
  Yemeni:        { emoji: "🇾🇪", code: "ye" },
  Iraqi:         { emoji: "🇮🇶", code: "iq" },
  // North Africa
  Moroccan:      { emoji: "🇲🇦", code: "ma" },
  Tunisian:      { emoji: "🇹🇳", code: "tn" },
  Algerian:      { emoji: "🇩🇿", code: "dz" },
  // Mediterranean
  Turkish:       { emoji: "🇹🇷", code: "tr" },
  Greek:         { emoji: "🇬🇷", code: "gr" },
  Italian:       { emoji: "🇮🇹", code: "it" },
  Spanish:       { emoji: "🇪🇸", code: "es" },
  // European
  French:        { emoji: "🇫🇷", code: "fr" },
  German:        { emoji: "🇩🇪", code: "de" },
  British:       { emoji: "🇬🇧", code: "gb" },
  // Asian
  Indian:        { emoji: "🇮🇳", code: "in" },
  Pakistani:     { emoji: "🇵🇰", code: "pk" },
  Chinese:       { emoji: "🇨🇳", code: "cn" },
  Japanese:      { emoji: "🇯🇵", code: "jp" },
  Korean:        { emoji: "🇰🇷", code: "kr" },
  Thai:          { emoji: "🇹🇭", code: "th" },
  Vietnamese:    { emoji: "🇻🇳", code: "vn" },
  Indonesian:    { emoji: "🇮🇩", code: "id" },
  Filipino:      { emoji: "🇵🇭", code: "ph" },
  // Americas
  Mexican:       { emoji: "🇲🇽", code: "mx" },
  American:      { emoji: "🇺🇸", code: "us" },
  Brazilian:     { emoji: "🇧🇷", code: "br" },
  Peruvian:      { emoji: "🇵🇪", code: "pe" },
};

const ARABIC_TO_FLAG: Record<string, FlagInfo> = {
  "لبناني":    { emoji: "🇱🇧", code: "lb" },
  "سوري":      { emoji: "🇸🇾", code: "sy" },
  "فلسطيني":   { emoji: "🇵🇸", code: "ps" },
  "أردني":     { emoji: "🇯🇴", code: "jo" },
  "مصري":      { emoji: "🇪🇬", code: "eg" },
  "سعودي":     { emoji: "🇸🇦", code: "sa" },
  "يمني":      { emoji: "🇾🇪", code: "ye" },
  "عراقي":     { emoji: "🇮🇶", code: "iq" },
  "مغربي":     { emoji: "🇲🇦", code: "ma" },
  "تونسي":     { emoji: "🇹🇳", code: "tn" },
  "جزائري":    { emoji: "🇩🇿", code: "dz" },
  "تركي":      { emoji: "🇹🇷", code: "tr" },
  "يوناني":    { emoji: "🇬🇷", code: "gr" },
  "إيطالي":    { emoji: "🇮🇹", code: "it" },
  "إسباني":    { emoji: "🇪🇸", code: "es" },
  "فرنسي":     { emoji: "🇫🇷", code: "fr" },
  "ألماني":    { emoji: "🇩🇪", code: "de" },
  "بريطاني":   { emoji: "🇬🇧", code: "gb" },
  "هندي":      { emoji: "🇮🇳", code: "in" },
  "باكستاني":  { emoji: "🇵🇰", code: "pk" },
  "صيني":      { emoji: "🇨🇳", code: "cn" },
  "ياباني":    { emoji: "🇯🇵", code: "jp" },
  "كوري":      { emoji: "🇰🇷", code: "kr" },
  "تايلندي":   { emoji: "🇹🇭", code: "th" },
  "فيتنامي":   { emoji: "🇻🇳", code: "vn" },
  "إندونيسي":  { emoji: "🇮🇩", code: "id" },
  "فلبيني":    { emoji: "🇵🇭", code: "ph" },
  "مكسيكي":    { emoji: "🇲🇽", code: "mx" },
  "أمريكي":    { emoji: "🇺🇸", code: "us" },
  "برازيلي":   { emoji: "🇧🇷", code: "br" },
  "بيروفي":    { emoji: "🇵🇪", code: "pe" },
};

export function cuisineFlagInfo(cuisine: string | null | undefined): FlagInfo | null {
  if (!cuisine) return null;
  const trimmed = cuisine.trim();
  return CUISINE_FLAGS[trimmed] || ARABIC_TO_FLAG[trimmed] || null;
}

/** SVG URL from flagcdn (works everywhere including Windows) */
export function cuisineFlagUrl(cuisine: string | null | undefined): string | null {
  const info = cuisineFlagInfo(cuisine);
  return info ? `https://flagcdn.com/${info.code}.svg` : null;
}

/** Emoji fallback (renders on iOS/macOS/Android, shows letters on Windows) */
export function cuisineFlag(cuisine: string | null | undefined): string {
  const info = cuisineFlagInfo(cuisine);
  return info?.emoji || "";
}
