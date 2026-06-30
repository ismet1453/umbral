"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  HUNTER_NAME_MAX,
  HUNTER_NAME_MIN,
  type AuthPhase,
  type CharacterSelectMode,
  type LoginResult,
  isValidHunterName,
} from "@/lib/authFlow";
import {
  type CharacterId,
  type PlayerProfile,
  defaultProfile,
  isProfileReady,
  loadProfile,
  loadSessionWallet,
  persistProfile,
  persistSessionWallet,
  purchaseCharacter,
} from "@/lib/idleGame";
import {
  authorizePhantomWallet,
  clearPhantomAuthorized,
  isPhantomAuthorized,
} from "@/lib/phantomAuth";
import { fadeOutAuthBgm, stopAuthBgm } from "@/lib/authBgm";
import {
  leaveCharacterSelect,
  stopCharacterSelectBgm,
} from "@/lib/characterSelectBgm";
import {
  fetchCloudProfile,
  mergeCloudIntoLocal,
} from "@/lib/firebase/syncProfile";
import {
  isGuestWallet,
  resolvePlayWallet,
} from "@/lib/guestWallet";

export type AuthBusy = "idle" | "connecting" | "registering";

const SESSION_RESTORE_MS = 1000;

export function useAuth() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<AuthPhase>("connect");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [pendingHunterName, setPendingHunterName] = useState<string | null>(
    null
  );
  const [characterSelectMode, setCharacterSelectMode] =
    useState<CharacterSelectMode>("new");
  const [uiLocked, setUiLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<AuthBusy>("idle");

  const autoChecked = useRef(false);
  const lockTimerRef = useRef<number | null>(null);
  const phaseRef = useRef<AuthPhase>("connect");
  const cloudMergedFor = useRef<string | null>(null);

  const walletAddress = wallet.publicKey?.toBase58() ?? null;

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const goAfterCharacterLock = useCallback((next: PlayerProfile) => {
    persistProfile(next);
    persistSessionWallet(next.walletAddress);
    setProfile(next);
    setPendingHunterName(null);
    setBusy("idle");
    fadeOutAuthBgm();
    leaveCharacterSelect();
    setPhase("ready");
  }, []);

  const clearLockTimer = useCallback(() => {
    if (lockTimerRef.current !== null) {
      window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  const routeToWelcomeWithLock = useCallback(
    (loaded: PlayerProfile) => {
      clearLockTimer();
      setProfile(loaded);
      persistSessionWallet(loaded.walletAddress);
      setError(null);
      setUiLocked(true);

      lockTimerRef.current = window.setTimeout(() => {
        setPhase("welcome");
        setUiLocked(false);
        lockTimerRef.current = null;
      }, SESSION_RESTORE_MS);
    },
    [clearLockTimer]
  );

  useEffect(() => () => clearLockTimer(), [clearLockTimer]);

  /** Step 1 on mount: restore session from localStorage */
  useEffect(() => {
    const stored = loadSessionWallet();
    if (stored) {
      const loaded = loadProfile(stored);
      if (loaded && isProfileReady(loaded)) {
        const walletOk =
          isGuestWallet(stored) ||
          (walletAddress === stored && isPhantomAuthorized(stored));
        if (walletOk) {
          routeToWelcomeWithLock(loaded);
        } else {
          setProfile(loaded);
        }
      }
    }
    setHydrated(true);
  }, [walletAddress, routeToWelcomeWithLock]);

  /** Auto-resume returning hunter when wallet reconnects with prior authorization */
  useEffect(() => {
    if (!hydrated || autoChecked.current) return;
    if (!walletAddress || !wallet.connected) return;
    if (!isPhantomAuthorized(walletAddress)) return;

    const loaded = loadProfile(walletAddress);
    if (!loaded || !isProfileReady(loaded)) return;

    autoChecked.current = true;
    routeToWelcomeWithLock(loaded);
  }, [hydrated, walletAddress, wallet.connected, routeToWelcomeWithLock]);

  const clearError = useCallback(() => setError(null), []);

  /** Connect Phantom + sign — returning hunters get 1s lock then welcome */
  const connectWallet = useCallback(async () => {
    setBusy("connecting");
    setError(null);
    try {
      const address = await authorizePhantomWallet(wallet, connection);
      persistSessionWallet(address);
      const loaded = loadProfile(address);
      if (loaded && isProfileReady(loaded)) {
        routeToWelcomeWithLock(loaded);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Wallet connection failed.";
      if (!msg.toLowerCase().includes("user rejected")) {
        setError(msg);
      }
    } finally {
      setBusy("idle");
    }
  }, [wallet, connection, routeToWelcomeWithLock]);

  /** Name-only or Phantom — register / resume hunter */
  const submitLogin = useCallback(
    (hunterName: string): LoginResult => {
      const trimmed = hunterName.trim();

      if (!isValidHunterName(trimmed)) {
        setError(
          `Hunter name must be ${HUNTER_NAME_MIN}–${HUNTER_NAME_MAX} characters.`
        );
        return false;
      }

      const address = resolvePlayWallet(trimmed, walletAddress);
      const phantomLinked =
        walletAddress !== null && isPhantomAuthorized(walletAddress);

      if (walletAddress && !phantomLinked) {
        setError("Sign with Phantom to authorize (Connect Solana Wallet).");
        return false;
      }

      setError(null);

      const existing = loadProfile(address);
      if (existing && isProfileReady(existing)) {
        if (
          existing.hunterName.trim().toUpperCase() !== trimmed.toUpperCase()
        ) {
          setError("Hunter name does not match this profile.");
          return false;
        }
        if (isGuestWallet(address)) {
          persistProfile(existing);
          persistSessionWallet(address);
          goAfterCharacterLock(existing);
          return "welcome";
        }
        setProfile(existing);
        persistSessionWallet(address);
        setPhase("welcome");
        return "welcome";
      }

      setCharacterSelectMode("new");
      setPendingHunterName(trimmed);
      setProfile(defaultProfile(address));
      setPhase("character_select");
      return "character_select";
    },
    [walletAddress, goAfterCharacterLock]
  );

  /** Welcome screen → character select (MMORPG-style entry) */
  const proceedToCharacterSelect = useCallback((): boolean => {
    if (!profile || !isProfileReady(profile)) return false;
    setCharacterSelectMode("returning");
    setPhase("character_select");
    return true;
  }, [profile]);

  /** Pick character — new registration or returning session */
  const selectCharacter = useCallback(
    (characterId: CharacterId): boolean => {
      const name = pendingHunterName ?? profile?.hunterName ?? "";
      const address = profile?.walletAddress ?? resolvePlayWallet(name, walletAddress);

      if (!address) {
        setError("Enter a hunter name first.");
        return false;
      }

      const phantomRequired = walletAddress !== null && !isGuestWallet(address);
      if (phantomRequired && !isPhantomAuthorized(address)) {
        setError("Sign with Phantom first (Connect Solana Wallet).");
        return false;
      }

      setBusy("registering");
      setError(null);

      if (characterSelectMode === "returning") {
        if (!profile || !isProfileReady(profile)) {
          setBusy("idle");
          setError("Session expired. Start again from the gate.");
          setPhase("connect");
          return false;
        }

        const purchased = purchaseCharacter(profile, characterId);
        if (!purchased.ok) {
          setBusy("idle");
          setError(purchased.reason);
          return false;
        }

        persistProfile(purchased.profile);
        persistSessionWallet(address);
        goAfterCharacterLock(purchased.profile);
        return true;
      }

      const hunterName = pendingHunterName;
      if (!hunterName) {
        setBusy("idle");
        setError("Registration session expired. Start again from the gate.");
        setPhase("connect");
        return false;
      }

      const next: PlayerProfile = {
        ...defaultProfile(address),
        hunterName: hunterName.trim(),
        walletAddress: address,
        selectedCharacter: characterId,
        unlockedCharacters: ["varek"],
      };

      goAfterCharacterLock(next);
      return true;
    },
    [walletAddress, pendingHunterName, characterSelectMode, profile, goAfterCharacterLock]
  );

  const cancelCharacterSelect = useCallback(() => {
    setError(null);
    if (characterSelectMode === "returning" && profile) {
      setPhase("welcome");
      return;
    }
    setPendingHunterName(null);
    setProfile(null);
    setPhase("connect");
  }, [characterSelectMode, profile]);

  const logout = useCallback(async () => {
    autoChecked.current = false;
    clearLockTimer();
    setUiLocked(false);
    stopAuthBgm();
    stopCharacterSelectBgm();
    const addr = walletAddress ?? loadSessionWallet();
    if (addr) clearPhantomAuthorized(addr);
    setProfile(null);
    setPendingHunterName(null);
    setCharacterSelectMode("new");
    setPhase("connect");
    setError(null);
    persistSessionWallet(null);
    try {
      await wallet.disconnect();
    } catch {
      /* optional */
    }
  }, [wallet, walletAddress, clearLockTimer]);

  const updateProfile = useCallback(
    (updater: (p: PlayerProfile) => PlayerProfile) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        persistProfile(next);
        return next;
      });
    },
    []
  );

  /** Once per wallet on entering the game: pull cloud backup and merge if newer. */
  useEffect(() => {
    if (phase !== "ready" || !profile) return;
    const wallet = profile.walletAddress;
    if (!wallet || cloudMergedFor.current === wallet) return;
    cloudMergedFor.current = wallet;

    let cancelled = false;
    void fetchCloudProfile(wallet).then((cloud) => {
      if (cancelled || !cloud) return;
      setProfile((prev) => {
        if (!prev || prev.walletAddress !== wallet) return prev;
        const merged = mergeCloudIntoLocal(prev, cloud);
        if (merged === prev) return prev;
        persistProfile(merged);
        return merged;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [phase, profile]);

  return {
    hydrated,
    phase,
    profile,
    pendingHunterName,
    characterSelectMode,
    uiLocked,
    walletAddress,
    error,
    busy,
    connectWallet,
    submitLogin,
    proceedToCharacterSelect,
    selectCharacter,
    cancelCharacterSelect,
    logout,
    updateProfile,
    clearError,
  };
}
