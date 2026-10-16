export const DIETARY_TAGS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Halal",
  "Kosher",
  "Low-Carb",
  "Keto",
  "Paleo",
  "Spicy",
  "Quick",
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number];
