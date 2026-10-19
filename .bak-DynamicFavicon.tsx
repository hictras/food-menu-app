"use client";

import { useEffect } from "react";

export default function DynamicFavicon() {
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.logo_url) return;

        // Remove any existing icon links
        document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());

        // Add new icon link
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/png";
        link.href = data.logo_url;
        document.head.appendChild(link);

        // Also update apple-touch-icon for iOS home screen
        const appleLink = document.createElement("link");
        appleLink.rel = "apple-touch-icon";
        appleLink.href = data.logo_url;
        document.head.appendChild(appleLink);
      })
      .catch(() => {});
  }, []);

  return null;
}
