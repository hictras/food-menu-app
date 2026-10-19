"use client";

import { useEffect, useState } from "react";
import WelcomeOverlay from "./WelcomeOverlay";

const SESSION_KEY = "hictra_welcome_entered";

export default function HomeWrapper({ children }: { children: React.ReactNode }) {
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");
  const [entered, setEntered] = useState<boolean | null>(null);

  useEffect(() => {
    // Session check
    try {
      const flag = sessionStorage.getItem(SESSION_KEY);
      setEntered(flag === "1");
    } catch {
      setEntered(false);
    }
    // Fetch background
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.background_url) setBackgroundUrl(data.background_url);
      })
      .catch(() => {});
  }, []);

  function handleEnter() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    setEntered(true);
  }

  // While checking session, render nothing to avoid flash
  if (entered === null) return null;

  return (
    <>
      {backgroundUrl && (
        <div
          className="home-background"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      )}
      {!entered && <WelcomeOverlay onEnter={handleEnter} />}
      <div style={{ opacity: entered ? 1 : 0, transition: "opacity 0.3s ease" }}>
        {children}
      </div>
    </>
  );
}
