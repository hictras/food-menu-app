"use client";

import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";

export default function PushSubscribe() {
  const { lang } = useLang();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub));
      });
    }
  }, []);

  async function subscribe() {
    setMsg("");
    
    // 1. ASK FOR PHONE NUMBER FIRST
    const phoneNumber = window.prompt(
      lang === "ar" 
        ? "أدخل رقم هاتفك (مثال: 96170123456)" 
        : "Enter your phone number (e.g. 96170123456)"
    );

    // If they click Cancel or leave it empty, stop.
    if (!phoneNumber || !phoneNumber.trim()) {
      setMsg(lang === "ar" ? "رقم الهاتف مطلوب" : "Phone number is required");
      return;
    }

    // 2. THEN ASK FOR PERMISSION
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg("Permission denied");
        setBusy(false);
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub, phoneNumber }),
      });

      if (!res.ok) {
        throw new Error("Server rejected the subscription");
      }

      setSubscribed(true);
      setMsg("Subscribed successfully!");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Unsubscribed");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  if (subscribed) {
    return (
      <button type="button" className="btn btn-ghost" onClick={unsubscribe} disabled={busy}>
        🔕 {lang === "ar" ? "إيقاف" : "Disable"}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button type="button" className="btn btn-ghost" onClick={subscribe} disabled={busy}>
        🔔 {lang === "ar" ? "تفعيل" : "Enable"}
      </button>
      {msg && <span style={{ fontSize: 11, color: "var(--accent)" }}>{msg}</span>}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
