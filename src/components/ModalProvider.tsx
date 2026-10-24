"use client";

import { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import { useLang } from "./LanguageProvider";
import { ar } from "@/lib/ar";

type Tone = "info" | "danger";

type ModalState = 
  | { type: "show"; title?: string; message: string; tone: Tone }
  | { type: "confirm"; title?: string; message: string; confirmText?: string; tone: Tone; resolve: (val: boolean) => void }
  | { type: "prompt"; title?: string; message: string; placeholder?: string; confirmText?: string; resolve: (val: string | null) => void }
  | null;

type ModalContextType = {
  show: (opts: { title?: string; message: string; tone?: Tone }) => void;
  confirm: (opts: { title?: string; message: string; confirmText?: string; tone?: Tone }) => Promise<boolean>;
  prompt: (opts: { title?: string; message: string; placeholder?: string; confirmText?: string }) => Promise<string | null>;
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

  function confirm(opts: { title?: string; message: string; confirmText?: string; tone?: Tone }): Promise<boolean> {
    return new Promise((resolve) => {
      setModal({ 
        type: "confirm", 
        title: opts.title, 
        message: opts.message, 
        confirmText: opts.confirmText, 
        tone: opts.tone || "info", 
        resolve 
      });
    });
  }

  function prompt(opts: { title?: string; message: string; placeholder?: string; confirmText?: string }): Promise<string | null> {
    return new Promise((resolve) => {
      setInputValue("");
      setModal({ 
        type: "prompt", 
        title: opts.title, 
        message: opts.message, 
        placeholder: opts.placeholder, 
        confirmText: opts.confirmText, 
        resolve 
      });
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

  const defaultTitle = 
    modal?.type === "confirm" ? (isAr ? ar.modal.confirmTitle : "Confirm") :
    modal?.type === "prompt" ? (isAr ? ar.modal.promptTitle : "Input") :
    modal?.type === "show" && modal.tone === "danger" ? (isAr ? ar.modal.errorTitle : "Error") :
    (isAr ? ar.modal.infoTitle : "Info");

  return (
    <ModalContext.Provider value={{ show, confirm, prompt }}>
      {children}
      
      {modal && (
        <div
          onClick={() => handleClose(modal.type === "prompt" ? null : false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            zIndex: 99999, direction: isAr ? "rtl" : "ltr",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface-solid)", 
              border: "1px solid var(--line-strong)",
              borderRadius: 14, 
              padding: 24, 
              maxWidth: 400, 
              width: "100%",
              boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.7)", 
              display: "flex", 
              flexDirection: "column", 
              gap: 20,
              animation: "modalPopIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              textAlign: "start"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>
                {modal.title || defaultTitle}
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--ink-soft)" }}>
                {modal.message}
              </p>
            </div>

            {modal.type === "prompt" && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={modal.placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && inputValue.trim()) handleClose(inputValue.trim()); }}
                  style={{ 
                    width: "100%", 
                    padding: "10px 14px", 
                    borderRadius: 8, 
                    border: "1px solid var(--line)", 
                    background: "rgba(0,0,0,0.2)", 
                    color: "var(--ink)", 
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              {modal.type === "confirm" ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => handleClose(false)} style={{ flex: 1, padding: 12 }}>
                    {isAr ? ar.modal.no : "Cancel"}
                  </button>
                  <button 
                    type="button" 
                    className={modal.tone === "danger" ? "btn btn-danger" : "btn btn-primary"} 
                    onClick={() => handleClose(true)} 
                    style={{ flex: 1, padding: 12 }}
                  >
                    {modal.confirmText || (isAr ? ar.modal.yes : "Confirm")}
                  </button>
                </>
              ) : modal.type === "prompt" ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => handleClose(null)} style={{ flex: 1, padding: 12 }}>
                    {isAr ? ar.modal.cancel : "Cancel"}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => handleClose(inputValue.trim())} disabled={!inputValue.trim()} style={{ flex: 1, padding: 12 }}>
                    {modal.confirmText || (isAr ? ar.modal.submit : "Submit")}
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
