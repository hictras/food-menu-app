const { createClient } = require("@libsql/client");
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

const words = {
  "حليب": "milk", "جبنة": "cheese", "لبن": "yogurt", "زبدة": "butter", "بيض": "egg", "بيضات": "eggs", "لبنة": "labneh",
  "لحم": "meat", "دجاج": "chicken", "دجاجة": "chicken", "سمك": "fish", "سلمون": "salmon", "تونة": "tuna", "روبيان": "shrimp",
  "خضار": "vegetables", "فواكه": "fruits", "تفاح": "apple", "موز": "banana", "برتقال": "orange", "ليمون": "lemon", "عنب": "grapes",
  "فراولة": "strawberry", "بطيخ": "watermelon", "بندورة": "tomato", "طماطم": "tomato", "خيار": "cucumber", "بصل": "onion",
  "ثوم": "garlic", "بطاطا": "potato", "بطاطس": "potato", "جزر": "carrot", "خس": "lettuce", "سبانخ": "spinach",
  "خبز": "bread", "كعك": "cake", "كيك": "cake", "بسكويت": "biscuit", "أرز": "rice", "رز": "rice", "معكرونة": "pasta",
  "طحين": "flour", "دقيق": "flour", "سكر": "sugar", "ملح": "salt", "زيت": "oil", "زيت زيتون": "olive oil",
  "خل": "vinegar", "عسل": "honey", "مربى": "jam", "شوكولا": "chocolate", "شوكولاتة": "chocolate", "نوتيلا": "nutella",
  "ماء": "water", "مياه": "water", "عصير": "juice", "قهوة": "coffee", "شاي": "tea", "نسكافيه": "nescafe",
  "مشروب غازي": "soda", "بيبسي": "pepsi", "كوكا كولا": "coca cola", "شيبس": "chips", "مكسرات": "nuts",
  "لوز": "almonds", "كاجو": "cashew", "فستق": "pistachio", "جوز": "walnuts", "زبيب": "raisins", "تمر": "dates",
  "حلوى": "candy", "سكاكر": "candy", "علكة": "chewing gum", "بوظة": "ice cream", "مثلجات": "ice cream",
  "صابون": "soap", "شامبو": "shampoo", "مناديل": "tissues", "منظف": "cleaner", "ديتول": "dettol",
  "حفاضات": "diapers", "بامبرز": "pampers"
};

(async () => {
  let count = 0;
  for (const [ar, en] of Object.entries(words)) {
    try {
      await db.execute({ sql: "INSERT OR IGNORE INTO store_dictionary (ar, en) VALUES (?, ?)", args: [ar, en] });
      count++;
    } catch (e) {}
  }
  console.log(`✅ Seeded ${count} words.`);
})();
