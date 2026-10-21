"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import ImageUpload from "@/components/ImageUpload";
import VideoUpload from "@/components/VideoUpload";

type Settings = {
  today_text: string;
  today_color_light: string;
  today_color_dark: string;
  recipe_name_color_light: string;
  recipe_name_color_dark: string;
  inbox_title_color_light: string;
  inbox_title_color_dark: string;
  inbox_recipe_color_light: string;
  inbox_recipe_color_dark: string;
  logo_url: string;
  favicon_url: string;
  background_url: string;
  welcome_title: string;
  welcome_button: string;
  no_dish_image_url: string;
  no_dish_video_url: string;
  title_size: string;
  title_color_light: string;
  title_color_dark: string;
  label_size: string;
  label_color_light: string;
  label_color_dark: string;
};

const DEFAULT: Settings = {
  today_text: "Hicham's Main Dish of the day",
  today_color_light: "#e2543a",
  today_color_dark: "#ff6b4a",
  recipe_name_color_light: "#52525b",
  recipe_name_color_dark: "#a1a1aa",
  inbox_title_color_light: "#e2543a",
  inbox_title_color_dark: "#ff6b4a",
  inbox_recipe_color_light: "#52525b",
  inbox_recipe_color_dark: "#a1a1aa",
  logo_url: "",
  favicon_url: "",
  background_url: "",
  welcome_title: "Hictra Recipes",
  welcome_button: "Enter",
  no_dish_image_url: "",
  no_dish_video_url: "",
  title_size: "40",
  title_color_light: "#17171a",
  title_color_dark: "#ededed",
  label_size: "11",
  label_color_light: "#71717a",
  label_color_dark: "#a1a1aa",
};

