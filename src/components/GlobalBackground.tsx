"use client";

import { useEffect, useState } from "react";

export default function GlobalBackground() {
  const [bgUrl, setBgUrl] = useState<string>("");
  const [opacity, setOpacity] = useState<number>(0.1);

  useEffect(() => {
    function loadBg() {
      fetch("/api/settings", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.global_bg_url) {
            setBgUrl(data.global_bg_url);
            setOpacity(parseFloat(data.global_bg_opacity) || 0.1);
          } else {
            setBgUrl("");
          }
        })
        .catch(() => {});
    }
    
    loadBg();

    // Listen for changes from the Settings page
    window.addEventListener("settings-updated", loadBg);
    return () => window.removeEventListener("settings-updated", loadBg);
  }, []);

  if (!bgUrl) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        opacity: opacity,
        zIndex: -1, // Behind everything
        pointerEvents: "none",
      }}
    />
  );
}
