const UNITS = [
  "tablespoons", "tablespoon", "tbsp", "tbs",
  "teaspoons", "teaspoon", "tsp",
  "cups", "cup",
  "grams", "gram", "gr", "g",
  "kilograms", "kilogram", "kg",
  "milliliters", "milliliter", "ml",
  "liters", "liter", "l",
  "ounces", "ounce", "oz",
  "pounds", "pound", "lb", "lbs",
  "cloves", "clove",
  "slices", "slice",
  "cans", "can",
  "pinches", "pinch",
  "bunches", "bunch",
  "stalks", "stalk",
  "sprigs", "sprig",
  "heads", "head",
  "dashes", "dash",
  "handfuls", "handful",
];

const AMOUNT_RE = /^(\d+\s*[-–]\s*\d+|\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])/;
const BULLET_RE = /^[\s•·●○▪▫■□◆◇♦→*\-–—]+/;

export type ParsedIngredient = {
  amount: string;
  unit: string;
  name: string;
  preparation: string;
};

export function parseIngredientLine(raw: string): ParsedIngredient | null {
  let line = raw.replace(BULLET_RE, "").trim();
  if (!line) return null;

  let preparation = "";

  const parenMatch = line.match(/\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    preparation = parenMatch[1].trim();
    line = line.slice(0, parenMatch.index).trim();
  } else {
    const commaMatch = line.match(/,\s*([a-zA-Z][a-zA-Z\s-]{2,30})$/);
    if (commaMatch) {
      preparation = commaMatch[1].trim();
      line = line.slice(0, commaMatch.index).trim();
    }
  }

  let rest = line;
  let amount = "";
  let unit = "";

  const amtMatch = rest.match(AMOUNT_RE);
  if (amtMatch) {
    amount = amtMatch[0].replace(/\s+/g, "");
    rest = rest.slice(amtMatch[0].length).trim();
  }

  if (amount) {
    const lower = rest.toLowerCase();
    for (const u of UNITS) {
      if (
        lower === u ||
        lower.startsWith(u + " ") ||
        lower.startsWith(u + ".")
      ) {
        unit = rest.slice(0, u.length);
        rest = rest.slice(u.length).replace(/^[.\s]+/, "").trim();
        break;
      }
    }
  }

  const name = rest.trim();
  if (!name) return null;
  return { amount, unit, name, preparation };
}

export function parseIngredientsBulk(input: string): ParsedIngredient[] {
  return input
    .split(/\r?\n/)
    .map(parseIngredientLine)
    .filter((x): x is ParsedIngredient => x !== null);
}
