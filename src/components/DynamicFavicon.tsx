"use client";

import { useEffect } from "react";

export default function DynamicFavicon() {
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.logo_url) return;

        // Remove Next.js default favicon AND our previous dynamic ones
        document.querySelectorAll("link[rel*='icon']").forEach((el) => {
          const href = el.getAttribute("href") || "";
          if (href.includes("/favicon.ico") || el.getAttribute("data-dynamic") === "true") {
            el.remove();
          }
        });

        // Add new icon links
        const icon = document.createElement("link");
        icon.rel = "icon";
        icon.type = "image/png";
        icon.href = data.logo_url;
        icon.setAttribute("data-dynamic", "true");
        document.head.appendChild(icon);

        const appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        appleIcon.href = data.logo_url;
        appleIcon.setAttribute("data-dynamic", "true");
        document.head.appendChild(appleIcon);
      })
      .catch(() => {});
  }, []);

  return null;
}
