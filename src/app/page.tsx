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
    
    welcome_image_url?: string;
    welcome_image_position?: string;
    welcome_image_size?: string;
    welcome_show_image?: string;
    welcome_image_align?: string;
    
    welcome_image2_url?: string;
    welcome_image2_position?: string;
    welcome_image2_size?: string;
    welcome_show_image2?: string;
    welcome_image2_align?: string;
    
    welcome_show_logo?: string;
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

  const showMainLogo = settings.welcome_show_logo !== "0";

  // Helper to render an image with its specific settings
  const renderImage = (
    url: string | undefined, 
    show: string | undefined, 
    align: string | undefined, 
    size: string | undefined
  ) => {
    if (!url || show === "0") return null;
    return (
      <div style={{ 
        width: "100%", 
        display: "flex", 
        justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        margin: "12px 0"
      }}>
        <img
          src={url}
          alt={greeting}
          style={{
            width: "100%",
            maxWidth: `${size || 300}px`,
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
          }}
        />
      </div>
    );
  };

  const img1Pos = settings.welcome_image_position || "replace-title";
  const img2Pos = settings.welcome_image2_position || "below-title";

  const img1 = renderImage(settings.welcome_image_url, settings.welcome_show_image, settings.welcome_image_align, settings.welcome_image_size);
  const img2 = renderImage(settings.welcome_image2_url, settings.welcome_show_image2, settings.welcome_image2_align, settings.welcome_image2_size);

  // Check if either image is set to replace the title
  const isTitleReplaced = (img1Pos === "replace-title" && img1) || (img2Pos === "replace-title" && img2);

  return (
    <div
      className="welcome-fullscreen"
      style={{
        backgroundImage: settings.background_url ? `url(${settings.background_url})` : undefined,
      }}
    >
      <div className="welcome-card-fullscreen">
        
        {showMainLogo && settings.logo_url && (
          <img src={settings.logo_url} alt="Logo" className="welcome-logo-fullscreen" />
        )}

        {/* ABOVE TITLE */}
        {img1Pos === "above-title" && img1}
        {img2Pos === "above-title" && img2}

        {/* TITLE (or replace-title images) */}
        {isTitleReplaced ? (
          <>
            {img1Pos === "replace-title" && img1}
            {img2Pos === "replace-title" && img2}
          </>
        ) : (
          <h1 className="welcome-title-fullscreen">{greeting}</h1>
        )}

        {/* BELOW TITLE */}
        {img1Pos === "below-title" && img1}
        {img2Pos === "below-title" && img2}

        <button
          type="button"
          className="welcome-enter-btn"
          onClick={() => router.push("/recipes")}
        >
          {welcomeButton}
        </button>

        {/* BELOW BUTTON */}
        {img1Pos === "below-button" && img1}
        {img2Pos === "below-button" && img2}
        
      </div>
    </div>
  );
}
