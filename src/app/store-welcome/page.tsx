"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { useState, useEffect } from "react";

export default function StoreWelcomePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [welcomeImage, setWelcomeImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.welcome_image2_url) setWelcomeImage(data.welcome_image2_url);
        else if (data.welcome_image_url) setWelcomeImage(data.welcome_image_url);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="container" style={{ minHeight: "calc(100vh - 100px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 107, 74, 0.08), transparent)",
        pointerEvents: "none", zIndex: 0
      }} />

      <div style={{
        position: "relative", zIndex: 1, background: "var(--surface)",
        border: "1px solid var(--line)", borderRadius: 24, padding: "48px",
        maxWidth: 500, width: "100%", textAlign: "center",
        backdropFilter: "blur(20px)", boxShadow: "var(--shadow-lg)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
        animation: "fadeIn 0.6s ease-out"
      }}>
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {welcomeImage ? (
          <img src={welcomeImage} alt="Shopping List" style={{ width: "100%", maxWidth: "280px", height: "auto", objectFit: "contain", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.4))", marginBottom: 8 }} />
        ) : (
          <div style={{ width: 80, height: 80, background: "var(--accent-soft)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 8, border: "1px solid var(--accent)", boxShadow: "0 0 40px var(--accent-soft)" }}>
            📋
          </div>
        )}

        <h1 style={{ fontFamily: "var(--font-head)", fontSize: "2.5rem", fontWeight: 400, lineHeight: 1.1, margin: 0 }}>
          {isAr ? "قائمة المشتريات" : "Shopping List"}
        </h1>

        <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.5, maxWidth: 320, margin: 0 }}>
          {isAr 
            ? "تصفح المنتجات، أنشئ قائمة مشترياتك، وأرسلها بسهولة عبر واتساب."
            : "Browse products, build your grocery list, and send it easily via WhatsApp."}
        </p>

        <Link 
          href="/store" 
          className="btn btn-primary"
          style={{ background: "var(--accent)", color: "white", padding: "16px 40px", borderRadius: 999, fontSize: 16, fontWeight: 600, textDecoration: "none", transition: "all 0.2s ease", boxShadow: "0 8px 24px var(--accent-soft)", marginTop: 16, width: "100%", maxWidth: 250, display: "flex", justifyContent: "center" }}
        >
          {isAr ? "تصفح المنتجات" : "Browse Products"}
        </Link>

        <div style={{ display: "flex", gap: 16, marginTop: 16, color: "var(--muted)", fontSize: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--olive)" }}>✓</span> {isAr ? "قائمة مشتريات" : "Make a List"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--olive)" }}>✓</span> {isAr ? "إرسال واتساب" : "Send WhatsApp"}
          </div>
        </div>

        {/* DATA WARNING */}
        <div style={{ 
          marginTop: 12, padding: "10px 14px", background: "rgba(255, 193, 7, 0.1)", 
          border: "1px solid rgba(255, 193, 7, 0.3)", borderRadius: 12, 
          display: "flex", alignItems: "flex-start", gap: 10, textAlign: "start"
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ fontSize: 12, color: "#ffc107", lineHeight: 1.4 }}>
            <strong>{isAr ? "تنبيه:" : "Note:"}</strong>{" "}
            {isAr 
              ? "يحتوي المتجر على أكثر من 5000 منتج. يرجى استخدام شبكة Wi-Fi لتجنب استهلاك بيانات كبيرة."
              : "The store contains over 5,000 products. Please use Wi-Fi to avoid consuming large amounts of mobile data."}
          </div>
        </div>

      </div>
    </main>
  );
}
