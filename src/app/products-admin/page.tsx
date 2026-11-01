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
  category: string | null;
  subCategory: string | null;
  brand: string | null;
  price: number;
  imageUrl: string | null;
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
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
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
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        p.externalId.toString().includes(q)
    );
  }, [products, query]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [query]);

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
      } else {
        show({ message: isAr ? "فشل الحذف" : "Delete failed", tone: "danger" });
      }
    } catch {
      show({ message: isAr ? "فشل الحذف" : "Delete failed", tone: "danger" });
    }
  }

  if (loading) return <div className="container" style={{ padding: 40 }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 1200 }}>
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
            placeholder={isAr ? "ابحث بالاسم، SKU، الفئة، الماركة..." : "Search by title, SKU, category, brand..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <button type="button" className="search-clear" onClick={() => setQuery("")}>✕</button>}
        </div>
      </div>

      <div className="form-card" style={{ padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 950 }}>
          <thead style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 40 }}>#</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 60 }}>Image</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600 }}>{isAr ? "الاسم" : "Title"}</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 100 }}>SKU</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 120 }}>{isAr ? "الفئة" : "Category"}</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 120 }}>{isAr ? "الفئة الفرعية" : "Sub Category"}</th>
              <th style={{ padding: 12, textAlign: "start", fontWeight: 600, width: 100 }}>{isAr ? "الماركة" : "Brand"}</th>
              <th style={{ padding: 12, textAlign: "end", fontWeight: 600, width: 80 }}>{isAr ? "السعر" : "Price"}</th>
              <th style={{ padding: 12, textAlign: "center", fontWeight: 600, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
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
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 16, opacity: 0.3 }}>🛒</div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{ fontWeight: 500 }}>{p.title}</span>
                  </td>
                  <td style={{ padding: 12, color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {p.sku}
                  </td>
                  <td style={{ padding: 12, color: "var(--ink-soft)", fontSize: 12 }}>
                    {p.category || "-"}
                  </td>
                  <td style={{ padding: 12, color: "var(--muted)", fontSize: 12, fontStyle: p.subCategory ? "normal" : "italic" }}>
                    {p.subCategory || (isAr ? "لا يوجد" : "None")}
                  </td>
                  <td style={{ padding: 12, color: "var(--accent)", fontSize: 12, fontWeight: 600 }}>
                    {p.brand || "-"}
                  </td>
                  <td style={{ padding: 12, textAlign: "end", fontWeight: 600, color: "var(--accent)" }}>
                    ${p.price.toFixed(2)}
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 16 }}
                      title={isAr ? "حذف" : "Delete"}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            ← {isAr ? "السابق" : "Prev"}
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>
            {currentPage} / {totalPages}
          </span>
          <button className="btn btn-ghost" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            {isAr ? "التالي" : "Next"} →
          </button>
        </div>
      )}
    </main>
  );
}
