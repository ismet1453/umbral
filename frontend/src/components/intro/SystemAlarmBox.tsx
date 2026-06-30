"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { GateAtmosphere } from "./GateAtmosphere";
import { SystemAlarmWindow } from "./SystemAlarmWindow";
import {
  HUNTER_NAME_MAX,
  HUNTER_NAME_MIN,
  INTRO_TIMINGS,
  sanitizeHunterName,
} from "@/lib/introFlow";
import { playSystemChime } from "@/lib/introAudio";

interface SystemAlarmBoxProps {
  visible: boolean;
  splitting: boolean;
  hunterName: string;
  onNameChange: (v: string) => void;
  walletAuthorized: boolean;
  authPending: boolean;
  authError: string | null;
  onAuthorizeWallet: () => void;
  onEnterDungeon: () => void;
  registering?: boolean;
}

type AlarmPhase = "welcome" | "swap" | "name";

export function SystemAlarmBox({
  visible,
  splitting,
  hunterName,
  onNameChange,
  walletAuthorized,
  authPending,
  authError,
  onAuthorizeWallet,
  onEnterDungeon,
  registering = false,
}: SystemAlarmBoxProps) {
  const { publicKey } = useWallet();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<AlarmPhase>("welcome");

  useEffect(() => {
    if (!visible || splitting) {
      setPhase("welcome");
      return;
    }

    const swapTimer = window.setTimeout(() => {
      setPhase("swap");
    }, INTRO_TIMINGS.welcomeAlarmMs);

    const nameTimer = window.setTimeout(() => {
      setPhase("name");
      playSystemChime();
    }, INTRO_TIMINGS.welcomeAlarmMs + INTRO_TIMINGS.alarmSwapMs);

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(nameTimer);
    };
  }, [visible, splitting]);

  useEffect(() => {
    if (phase === "name" && !registering) {
      inputRef.current?.focus();
    }
  }, [phase, registering]);

  if (!visible && !splitting) return null;

  const canEnter =
    walletAuthorized &&
    hunterName.trim().length >= HUNTER_NAME_MIN &&
    !registering;

  const walletShort = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
    : null;

  const showWelcome = phase === "welcome";
  const showName = phase === "name";

  return (
    <div
      className={`intro-system-wrap${visible ? " intro-system-wrap--in" : ""}`}
    >
      <GateAtmosphere intense />
      <div className="intro-system-wrap__bg" aria-hidden />

      {!splitting ? (
        <div className="intro-system-stack">
          <div className="intro-system__alarm-stage">
            {showWelcome && <SystemAlarmWindow variant="welcome" />}
            {showName && (
              <SystemAlarmWindow variant="name" hunterName={hunterName} />
            )}
            {phase === "swap" && (
              <div className="intro-system__alarm-flash" aria-hidden />
            )}
          </div>

          {showName && (
            <div className="intro-system__register sl-alarm-register">
              <label className="intro-system__input-label" htmlFor="hunter-name">
                Hunter ID · {HUNTER_NAME_MAX} characters max
              </label>
              <div className="intro-system__input-wrap">
                <input
                  ref={inputRef}
                  id="hunter-name"
                  type="text"
                  className="intro-system__input"
                  placeholder="Type your hunter name…"
                  maxLength={HUNTER_NAME_MAX}
                  value={hunterName}
                  disabled={registering}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) =>
                    onNameChange(sanitizeHunterName(e.target.value))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canEnter) onEnterDungeon();
                  }}
                />
                <span className="intro-system__char-count">
                  {hunterName.length}/{HUNTER_NAME_MAX}
                </span>
              </div>

              <button
                type="button"
                className="intro-system__wallet-btn"
                disabled={walletAuthorized || authPending || registering}
                onClick={onAuthorizeWallet}
              >
                {walletAuthorized && walletShort
                  ? `✓ Phantom Authorized · ${walletShort}`
                  : authPending
                    ? "Awaiting Phantom…"
                    : "Connect & Authorize Phantom"}
              </button>

              {authError && (
                <p className="intro-system__auth-error" role="alert">
                  {authError}
                </p>
              )}

              <button
                type="button"
                className="intro-system__enter-btn"
                disabled={!canEnter}
                onClick={onEnterDungeon}
              >
                {registering ? "Registering Hunter…" : "Enter Dungeon"}
              </button>
            </div>
          )}

          {showWelcome && (
            <p className="intro-system__charge-label">System awakening…</p>
          )}
        </div>
      ) : (
        <div className="intro-system-split">
          <div className="intro-system-split__half intro-system-split__half--tl">
            <SystemAlarmWindow variant="name" hunterName={hunterName} />
          </div>
          <div className="intro-system-split__half intro-system-split__half--br">
            <SystemAlarmWindow variant="name" hunterName={hunterName} />
          </div>
        </div>
      )}
    </div>
  );
}
