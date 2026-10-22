import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meal Calendar | Menu",
  description: "Plan your daily meals",
  openGraph: {
    title: "Meal Calendar | Menu",
    description: "Plan your daily meals",
    images: [{ 
      url: "https://pub-38f308b7646741b187d7a0e8b3ee30c2.r2.dev/recipes/768f50d2-006a-4863-b877-dcb4a2b9e621.png", 
      width: 1200, 
      height: 630 
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meal Calendar | Menu",
    description: "Plan your daily meals",
    images: ["https://pub-38f308b7646741b187d7a0e8b3ee30c2.r2.dev/recipes/768f50d2-006a-4863-b877-dcb4a2b9e621.png"],
  },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
