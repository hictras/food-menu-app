"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ar } from "@/lib/ar";
import { useLang } from "@/components/LanguageProvider";
import ImageUpload from "@/components/ImageUpload";
import VideoUpload from "@/components/VideoUpload";
import { useModal } from "@/components/ModalProvider";

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
  badge_location_color_light: string;
  badge_location_color_dark: string;
  badge_time_color_light: string;
  badge_time_color_dark: string;
  cook_title_size: string;
  cook_title_color_light: string;
  cook_title_color_dark: string;
  cook_instruction_size: string;
  cook_instruction_color_light: string;
  cook_instruction_color_dark: string;
  logo_url: string;
  favicon_url: string;
  background_url: string;
  app_name: string;
  welcome_title: string;
  welcome_button: string;
  welcome_image_url: string;
  welcome_image_position: string;
  welcome_image_size: string;
  welcome_show_image: string;
  welcome_image_align: string;
  welcome_image2_url: string;
  welcome_image2_position: string;
  welcome_image2_size: string;
  welcome_show_image2: string;
  welcome_image2_align: string;
  welcome_show_logo: string;
  no_dish_image_url: string;
  no_dish_video_url: string;
  title_size: string;
  title_color_light: string;
  title_color_dark: string;
  label_size: string;
  label_color_light: string;
  label_color_dark: string;
  page_title_icon: string;
  nav_image_url: string;
  nav_image_opacity: string;
  global_bg_url: string;      // NEW
  global_bg_opacity: string;  // NEW
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
  badge_location_color_light: "#e2543a",
  badge_location_color_dark: "#ff6b4a",
  badge_time_color_light: "#17171a",
  badge_time_color_dark: "#ededed",
  cook_title_size: "28",
  cook_title_color_light: "#FFD700",
  cook_title_color_dark: "#FFD700",
  cook_instruction_size: "32",
  cook_instruction_color_light: "#ededed",
  cook_instruction_color_dark: "#ededed",
  logo_url: "",
  favicon_url: "",
  background_url: "",
  app_name: "Menu",
  welcome_title: "Hictra Recipes",
  welcome_button: "Enter",
  welcome_image_url: "",
  welcome_image_position: "replace-title",
  welcome_image_size: "300",
  welcome_show_image: "1",
  welcome_image_align: "center",
  welcome_image2_url: "",
  welcome_image2_position: "below-title",
  welcome_image2_size: "300",
  welcome_show_image2: "1",
  welcome_image2_align: "center",
  welcome_show_logo: "1",
  no_dish_image_url: "",
  no_dish_video_url: "",
  title_size: "40",
  title_color_light: "#17171a",
  title_color_dark: "#ededed",
  label_size: "11",
  label_color_light: "#71717a",
  label_color_dark: "#a1a1aa",
  page_title_icon: "",
  nav_image_url: "",
  nav_image_opacity: "0.5",
  global_bg_url: "",
  global_bg_opacity: "0.1",
};

