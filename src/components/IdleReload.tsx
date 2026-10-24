"use client";

import { useEffect, useRef } from "react";

export default function IdleReload() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 15 minutes in milliseconds
    const TIMEOUT_MS = 15 * 60 * 1000;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Reload the page silently
        window.location.reload();
      }, TIMEOUT_MS);
    };

    // Events that indicate the user is active
    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];

    // Start the timer initially
    resetTimer();

    // Add listeners to reset the timer whenever the user interacts
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Clean up when the component unmounts
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return null;
}
