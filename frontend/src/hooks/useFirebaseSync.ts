"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerProfile } from "@/lib/idleGame";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import {
  fetchLeaderboard,
  pushProfileToCloud,
  type LeaderboardEntry,
} from "@/lib/firebase/syncProfile";

const DEBOUNCE_MS = 30_000;

export interface UseFirebaseSyncResult {
  enabled: boolean;
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  refreshLeaderboard: () => void;
  lastSyncMs: number | null;
  /** Push immediately, bypassing the debounce (e.g. claim / level-up). */
  flushSync: () => void;
}

/**
 * Backs up the leaderboard-relevant profile slice to Firestore:
 *  - debounced 30s on any profile change
 *  - immediate push when the hunter levels up
 *  - flush on tab close
 * No-op when Firebase env is not configured.
 */
export function useFirebaseSync(
  profile: PlayerProfile | null
): UseFirebaseSyncResult {
  const enabled = isFirebaseConfigured();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [lastSyncMs, setLastSyncMs] = useState<number | null>(null);

  const profileRef = useRef(profile);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLevelRef = useRef<number | null>(profile?.level ?? null);
  const prevCoinRef = useRef<number | null>(profile?.walletCoin ?? null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const doPush = useCallback(() => {
    const p = profileRef.current;
    if (!enabled || !p) return;
    void pushProfileToCloud(p);
    setLastSyncMs(Date.now());
  }, [enabled]);

  const flushSync = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    doPush();
  }, [doPush]);

  // Debounced push on profile change + immediate push on level-up.
  useEffect(() => {
    if (!enabled || !profile) return;

    const leveledUp =
      prevLevelRef.current !== null && profile.level > prevLevelRef.current;
    // walletCoin only grows on claim (Essence → Coin) — push that instantly.
    const claimed =
      prevCoinRef.current !== null && profile.walletCoin > prevCoinRef.current;
    prevLevelRef.current = profile.level;
    prevCoinRef.current = profile.walletCoin;

    if (leveledUp || claimed) {
      flushSync();
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      doPush();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, profile, doPush, flushSync]);

  // Flush pending push when the tab is hidden / closed.
  useEffect(() => {
    if (!enabled) return;
    const onHide = () => {
      if (debounceRef.current) flushSync();
    };
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [enabled, flushSync]);

  const refreshLeaderboard = useCallback(() => {
    if (!enabled) return;
    setLeaderboardLoading(true);
    void fetchLeaderboard(100)
      .then(setLeaderboard)
      .finally(() => setLeaderboardLoading(false));
  }, [enabled]);

  return {
    enabled,
    leaderboard,
    leaderboardLoading,
    refreshLeaderboard,
    lastSyncMs,
    flushSync,
  };
}
