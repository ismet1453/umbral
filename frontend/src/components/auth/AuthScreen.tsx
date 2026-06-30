"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthPhase, CharacterSelectMode, LoginResult } from "@/lib/authFlow";
import { isValidHunterName } from "@/lib/authFlow";
import type { CharacterId } from "@/lib/idleGame";
import type { AuthBusy } from "@/hooks/useAuth";
import type { PlayerProfile } from "@/lib/idleGame";
import {
  playAcceptQuest,
  playDecline,
  playInputError,
  playUiClick,
  playWalletConnect,
  scheduleAuthRevealSounds,
} from "@/lib/authAudio";
import {
  fadeOutAuthBgm,
  startAuthBgm,
  stopAuthBgm,
} from "@/lib/authBgm";
import {
  enterCharacterSelect,
  leaveCharacterSelect,
  preloadCharacterThemes,
  stopCharacterSelectBgm,
} from "@/lib/characterSelectBgm";
import { CharacterSelectLayout } from "./CharacterSelectLayout";
import { SystemBootScreen } from "./SystemBootScreen";
import { SystemGateBackground } from "./SystemGateBackground";
import { SystemNotificationPanel } from "./SystemNotificationPanel";

type TransitionPhase = "idle" | "covering" | "revealing";

const FADE_MS = 900;

interface AuthScreenProps {
  phase: AuthPhase;
  profile: PlayerProfile | null;
  pendingHunterName: string | null;
  characterSelectMode: CharacterSelectMode;
  uiLocked: boolean;
  walletAddress: string | null;
  error: string | null;
  busy: AuthBusy;
  onConnect: () => void;
  onSubmitLogin: (name: string) => LoginResult;
  onProceedToCharacterSelect: () => boolean;
  onSelectCharacter: (characterId: CharacterId) => void;
  onCancelCharacterSelect: () => void;
  onLogout: () => void;
  onClearError: () => void;
}

