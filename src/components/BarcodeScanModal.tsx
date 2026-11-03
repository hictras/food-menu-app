"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  isAr?: boolean;
};

export default function BarcodeScanModal({ isOpen, onClose, onDetected, isAr = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState("Starting camera...");
  const [error, setError] = useState("");
  const hasDetectedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasDetectedRef.current = false;
      return;
    }
    
    let cancelled = false;

    async function start() {
      setError("");
      setStatus("Starting camera...");
      try {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
        ]);
        
        const reader = new BrowserMultiFormatReader(hints);

        if (!videoRef.current) return;

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current,
          (result) => {
            if (cancelled || !result || hasDetectedRef.current) return;
            
            // Stop immediately on first successful scan to prevent duplicates
            hasDetectedRef.current = true;
            if (navigator.vibrate) navigator.vibrate(80);
            onDetected(result.getText());
            onClose();
          }
        );
        
        controlsRef.current = controls;
        if (!cancelled) setStatus("Point camera at barcode");
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Camera access denied");
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
    <div
      style={{
        position: "fixed", // 🔒 Locks modal to screen
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#101827",
          border: "1px solid #2c3b50",
          borderRadius: 16,
          maxWidth: 400,
          width: "100%",
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #2c3b50", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16, color: "#fff" }}>
            {isAr ? "مسح الباركود" : "Scan Barcode"}
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {/* Camera Area */}
        <div style={{ padding: 20 }}>
          <div style={{ 
            position: "relative", 
            background: "#000", 
            borderRadius: 12, 
            overflow: "hidden", 
            aspectRatio: "4/3",
            border: "2px solid #334155"
          }}>
            <video 
              ref={videoRef} 
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} 
              muted 
              playsInline 
            />
            {/* Red scan line visual */}
            <div style={{ position: "absolute", left: "10%", right: "10%", top: "50%", height: 2, background: "#ef4444", boxShadow: "0 0 10px #ef4444" }} />
          </div>

          <p style={{ textAlign: "center", color: error ? "#fca5a5" : "#94a3b8", fontSize: 13, marginTop: 16, marginBottom: 0 }}>
            {error ? `⚠️ ${error}` : status}
          </p>
        </div>
      </div>
    </div>
  );
}
