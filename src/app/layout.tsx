import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Nav from "@/components/Nav";
import DynamicFavicon from "@/components/DynamicFavicon";
import TitleThemeSync from "@/components/TitleThemeSync";

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

// Runs before React hydration — applies saved theme/lang instantly.
// No flash of dark/English on first paint.
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
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: inlineBootstrap }} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <DynamicFavicon />
            <TitleThemeSync />
            <Nav />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
