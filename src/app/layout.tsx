import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menu — Recipes",
  description: "Your personal cookbook",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/" className="brand">
              Menu<span>.</span>
            </Link>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <Link href="/recipes">Recipes</Link>
              <Link href="/recipes/new" className="btn btn-primary">
                + Add Recipe
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
