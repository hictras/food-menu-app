import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Day Plan | Menu",
  description: "Your meal plan for the day",
  openGraph: {
    title: "Day Plan | Menu",
    description: "Your meal plan for the day",
    images: [{ 
      url: "https://pub-38f308b7646741b187d7a0e8b3ee30c2.r2.dev/recipes/768f50d2-006a-4863-b877-dcb4a2b9e621.png", 
      width: 1200, 
      height: 630 
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Day Plan | Menu",
    description: "Your meal plan for the day",
    images: ["https://pub-38f308b7646741b187d7a0e8b3ee30c2.r2.dev/recipes/768f50d2-006a-4863-b877-dcb4a2b9e621.png"],
  },
};

export default function DayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
