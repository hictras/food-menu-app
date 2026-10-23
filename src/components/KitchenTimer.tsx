"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LanguageProvider";
import { ar } from "@/lib/ar";

type Props = {
  seconds: number;
  brief: string;
  onClose: () => void;
  onNextStep?: () => void;
};

export default function KitchenTimer({ seconds, brief, onClose, onNextStep }: Props) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  
  const [remaining, setRemaining] = useState(seconds);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            if (audioRef.current) {
              audioRef.current.loop = true;
              audioRef.current.play().catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remaining]);

  function stopAlarm() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
    }
  }

  function handleClose() {
    stopAlarm();
    onClose();
  }

  function handleNext() {
    stopAlarm();
    onClose();
    if (onNextStep) onNextStep();
  }

  function togglePause() {
    if (remaining === 0) {
      setRemaining(seconds);
      setIsRunning(true);
      stopAlarm();
    } else {
      setIsRunning(!isRunning);
    }
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = 1 - remaining / seconds;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          {isAr ? ar.timer.for : "Timer for"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#fff" }}>
          {brief}
        </div>
      </div>

      <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 40 }}>
        <svg width="200" height="200" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
          <circle cx="100" cy="100" r="80" fill="none" stroke="#333" strokeWidth="8" />
          <circle cx="100" cy="100" r="80" fill="none" stroke={remaining === 0 ? "#3fb950" : "#ff6b4a"} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div style={{ fontSize: 48, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: remaining === 0 ? "#3fb950" : "#fff" }}>
          {mins}:{secs.toString().padStart(2, "0")}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        {remaining === 0 && onNextStep ? (
          <button onClick={handleNext} style={{ padding: "16px 32px", borderRadius: 12, border: "none", background: "#3fb950", color: "#fff", fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
            {isAr ? ar.timer.nextStep : "Next Step →"}
          </button>
        ) : (
          <button onClick={togglePause} style={{ padding: "16px 32px", borderRadius: 12, border: "none", background: remaining === 0 ? "#3fb950" : "#333", color: "#fff", fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
            {remaining === 0 ? (isAr ? ar.timer.reset : "Reset") : isRunning ? (isAr ? ar.timer.pause : "Pause") : (isAr ? ar.timer.resume : "Resume")}
          </button>
        )}
        <button onClick={handleClose} style={{ padding: "16px 32px", borderRadius: 12, border: "1px solid #333", background: "transparent", color: "#fff", fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
          {isAr ? ar.timer.close : "Close"}
        </button>
      </div>

      {remaining === 0 && (
        <p style={{ color: "#3fb950", fontSize: 20, fontWeight: 600, animation: "pulse 1s infinite" }}>
          {isAr ? ar.timer.timeIsUp : "⏰ Time's up!"}
        </p>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
