import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import NavGate from "@/components/NavGate";
import DynamicFavicon from "@/components/DynamicFavicon";
import TitleThemeSync from "@/components/TitleThemeSync";
import BackToTop from "@/components/BackToTop";
import { ModalProvider } from "@/components/ModalProvider";
import IdleReload from "@/components/IdleReload";
import PresenceTracker from "@/components/PresenceTracker";

// Static Metadata (No DB calls here to avoid blocking)
export const metadata: Metadata = {
  title: "Hictra",
  description: "Your personal cookbook",
  openGraph: {
    title: "Hictra",
    siteName: "Hictra",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const inlineBootstrap = `
(function() {
  try {
    // 1. Language
    var cookieLang = document.cookie.match(/lang=(en|ar)/);
    var l = cookieLang ? cookieLang[1] : (localStorage.getItem("lang") || "en");
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";

    // 2. Theme
    var t = localStorage.getItem("theme");
    if (!t) t = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);

    // 3. Font Size
    var f = localStorage.getItem("font_size");
    if (f) document.documentElement.style.fontSize = f;

    // 4. Fetch Settings (App Name & User Settings)
    fetch("/api/settings", { credentials: "same-origin" })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.app_name) {
          document.title = d.app_name;
          var ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) ogTitle.setAttribute("content", d.app_name);
          var ogSite = document.querySelector('meta[property="og:site_name"]');
          if (ogSite) ogSite.setAttribute("content", d.app_name);
        }
      })
      .catch(function(){});

    fetch("/api/user-settings", { credentials: "same-origin" })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.theme) document.documentElement.setAttribute("data-theme", d.theme);
        if (d.lang) {
          document.documentElement.lang = d.lang;
          document.documentElement.dir = d.lang === "ar" ? "rtl" : "ltr";
        }
        if (d.font_size) document.documentElement.style.fontSize = d.font_size;
      })
      .catch(function(){});
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <Script id="bootstrap" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: inlineBootstrap }} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <Suspense fallback={null}>
              <PresenceTracker />
              <IdleReload />
            </Suspense>
            <ModalProvider>
              <DynamicFavicon />
              <TitleThemeSync />
              <Suspense fallback={null}><NavGate /></Suspense>
              {children}
            </ModalProvider>
          </LanguageProvider>
        </ThemeProvider>
        <BackToTop />
      </body>
    </html>
  );
}
