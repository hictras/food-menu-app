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

export const metadata: Metadata = {
  title: "Menu — Recipes",
  description: "Your personal cookbook",
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
    var theme = localStorage.getItem("theme");
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", theme);

    var lang = localStorage.getItem("lang") || "en";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    var fontSize = localStorage.getItem("font_size");
    if (fontSize) {
      document.documentElement.style.fontSize = fontSize;
    }

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
