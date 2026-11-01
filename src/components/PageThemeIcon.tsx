"use client";

import { useEffect, useState } from "react";

export default function PageThemeIcon() {
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  // 1. Fetch the icon from settings when the app loads
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.page_title_icon) setIconUrl(data.page_title_icon);
      })
      .catch(() => {});
  }, []);

  // 2. Inject the icon into every .page-head h1 on the page
  useEffect(() => {
    if (!iconUrl) return;

    const injectIcons = () => {
      const heads = document.querySelectorAll(".page-head h1");
      heads.forEach((h1) => {
        // Don't add it twice
        if (h1.querySelector(".theme-title-icon")) return;

        const img = document.createElement("img");
        img.src = iconUrl;
        img.alt = "Theme Icon";
        img.className = "theme-title-icon";
        
        // Insert at the beginning of the h1
        h1.insertBefore(img, h1.firstChild);
      });
    };

    // Run once immediately
    injectIcons();

    // Set up a MutationObserver to catch page transitions (React Router swaps)
    const observer = new MutationObserver(() => {
      injectIcons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [iconUrl]);

  return null;
}
