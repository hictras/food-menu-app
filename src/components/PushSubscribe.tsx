"use client";

import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";
import { ar } from "@/lib/ar";
import { useModal } from "./ModalProvider";

export default function PushSubscribe() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { show, confirm, prompt } = useModal();
  
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub));
      });
    }
  }, []);

  async function subscribe() {
    setBusy(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        show({
          message: isAr ? ar.push.permissionDenied : "Permission denied",
          tone: "danger",
        });
        setBusy(false);
        return;
      }

      const phoneNumber = await prompt({
        message: isAr ? ar.push.enterPhone : "Enter your phone number (e.g. 96170123456)",
        placeholder: "96170123456"
      });

      if (!phoneNumber || !phoneNumber.trim()) {
        show({
          message: isAr ? ar.push.phoneRequired : "Phone number is required",
          tone: "danger",
        });
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
        body: JSON.stringify({ subscription: sub, phoneNumber, visitorId: localStorage.getItem("visitor_id") }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          show({
            message: isAr ? ar.push.phoneTaken : (data.error || "Phone already registered"),
            tone: "danger",
          });
          try { await sub.unsubscribe(); } catch {}
          setBusy(false);
          return;
        }
        show({
          message: isAr ? ar.push.error : (data.error || "Server rejected the subscription"),
          tone: "danger",
        });
        setBusy(false);
        return;
      }

      localStorage.setItem("viewer_phone", phoneNumber.trim());
      setSubscribed(true);
      show({
        message: isAr ? ar.push.subscribed : "Subscribed successfully!",
        tone: "info",
      });
    } catch (err) {
      show({
        message: isAr ? ar.push.error : (err instanceof Error ? err.message : "Error"),
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    const ok = await confirm({
      message: isAr ? ar.push.unsubscribeConfirm : "Disable notifications? You won't receive any updates.",
      confirmText: isAr ? "إيقاف" : "Disable",
      tone: "danger"
    });
    if (!ok) return;

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
      localStorage.removeItem("viewer_phone");
      setSubscribed(false);
      show({
        message: isAr ? ar.push.unsubscribed : "Unsubscribed",
        tone: "info",
      });
    } catch (err) {
      show({
        message: isAr ? ar.push.error : (err instanceof Error ? err.message : "Error"),
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return subscribed ? (
    <button type="button" className="btn btn-ghost" onClick={unsubscribe} disabled={busy}>
      🔕
    </button>
  ) : (
    <button type="button" className="btn btn-ghost" onClick={subscribe} disabled={busy}>
      🔔
    </button>
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
