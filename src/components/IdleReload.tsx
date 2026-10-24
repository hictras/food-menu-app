"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function IdleReload() {
  const pathname = usePathname();

  useEffect(() => {
    // This runs every time the page changes (even via soft navigation)
    const trackPage = async () => {
      const visitorId = localStorage.getItem("visitor_id");
      if (visitorId && pathname) {
        try {
          // Get the phone from cookie if available
          const match = document.cookie.match(/viewer_phone=([^;]+)/);
          const phone = match ? decodeURIComponent(match[1]) : null;

          await fetch("/api/visitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              id: visitorId, 
              phone: phone,
              lastPage: pathname 
            }),
          });
        } catch (e) {
          // Ignore errors
        }
      }
    };
    
    // Call it when the page changes
    trackPage();
  }, [pathname]);

  // Keep the idle reload timer
  useEffect(() => {
    const TIMEOUT_MS = 15 * 60 * 1000;
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        window.location.reload();
      }, TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    resetTimer();
    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return null;
}
