"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useLang } from "@/components/LanguageProvider";
import ReceiptScanModal from "@/components/ReceiptScanModal"; // <--- Imported your actual scanner

export default function CartPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { cart, updateQuantity, removeFromCart, editCartItem, cartTotal, clearCart, addToCart } = useCart();

  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const [costModalOpen, setCostModalOpen] = useState(false);
  const [costData, setCostData] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);

  // --- MODAL STATES ---
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [exchangeRate, setExchangeRate] = useState("89500");

  function startEdit(item: any) {
    setEditId(item.id);
    setEditTitle(item.title);
    setEditPrice(item.price.toFixed(2));
  }

  function saveEdit() {
    if (editId !== null) {
      editCartItem(editId, editTitle, Number(editPrice) || 0);
      setEditId(null);
    }
  }

  function removeImage(id: number) {
    editCartItem(id, editTitle, Number(editPrice) || 0, null);
  }

  function openCostModal() {
    const initialData = cart.map(item => ({
      id: item.id,
      name: item.title,
      price: item.price,
      qtyUsed: item.quantity
    }));
    setCostData(initialData);
    const initialTotal = initialData.reduce((sum, item) => sum + (item.qtyUsed * item.price), 0);
    setGrandTotal(initialTotal);
    setCostModalOpen(true);
  }

  function handleQtyChange(id: number, qty: string) {
    const newData = costData.map(item => {
      if (item.id === id) {
        return { ...item, qtyUsed: parseFloat(qty) || 0 };
      }
      return item;
    });
    setCostData(newData);
    const total = newData.reduce((sum, item) => sum + (item.qtyUsed * item.price), 0);
    setGrandTotal(total);
  }

  function sendCostToWhatsApp() {
    let text = isAr ? `*هيكترا*\n*تقدير تكلفة المشتريات*\n------------------\n\n` : `*HICTRA*\n*Shopping Cost Estimate*\n------------------\n\n`;
    costData.forEach(item => {
      if (item.qtyUsed > 0) {
        text += `• ${item.qtyUsed}x ${item.name} - $${(item.qtyUsed * item.price).toFixed(2)}\n`;
      }
    });
    text += `\n------------------\n*${isAr ? "المجموع" : "Total"}: $${grandTotal.toFixed(2)}*\n------------------\n\n`;
    text += isAr ? `_أُرسلت من تطبيق هيكترا_` : `_Sent from Hictra App_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  // --- PARSE GEMINI TEXT ---
  function handleBulkText() {
    if (!pasteText.trim()) return;

    const rate = parseFloat(exchangeRate) || 89500;
    const lines = pasteText.split("\n");
    let addedCount = 0;

    lines.forEach((line) => {
      const parts = line.split("|").map(s => s.trim()).filter(Boolean);
      
      if (parts.length >= 4) {
        const name = parts[0];
        const totalStr = parts[3];

        if (name.toLowerCase().includes("item") || totalStr.toLowerCase().includes("total")) return;

        const rawPrice = parseFloat(totalStr.replace(/[^\d.]/g, ''));
        
        if (!isNaN(rawPrice) && rawPrice > 0) {
          const priceUSD = parseFloat((rawPrice / rate).toFixed(2));
          
          addToCart({
            id: Date.now() + Math.random(),
            title: name,
            price: priceUSD,
            imageUrl: null,
          });
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      alert(isAr ? `تمت إضافة ${addedCount} منتج` : `Added ${addedCount} items to cart!`);
      setPasteModalOpen(false);
      setPasteText("");
    } else {
      alert(isAr ? "لم يتم العثور على منتجات. تأكد من نسخ الجدول بالكامل." : "No items found. Make sure to copy the full table.");
    }
  }

  function generateTextList() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const dateStr = new Date().toLocaleDateString(isAr ? "ar-LB" : "en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" });
    let text = isAr ? `*هيكترا*\n*قائمة المشتريات*\n${dateStr}\n------------------\n\n` : `*HICTRA*\n*Shopping List*\n${dateStr}\n------------------\n\n`;
    cart.forEach((item) => { text += `• ${item.quantity}x ${item.title} - $${(item.price * item.quantity).toFixed(2)}\n`; });
    text += `\n------------------\n*${isAr ? "المجموع الكلي" : "Total"}: $${cartTotal.toFixed(2)}*\n------------------\n\n`;
    text += isAr ? `تسوق المزيد هنا: ${origin}/store\n_أُرسلت من تطبيق هيكترا_` : `Shop more: ${origin}/store\n_Sent from Hictra App_`;
    return text;
  }

  function handlePrint() { window.print(); }
  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(generateTextList())}`, "_blank");
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 100, maxWidth: 800 }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .site-header { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
        <div className="page-head" style={{ margin: 0 }}>
          <h1 style={{ margin: 0 }}>{isAr ? "سلة المشتريات" : "Shopping Cart"}</h1>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setScanModalOpen(true)} className="btn btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>
            📷 {isAr ? "مسح الفاتورة" : "Scan Receipt"}
          </button>

          <button onClick={() => setPasteModalOpen(true)} className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 16px", border: "1px solid var(--accent)", color: "var(--accent)" }}>
            📝 {isAr ? "لصق نص الفاتورة" : "Paste Receipt Text"}
          </button>
          
          {cart.length > 0 && (
            <button onClick={clearCart} className="btn btn-danger" style={{ fontSize: 13, padding: "8px 16px" }}>
              🗑 {isAr ? "مسح السلة" : "Clear Cart"}
            </button>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="empty no-print">
          <h2>{isAr ? "سلتك فارغة" : "Your cart is empty"}</h2>
          <p>{isAr ? "تصفح المتجر لإضافة منتجات أو الصق نص الفاتورة" : "Browse the store to add items or paste a receipt"}</p>
          <Link href="/store" className="btn btn-primary" style={{ marginTop: 16 }}>
            {isAr ? "← الذهاب إلى المتجر" : "← Go to Store"}
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          <div style={{ display: "none", marginBottom: 20 }} className="print-only">
            <h2 style={{ margin: 0, fontSize: 24, color: "black" }}>{isAr ? "قائمة مشتريات هيكترا" : "Hictra Shopping List"}</h2>
            <p style={{ margin: 0, fontSize: 14, color: "gray" }}>{new Date().toLocaleDateString()}</p>
          </div>

          <div className="print-card" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, borderBottom: "1px solid var(--line)" }}>
                
                <div style={{ position: "relative" }}>
                  <div className="no-print" style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", background: "var(--surface-2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, opacity: 0.3 }}>🛒</span>}
                  </div>
                  {editId === item.id && item.imageUrl && (
                    <button onClick={() => removeImage(item.id)} style={{ position: "absolute", top: -6, right: -6, background: "var(--accent)", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, cursor: "pointer", zIndex: 5 }} title={isAr ? "إزالة الصورة" : "Remove image"}>✕</button>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editId === item.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ padding: "4px 8px", fontSize: 13, borderRadius: 4, border: "1px solid var(--accent)", background: "var(--input-bg)", color: "var(--ink)", width: "100%" }} autoFocus />
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>$</span>
                        <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ padding: "4px 8px", fontSize: 13, borderRadius: 4, border: "1px solid var(--accent)", background: "var(--input-bg)", color: "var(--ink)", width: 80 }} />
                        <button onClick={saveEdit} className="btn btn-primary" style={{ padding: "2px 10px", fontSize: 11 }}>✓ {isAr ? "حفظ" : "Save"}</button>
                        <button onClick={() => setEditId(null)} className="btn btn-ghost" style={{ padding: "2px 10px", fontSize: 11 }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => startEdit(item)} style={{ cursor: "pointer" }} title={isAr ? "اضغط للتعديل" : "Click to edit"}>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 6 }}>
                        {item.title} <span style={{ fontSize: 10, color: "var(--muted)", opacity: 0.6 }}>✎</span>
                      </h3>
                      <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>${item.price.toFixed(2)}</div>
                    </div>
                  )}
                </div>

                <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", borderRadius: 8, padding: "4px 8px" }}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--ink)" }}>−</button>
                  <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--ink)" }}>+</button>
                </div>

                <button className="no-print" onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 18, padding: 8 }}>✕</button>
              </div>
            ))}
          </div>

          <div className="print-card" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, fontSize: 16, fontWeight: 700, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
              <span>{isAr ? "المجموع الكلي" : "Total"}</span>
              <span style={{ color: "var(--accent)" }}>${cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="no-print" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-ghost" onClick={openCostModal} style={{ flex: 1, padding: 14, fontSize: 15, border: "1px solid var(--olive)", background: "var(--olive-soft)", color: "var(--olive)", fontWeight: 600 }}>
                💰 {isAr ? "تقدير التكلفة" : "Calculate Cost"}
              </button>
              <button className="btn btn-ghost" onClick={handlePrint} style={{ flex: 1, padding: 14, fontSize: 15, border: "1px solid var(--line)" }}>
                🖨 {isAr ? "طباعة" : "Print"}
              </button>
              <button className="btn btn-primary" onClick={handleWhatsApp} style={{ flex: 2, padding: 14, fontSize: 15, background: "#25D366", borderColor: "#25D366", color: "white" }}>
                💬 {isAr ? "إرسال واتساب" : "Send WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT SCANNER MODAL */}
      <ReceiptScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onAddItems={(items) => {
          items.forEach(item => {
            // Add to cart with a unique ID
            addToCart({ id: Date.now() + Math.random(), title: item.title, price: item.price, imageUrl: null });
          });
          alert(isAr ? "تمت إضافة المنتجات من الفاتورة" : "Items added from receipt!");
        }}
        isAr={isAr}
      />

      {/* PASTE TEXT MODAL */}
      {pasteModalOpen && (
        <div onClick={() => setPasteModalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface-solid)", border: "1px solid var(--line)", borderRadius: 16, maxWidth: 500, width: "100%", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>{isAr ? "لصق نص الفاتورة" : "Paste Receipt Text"}</h2>
            
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--muted)" }}>
                {isAr ? "سعر الصرف (ل.ل لكل دولار)" : "Exchange Rate (LBP per $1)"}
              </label>
              <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--muted)" }}>
                {isAr ? "الصق نص الجدول هنا" : "Paste Table Text Here"}
              </label>
              <textarea 
                value={pasteText} 
                onChange={(e) => setPasteText(e.target.value)} 
                placeholder="| Item | Qty | Price | Total |&#10;| Mango | 1kg | 90,000 | 88,020 |&#10;| Peach | 1kg | 195,000 | 243,360 |"
                style={{ width: "100%", minHeight: 200, padding: 12, borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontFamily: "monospace", fontSize: 13, resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setPasteModalOpen(false)} className="btn btn-ghost">{isAr ? "إلغاء" : "Cancel"}</button>
              <button onClick={handleBulkText} className="btn btn-primary">{isAr ? "إضافة إلى السلة" : "Add to Cart"}</button>
            </div>
          </div>
        </div>
      )}

      {/* COST MODAL */}
      {costModalOpen && (
        <div onClick={() => setCostModalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.2s ease-out" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface-solid)", border: "1px solid var(--line)", borderRadius: 24, maxWidth: 500, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 48px rgba(0,0,0,0.5)", overflow: "hidden" }}>
            
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 400 }}>{isAr ? "تقدير التكلفة" : "Cost Estimate"}</div>
              <button onClick={() => setCostModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: 24, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              {costData.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface-2)", padding: 12, borderRadius: 12, border: "1px solid var(--line)", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, marginTop: 2 }}>
                      {item.price > 0 ? `$${item.price.toFixed(2)} / unit` : (isAr ? "غير متوفر" : "Not found")}
                    </div>
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    placeholder="Qty"
                    value={item.qtyUsed || ""}
                    onChange={(e) => handleQtyChange(item.id, e.target.value)}
                    style={{ width: 80, padding: 8, borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink)", fontSize: 14, textAlign: "center", fontWeight: 600 }}
                  />
                  <div style={{ width: 70, textAlign: "end", fontSize: 14, fontWeight: 700, color: "var(--olive)" }}>
                    ${(item.qtyUsed * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "20px 24px", borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>{isAr ? "المجموع" : "Total Estimate"}</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)" }}>${grandTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-whatsapp" onClick={sendCostToWhatsApp} style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 600, background: "#25D366", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  💬 {isAr ? "إرسال واتساب" : "Send to WhatsApp"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
