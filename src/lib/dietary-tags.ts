export const DIETARY_TAGS = [
  // Diet style
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Halal",
  "Kosher",
  "Low-Carb",
  "Keto",
  "Paleo",
  // Protein / main ingredient
  "Meat",
  "Chicken",
  "Seafood",
  "Fish",
  "Lamb",
  "Beef",
  "Legumes",
  // Other
  "Spicy",
  "Quick",
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number];
