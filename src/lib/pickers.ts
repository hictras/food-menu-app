export type PickerItem = {
  value: string;   // value to insert into the input (EN)
  valueAr: string; // Arabic value to insert when lang is ar
  label: string;   // display label
  icon: string;    // emoji
  group?: string;  // optional category for grouping
};

/* ---------- CUISINES ---------- */
export const CUISINES: PickerItem[] = [
  { value: "Lebanese",       valueAr: "لبناني",          label: "Lebanese",       icon: "🇱🇧", group: "Middle East" },
  { value: "Syrian",         valueAr: "سوري",            label: "Syrian",         icon: "🇸🇾", group: "Middle East" },
  { value: "Palestinian",    valueAr: "فلسطيني",         label: "Palestinian",    icon: "🇵🇸", group: "Middle East" },
  { value: "Jordanian",      valueAr: "أردني",           label: "Jordanian",      icon: "🇯🇴", group: "Middle East" },
  { value: "Egyptian",       valueAr: "مصري",            label: "Egyptian",       icon: "🇪🇬", group: "Middle East" },
  { value: "Saudi",          valueAr: "سعودي",           label: "Saudi",          icon: "🇸🇦", group: "Middle East" },
  { value: "Yemeni",         valueAr: "يمني",            label: "Yemeni",         icon: "🇾🇪", group: "Middle East" },
  { value: "Iraqi",          valueAr: "عراقي",           label: "Iraqi",          icon: "🇮🇶", group: "Middle East" },
  { value: "Moroccan",       valueAr: "مغربي",           label: "Moroccan",       icon: "🇲🇦", group: "North Africa" },
  { value: "Tunisian",       valueAr: "تونسي",           label: "Tunisian",       icon: "🇹🇳", group: "North Africa" },
  { value: "Algerian",       valueAr: "جزائري",          label: "Algerian",       icon: "🇩🇿", group: "North Africa" },
  { value: "Turkish",        valueAr: "تركي",            label: "Turkish",        icon: "🇹🇷", group: "Mediterranean" },
  { value: "Greek",          valueAr: "يوناني",          label: "Greek",          icon: "🇬🇷", group: "Mediterranean" },
  { value: "Italian",        valueAr: "إيطالي",          label: "Italian",        icon: "🇮🇹", group: "Mediterranean" },
  { value: "Spanish",        valueAr: "إسباني",          label: "Spanish",        icon: "🇪🇸", group: "Mediterranean" },
  { value: "French",         valueAr: "فرنسي",           label: "French",         icon: "🇫🇷", group: "European" },
  { value: "German",         valueAr: "ألماني",          label: "German",         icon: "🇩🇪", group: "European" },
  { value: "British",        valueAr: "بريطاني",         label: "British",        icon: "🇬🇧", group: "European" },
  { value: "Indian",         valueAr: "هندي",            label: "Indian",         icon: "🇮🇳", group: "Asian" },
  { value: "Pakistani",      valueAr: "باكستاني",        label: "Pakistani",      icon: "🇵🇰", group: "Asian" },
  { value: "Chinese",        valueAr: "صيني",            label: "Chinese",        icon: "🇨🇳", group: "Asian" },
  { value: "Japanese",       valueAr: "ياباني",          label: "Japanese",       icon: "🇯🇵", group: "Asian" },
  { value: "Korean",         valueAr: "كوري",            label: "Korean",         icon: "🇰🇷", group: "Asian" },
  { value: "Thai",           valueAr: "تايلندي",         label: "Thai",           icon: "🇹🇭", group: "Asian" },
  { value: "Vietnamese",     valueAr: "فيتنامي",         label: "Vietnamese",     icon: "🇻🇳", group: "Asian" },
  { value: "Indonesian",     valueAr: "إندونيسي",        label: "Indonesian",     icon: "🇮🇩", group: "Asian" },
  { value: "Filipino",       valueAr: "فلبيني",          label: "Filipino",       icon: "🇵🇭", group: "Asian" },
  { value: "Mexican",        valueAr: "مكسيكي",          label: "Mexican",        icon: "🇲🇽", group: "Americas" },
  { value: "American",       valueAr: "أمريكي",          label: "American",       icon: "🇺🇸", group: "Americas" },
  { value: "Brazilian",      valueAr: "برازيلي",         label: "Brazilian",      icon: "🇧🇷", group: "Americas" },
  { value: "Peruvian",       valueAr: "بيروفي",          label: "Peruvian",       icon: "🇵🇪", group: "Americas" },
];

