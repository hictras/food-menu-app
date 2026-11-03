"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";
import { useDebounce } from "use-debounce";

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
  packageSize: number | null;
  packageUnit: string | null;
  isPromotion: number | null;
};

const ALLOWED_MAIN_CATEGORIES = [
  "Offers & Promotions", "Meat & Poultry", "Fresh Fish", "Back To School",
  "Produce", "Dairy & Eggs", "Bakery", "Ready To Eat", "Grocery Food",
  "Frozen Food", "Snack & Sweet", "Beverages", "Coffee & Tea",
  "Organic & Healthy", "Toys", "Baby Care", "Home Care", "Personal Care",
  "Pet Care", "Tobacco", "Kitchen Accessories", "Phone & Home electronics"
];

const MAIN_CATEGORY_TRANSLATIONS: Record<string, string> = {
  "Offers & Promotions": "العروض والترويجات", "Meat & Poultry": "لحوم ودواجن",
  "Fresh Fish": "سمك طازج", "Back To School": "العودة إلى المدرسة",
  "Produce": "خضار وفواكه", "Dairy & Eggs": "ألبان وبيض",
  "Bakery": "مخبوزات", "Ready To Eat": "أكل جاهز", "Grocery Food": "بقالة",
  "Frozen Food": "مأكولات مجمدة", "Snack & Sweet": "وجبات خفيفة وحلويات",
  "Beverages": "مشروبات", "Coffee & Tea": "قهوة وشاي",
  "Organic & Healthy": "عضوي وصحي", "Toys": "ألعاب", "Baby Care": "عناية بالطفل",
  "Home Care": "عناية بالمنزل", "Personal Care": "عناية شخصية",
  "Pet Care": "عناية بالحيوانات", "Tobacco": "دخان",
  "Kitchen Accessories": "أدوات المطبخ", "Phone & Home electronics": "هواتف وإلكترونيات"
};

