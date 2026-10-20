"use client";

import { useEffect } from "react";

export default function DynamicFavicon() {
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const url = data.favicon_url || data.logo_url;
        if (!url) return;

        // Remove Next.js default + any previous dynamic icons
        document.querySelectorAll("link[rel*='icon']").forEach((el) => {
          const href = el.getAttribute("href") || "";
          if (href.includes("/favicon.ico") || el.getAttribute("data-dynamic") === "true") {
            el.remove();
          }
        });

        const icon = document.createElement("link");
        icon.rel = "icon";
        icon.type = "image/png";
        icon.href = url;
        icon.setAttribute("data-dynamic", "true");
        document.head.appendChild(icon);

        const appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        appleIcon.href = url;
        appleIcon.setAttribute("data-dynamic", "true");
        document.head.appendChild(appleIcon);
      })
      .catch(() => {});
  }, []);

  return null;
}