/* ---------- UNITS (EN + AR) ---------- */
export const UNITS: PickerItem[] = [
  { value: "g",     valueAr: "غ",       label: "gram",        icon: "⚖️" },
  { value: "kg",    valueAr: "كغ",      label: "kilogram",    icon: "⚖️" },
  { value: "ml",    valueAr: "مل",      label: "milliliter",  icon: "🥤" },
  { value: "l",     valueAr: "ل",       label: "liter",       icon: "🥤" },
  { value: "cup",   valueAr: "كوب",     label: "cup",         icon: "🥛" },
  { value: "tbsp",  valueAr: "ملعقة كبيرة", label: "tablespoon", icon: "🥄" },
  { value: "tsp",   valueAr: "ملعقة صغيرة", label: "teaspoon",   icon: "🥄" },
  { value: "spoon", valueAr: "ملعقة",   label: "spoon",       icon: "🥄" },
  { value: "clove", valueAr: "فص",      label: "clove",       icon: "🧄" },
  { value: "slice", valueAr: "شريحة",   label: "slice",       icon: "🍞" },
  { value: "piece", valueAr: "قطعة",    label: "piece",       icon: "🔸" },
  { value: "can",   valueAr: "علبة",    label: "can",         icon: "🥫" },
  { value: "bottle",valueAr: "قنينة",   label: "bottle",      icon: "🍾" },
  { value: "pack",  valueAr: "باكيت",   label: "pack",        icon: "📦" },
  { value: "bunch", valueAr: "ربطة",    label: "bunch",       icon: "🌿" },
  { value: "head",  valueAr: "رأس",     label: "head",        icon: "🥬" },
  { value: "pinch", valueAr: "رشة",     label: "pinch",       icon: "🤏" },
  { value: "dash",  valueAr: "قطرة",    label: "dash",        icon: "💧" },
  { value: "handful",valueAr: "حفنة",   label: "handful",     icon: "🤲" },
  { value: "stalk", valueAr: "عود",     label: "stalk",       icon: "🌱" },
  { value: "sprig", valueAr: "غصن",     label: "sprig",       icon: "🌿" },
  { value: "serving",valueAr:"حصة",     label: "serving",     icon: "🍽️" },
  { value: "portion",valueAr:"نصيب",    label: "portion",     icon: "🍽️" },
];

