"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useLang } from "@/components/LanguageProvider";

export default function CartPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

  function generateTextList() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const dateStr = new Date().toLocaleDateString(isAr ? "ar-LB" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    let text = "";

    // Super clean, text-only header
    if (isAr) {
      text += `*هيكترا*\n`;
      text += `*قائمة المشتريات*\n`;
      text += `${dateStr}\n`;
      text += `------------------\n\n`;
    } else {
      text += `*HICTRA*\n`;
      text += `*Shopping List*\n`;
      text += `${dateStr}\n`;
      text += `------------------\n\n`;
    }

    cart.forEach((item) => {
      text += `• ${item.quantity}x ${item.title} - $${(item.price * item.quantity).toFixed(2)}\n`;
    });

    text += `\n------------------\n`;
    text += `*${isAr ? "المجموع الكلي" : "Total"}: $${cartTotal.toFixed(2)}*\n`;
    text += `------------------\n\n`;
    
    if (isAr) {
      text += `تسوق المزيد هنا: ${origin}/store\n`;
      text += `_أُرسلت من تطبيق هيكترا_`;
    } else {
      text += `Shop more: ${origin}/store\n`;
      text += `_Sent from Hictra App_`;
    }

    return text;
  }

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    const text = generateTextList();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 100, maxWidth: 800 }}>
      
      {/* Hide header and buttons when printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .site-header { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>{isAr ? "سلة المشتريات" : "Shopping Cart"}</h1>
        {cart.length > 0 && (
          <button onClick={clearCart} className="btn btn-danger" style={{ fontSize: 12 }}>
            🗑 {isAr ? "مسح السلة" : "Clear Cart"}
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="empty no-print">
          <h2>{isAr ? "سلتك فارغة" : "Your cart is empty"}</h2>
          <p>{isAr ? "تصفح المتجر لإضافة منتجات" : "Browse the store to add items"}</p>
          <Link href="/store" className="btn btn-primary" style={{ marginTop: 16 }}>
            {isAr ? "← الذهاب إلى المتجر" : "← Go to Store"}
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Print Header (Only visible when printing) */}
          <div style={{ display: "none", marginBottom: 20 }} className="print-only">
            <h2 style={{ margin: 0, fontSize: 24, color: "black" }}>{isAr ? "قائمة مشتريات هيكترا" : "Hictra Shopping List"}</h2>
            <p style={{ margin: 0, fontSize: 14, color: "gray" }}>{new Date().toLocaleDateString()}</p>
          </div>

          {/* Cart Items */}
          <div className="print-card" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, borderBottom: "1px solid var(--line)" }}>
                
                {/* Image (Hidden on print) */}
                <div className="no-print" style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", background: "var(--surface-2)", flexShrink: 0 }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</h3>
                  <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>${item.price.toFixed(2)}</div>
                </div>

                <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", borderRadius: 8, padding: "4px 8px" }}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--ink)" }}>−</button>
                  <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--ink)" }}>+</button>
                </div>

                {/* Print Only Quantity */}
                <div className="print-only" style={{ display: "none", fontSize: 16, fontWeight: 700, marginRight: 20 }}>
                  x{item.quantity}
                </div>

                <button className="no-print" onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 18, padding: 8 }}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Summary & Actions */}
          <div className="print-card" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, fontSize: 16, fontWeight: 700, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
              <span>{isAr ? "المجموع الكلي" : "Total"}</span>
              <span style={{ color: "var(--accent)" }}>${cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="no-print" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-ghost" onClick={handlePrint} style={{ flex: 1, padding: 14, fontSize: 15, border: "1px solid var(--line)" }}>
                🖨 {isAr ? "طباعة" : "Print"}
              </button>
              <button className="btn btn-primary" onClick={handleWhatsApp} style={{ flex: 1, padding: 14, fontSize: 15, background: "#25D366", borderColor: "#25D366", color: "white" }}>
                💬 {isAr ? "إرسال واتساب" : "Send WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
