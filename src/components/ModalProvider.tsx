"use client";

import { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import { useLang } from "./LanguageProvider";
import { ar } from "@/lib/ar";

type Tone = "error" | "success" | "info" | "confirm";

type ModalState = 
  | { type: "show"; title?: string; message: string; tone: Tone }
  | { type: "confirm"; title?: string; message: string; resolve: (val: boolean) => void }
  | { type: "prompt"; title?: string; message: string; placeholder?: string; resolve: (val: string | null) => void }
  | null;

type ModalContextType = {
  show: (opts: { title?: string; message: string; tone?: Tone }) => void;
  confirm: (opts: { title?: string; message: string }) => Promise<boolean>;
  prompt: (opts: { title?: string; message: string; placeholder?: string }) => Promise<string | null>;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [modal, setModal] = useState<ModalState>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modal?.type === "prompt") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [modal]);

  function show(opts: { title?: string; message: string; tone?: Tone }) {
    setModal({ type: "show", title: opts.title, message: opts.message, tone: opts.tone || "info" });
  }

  function confirm(opts: { title?: string; message: string }): Promise<boolean> {
    return new Promise((resolve) => {
      setModal({ type: "confirm", title: opts.title, message: opts.message, resolve });
    });
  }

  function prompt(opts: { title?: string; message: string; placeholder?: string }): Promise<string | null> {
    return new Promise((resolve) => {
      setInputValue("");
      setModal({ type: "prompt", title: opts.title, message: opts.message, placeholder: opts.placeholder, resolve });
    });
  }

  function handleClose(result?: boolean | string | null) {
    if (!modal) return;
    if (modal.type === "confirm") {
      modal.resolve(result === true);
    } else if (modal.type === "prompt") {
      modal.resolve(typeof result === "string" ? result : null);
    }
    setModal(null);
  }

  const toneIcon = 
    modal?.type === "show" && modal.tone === "error" ? "⚠️" :
    modal?.type === "show" && modal.tone === "success" ? "✅" :
    modal?.type === "confirm" ? "❓" :
    modal?.type === "prompt" ? "✏️" : "ℹ️";

  const toneColor = 
    modal?.type === "show" && modal.tone === "error" ? "var(--accent)" :
    modal?.type === "show" && modal.tone === "success" ? "var(--olive)" :
    "var(--ink)";

  const defaultTitle = 
    modal?.type === "confirm" ? (isAr ? ar.modal.confirmTitle : "Confirm") :
    modal?.type === "prompt" ? (isAr ? ar.modal.promptTitle : "Input") :
    modal?.type === "show" && modal.tone === "error" ? (isAr ? ar.modal.errorTitle : "Error") :
    modal?.type === "show" && modal.tone === "success" ? (isAr ? ar.modal.successTitle : "Success") :
    (isAr ? ar.modal.infoTitle : "Info");

  return (
    <ModalContext.Provider value={{ show, confirm, prompt }}>
      {children}
      
      {modal && (
        <div
          onClick={() => handleClose(modal.type === "prompt" ? null : false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            zIndex: 99999, direction: isAr ? "rtl" : "ltr",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface-solid)", border: "1px solid var(--line-strong)",
              borderRadius: 14, padding: 24, maxWidth: 400, width: "100%",
              boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", gap: 16
            }}
          >
            <div style={{ textAlign: "center", fontSize: 40, marginBottom: -8 }}>
              {toneIcon}
            </div>
            
            <div style={{ textAlign: "center" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "var(--ink)", fontWeight: 600 }}>
                {modal.title || defaultTitle}
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: toneColor }}>
                {modal.message}
              </p>
            </div>

            {modal.type === "prompt" && (
              <input
                ref={inputRef}
                type="text"
                className="preset-input"
                placeholder={modal.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && inputValue.trim()) handleClose(inputValue.trim()); }}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)" }}
              />
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {modal.type === "confirm" ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => handleClose(false)} style={{ flex: 1, padding: 12 }}>
                    {isAr ? ar.modal.no : "No"}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => handleClose(true)} style={{ flex: 1, padding: 12 }}>
                    {isAr ? ar.modal.yes : "Yes"}
                  </button>
                </>
              ) : modal.type === "prompt" ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => handleClose(null)} style={{ flex: 1, padding: 12 }}>
                    {isAr ? ar.modal.cancel : "Cancel"}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => handleClose(inputValue.trim())} disabled={!inputValue.trim()} style={{ flex: 1, padding: 12 }}>
                    {isAr ? ar.modal.submit : "Submit"}
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => handleClose(false)} style={{ width: "100%", padding: 12 }}>
                  {isAr ? ar.modal.ok : "OK"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
