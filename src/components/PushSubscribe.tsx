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
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  async function subscribe() {
    setBusy(true);
    setMsg("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg(lang === "ar" ? "تم رفض الإذن" : "Permission denied");
        setBusy(false);
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      setSubscribed(true);
      setMsg(lang === "ar" ? "تم التفعيل!" : "Subscribed!");
    } catch (err) {
      console.error(err);
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    setMsg("");
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
      setMsg(lang === "ar" ? "تم الإيقاف" : "Unsubscribed");
    } catch (err) {
      console.error(err);
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        type="button"
        className={subscribed ? "btn btn-ghost" : "btn btn-primary"}
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={busy}
        title={subscribed ? "Click to disable" : "Click to enable"}
      >
        {busy
          ? "…"
          : subscribed
          ? lang === "ar"
            ? "🔕 إيقاف الإشعارات"
            : "🔕 Disable notifications"
          : lang === "ar"
          ? "🔔 تفعيل الإشعارات"
          : "🔔 Enable notifications"}
      </button>
      {msg && (
        <span className="helper" style={{ fontSize: 12 }}>
          {msg}
        </span>
      )}
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
