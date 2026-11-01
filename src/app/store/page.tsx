"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";

type Product = {
  id: number;
  externalId: number;
  sku: string;
  title: string;
  titleAr: string | null;
  category: string | null;
  subCategory: string | null;
  brand: string | null;
  price: number;
  imageUrl: string | null;
};

const ALLOWED_MAIN_CATEGORIES = [
  "Offers & Promotions", "Meat & Poultry", "Fresh Fish", "Back To School",
  "Produce", "Dairy & Eggs", "Bakery", "Ready To Eat", "Grocery Food",
  "Frozen Food", "Snack & Sweet", "Beverages", "Coffee & Tea",
  "Organic & Healthy", "Toys", "Baby Care", "Home Care", "Personal Care",
  "Pet Care", "Tobacco", "Kitchen Accessories", "Phone & Home electronics"
];

const MAIN_CATEGORY_TRANSLATIONS: Record<string, string> = {
  "Offers & Promotions": "العروض والترويجات",
  "Meat & Poultry": "لحوم ودواجن",
  "Fresh Fish": "سمك طازج",
  "Back To School": "العودة إلى المدرسة",
  "Produce": "خضار وفواكه",
  "Dairy & Eggs": "ألبان وبيض",
  "Bakery": "مخبوزات",
  "Ready To Eat": "أكل جاهز",
  "Grocery Food": "بقالة",
  "Frozen Food": "مأكولات مجمدة",
  "Snack & Sweet": "وجبات خفيفة وحلويات",
  "Beverages": "مشروبات",
  "Coffee & Tea": "قهوة وشاي",
  "Organic & Healthy": "عضوي وصحي",
  "Toys": "ألعاب",
  "Baby Care": "عناية بالطفل",
  "Home Care": "عناية بالمنزل",
  "Personal Care": "عناية شخصية",
  "Pet Care": "عناية بالحيوانات",
  "Tobacco": "دخان",
  "Kitchen Accessories": "أدوات المطبخ",
  "Phone & Home electronics": "هواتف وإلكترونيات"
};

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function StorePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { cart, addToCart, removeFromCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [dictionary, setDictionary] = useState<Record<string, string>>({});

  const [activeMainCategory, setActiveMainCategory] = useState<string>("All");
  const [activeSubCategory, setActiveSubCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Store a shuffled version of products in a ref
  const shuffledProductsRef = useRef<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          shuffledProductsRef.current = shuffleArray(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/dictionary")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const dict: Record<string, string> = {};
          data.forEach((item: any) => {
            dict[item.ar] = item.en;
          });
          setDictionary(dict);
        }
      })
      .catch(() => {});
  }, []);

  const categoryTree = useMemo(() => {
    const tree: Record<string, Set<string>> = {};
    for (const p of products) {
      if (!p.category) continue;
      if (!tree[p.category]) tree[p.category] = new Set();
      if (p.subCategory) tree[p.category].add(p.subCategory);
    }
    return tree;
  }, [products]);

  const mainCategories = useMemo(() => {
    const validCats = ALLOWED_MAIN_CATEGORIES.filter(cat => 
      products.some(p => p.category === cat)
    );
    return ["All", ...validCats];
  }, [products]);
  
  const subCategories = useMemo(() => {
    if (activeMainCategory === "All") return [];
    const subs = categoryTree[activeMainCategory];
    return subs ? ["All", ...Array.from(subs).sort()] : [];
  }, [categoryTree, activeMainCategory]);

  const filteredProducts = useMemo(() => {
    let list = shuffledProductsRef.current;
    
    if (activeMainCategory !== "All") {
      list = list.filter(p => p.category === activeMainCategory);
    }
    if (activeSubCategory !== "All") {
      list = list.filter(p => p.subCategory === activeSubCategory);
    }
    
    if (search.trim()) {
      const lower = search.toLowerCase().trim();
      if (lower.length < 3) return list; 

      const englishTranslations: string[] = [];
      for (const [arKey, enValue] of Object.entries(dictionary)) {
        if (arKey.startsWith(search.trim())) {
          englishTranslations.push(enValue.toLowerCase());
        }
      }
      
      list = list.filter((p) => {
        const titleEn = (p.title || "").toLowerCase();
        if (titleEn.includes(lower)) return true;
        if (englishTranslations.length > 0 && englishTranslations.some(eng => titleEn.includes(eng))) return true;
        if (p.titleAr && p.titleAr.includes(search)) return true;
        if (p.sku && p.sku.toLowerCase().includes(lower)) return true;
        if (p.brand && p.brand.toLowerCase().includes(lower)) return true;
        if (p.category && p.category.toLowerCase().includes(lower)) return true;
        if (p.subCategory && p.subCategory.toLowerCase().includes(lower)) return true;
        return false;
      });
    }
    return list;
  }, [search, activeMainCategory, activeSubCategory, dictionary, products]);

  // DYNAMIC ITEMS PER PAGE
  const itemsPerPage = currentPage === 1 ? 10 : 30;

  const totalPages = Math.ceil((filteredProducts.length - 10) / 30) + 1;
  
  const paginatedProducts = useMemo(() => {
    if (currentPage === 1) {
      return filteredProducts.slice(0, 10);
    } else {
      const start = 10 + (currentPage - 2) * 30;
      return filteredProducts.slice(start, start + 30);
    }
  }, [filteredProducts, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search, activeMainCategory, activeSubCategory]);

  function handleMainCategoryClick(cat: string) {
    setActiveMainCategory(cat);
    setActiveSubCategory("All");
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div className="page-head" style={{ margin: 0 }}><h1>{isAr ? "المتجر" : "Store"}</h1></div>
      </div>
      
      <p className="page-sub">
        {isAr 
          ? `عرض ${filteredProducts.length} منتج (صفحة ${currentPage} من ${totalPages || 1})` 
          : `Showing ${filteredProducts.length} products (Page ${currentPage} of ${totalPages || 1})`}
      </p>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ width: "100%", maxWidth: 400 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={isAr ? "ابحث عن منتج... (3 أحرف على الأقل)" : "Search products... (min 3 chars)"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button type="button" className="search-clear" onClick={() => setSearch("")}>✕</button>}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {mainCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleMainCategoryClick(cat)}
            className={`chip ${activeMainCategory === cat ? "active" : ""}`}
            style={{ fontSize: 14, padding: "8px 16px", cursor: "pointer", fontWeight: activeMainCategory === cat ? 700 : 500 }}
          >
            {cat === "All" ? (isAr ? "الكل" : "All") : (isAr ? MAIN_CATEGORY_TRANSLATIONS[cat] || cat : cat)}
          </button>
        ))}
      </div>

      {activeMainCategory !== "All" && subCategories.length > 1 && (
        <div style={{ 
          display: "flex", gap: 6, marginBottom: 24, paddingBottom: 8,
          overflowX: "auto", whiteSpace: "nowrap", WebkitOverflowScrolling: "touch"
        }}>
          {subCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubCategory(sub)}
              className={`chip ${activeSubCategory === sub ? "active" : ""}`}
              style={{ fontSize: 12, padding: "6px 14px", cursor: "pointer", flexShrink: 0 }}
            >
              {sub === "All" ? (isAr ? "الكل" : "All") : sub}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="helper">{isAr ? "جاري التحميل..." : "Loading..."}</p>
      ) : filteredProducts.length === 0 ? (
        <div className="empty">
          <h2>{isAr ? "لا توجد منتجات" : "No products found"}</h2>
          <p>{isAr ? "جرب البحث بكلمة أخرى أو فئة أخرى." : "Try a different search or category."}</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {paginatedProducts.map((p) => {
              const cartItem = cart.find((i) => i.id === p.id);
              const displayCat = p.brand || p.subCategory || p.category || p.sku;
              const displayTitle = isAr && p.titleAr ? p.titleAr : p.title;

              return (
                <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ width: "100%", aspectRatio: "1/1", background: "var(--surface-2)", position: "relative" }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={displayTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 32, opacity: 0.3 }}>🛒</div>
                    )}
                  </div>

                  <div style={{ padding: 12, display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>
                        {displayCat}
                      </div>
                      <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {displayTitle}
                      </h3>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                        ${p.price.toFixed(2)}
                      </span>

                      {cartItem ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--accent-soft)", borderRadius: 8, padding: "2px 4px" }}>
                          <button onClick={() => removeFromCart(p.id)} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 16, cursor: "pointer", width: 20 }}>-</button>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{cartItem.quantity}</span>
                          <button onClick={() => addToCart({ id: p.id, title: displayTitle, price: p.price, imageUrl: p.imageUrl })} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 16, cursor: "pointer", width: 20 }}>+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart({ id: p.id, title: displayTitle, price: p.price, imageUrl: p.imageUrl })}
                          style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 40 }}>
              <button className="btn btn-ghost" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>← {isAr ? "السابق" : "Prev"}</button>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>{currentPage} / {totalPages}</span>
              <button className="btn btn-ghost" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{isAr ? "التالي" : "Next"} →</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
