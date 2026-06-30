"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  defaultProfile,
  isProfileReady,
  loadProfile,
  loadSessionWallet,
  persistProfile,
  persistSessionWallet,
} from "@/lib/idleGame";

export type AuthPhase = "connect" | "naming" | "ready";

export function usePlayerSession() {
  const { publicKey, connect, connected } = useWallet();
  const [sessionWallet, setSessionWallet] = useState<string | null>(null);
  const [profile, setProfile] = useState<ReturnType<typeof defaultProfile> | null>(
    null
  );
  const [connecting, setConnecting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadSessionWallet();
    if (stored) setSessionWallet(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (publicKey) {
      const addr = publicKey.toBase58();
      setSessionWallet(addr);
      persistSessionWallet(addr);
    }
  }, [publicKey]);

  useEffect(() => {
    if (!sessionWallet) {
      setProfile(null);
      return;
    }
    const existing = loadProfile(sessionWallet);
    setProfile(existing ?? defaultProfile(sessionWallet));
  }, [sessionWallet]);

  const phase: AuthPhase = !sessionWallet
    ? "connect"
    : profile && isProfileReady(profile)
      ? "ready"
      : "naming";

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    try {
      if (!connected) {
        await connect();
      }
    } catch {
      const mock = `ShadowHunter${Date.now().toString(36).slice(-8)}MockWallet111111111`;
      setSessionWallet(mock);
      persistSessionWallet(mock);
    } finally {
      setConnecting(false);
    }
  }, [connect, connected]);

  const setHunterName = useCallback(
    (name: string) => {
      if (!sessionWallet || !profile) return;
      const next = { ...profile, hunterName: name.trim(), walletAddress: sessionWallet };
      setProfile(next);
      persistProfile(next);
    },
    [sessionWallet, profile]
  );

  const updateProfile = useCallback(
    (updater: (p: NonNullable<typeof profile>) => NonNullable<typeof profile>) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        persistProfile(next);
        return next;
      });
    },
    []
  );

  const disconnect = useCallback(() => {
    setSessionWallet(null);
    setProfile(null);
    persistSessionWallet(null);
  }, []);

  const completeOnboarding = useCallback(
    (name: string, wallet: string) => {
      persistSessionWallet(wallet);
      setSessionWallet(wallet);
      const next = {
        ...defaultProfile(wallet),
        hunterName: name.trim(),
        walletAddress: wallet,
      };
      setProfile(next);
      persistProfile(next);
    },
    []
  );

  return {
    hydrated,
    sessionWallet,
    profile,
    phase,
    connecting,
    connectWallet,
    setHunterName,
    updateProfile,
    disconnect,
    completeOnboarding,
  };
}
