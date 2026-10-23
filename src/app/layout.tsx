import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Nav from "@/components/Nav";
import DynamicFavicon from "@/components/DynamicFavicon";
import TitleThemeSync from "@/components/TitleThemeSync";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/db";
import { settings } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> {
  'use cache'
  cacheLife('hours')
  cacheTag('app-settings')

  try {
    const db = getDb();
    const rows = await db.select().from(settings);
    const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const appName = s.app_name || "Menu";
    return { title: appName, description: "Your personal cookbook" };
  } catch {
    return { title: "Menu", description: "Your personal cookbook" };
  }
}

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
  } catch(e) {}
})();
`;

const visitorTracker = `
(function() {
  // Check if user is admin via API before tracking
  fetch("/api/auth/me")
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.admin) return; // Skip tracking if admin
      
      var visitorId = localStorage.getItem("visitor_id");
      if (!visitorId) {
        visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem("visitor_id", visitorId);
      }
      
      var phone = null;
      var match = document.cookie.match(/viewer_phone=([^;]+)/);
      if (match) phone = decodeURIComponent(match[1]);

      return fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: visitorId, phone: phone })
      });
    })
    .catch(function(){});
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
        <script dangerouslySetInnerHTML={{ __html: visitorTracker }} />
      </body>
    </html>
  );
}