export default function SettingsPage() {
  const { lang } = useLang();
  const router = useRouter();
  const [config, setConfig] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.admin) router.push("/login");
        else load();
      });
  }, [router]);

  function load() {
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

  const ColorPair = ({ label, lightKey, darkKey }: { label: string; lightKey: keyof Settings; darkKey: keyof Settings }) => (
    <div className="field" style={{ marginBottom: 16 }}>
      <label>{label}</label>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>Light</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="color" value={config[lightKey]} onChange={(e) => setConfig({ ...config, [lightKey]: e.target.value })} style={{ width: 40, height: 36, padding: 0, border: "none", background: "none" }} />
            <input type="text" value={config[lightKey]} onChange={(e) => setConfig({ ...config, [lightKey]: e.target.value })} style={{ flex: 1 }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>Dark</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="color" value={config[darkKey]} onChange={(e) => setConfig({ ...config, [darkKey]: e.target.value })} style={{ width: 40, height: 36, padding: 0, border: "none", background: "none" }} />
            <input type="text" value={config[darkKey]} onChange={(e) => setConfig({ ...config, [darkKey]: e.target.value })} style={{ flex: 1 }} />
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="container" style={{ padding: 40 }}>Loading...</div>;

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 650 }}>
      <div className="page-head">
        <h1>{lang === "ar" ? "الإعدادات" : "Settings"}</h1>
      </div>

      <div className="form-card">
        <div className="form-section">
          <h2>{lang === "ar" ? "الهوية" : "Branding"}</h2>

          <div className="field">
            <label>{lang === "ar" ? "الشعار" : "Logo"}</label>
            <ImageUpload
              onUploaded={(url) => setConfig({ ...config, logo_url: url })}
              initialUrl={config.logo_url || undefined}
            />
          </div>

          <div className="field">
            <label>{lang === "ar" ? "أيقونة التبويب (favicon)" : "Favicon (tab icon)"}</label>
            <ImageUpload
              onUploaded={(url) => setConfig({ ...config, favicon_url: url })}
              initialUrl={config.favicon_url || undefined}
            />
            <p className="helper" style={{ marginTop: 6 }}>
              {lang === "ar"
                ? "أيقونة مربعة صغيرة (64x64 أو 128x128). تظهر في علامة التبويب."
                : "Small square icon (64x64 or 128x128). Appears in the browser tab."}
            </p>
          </div>

          <div className="field">
            <label>{lang === "ar" ? "صورة الخلفية" : "Background image"}</label>
            <ImageUpload
              onUploaded={(url) => setConfig({ ...config, background_url: url })}
              initialUrl={config.background_url || undefined}
            />
          </div>

          <div className="field">
            <label>{lang === "ar" ? "نص الترحيب" : "Welcome title"}</label>
            <input
              type="text"
              value={config.welcome_title}
              onChange={(e) => setConfig({ ...config, welcome_title: e.target.value })}
              placeholder="Hictra Recipes"
              style={{ width: "100%", padding: 10 }}
            />
          </div>

          <div className="field">
            <label>{lang === "ar" ? "نص زر الدخول" : "Enter button text"}</label>
            <input
              type="text"
              value={config.welcome_button}
              onChange={(e) => setConfig({ ...config, welcome_button: e.target.value })}
              placeholder="Enter"
              style={{ width: "100%", padding: 10 }}
            />
          </div>

          <div className="field">
            <label>No dish today image</label>
            <ImageUpload
              onUploaded={(url) => setConfig({ ...config, no_dish_image_url: url })}
              initialUrl={config.no_dish_image_url || undefined}
            />
            <p className="helper" style={{ marginTop: 6 }}>
              Shown on the /no-dish-today page and in link previews.
            </p>
          </div>

          <div className="field">
            <label>No dish today video</label>
            <VideoUpload
              onUploaded={(url) => setConfig({ ...config, no_dish_video_url: url })}
              initialUrl={config.no_dish_video_url || undefined}
            />
            <p className="helper" style={{ marginTop: 6 }}>
              Optional. Shown on the /no-dish-today page below the image.
            </p>
          </div>
        </div>

        <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

        <div className="form-section">
          <h2>Page Titles</h2>

          <div className="field">
            <label>Title font size (px)</label>
            <input
              type="number"
              min="24"
              max="96"
              value={config.title_size}
              onChange={(e) => setConfig({ ...config, title_size: e.target.value })}
              style={{ width: "100%", padding: 10 }}
            />
            <p className="helper">Used for page headings across the app (e.g. 40px).</p>
          </div>

        <div className="form-section">
          <h2>Labels Style</h2>
          <p className="helper" style={{ marginBottom: 16 }}>
            Customize the look of form labels and section headings across the app.
          </p>

          <div className="field">
            <label>Label font size (px)</label>
            <input
              type="number"
              min="8"
              max="24"
              value={config.label_size}
              onChange={(e) => setConfig({ ...config, label_size: e.target.value })}
              style={{ width: "100%", padding: 10 }}
            />
            <p className="helper">Default: 11px</p>
          </div>

          <div className="field">
            <label>Label color</label>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>Light</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="color" value={config.label_color_light} onChange={(e) => setConfig({ ...config, label_color_light: e.target.value })} style={{ width: 40, height: 36, padding: 0, border: "none", background: "none" }} />
                  <input type="text" value={config.label_color_light} onChange={(e) => setConfig({ ...config, label_color_light: e.target.value })} style={{ flex: 1 }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>Dark</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="color" value={config.label_color_dark} onChange={(e) => setConfig({ ...config, label_color_dark: e.target.value })} style={{ width: 40, height: 36, padding: 0, border: "none", background: "none" }} />
                  <input type="text" value={config.label_color_dark} onChange={(e) => setConfig({ ...config, label_color_dark: e.target.value })} style={{ flex: 1 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

          <div className="field">
            <label>Title color</label>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>Light</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="color" value={config.title_color_light} onChange={(e) => setConfig({ ...config, title_color_light: e.target.value })} style={{ width: 40, height: 36, padding: 0, border: "none", background: "none" }} />
                  <input type="text" value={config.title_color_light} onChange={(e) => setConfig({ ...config, title_color_light: e.target.value })} style={{ flex: 1 }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>Dark</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="color" value={config.title_color_dark} onChange={(e) => setConfig({ ...config, title_color_dark: e.target.value })} style={{ width: 40, height: 36, padding: 0, border: "none", background: "none" }} />
                  <input type="text" value={config.title_color_dark} onChange={(e) => setConfig({ ...config, title_color_dark: e.target.value })} style={{ flex: 1 }} />
                </div>
              </div>
            </div>
          </div>
        </div>



        <div className="field" style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            {lang === "ar" ? "نص عنوان اليوم" : '"Today" title text'}
          </label>
          <input
            type="text"
            value={config.today_text}
            onChange={(e) => setConfig({ ...config, today_text: e.target.value })}
            style={{ width: "100%", padding: 10, marginTop: 8 }}
          />
        </div>

        <ColorPair label="Main Title Color (?today)" lightKey="today_color_light" darkKey="today_color_dark" />
        <ColorPair label="Recipe Name Color (under ?today)" lightKey="recipe_name_color_light" darkKey="recipe_name_color_dark" />

        <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

        <ColorPair label="Inbox Preview: Main Title" lightKey="inbox_title_color_light" darkKey="inbox_title_color_dark" />
        <ColorPair label="Inbox Preview: Recipe Name" lightKey="inbox_recipe_color_light" darkKey="inbox_recipe_color_dark" />

        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: "100%", marginTop: 16 }}>
          {saving ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ التغييرات" : "Save Changes")}
        </button>
      </div>
    </main>
  );
}
