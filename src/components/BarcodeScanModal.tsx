"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string, format: string) => void;
  isAr?: boolean;
};

export default function BarcodeScanModal({ isOpen, onClose, onDetected, isAr = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState("Point the camera at the barcode…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function start() {
      setError("");
      setStatus("Starting camera…");
      try {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
          BarcodeFormat.ITF, BarcodeFormat.CODABAR,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            if (cancelled || !result) return;
            const code = result.getText();
            const format = BarcodeFormat[result.getBarcodeFormat()];
            if (navigator.vibrate) navigator.vibrate(80);
            onDetected(code, format);
            onClose();
          }
        );
        controlsRef.current = controls;
        if (!cancelled) setStatus("Scanning…");
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Camera error");
          setStatus("Could not start camera.");
        }
      }
    }
    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [isOpen, onDetected, onClose]);

  if (!isOpen) return null;

  return (
    <div onClick={onClose} role="dialog" aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "#101827", color: "#e8edf5", border: "1px solid #2c3b50", borderRadius: 14, maxWidth: 500, width: "100%", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #2c3b50", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16, color: "#fff" }}>{isAr ? "مسح الباركود" : "Scan Barcode"}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ position: "relative", background: "#000", borderRadius: 10, overflow: "hidden", aspectRatio: "4 / 3" }}>
            <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted playsInline />
            <div style={{ position: "absolute", left: "10%", right: "10%", top: "42%", height: 2, background: "#ef4444", boxShadow: "0 0 12px #ef4444" }} />
            <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(239,68,68,0.35)", borderRadius: 10, pointerEvents: "none" }} />
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "12px 0 0", textAlign: "center" }}>{status}</p>
          {error && <p style={{ fontSize: 12, color: "#fca5a5", margin: "8px 0 0", textAlign: "center" }}>⚠️ {error}</p>}
        </div>
      </div>
    </div>
  );
}