export function AuthScreen({
  phase,
  profile,
  pendingHunterName,
  characterSelectMode,
  uiLocked,
  walletAddress,
  error,
  busy,
  onConnect,
  onSubmitLogin,
  onProceedToCharacterSelect,
  onSelectCharacter,
  onCancelCharacterSelect,
  onLogout,
  onClearError,
}: AuthScreenProps) {
  const [booting, setBooting] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("umbral-boot-seen") !== "1";
  });
  const [panelActive, setPanelActive] = useState(false);
  const [charSelectActive, setCharSelectActive] = useState(false);
  const [transition, setTransition] = useState<TransitionPhase>("idle");
  const [hunterName, setHunterName] = useState("");
  const [characterId, setCharacterId] = useState<CharacterId>("varek");
  const [inputShake, setInputShake] = useState(false);

  const transitionTimers = useRef<number[]>([]);

  const clearTransitionTimers = useCallback(() => {
    transitionTimers.current.forEach((id) => window.clearTimeout(id));
    transitionTimers.current = [];
  }, []);

  const startCharSelectTransition = useCallback(() => {
    clearTransitionTimers();
    setPanelActive(false);
    setCharSelectActive(false);
    setTransition("covering");
    preloadCharacterThemes();
    fadeOutAuthBgm(undefined, 550);

    const revealId = window.setTimeout(() => {
      setTransition("revealing");
      setCharSelectActive(true);
      enterCharacterSelect(characterId);
      const doneId = window.setTimeout(() => {
        setTransition("idle");
      }, FADE_MS);
      transitionTimers.current.push(doneId);
    }, FADE_MS);

    transitionTimers.current.push(revealId);
  }, [clearTransitionTimers, characterId]);

  useEffect(() => () => clearTransitionTimers(), [clearTransitionTimers]);

  useEffect(() => () => {
    stopAuthBgm();
    stopCharacterSelectBgm();
  }, []);

  useEffect(() => {
    if (profile?.hunterName) {
      setHunterName(profile.hunterName);
    }
  }, [profile?.hunterName]);

  useEffect(() => {
    if (profile?.selectedCharacter) {
      setCharacterId(profile.selectedCharacter);
    }
  }, [profile?.selectedCharacter]);

  useEffect(() => {
    if (phase === "connect" && transition === "idle" && !booting) {
      setPanelActive(true);
      setCharSelectActive(false);
    }
    if (phase === "welcome" && transition === "idle" && !booting) {
      setPanelActive(true);
      setCharSelectActive(false);
    }
  }, [phase, transition, booting]);

  const handleGateEnter = useCallback(() => {
    startAuthBgm();
  }, []);

  const handleBootComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("umbral-boot-seen", "1");
    }
    setBooting(false);
    scheduleAuthRevealSounds();
    window.setTimeout(() => setPanelActive(true), 50);
  }, []);

  const shakeInput = useCallback(() => {
    playInputError();
    setInputShake(true);
    window.setTimeout(() => setInputShake(false), 1000);
  }, []);

  const handleConnect = useCallback(() => {
    if (uiLocked) return;
    playWalletConnect();
    onClearError();
    onConnect();
  }, [onConnect, onClearError, uiLocked]);

  const handleConfirm = useCallback(() => {
    if (uiLocked) return;
    onClearError();
    playUiClick();

    if (phase === "welcome") {
      playAcceptQuest();
      if (onProceedToCharacterSelect()) {
        startCharSelectTransition();
      }
      return;
    }

    if (phase === "character_select") {
      playAcceptQuest();
      onSelectCharacter("varek");
      return;
    }

    if (!isValidHunterName(hunterName)) {
      shakeInput();
      return;
    }

    const result = onSubmitLogin(hunterName.trim());
    if (result === "welcome") {
      playAcceptQuest();
    } else if (result === "character_select") {
      playAcceptQuest();
      startCharSelectTransition();
    }
  }, [
    phase,
    uiLocked,
    hunterName,
    characterId,
    characterSelectMode,
    profile,
    onClearError,
    onProceedToCharacterSelect,
    onSelectCharacter,
    onSubmitLogin,
    shakeInput,
    startCharSelectTransition,
  ]);

  const handleDecline = useCallback(() => {
    if (uiLocked) return;
    playDecline();
    if (phase === "welcome") {
      onLogout();
      setHunterName("");
      return;
    }
    if (phase === "character_select") {
      clearTransitionTimers();
      setTransition("idle");
      setCharSelectActive(false);
      setPanelActive(true);
      leaveCharacterSelect(() => startAuthBgm());
      onCancelCharacterSelect();
      return;
    }
    if (walletAddress) {
      onLogout();
      setHunterName("");
      return;
    }
    onClearError();
    setHunterName("");
  }, [
    phase,
    uiLocked,
    walletAddress,
    onLogout,
    onCancelCharacterSelect,
    onClearError,
    clearTransitionTimers,
  ]);

  const showNotification =
    !booting &&
    (phase === "connect" || phase === "welcome") &&
    transition !== "covering";

  const showCharacterSelect =
    !booting && phase === "character_select" && charSelectActive;

  const displayHunterName =
    characterSelectMode === "returning" && profile
      ? profile.hunterName
      : pendingHunterName ?? hunterName;

  return (
    <div className="sys-notify-root">
      <SystemGateBackground />
      <SystemBootScreen
        active={booting}
        onComplete={handleBootComplete}
        onGateEnter={handleGateEnter}
      />

      {showNotification && (
        <SystemNotificationPanel
          active={panelActive && transition !== "revealing"}
          phase={phase}
          profile={profile}
          walletAddress={walletAddress}
          hunterName={hunterName}
          error={error}
          busy={busy}
          uiLocked={uiLocked}
          inputShake={inputShake}
          onNameChange={setHunterName}
          onConnect={handleConnect}
          onConfirm={handleConfirm}
          onDecline={handleDecline}
          onClearError={onClearError}
        />
      )}

      {!booting && phase === "character_select" && (
        <CharacterSelectLayout
          active={showCharacterSelect}
          mode={characterSelectMode}
          hunterName={displayHunterName}
          characterId="varek"
          walletAddress={walletAddress}
          profile={profile}
          error={error}
          busy={busy}
          onConfirm={handleConfirm}
          onDecline={handleDecline}
        />
      )}

      {!booting && transition !== "idle" && (
        <div
          className={`auth-phase-overlay auth-phase-overlay--${transition}`}
          aria-hidden
        />
      )}
    </div>
  );
}