export default function StorePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { cart, addToCart, removeFromCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(false);

  const [activeMainCategory, setActiveMainCategory] = useState<string>("All");
  const [activeSubCategory, setActiveSubCategory] = useState<string>("All");
  
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebounce(searchInput, 500);
  const [dictionary, setDictionary] = useState<Record<string, string>>({});
  const [translatedSearch, setTranslatedSearch] = useState("");

  const observerTarget = useRef<HTMLDivElement>(null);


  // Load dictionary
  useEffect(() => {
    fetch("/api/dictionary").then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        const dict: Record<string, string> = {};
        data.forEach((item: any) => { if (item.ar && item.en) dict[item.ar] = item.en; });
        setDictionary(dict);
      }
    }).catch(() => {});
  }, []);

  // Load settings (Infinite scroll toggle)
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.infinite_scroll === "1") setInfiniteScrollEnabled(true);
      })
      .catch(() => {});
  }, []);

  // Translate search
  useEffect(() => {
    const raw = debouncedSearch.trim();
    if (raw.length < 3) { setTranslatedSearch(raw); return; }

    let enMatches = [];
    for (const [arKey, enVal] of Object.entries(dictionary)) {
      if (arKey.startsWith(raw)) enMatches.push(enVal);
    }
    setTranslatedSearch(enMatches.length > 0 ? enMatches[0] : raw);
  }, [debouncedSearch, dictionary]);

  const fetchProducts = useCallback((page: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    const params = new URLSearchParams({ page: page.toString() });
    if (activeMainCategory !== "All") params.append("category", activeMainCategory);
    if (activeSubCategory !== "All") params.append("subCategory", activeSubCategory);
    
    // Only search if 3+ chars
    if (translatedSearch.length >= 3) params.append("search", translatedSearch);
    if (page === 1) params.append("random", "true");

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          if (append) {
            setProducts(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = data.products.filter((p: Product) => !existingIds.has(p.id));
              return [...prev, ...newItems];
            });
          } else {
            setProducts(data.products);
          }
          setTotalCount(data.totalCount);
          setTotalPages(data.totalPages);
        }
        setLoading(false);
        setLoadingMore(false);
      })
      .catch(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [activeMainCategory, activeSubCategory, translatedSearch]);

  // Reset on filter/search change
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  // Infinite scroll observer
  useEffect(() => {
    if (!infiniteScrollEnabled) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && currentPage < totalPages) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchProducts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [infiniteScrollEnabled, loading, loadingMore, currentPage, totalPages, fetchProducts]);

  function goToPage(page: number) {
    setCurrentPage(page);
    fetchProducts(page, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Available subcategories based on the current main category
  const subCategories: Record<string, string[]> = {
    "Offers & Promotions": ["Weekly Offers", "Daily offers", "Fresh daily offers", "Online Offers"],
    "Meat & Poultry": ["Cold Cuts", "Meat", "Chicken"],
    "Fresh Fish": ["Cooked Fish", "Fresh Fish"],
    "Dairy & Eggs": ["Cheese", "Butters & Creams", "Labneh", "yogurts", "Powder Milk", "UHT & Fresh Milk", "Eggs"],
    "Produce": ["Vegetables", "Fruits", "Herbs", "Dried fruits", "Ready To Cook"],
    "Bakery": ["Bread", "Kaak & Toast", "Freshly Baked"],
    "Grocery Food": ["Spreads, Jam & Honey", "Rice", "Sugar", "Grains & Seeds", "Pasta & Noodles", "Baking & Flour", "Herbs & Spices", "Oil & Ghee", "Sauces & Condiments", "Cans & Jars", "Soups", "Cereals"],
    "Frozen Food": ["Vegetables & fruits", "Frozen Food", "Meat & Chicken", "Fish & Shrimp"],
    "Snack & Sweet": ["Pop Corn", "Gums & Candies", "Nuts & Kernels", "Cakes & Croissant", "Chocolates", "Chips & Crackers", "Wafers & Biscuits"],
    "Beverages": ["Water", "Sparkling & Flavored Water", "Juices", "Soft Drinks", "Energy & Sport Drinks", "Iced Coffee & Tea", "Powder Drinks", "Non Alcoholic Drinks", "Concentrated Drinks"],
    "Coffee & Tea": ["Lebanese Coffee", "Instant Coffee", "Tea & Infusion", "creamer & sweetners"],
    "Home Care": ["Powder Laundry Detergents", "Liquid Laundry Detergents", "Fabric Softner", "Tissues & Napkins", "Kitchen & Toilet Rolls", "Bathroom Cleaning", "Surface & Floor Cleaning", "Kitchen Supplies", "Cleaning Tools & Gloves", "Disinfectant", "Dishwashing", "Disposables", "Insecticides", "Batteries"],
    "Personal Care": ["Shampoo", "Conditioners", "Bath & Body Wash", "Liquid Handwash", "Bar Soap", "Deodorants&perfumes", "Men's Care", "Women's Care", "Tooth care", "Body Care", "Hair Coloration", "Hair Styling", "Skin Care", "Cotton", "Wipes & Sanitizers", "Elder Care"],
    "Baby Care": ["Diapers", "baby bath & wash", "Wipes & Sanitizers"],
    "Kitchen Accessories": ["Gas", "Kitchen tools", "Electric Kitchen Tools"],
  };

  const currentSubs = subCategories[activeMainCategory] || [];
  const searchTooShort = searchInput.trim().length > 0 && searchInput.trim().length < 3;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 100 }}>
      <style>{`
        .main-categories-desktop { display: flex; }
        .main-categories-mobile { display: none; }
        @media (max-width: 768px) {
          .main-categories-desktop { display: none !important; }
          .main-categories-mobile { display: block !important; }
        }
        .product-card:hover .product-title { color: var(--accent) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div className="page-head" style={{ margin: 0 }}><h1>{isAr ? "المتجر" : "Store"}</h1></div>
      </div>
      
      <p className="page-sub">
        {isAr 
          ? `عرض ${products.length} من ${totalCount} منتج` 
          : `Showing ${products.length} of ${totalCount} products`}
        {searchTooShort && (
          <span style={{ marginInlineStart: 8, color: "var(--accent)" }}>
            {isAr ? "— اكتب 3 أحرف على الأقل للبحث" : "— type at least 3 characters to search"}
          </span>
        )}
      </p>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ width: "100%", maxWidth: 450, display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder={isAr ? "ابحث عن منتج... (3 أحرف على الأقل)" : "Search products... (min 3 chars)"}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingRight: 40 }}
            />
            {searchInput && <button type="button" className="search-clear" onClick={() => setSearchInput("")}>✕</button>}
          </div>
        </div>
      </div>

      <div className="main-categories-desktop" style={{ flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {["All", ...ALLOWED_MAIN_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveMainCategory(cat); setActiveSubCategory("All"); }}
            className={`chip ${activeMainCategory === cat ? "active" : ""}`}
            style={{ fontSize: 14, padding: "8px 16px", cursor: "pointer", fontWeight: activeMainCategory === cat ? 700 : 500 }}
          >
            {cat === "All" ? (isAr ? "الكل" : "All") : (isAr ? MAIN_CATEGORY_TRANSLATIONS[cat] || cat : cat)}
          </button>
        ))}
      </div>

      <div className="main-categories-mobile" style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
          {isAr ? "الفئة الرئيسية" : "Main Category"}
        </label>
        <select
          className="filter-select"
          value={activeMainCategory}
          onChange={(e) => { setActiveMainCategory(e.target.value); setActiveSubCategory("All"); }}
          style={{ width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 8, background: "var(--surface-solid)", border: "1px solid var(--line)", color: "var(--ink)" }}
        >
          {["All", ...ALLOWED_MAIN_CATEGORIES].map((cat) => (
            <option key={cat} value={cat}>
              {cat === "All" ? (isAr ? "الكل" : "All") : (isAr ? MAIN_CATEGORY_TRANSLATIONS[cat] || cat : cat)}
            </option>
          ))}
        </select>
      </div>

      {activeMainCategory !== "All" && currentSubs.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 24, paddingBottom: 8, overflowX: "auto", whiteSpace: "nowrap", WebkitOverflowScrolling: "touch" }}>
          {["All", ...currentSubs].map((sub) => (
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 20 }}>
          <div style={{ width: 48, height: 48, border: "4px solid var(--line-strong)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "var(--ink)" }}>{isAr ? "جاري تحميل المنتجات..." : "Loading products..."}</h3>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="empty">
          <h2>{isAr ? "لا توجد منتجات" : "No products found"}</h2>
          <p>{isAr ? "جرب البحث بكلمة أخرى أو فئة أخرى." : "Try a different search or category."}</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {products.map((p) => {
              const cartItem = cart.find((i) => i.id === p.id);
              const displayCat = p.brand || p.subCategory || p.category || p.sku;
              const displayTitle = isAr && p.titleAr ? p.titleAr : p.title;
              const pkgLabel = p.packageSize != null && p.packageUnit ? `${p.packageSize}${p.packageUnit}` : null;

              return (
                <div key={p.id} className="product-card" style={{ background: "var(--surface-solid)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                  <div style={{ width: "100%", aspectRatio: "1/1", background: "var(--surface-2)", position: "relative" }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={displayTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 32, opacity: 0.3 }}>🛒</div>
                    )}
                    {p.isPromotion === 1 && (
                      <div style={{ position: "absolute", top: 8, left: 8, background: "#61d509", color: "#000", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase", zIndex: 3, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
                        {isAr ? "عرض" : "Promo"}
                      </div>
                    )}
                    {pkgLabel && (
                      <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.75)", color: "#fff", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, zIndex: 2, pointerEvents: "none" }}>
                        {pkgLabel}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 14, display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
                        {displayCat}
                      </div>
                      <h3 className="product-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", transition: "color 0.2s" }}>
                        {displayTitle}
                      </h3>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
                        ${p.price.toFixed(2)}
                      </span>

                      {cartItem ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--accent-soft)", borderRadius: 8, padding: "2px 4px" }}>
                          <button onClick={() => removeFromCart(p.id)} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 16, cursor: "pointer", width: 20 }}>-</button>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{cartItem.quantity}</span>
                          <button onClick={() => addToCart({ id: p.id, title: displayTitle, price: p.price, imageUrl: p.imageUrl })} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 16, cursor: "pointer", width: 20 }}>+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart({ id: p.id, title: displayTitle, price: p.price, imageUrl: p.imageUrl })} style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>
                          +
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {infiniteScrollEnabled ? (
            <div ref={observerTarget} style={{ display: "flex", justifyContent: "center", padding: "40px 0", minHeight: 60 }}>
              {loadingMore && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, border: "3px solid var(--line-strong)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{isAr ? "جاري تحميل المزيد..." : "Loading more..."}</span>
                </div>
              )}
              {!loadingMore && currentPage >= totalPages && (
                <span style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>{isAr ? "لقد وصلت إلى النهاية" : "You've reached the end"}</span>
              )}
            </div>
          ) : (
            totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 40 }}>
                <button className="btn btn-ghost" onClick={() => goToPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>← {isAr ? "السابق" : "Prev"}</button>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>{currentPage} / {totalPages}</span>
                <button className="btn btn-ghost" onClick={() => goToPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>{isAr ? "التالي" : "Next"} →</button>
              </div>
            )
          )}
        </>
      )}
    </main>
  );
}