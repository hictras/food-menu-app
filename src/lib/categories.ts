export type Category = {
  value: string;
  valueAr: string;
  icon: string;
};

export const CATEGORIES: Category[] = [
  { value: "Main Dish",     valueAr: "طبق رئيسي",     icon: "🍽️" },
  { value: "Stew",          valueAr: "يخنة",           icon: "🍲" },
  { value: "Side",          valueAr: "طبق جانبي",     icon: "🥗" },
  { value: "Appetizer",     valueAr: "مقبلات",         icon: "🥟" },
  { value: "Mezze",         valueAr: "مازة",           icon: "🫓" },
  { value: "Soup",          valueAr: "شوربة",          icon: "🥣" },
  { value: "Salad",         valueAr: "سلطة",           icon: "🥬" },
  { value: "Bread",         valueAr: "خبز",            icon: "🥖" },
  { value: "Pastry",        valueAr: "معجنات",         icon: "🥐" },
  { value: "Grill",         valueAr: "مشاوي",          icon: "🔥" },
  { value: "Rice",          valueAr: "أطباق الأرز",    icon: "🍚" },
  { value: "Pasta",         valueAr: "معكرونة",        icon: "🍝" },
  { value: "Breakfast",     valueAr: "فطور",           icon: "🌅" },
  { value: "Snack",         valueAr: "وجبة خفيفة",    icon: "🍿" },
  { value: "Dessert",       valueAr: "حلويات",         icon: "🍰" },
  { value: "Drink",         valueAr: "مشروب",          icon: "🥤" },
  { value: "Joke Recipe",   valueAr: "وصفة مزحة",      icon: "😂" }, // <--- ADDED HERE
];

export function categoryIcon(value: string | null | undefined): string {
  if (!value) return "";
  const c = CATEGORIES.find(
    (x) => x.value === value || x.valueAr === value
  );
  return c ? c.icon : "";
}

export function categoryLabel(
  value: string | null | undefined,
  lang: "en" | "ar"
): string {
  if (!value) return "";
  const c = CATEGORIES.find(
    (x) => x.value === value || x.valueAr === value
  );
  if (!c) return value;
  return lang === "ar" ? c.valueAr : c.value;
}
