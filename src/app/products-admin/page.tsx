"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { useModal } from "@/components/ModalProvider";
import Link from "next/link";

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
  isPromotion: number | null;
  packageSize: number | null;
  packageUnit: string | null;
};

const ITEMS_PER_PAGE = 50;

export default function ProductsAdminPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const router = useRouter();
  const { confirm, show } = useModal();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Edit states
  const [editId, setEditId] = useState<number | null>(null);
  const [editField, setEditField] = useState<"titleAr" | "price" | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.admin) router.push("/login");
        else loadProducts();
      });
  }, [router]);

  function loadProducts() {
    setLoading(true);
    // Add admin=true so the API returns ALL products
    fetch("/api/products?admin=true", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.titleAr && p.titleAr.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        p.externalId.toString().includes(q)
    );
  }, [products, query]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [query]);

  async function saveEdit(id: number) {
    setSaving(true);
    const payload: any = {};
    if (editField === "titleAr") payload.titleAr = editValue.trim();
    if (editField === "price") payload.price = Number(editValue) || 0;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
        setEditId(null);
        setEditField(null);
      } else {
        show({ message: isAr ? "فشل الحفظ" : "Save failed", tone: "danger" });
      }
    } catch {
      show({ message: isAr ? "فشل الحفظ" : "Save failed", tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  async function togglePromotion(p: Product) {
    const newState = p.isPromotion === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPromotion: newState }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(item => item.id === p.id ? { ...item, isPromotion: newState } : item));
      }
    } catch {}
  }

  async function handleDelete(id: number, title: string) {
    const ok = await confirm({
      message: isAr ? `حذف المنتج "${title}"؟` : `Delete product "${title}"?`,
      confirmText: isAr ? "حذف" : "Delete",
      tone: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        show({ message: isAr ? "تم الحذف" : "Deleted", tone: "info" });
      }
    } catch {}
  }

  if (loading) return <div className="container" style={{ padding: 40 }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 1300 }}>
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <h1 style={{ margin: 0 }}>{isAr ? "إدارة المنتجات" : "Products Management"}</h1>
        <Link href="/import-products" className="btn btn-primary">
          {isAr ? "استيراد منتجات" : "+ Import Products"}
        </Link>
      </div>
      <p className="page-sub">
        {isAr ? `إجمالي ${filtered.length} منتج` : `Total ${filtered.length} products`}
      </p>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ width: "100%", maxWidth: 400 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={isAr ? "ابحث..." : "Search..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <button type="button" className="search-clear" onClick={() => setQuery("")}>✕</button>}
        </div>
      </div>

      <div className="form-card" style={{ padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 1150 }}>
          <thead style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 40 }}>#</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 60 }}>Image</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? "الاسم (EN)" : "Title (EN)"}</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? "الاسم (AR)" : "Title (AR)"}</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 100 }}>SKU</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 80 }}>Size</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 120 }}>{isAr ? "الفئة" : "Category"}</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 100 }}>{isAr ? "الماركة" : "Brand"}</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600, width: 80 }}>Promo</th>
              <th style={{ padding: 12, textAlign: "end", fontWeight: 600, width: 90 }}>{isAr ? "السعر" : "Price"}</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
                  {isAr ? "لا توجد منتجات" : "No products found"}
                </td>
              </tr>
            ) : (
              paginated.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                    {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                  </td>
                  <td style={{ padding: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", background: "var(--surface-2)" }}>
                      {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 16, opacity: 0.3 }}>🛒</div>}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{ fontWeight: 500 }}>{p.title}</span>
                  </td>
                  
                  {/* Arabic Title */}
                  <td style={{ padding: 12 }}>
                    {editId === p.id && editField === "titleAr" ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} dir="rtl" style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--accent)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 12, width: 100 }} autoFocus />
                        <button onClick={() => saveEdit(p.id)} disabled={saving} style={{ background: "var(--olive)", color: "white", border: "none", borderRadius: 4, padding: "0 8px", cursor: "pointer", fontSize: 11 }}>{saving ? "..." : "✓"}</button>
                        <button onClick={() => { setEditId(null); setEditField(null); }} style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 4, padding: "0 8px", cursor: "pointer", fontSize: 11 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => { setEditId(p.id); setEditField("titleAr"); setEditValue(p.titleAr || ""); }}>
                        {p.titleAr ? (
                          <span style={{ color: "var(--ink)", fontSize: 13 }} dir="rtl">{p.titleAr}</span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 11, fontStyle: "italic" }}>+ {isAr ? "إضافة" : "Add"}</span>
                        )}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: 12, color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {p.sku}
                  </td>
                  
                  {/* Size */}
                  <td style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>
                    {p.packageSize && p.packageUnit ? `${p.packageSize}${p.packageUnit}` : "-"}
                  </td>

                  <td style={{ padding: 12, color: "var(--ink-soft)", fontSize: 12 }}>
                    {p.category || "-"}
                  </td>
                  <td style={{ padding: 12, color: "var(--accent)", fontSize: 12, fontWeight: 600 }}>
                    {p.brand || "-"}
                  </td>

                  {/* Promotion Toggle */}
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <input 
                      type="checkbox" 
                      checked={p.isPromotion === 1} 
                      onChange={() => togglePromotion(p)}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#61d509" }} 
                    />
                  </td>

                  {/* Price Edit */}
                  <td style={{ padding: 12, textAlign: "end" }}>
                    {editId === p.id && editField === "price" ? (
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <input type="number" step="0.01" value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--accent)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 12, width: 70 }} autoFocus />
                        <button onClick={() => saveEdit(p.id)} disabled={saving} style={{ background: "var(--olive)", color: "white", border: "none", borderRadius: 4, padding: "0 8px", cursor: "pointer", fontSize: 11 }}>{saving ? "..." : "✓"}</button>
                        <button onClick={() => { setEditId(null); setEditField(null); }} style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 4, padding: "0 8px", cursor: "pointer", fontSize: 11 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ cursor: "pointer", fontWeight: 700, color: "var(--olive)" }} onClick={() => { setEditId(p.id); setEditField("price"); setEditValue(String(p.price)); }}>
                        ${p.price.toFixed(2)}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button onClick={() => handleDelete(p.id, p.title)} style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 16 }} title={isAr ? "حذف" : "Delete"}>🗑</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>← {isAr ? "السابق" : "Prev"}</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>{currentPage} / {totalPages}</span>
          <button className="btn btn-ghost" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{isAr ? "التالي" : "Next"} →</button>
        </div>
      )}
    </main>
  );
}
