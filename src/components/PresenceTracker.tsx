"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PresenceTracker() {
  const pathname = usePathname();
  useEffect(() => {
    fetch("/api/user-activity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname }),
    }).catch(() => {});
  }, [pathname]);
  return null;
}
