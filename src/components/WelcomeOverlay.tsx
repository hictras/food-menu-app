"use client";

import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";

type Settings = {
  logo_url?: string;
  welcome_title?: string;
  welcome_button?: string;
};

export default function WelcomeOverlay({ onEnter }: { onEnter: () => void }) {
  const { lang } = useLang();
  const [settings, setSettings] = useState<Settings>({});
  const [name, setName] = useState<string | null>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => {});
    fetch("/api/auth/welcome")
      .then((res) => res.json())
      .then((data) => setName(data.name || null))
      .catch(() => setName(null));
  }, []);

  const defaultTitle = lang === "ar" ? "أهلاً بك في منيو هيكترا" : "Welcome to Hictra Recipes";
  const defaultButton = lang === "ar" ? "دخول" : "Enter";
  const welcomeTitle = settings.welcome_title || defaultTitle;
  const welcomeButton = settings.welcome_button || defaultButton;

  const greeting = name
    ? (lang === "ar" ? `أهلاً بك، ${name}` : `Welcome, ${name}`)
    : welcomeTitle;

  function enter() {
    setFading(true);
    setTimeout(() => {
      onEnter();
    }, 300);
  }

  return (
    <div
      className="welcome-overlay"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      <div className="welcome-card">
        {settings.logo_url && (
          <img
            src={settings.logo_url}
            alt="Logo"
            className="welcome-logo"
          />
        )}
        <h1 className="welcome-title">{greeting}</h1>
        <button type="button" className="welcome-enter-btn" onClick={enter}>
          {welcomeButton}
        </button>
      </div>
    </div>
  );
}
