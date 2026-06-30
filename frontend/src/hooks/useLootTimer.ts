"use client";

import { useEffect, useRef } from "react";
import {
  createChestId,
  randomPityDurationMs,
} from "@/lib/lootSystem";

/**
 * Hidden pity timer: every 3–10 min (random) adds a common chest
 * while the battle screen is active.
 */
export function useLootTimer(
  updateProfile: (fn: (p: import("@/lib/idleGame").PlayerProfile) => import("@/lib/idleGame").PlayerProfile) => void,
  enabled: boolean
) {
  const remainingRef = useRef(randomPityDurationMs());
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    lastTickRef.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      remainingRef.current -= delta;

      if (remainingRef.current <= 0) {
        const chestId = createChestId();
        updateProfile((p) => ({
          ...p,
          storedChests: [
            ...p.storedChests,
            { id: chestId, type: "common", earnedAt: now },
          ],
        }));
        remainingRef.current = randomPityDurationMs();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [enabled, updateProfile]);
}
