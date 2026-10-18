"use client";

import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";

export default function PushSubscribe() {
  const { lang } = useLang();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [deviceName, setDeviceName] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub));
      });
    }
  }, []);

  async function subscribe() {
    if (!deviceName.trim()) {
      setMsg("Please enter a name for your device first.");
      return;
    }

    setBusy(true);
    setMsg("");
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

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub, deviceName }),
      });

      setSubscribed(true);
      setMsg("Subscribed!");
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
        🔕 Disable
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input 
        type="text" 
        placeholder="Your name (e.g. Hicham)" 
        value={deviceName}
        onChange={(e) => setDeviceName(e.target.value)}
        style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 12, background: "var(--input-bg)", color: "var(--ink)" }}
      />
      <button type="button" className="btn btn-ghost" onClick={subscribe} disabled={busy}>
        🔔 Enable
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
