"use client";
import { useEffect, useState, useCallback, useRef } from "react";

export function useGameStats<T = Record<string, number>>(game: string, defaultStats: T) {
  const [stats, setStats] = useState<T>(defaultStats);
  const statsRef = useRef<T>(defaultStats);

  // Keep the ref in sync
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    fetch(`/api/game-stats?game=${game}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.stats && Object.keys(d.stats).length > 0) {
          setStats(d.stats);
          statsRef.current = d.stats;
        }
      })
      .catch(() => {});
  }, [game]);

  const saveStats = useCallback(async (updater: T | ((prev: T) => T)) => {
    // Grab the absolute latest state from the ref
    const prev = statsRef.current;
    const next = typeof updater === "function" ? (updater as Function)(prev) : updater;
    
    setStats(next);
    statsRef.current = next;

    try {
      await fetch("/api/game-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, stats: next }),
      });
    } catch (e) {
      console.error("Failed to save stats", e);
    }
  }, [game]);

  return { stats, saveStats };
}
