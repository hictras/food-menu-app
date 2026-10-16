"use client";

import { useState } from "react";
import { CUISINES, UNITS, PREPARATIONS, PickerItem } from "@/lib/pickers";

type Kind = "cuisine" | "unit" | "prep";

type Props = {
  kind: Kind;
  value: string;         // current value in the source field
  sourceIsAr?: boolean;  // if true, we're translating AR -> EN
  onTranslated: (result: string) => void;
  title?: string;
};

function findList(kind: Kind): PickerItem[] {
  if (kind === "cuisine") return CUISINES;
  if (kind === "unit") return UNITS;
  return PREPARATIONS;
}

export default function AutoTranslate({ kind, value, sourceIsAr, onTranslated, title }: Props) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function translate() {
    const trimmed = value.trim();
    if (!trimmed) return;

    setBusy(true);
    const list = findList(kind);

    // Match against EN value, AR value, or label (case-insensitive)
    const found = list.find((item) => {
      const targets = sourceIsAr
        ? [item.valueAr, item.value, item.label]
        : [item.value, item.label, item.valueAr];
      return targets.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    });

    if (found) {
      const result = sourceIsAr ? found.value : found.valueAr;
      onTranslated(result);
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    } else {
      // No exact match — try partial startsWith
      const partial = list.find((item) => {
        const target = sourceIsAr ? item.valueAr : item.value;
        return target.toLowerCase().startsWith(trimmed.toLowerCase());
      });
      if (partial) {
        const result = sourceIsAr ? partial.value : partial.valueAr;
        onTranslated(result);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      className={`auto-translate-btn${done ? " done" : ""}`}
      onClick={translate}
      disabled={busy || !value.trim()}
      title={title || "Auto-translate"}
      aria-label="Auto-translate"
    >
      {done ? "✓" : "⇄"}
    </button>
  );
}
