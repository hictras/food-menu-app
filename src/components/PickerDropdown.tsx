"use client";

import { useEffect, useRef, useState } from "react";
import { PickerItem } from "@/lib/pickers";
import { useLang } from "./LanguageProvider";

type Props = {
  items: PickerItem[];
  onPick: (en: string, ar: string) => void;
  align?: "left" | "right";
  title?: string;
};

export default function PickerDropdown({ items, onPick, align = "right", title }: Props) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const filtered = query.trim()
    ? items.filter((i) =>
        (i.label + " " + i.value + " " + i.valueAr).toLowerCase().includes(query.toLowerCase())
      )
    : items;

  const grouped: Record<string, PickerItem[]> = {};
  for (const item of filtered) {
    const g = item.group || "";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(item);
  }

  return (
    <div className="picker-wrap" ref={ref}>
      <button
        type="button"
        className="picker-btn"
        onClick={() => setOpen((v) => !v)}
        title={title || (lang === "ar" ? "اختر من القائمة" : "Pick from list")}
        aria-label="Open picker"
      >
        ▾
      </button>

      {open && (
        <div
          className="picker-menu"
          style={{
            [align === "right" ? "right" : "left"]: 0,
          } as React.CSSProperties}
        >
          {items.length > 8 && (
            <input
              className="picker-search"
              placeholder={lang === "ar" ? "ابحث..." : "Search..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          )}

          <div className="picker-list">
            {Object.entries(grouped).map(([group, list]) => (
              <div key={group}>
                {group && <div className="picker-group">{group}</div>}
                {list.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className="picker-item"
                    onClick={() => {
                      onPick(item.value, item.valueAr);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="picker-icon">{item.icon}</span>
                    <span className="picker-label">
                      {lang === "ar" ? item.valueAr : item.label}
                    </span>
                    {item.group && <span className="picker-hint">{item.label}</span>}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="picker-empty">
                {lang === "ar" ? "لا نتائج" : "No results"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
