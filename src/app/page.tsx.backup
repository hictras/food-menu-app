"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

export default function WelcomePage() {
  const { lang } = useLang();
  const router = useRouter();
  const [settings, setSettings] = useState<{
    logo_url?: string;
    background_url?: string;
    welcome_title?: string;
    welcome_button?: string;
  }>({});
  const [name, setName] = useState<string | null>(null);

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

  return (
    <div
      className="welcome-fullscreen"
      style={{
        backgroundImage: settings.background_url ? `url(${settings.background_url})` : undefined,
      }}
    >
      <div className="welcome-card-fullscreen">
        {settings.logo_url && (
          <img src={settings.logo_url} alt="Logo" className="welcome-logo-fullscreen" />
        )}
        <h1 className="welcome-title-fullscreen">{greeting}</h1>
        <button
          type="button"
          className="welcome-enter-btn"
          onClick={() => router.push("/recipes")}
        >
          {welcomeButton}
        </button>
      </div>
    </div>
  );
}