/* ---------- PREPARATIONS (EN + AR) ---------- */
export const PREPARATIONS: PickerItem[] = [
  { value: "chopped",         valueAr: "مفروم",         label: "chopped",         icon: "🔪" },
  { value: "finely chopped",  valueAr: "مفروم ناعماً",   label: "finely chopped",  icon: "🔪" },
  { value: "roughly chopped", valueAr: "مفروم خشناً",    label: "roughly chopped", icon: "🔪" },
  { value: "diced",           valueAr: "مقطع مكعبات",    label: "diced",           icon: "🎲" },
  { value: "minced",          valueAr: "مفروم ناعم",     label: "minced",          icon: "🧄" },
  { value: "sliced",          valueAr: "مقطع شرائح",     label: "sliced",          icon: "🔪" },
  { value: "julienned",       valueAr: "مقطع أعواد",     label: "julienned",       icon: "🥕" },
  { value: "grated",          valueAr: "مبشور",          label: "grated",          icon: "🧀" },
  { value: "crushed",         valueAr: "مسحوق",          label: "crushed",         icon: "🥜" },
  { value: "peeled",          valueAr: "مقشر",           label: "peeled",          icon: "🥔" },
  { value: "quartered",       valueAr: "مقطع أرباع",     label: "quartered",       icon: "🍋" },
  { value: "halved",          valueAr: "مقطع نصفين",     label: "halved",          icon: "🍅" },
  { value: "cubed",           valueAr: "مكعبات",         label: "cubed",           icon: "🎲" },
  { value: "mashed",          valueAr: "مهروس",          label: "mashed",          icon: "🥔" },
  { value: "ground",          valueAr: "مطحون",          label: "ground",          icon: "🥄" },
  { value: "whole",           valueAr: "كامل",           label: "whole",           icon: "⚪" },
  { value: "to taste",        valueAr: "حسب الرغبة",     label: "to taste",        icon: "🧂" },
  { value: "rinsed",          valueAr: "مغسول",          label: "rinsed",          icon: "💧" },
  { value: "drained",         valueAr: "مصفى",           label: "drained",         icon: "🥣" },
  { value: "softened",        valueAr: "طري",            label: "softened",        icon: "🧈" },
  { value: "melted",          valueAr: "مذوب",           label: "melted",          icon: "🧈" },
  { value: "beaten",          valueAr: "مخفوق",          label: "beaten",          icon: "🥚" },
  { value: "roasted",         valueAr: "مشوي",           label: "roasted",         icon: "🔥" },
  { value: "toasted",         valueAr: "محمص",           label: "toasted",         icon: "🔥" },
  { value: "boiled",          valueAr: "مسلوق",          label: "boiled",          icon: "💧" },
  { value: "steamed",         valueAr: "مطهو بالبخار",   label: "steamed",         icon: "♨️" },
  { value: "fried",           valueAr: "مقلي",           label: "fried",           icon: "🍳" },
  { value: "grilled",         valueAr: "مشوي على الفحم", label: "grilled",         icon: "🔥" },
  { value: "baked",           valueAr: "مخبوز",          label: "baked",           icon: "🥖" },
];

/* ---------- MEAL TYPES (optional, for future) ---------- */
export const MEAL_TYPES: PickerItem[] = [
  { value: "Breakfast", valueAr: "فطور",   label: "Breakfast", icon: "🌅" },
  { value: "Lunch",     valueAr: "غداء",   label: "Lunch",     icon: "🌞" },
  { value: "Dinner",    valueAr: "عشاء",   label: "Dinner",    icon: "🌙" },
  { value: "Snack",     valueAr: "وجبة خفيفة", label: "Snack", icon: "🍎" },
  { value: "Dessert",   valueAr: "حلويات", label: "Dessert",   icon: "🍰" },
  { value: "Drink",     valueAr: "مشروب",  label: "Drink",     icon: "🥤" },
];

/* ---------- DIETARY TAGS (reused for pickers) ---------- */
export const DIETARY_PICKER: PickerItem[] = [
  { value: "Vegetarian",  valueAr: "نباتي",        label: "Vegetarian",  icon: "🥬" },
  { value: "Vegan",       valueAr: "نباتي صرف",     label: "Vegan",       icon: "🌱" },
  { value: "Gluten-Free", valueAr: "خالٍ من الغلوتين", label: "Gluten-Free", icon: "🌾" },
  { value: "Dairy-Free",  valueAr: "خالٍ من الألبان", label: "Dairy-Free",  icon: "🥛" },
  { value: "Nut-Free",    valueAr: "خالٍ من المكسرات", label: "Nut-Free",   icon: "🥜" },
  { value: "Halal",       valueAr: "حلال",         label: "Halal",       icon: "☪️" },
  { value: "Kosher",      valueAr: "كوشير",        label: "Kosher",      icon: "✡️" },
  { value: "Low-Carb",    valueAr: "قليل الكربوهيدرات", label: "Low-Carb", icon: "🥩" },
  { value: "Keto",        valueAr: "كيتو",         label: "Keto",        icon: "🥑" },
  { value: "Paleo",       valueAr: "باليو",        label: "Paleo",       icon: "🍖" },
  { value: "Spicy",       valueAr: "حار",          label: "Spicy",       icon: "🌶️" },
  { value: "Quick",       valueAr: "سريع",         label: "Quick",       icon: "⚡" },
];
