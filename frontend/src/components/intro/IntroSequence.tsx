"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CatacombsLoader } from "./CatacombsLoader";
import { GateEntryOverlay } from "./GateEntryOverlay";
import { IgrisCutscene } from "./IgrisCutscene";
import { SystemAlarmBox } from "./SystemAlarmBox";
import { usePhantomAuth } from "@/hooks/usePhantomAuth";
import { playSlashImpact, playSystemChime, unlockAudio } from "@/lib/introAudio";
import { HUNTER_NAME_MIN, INTRO_TIMINGS, type IntroStep } from "@/lib/introFlow";
import {
  fadeOutShadowborn,
  startShadowbornBuildUp,
  stopShadowborn,
  triggerShadowbornDrop,
} from "@/lib/shadowbornAudio";

interface IntroSequenceProps {
  onComplete: (data: { hunterName: string; wallet: string }) => void;
}

export function IntroSequence({ onComplete }: IntroSequenceProps) {
  const {
    address: walletAddress,
    walletAuthorized,
    authPending,
    authError,
    authorize,
    clearError,
  } = usePhantomAuth();

  const [gateStarted, setGateStarted] = useState(false);
  const [step, setStep] = useState<IntroStep>("loading");
  const [collapsing, setCollapsing] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [igrisVisible, setIgrisVisible] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [chromatic, setChromatic] = useState(false);
  const [hunterName, setHunterName] = useState("");
  const [registering, setRegistering] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    return () => stopShadowborn();
  }, []);

  useEffect(() => {
    if (!gateStarted) return;

    const collapseTimer = window.setTimeout(() => {
      setCollapsing(true);
      setStep("collapse");
    }, INTRO_TIMINGS.loadingMs);

    const systemTimer = window.setTimeout(() => {
      setCollapsing(false);
      setStep("system_box");
      unlockAudio();
      playSystemChime();
    }, INTRO_TIMINGS.loadingMs + INTRO_TIMINGS.collapseMs);

    return () => {
      window.clearTimeout(collapseTimer);
      window.clearTimeout(systemTimer);
    };
  }, [gateStarted]);

  const handleEnterGate = useCallback(() => {
    unlockAudio();
    startShadowbornBuildUp();
    setGateStarted(true);
  }, []);

  const handleAuthorizeWallet = useCallback(async () => {
    unlockAudio();
    clearError();
    try {
      await authorize();
    } catch {
      /* error surfaced via authError */
    }
  }, [authorize, clearError]);

  const handleEnterDungeon = useCallback(() => {
    if (!walletAddress || !walletAuthorized) return;
    if (hunterName.trim().length < HUNTER_NAME_MIN) return;
    if (completedRef.current || registering) return;

    setRegistering(true);
    unlockAudio();
    playSlashImpact();
    triggerShadowbornDrop();
    setChromatic(true);
    setSplitting(true);
    setStep("igris_cutscene");
    setIgrisVisible(true);

    setTimeout(() => setChromatic(false), 650);

    setTimeout(() => {
      setDissolving(true);
    }, INTRO_TIMINGS.igrisPlayMs);

    setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      fadeOutShadowborn(() => {
        onComplete({
          hunterName: hunterName.trim(),
          wallet: walletAddress,
        });
      });
    }, INTRO_TIMINGS.igrisPlayMs + INTRO_TIMINGS.gateDissolveMs);
  }, [
    walletAddress,
    walletAuthorized,
    hunterName,
    onComplete,
    registering,
  ]);

  const showCatacombs =
    gateStarted && (step === "loading" || step === "collapse");
  const showSystem =
    step === "system_box" ||
    step === "igris_cutscene" ||
    splitting;
  const showIgris = step === "igris_cutscene";

  return (
    <div
      className={`intro-root${chromatic ? " intro-root--chromatic" : ""}${dissolving ? " intro-root--shaking" : ""}`}
    >
      {!gateStarted && <GateEntryOverlay onEnter={handleEnterGate} />}

      {showCatacombs && <CatacombsLoader collapsing={collapsing} active />}

      {gateStarted && step === "collapse" && (
        <div className="intro-blackout" aria-hidden />
      )}

      {showSystem && (
        <SystemAlarmBox
          visible={step === "system_box" || (step === "igris_cutscene" && splitting)}
          splitting={splitting && step === "igris_cutscene"}
          hunterName={hunterName}
          onNameChange={setHunterName}
          walletAuthorized={walletAuthorized}
          authPending={authPending}
          authError={authError}
          onAuthorizeWallet={handleAuthorizeWallet}
          onEnterDungeon={handleEnterDungeon}
          registering={registering}
        />
      )}

      {showIgris && (
        <IgrisCutscene visible={igrisVisible} dissolving={dissolving} />
      )}
    </div>
  );
}
