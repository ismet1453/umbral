"use client";

import { useState } from "react";
import { resetIntroComplete } from "@/lib/introFlow";

interface IntroCompletePanelProps {
  hunterName: string;
  wallet: string;
  registered?: boolean;
  onReplay: () => void;
}

export function IntroCompletePanel({
  hunterName,
  wallet,
  registered = false,
  onReplay,
}: IntroCompletePanelProps) {
  return (
    <div className="intro-root intro-complete">
      <div className="intro-complete__glow" aria-hidden />
      <div className="sl-glass intro-complete__card">
        <p className="intro-complete__eyebrow">Gate Sequence · Phase 1</p>
        <h2 className="intro-complete__title">
          {registered ? "Hunter Registered" : "Onboarding Complete"}
        </h2>
        <p className="intro-complete__body">
          Hunter{" "}
          <span className="intro-complete__name">{hunterName}</span> is bound to
          the Shadow Monarch protocol.
        </p>
        <p className="intro-complete__wallet">{wallet}</p>
        <p className="intro-complete__note">
          {registered
            ? "Your profile is saved locally. Idle dungeon unlocks in the next phase."
            : "Intro replay complete — profile saved."}
        </p>
        <button type="button" className="sl-btn-connect" onClick={onReplay}>
          Replay Intro
        </button>
      </div>
    </div>
  );
}

export function useIntroReplay() {
  const [replayKey, setReplayKey] = useState(0);
  const [forceIntro, setForceIntro] = useState(false);
  const [completed, setCompleted] = useState<{
    hunterName: string;
    wallet: string;
  } | null>(null);

  const handleComplete = (data: { hunterName: string; wallet: string }) => {
    setCompleted(data);
    setForceIntro(false);
  };

  const replay = () => {
    resetIntroComplete();
    setCompleted(null);
    setForceIntro(true);
    setReplayKey((k) => k + 1);
  };

  return { replayKey, forceIntro, completed, handleComplete, replay };
}
