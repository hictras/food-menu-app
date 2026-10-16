import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Menu — Recipes",
  description: "Your personal cookbook",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <Nav />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
