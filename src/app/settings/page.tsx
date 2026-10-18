"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

export default function SettingsPage() {
  const { lang } = useLang();
  const router = useRouter();
  
  const [config, setConfig] = useState({
    today_text: "Hicham's Main Dish of the day",
    today_color_light: "#e2543a",
    today_color_dark: "#ff6b4a",
    recipe_name_color_light: "#52525b",
    recipe_name_color_dark: "#a1a1aa",
    inbox_title_color_light: "#e2543a",
    inbox_title_color_dark: "#ff6b4a",
    inbox_recipe_color_light: "#52525b",
    inbox_recipe_color_dark: "#a1a1aa",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.admin) router.push("/login");
        else loadSettings();
      });
  }, [router]);

  function loadSettings() {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setConfig((prev) => ({ ...prev, ...data }));
        setLoading(false);
      });
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    alert(lang === "ar" ? "تم الحفظ!" : "Settings saved!");
  }

  const ColorPair = ({ label, lightKey, darkKey }: { label: string, lightKey: keyof typeof config, darkKey: keyof typeof config }) => (
    <div className="field" style={{ marginBottom: 16 }}>
      <label>{label}</label>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>Light Mode</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="color" value={config[lightKey] as string} onChange={(e) => setConfig({ ...config, [lightKey]: e.target.value })} style={{ width: 40, height: 36, padding: 0, border: "none", background: "none" }} />
            <input type="text" value={config[lightKey] as string} onChange={(e) => setConfig({ ...config, [lightKey]: e.target.value })} style={{ flex: 1 }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>Dark Mode</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="color" value={config[darkKey] as string} onChange={(e) => setConfig({ ...config, [darkKey]: e.target.value })} style={{ width: 40, height: 36, padding: 0, border: "none", background: "none" }} />
            <input type="text" value={config[darkKey] as string} onChange={(e) => setConfig({ ...config, [darkKey]: e.target.value })} style={{ flex: 1 }} />
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="container" style={{ padding: 40 }}>Loading...</div>;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 650 }}>
      <div className="page-head">
        <h1>{lang === "ar" ? "إعدادات العناوين" : "Title & Color Settings"}</h1>
      </div>
      
      <div className="form-card">
        {/* Text Customization */}
        <div className="field" style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            "Today" Title Text
          </label>
          <input 
            type="text" 
            value={config.today_text} 
            onChange={(e) => setConfig({ ...config, today_text: e.target.value })} 
            placeholder="e.g. Hicham's Main Dish of the day"
            style={{ width: "100%", padding: "10px", marginTop: 8 }}
          />
        </div>

        <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

        <ColorPair label="Main Title Color (?today)" lightKey="today_color_light" darkKey="today_color_dark" />
        <ColorPair label="Recipe Name Color (under ?today)" lightKey="recipe_name_color_light" darkKey="recipe_name_color_dark" />

        <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

        <ColorPair label="Inbox Preview: Main Title Color" lightKey="inbox_title_color_light" darkKey="inbox_title_color_dark" />
        <ColorPair label="Inbox Preview: Recipe Name Color" lightKey="inbox_recipe_color_light" darkKey="inbox_recipe_color_dark" />

        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: "100%", marginTop: 16 }}>
          {saving ? "Saving..." : (lang === "ar" ? "حفظ التغييرات" : "Save Changes")}
        </button>
      </div>
    </main>
  );
}