export default function SettingsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const router = useRouter();
  const { show } = useModal();
  
  const [config, setConfig] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"branding" | "typography" | "colors" | "noDish">("branding");

  useEffect(() => {
    fetch("/api/recipes").then(r => r.json()).then(d => setRecipes(Array.isArray(d) ? d : []));
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.admin) router.push("/login");
        else load();
      });
  }, [router]);

  function load() {
    fetch("/api/visitors").then(r => r.json()).then(d => setDevices(d.devices || []));
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setConfig((prev) => ({ ...prev, ...data }));
        setLoading(false);
      });
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    
    if (res.ok) {
      window.dispatchEvent(new CustomEvent("settings-updated"));
      show({ message: isAr ? ar.messages.settingsSaved : "Settings saved!", tone: "info" });
    } else {
      show({ message: isAr ? "Failed to save" : "Failed to save", tone: "danger" });
    }
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
        <h1>{isAr ? ar.settingsPage.title : "Settings"}</h1>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 20 }}>
        <button type="button" className={`btn ${activeTab === "branding" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("branding")}>
          {isAr ? ar.settingsPage.branding : "Branding"}
        </button>
        <button type="button" className={`btn ${activeTab === "typography" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("typography")}>
          {isAr ? ar.settingsPage.typography : "Typography"}
        </button>
        <button type="button" className={`btn ${activeTab === "colors" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("colors")}>
          {isAr ? ar.settingsPage.datesColors : "Dates & Colors"}
        </button>
        <button type="button" className={`btn ${activeTab === "noDish" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("noDish")}>
          {isAr ? ar.settingsPage.noDishTab : "No Dish Today"}
        </button>
      </div>

      <div className="form-card">
        
        {activeTab === "branding" && (
          <div>
            <div className="field"><label>{isAr ? ar.settingsPage.logo : "Logo"}</label><ImageUpload onUploaded={(url) => setConfig({ ...config, logo_url: url })} initialUrl={config.logo_url || undefined} /></div>
            <div className="field"><label>{isAr ? ar.settingsPage.favicon : "Favicon"}</label><ImageUpload onUploaded={(url) => setConfig({ ...config, favicon_url: url })} initialUrl={config.favicon_url || undefined} /></div>
            
            <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />
            
            <div className="field">
              <label>{isAr ? "خلفية جميع الصفحات" : "Global Page Background"}</label>
              <ImageUpload onUploaded={(url) => setConfig({ ...config, global_bg_url: url })} initialUrl={config.global_bg_url || undefined} />
              <p className="helper">{isAr ? "تظهر خلف كل محتوى الموقع" : "Appears behind all website content."}</p>
            </div>

            <div className="field">
              <label>{isAr ? "شفافية الخلفية (0.1 إلى 1)" : "Background Opacity (0.1 to 1)"}</label>
              <input type="number" step="0.1" min="0.1" max="1" value={config.global_bg_opacity} onChange={(e) => setConfig({ ...config, global_bg_opacity: e.target.value })} style={{ width: "100%", padding: 10 }} />
            </div>

            <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

            <div className="field">
              <label>{isAr ? "أيقونة عنوان الصفحة (ثيم)" : "Page Title Icon (Theme)"}</label>
              <ImageUpload onUploaded={(url) => setConfig({ ...config, page_title_icon: url })} initialUrl={config.page_title_icon || undefined} />
              <p className="helper">{isAr ? "تظهر بجانب عنوان كل صفحة (مثال: قرعة هالوين)" : "Appears next to every page title (e.g., Halloween pumpkin)."}</p>
            </div>

            <div className="field">
              <label>{isAr ? "صورة شريط التنقل" : "Navbar Image"}</label>
              <ImageUpload onUploaded={(url) => setConfig({ ...config, nav_image_url: url })} initialUrl={config.nav_image_url || undefined} />
              <p className="helper">{isAr ? "تظهر كخلفية شفافة في الشريط العلوي" : "Appears as a transparent background in the top nav."}</p>
            </div>

            <div className="field">
              <label>{isAr ? "شفافية صورة الشريط (0.1 إلى 1)" : "Navbar Image Opacity (0.1 to 1)"}</label>
              <input type="number" step="0.1" min="0.1" max="1" value={config.nav_image_opacity} onChange={(e) => setConfig({ ...config, nav_image_opacity: e.target.value })} style={{ width: "100%", padding: 10 }} />
            </div>

            <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

            <div className="field">
              <label>{isAr ? "خلفية صفحة الترحيب" : "Welcome Page Background"}</label>
              <ImageUpload onUploaded={(url) => setConfig({ ...config, background_url: url })} initialUrl={config.background_url || undefined} />
            </div>

            <div className="field"><label>{isAr ? ar.settingsPage.welcomeTitle : "Welcome title"}</label><input type="text" value={config.welcome_title} onChange={(e) => setConfig({ ...config, welcome_title: e.target.value })} style={{ width: "100%", padding: 10 }} /></div>
            <div className="field"><label>{isAr ? ar.settingsPage.welcomeButton : "Enter button text"}</label><input type="text" value={config.welcome_button} onChange={(e) => setConfig({ ...config, welcome_button: e.target.value })} style={{ width: "100%", padding: 10 }} /></div>
            
            <div className="field" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24, marginBottom: 24 }}>
              <input type="checkbox" id="welcome_show_logo" checked={config.welcome_show_logo === "1"} onChange={(e) => setConfig({ ...config, welcome_show_logo: e.target.checked ? "1" : "0" })} style={{ width: 20, height: 20, cursor: "pointer" }} />
              <label htmlFor="welcome_show_logo" style={{ marginBottom: 0, cursor: "pointer", fontSize: 14 }}>
                {isAr ? "إظهار الشعار في صفحة الترحيب" : "Show Main Logo on Welcome Page"}
              </label>
            </div>

            <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

            <h3 style={{ fontSize: 16, marginBottom: 12, color: "var(--ink)" }}>{isAr ? "الصورة 1" : "Welcome Image 1"}</h3>
            <div className="field">
              <label>{isAr ? "صورة الترحيب" : "Image"}</label>
              <ImageUpload onUploaded={(url) => setConfig({ ...config, welcome_image_url: url })} initialUrl={config.welcome_image_url || undefined} />
            </div>
            <div className="field" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, marginBottom: 16 }}>
              <input type="checkbox" id="welcome_show_image" checked={config.welcome_show_image === "1"} onChange={(e) => setConfig({ ...config, welcome_show_image: e.target.checked ? "1" : "0" })} style={{ width: 20, height: 20, cursor: "pointer" }} />
              <label htmlFor="welcome_show_image" style={{ marginBottom: 0, cursor: "pointer", fontSize: 14 }}>
                {isAr ? "إظهار الصورة 1" : "Show Image 1"}
              </label>
            </div>
            <div className="field">
              <label>{isAr ? "موضع الصورة 1" : "Image 1 Position"}</label>
              <select value={config.welcome_image_position} onChange={(e) => setConfig({ ...config, welcome_image_position: e.target.value })} style={{ width: "100%", padding: 10 }}>
                <option value="replace-title">{isAr ? "استبدال النص (بدلاً من العنوان)" : "Replace Title Text"}</option>
                <option value="above-title">{isAr ? "أعلى العنوان" : "Above Title"}</option>
                <option value="below-title">{isAr ? "أسفل العنوان" : "Below Title"}</option>
                <option value="below-button">{isAr ? "أسفل الزر" : "Below Button"}</option>
              </select>
            </div>
            <div className="field">
              <label>{isAr ? "محاذاة الصورة 1" : "Image 1 Alignment"}</label>
              <select value={config.welcome_image_align} onChange={(e) => setConfig({ ...config, welcome_image_align: e.target.value })} style={{ width: "100%", padding: 10 }}>
                <option value="left">{isAr ? "يسار" : "Left"}</option>
                <option value="center">{isAr ? "وسط" : "Center"}</option>
                <option value="right">{isAr ? "يمين" : "Right"}</option>
              </select>
            </div>
            <div className="field">
              <label>{isAr ? "حجم الصورة 1 (بكسل)" : "Image 1 Width (px)"}</label>
              <input type="number" min="100" max="800" value={config.welcome_image_size} onChange={(e) => setConfig({ ...config, welcome_image_size: e.target.value })} style={{ width: "100%", padding: 10 }} />
            </div>

            <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

            <h3 style={{ fontSize: 16, marginBottom: 12, color: "var(--ink)" }}>{isAr ? "الصورة 2" : "Welcome Image 2"}</h3>
            <div className="field">
              <label>{isAr ? "صورة الترحيب 2" : "Image 2"}</label>
              <ImageUpload onUploaded={(url) => setConfig({ ...config, welcome_image2_url: url })} initialUrl={config.welcome_image2_url || undefined} />
            </div>
            <div className="field" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, marginBottom: 16 }}>
              <input type="checkbox" id="welcome_show_image2" checked={config.welcome_show_image2 === "1"} onChange={(e) => setConfig({ ...config, welcome_show_image2: e.target.checked ? "1" : "0" })} style={{ width: 20, height: 20, cursor: "pointer" }} />
              <label htmlFor="welcome_show_image2" style={{ marginBottom: 0, cursor: "pointer", fontSize: 14 }}>
                {isAr ? "إظهار الصورة 2" : "Show Image 2"}
              </label>
            </div>
            <div className="field">
              <label>{isAr ? "موضع الصورة 2" : "Image 2 Position"}</label>
              <select value={config.welcome_image2_position} onChange={(e) => setConfig({ ...config, welcome_image2_position: e.target.value })} style={{ width: "100%", padding: 10 }}>
                <option value="replace-title">{isAr ? "استبدال النص (بدلاً من العنوان)" : "Replace Title Text"}</option>
                <option value="above-title">{isAr ? "أعلى العنوان" : "Above Title"}</option>
                <option value="below-title">{isAr ? "أسفل العنوان" : "Below Title"}</option>
                <option value="below-button">{isAr ? "أسفل الزر" : "Below Button"}</option>
              </select>
            </div>
            <div className="field">
              <label>{isAr ? "محاذاة الصورة 2" : "Image 2 Alignment"}</label>
              <select value={config.welcome_image2_align} onChange={(e) => setConfig({ ...config, welcome_image2_align: e.target.value })} style={{ width: "100%", padding: 10 }}>
                <option value="left">{isAr ? "يسار" : "Left"}</option>
                <option value="center">{isAr ? "وسط" : "Center"}</option>
                <option value="right">{isAr ? "يمين" : "Right"}</option>
              </select>
            </div>
            <div className="field">
              <label>{isAr ? "حجم الصورة 2 (بكسل)" : "Image 2 Width (px)"}</label>
              <input type="number" min="100" max="800" value={config.welcome_image2_size} onChange={(e) => setConfig({ ...config, welcome_image2_size: e.target.value })} style={{ width: "100%", padding: 10 }} />
            </div>

            <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

            <div className="field"><label>{isAr ? ar.settingsPage.appName : "App Name"}</label><input type="text" value={config.app_name || ""} onChange={(e) => setConfig({ ...config, app_name: e.target.value })} placeholder="e.g. Hictra Recipes" style={{ width: "100%", padding: 10 }} /><p className="helper" style={{ marginTop: 6 }}>{isAr ? ar.settingsPage.appNameHint : "Shows in browser tab and shared messages."}</p></div>
          </div>
        )}

        {activeTab === "typography" && (
          <div>
            <div className="form-section" style={{ marginTop: 0 }}>
              <h2>{isAr ? ar.settingsPage.pageTitles : "Page Titles"}</h2>
              <div className="field"><label>{isAr ? ar.settingsPage.titleSize : "Title font size (px)"}</label><input type="number" min="24" max="96" value={config.title_size} onChange={(e) => setConfig({ ...config, title_size: e.target.value })} style={{ width: "100%", padding: 10 }} /></div>
              <div className="field"><label>{isAr ? ar.settingsPage.titleColor : "Title color"}</label><div style={{ display: "flex", gap: 12 }}><div style={{ flex: 1 }}><span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>{isAr ? ar.settingsPage.light : "Light"}</span><input type="color" value={config.title_color_light} onChange={(e) => setConfig({ ...config, title_color_light: e.target.value })} style={{ width: "100%", height: 36 }} /></div><div style={{ flex: 1 }}><span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>{isAr ? ar.settingsPage.dark : "Dark"}</span><input type="color" value={config.title_color_dark} onChange={(e) => setConfig({ ...config, title_color_dark: e.target.value })} style={{ width: "100%", height: 36 }} /></div></div></div>
            </div>

            <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

            <div className="form-section" style={{ marginTop: 0 }}>
              <h2>{isAr ? ar.settingsPage.todayText : "Today Text"}</h2>
              <div className="field"><label>{isAr ? ar.settingsPage.todayText : '"Today" title text'}</label><input type="text" value={config.today_text} onChange={(e) => setConfig({ ...config, today_text: e.target.value })} style={{ width: "100%", padding: 10 }} /></div>
            </div>

            <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />

            <div className="form-section" style={{ marginTop: 0 }}>
              <h2>{isAr ? ar.settingsPage.labelsStyle : "Labels Style"}</h2>
              <div className="field"><label>{isAr ? ar.settingsPage.labelSize : "Label font size (px)"}</label><input type="number" min="8" max="24" value={config.label_size} onChange={(e) => setConfig({ ...config, label_size: e.target.value })} style={{ width: "100%", padding: 10 }} /></div>
              <div className="field"><label>{isAr ? ar.settingsPage.labelColor : "Label color"}</label><div style={{ display: "flex", gap: 12 }}><div style={{ flex: 1 }}><span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>{isAr ? ar.settingsPage.light : "Light"}</span><input type="color" value={config.label_color_light} onChange={(e) => setConfig({ ...config, label_color_light: e.target.value })} style={{ width: "100%", height: 36 }} /></div><div style={{ flex: 1 }}><span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 4 }}>{isAr ? ar.settingsPage.dark : "Dark"}</span><input type="color" value={config.label_color_dark} onChange={(e) => setConfig({ ...config, label_color_dark: e.target.value })} style={{ width: "100%", height: 36 }} /></div></div></div>
            </div>
          </div>
        )}

        {activeTab === "colors" && (
          <div>
            <ColorPair label={isAr ? ar.settingsPage.mainTitleColor : "Main Title Color (?today)"} lightKey="today_color_light" darkKey="today_color_dark" />
            <ColorPair label={isAr ? ar.settingsPage.recipeNameColor : "Recipe Name Color"} lightKey="recipe_name_color_light" darkKey="recipe_name_color_dark" />
            <hr style={{ borderColor: "var(--line)", margin: "16px 0" }} />
            <ColorPair label={isAr ? ar.settingsPage.inboxTitleColor : "Inbox: Main Title"} lightKey="inbox_title_color_light" darkKey="inbox_title_color_dark" />
            <ColorPair label={isAr ? ar.settingsPage.inboxRecipeColor : "Inbox: Recipe Name"} lightKey="inbox_recipe_color_light" darkKey="inbox_recipe_color_dark" />
            <hr style={{ borderColor: "var(--line)", margin: "16px 0" }} />
            <h3 style={{ fontSize: 14, marginBottom: 12, color: "var(--ink)" }}>{isAr ? "ألوان الشارات" : "Badge Colors"}</h3>
            <ColorPair label={isAr ? "لون الموقع" : "Location Badge Color"} lightKey="badge_location_color_light" darkKey="badge_location_color_dark" />
            <ColorPair label={isAr ? "لون الوقت" : "Time Badge Color"} lightKey="badge_time_color_light" darkKey="badge_time_color_dark" />
            
            <hr style={{ borderColor: "var(--line)", margin: "16px 0" }} />
            <h3 style={{ fontSize: 14, marginBottom: 12, color: "var(--ink)" }}>{isAr ? "وضع الطبخ (Cook Mode)" : "Cook Mode"}</h3>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>{isAr ? "حجم العنوان (بكسل)" : "Title Size (px)"}</label>
              <input type="number" min="16" max="72" value={config.cook_title_size} onChange={(e) => setConfig({ ...config, cook_title_size: e.target.value })} style={{ width: "100%", padding: 10 }} />
            </div>
            <ColorPair label={isAr ? "لون عنوان الطبخ" : "Cook Title Color"} lightKey="cook_title_color_light" darkKey="cook_title_color_dark" />

            <hr style={{ borderColor: "var(--line)", margin: "16px 0" }} />
            <div className="field" style={{ marginBottom: 16 }}>
              <label>{isAr ? "حجم نص الخطوات (بكسل)" : "Instruction Text Size (px)"}</label>
              <input type="number" min="16" max="72" value={config.cook_instruction_size || "32"} onChange={(e) => setConfig({ ...config, cook_instruction_size: e.target.value })} style={{ width: "100%", padding: 10 }} />
            </div>
            <ColorPair label={isAr ? "لون نص الخطوات" : "Instruction Text Color"} lightKey="cook_instruction_color_light" darkKey="cook_instruction_color_dark" />
          </div>
        )}

        {activeTab === "noDish" && (
          <div>
            <div className="field"><label>{isAr ? ar.settingsPage.noDishImage : "No dish today image"}</label><ImageUpload onUploaded={(url) => setConfig({ ...config, no_dish_image_url: url })} initialUrl={config.no_dish_image_url || undefined} /></div>
            <div className="field"><label>{isAr ? ar.settingsPage.noDishVideo : "No dish today video"}</label><VideoUpload onUploaded={(url) => setConfig({ ...config, no_dish_video_url: url })} initialUrl={config.no_dish_video_url || undefined} /></div>
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: "100%", padding: 12 }}>
            {saving ? (isAr ? ar.settingsPage.saving : "Saving...") : (isAr ? ar.settingsPage.save : "Save Changes")}
          </button>
        </div>
      </div>
    </main>
  );
}
