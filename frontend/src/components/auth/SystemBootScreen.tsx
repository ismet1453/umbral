"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  playBootCharTick,
  playBootGlitch,
  playBootAccessGranted,
  playGateBum,
  unlockAuthAudio,
} from "@/lib/authAudio";

const FAKE_LOGS = [
  "Initialize Web3 RPC connection...",
  "Fetching blockhash from Solana cluster... OK",
  "Validating Phantom adapter [0x8fB...9A2]... SUCCESS",
  "Syncing player data nodes...",
  "WARNING: E-Rank limitations detected",
  "Bypassing standard hunter protocol...",
  "Injecting Shadow Monarch logic array...",
  "Solana devnet latency: 38ms",
  "Loading shadow registry...",
  "Verifying cryptographic proof of rank...",
  "Boot sector integrity: PASS",
  "Allocating monarch memory buffer...",
  "Linking to Gate dimensional coordinates...",
  "Player cache hydrated: 0 records",
];

const LOG_INTERVAL_MS = 80;
const LOG_COUNT = 22;
const CHAR_DELAY_MS = 38;
const PAUSE_BETWEEN_MS = 750;
const LOADING_TICK_MS = 40;
const FADE_OUT_MS = 900;

type Phase = "gate" | "logs" | "type" | "loading" | "granted";

interface SystemBootScreenProps {
  active: boolean;
  onComplete: () => void;
  onGateEnter?: () => void;
}

export function SystemBootScreen({
  active,
  onComplete,
  onGateEnter,
}: SystemBootScreenProps) {
  const t = useT();
  const bootMessages = t.boot.typeLines;

  const [phase, setPhase] = useState<Phase>("gate");
  const [logs, setLogs] = useState<string[]>([]);
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [progress, setProgress] = useState(0);
  const [granted, setGranted] = useState(false);
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  const finishedRef = useRef(false);
  const gateOpenedRef = useRef(false);
  const timers = useRef<number[]>([]);

  const after = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFading(true);
    after(() => {
      setVisible(false);
      onComplete();
    }, FADE_OUT_MS);
  }, [onComplete]);

  const skipBoot = useCallback(() => {
    if (finishedRef.current) return;
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    finish();
  }, [finish]);

  const startLoading = useCallback(() => {
    setPhase("loading");
    setCompletedLines(bootMessages);
    setCurrentLine("");
    setProgress(0);

    let p = 0;
    const tick = () => {
      p += Math.random() * 4.5 + 0.5;
      if (p >= 100) {
        p = 100;
        setProgress(100);
        after(() => {
          setPhase("granted");
          setGranted(true);
          playBootAccessGranted();
          after(finish, 1200);
        }, 300);
        return;
      }
      setProgress(p);
      after(tick, LOADING_TICK_MS);
    };
    after(tick, LOADING_TICK_MS);
  }, [finish, bootMessages]);

  const startTyping = useCallback(() => {
    setPhase("type");
    setCompletedLines([]);
    setCurrentLine("");
    let msgIdx = 0;
    let charIdx = 0;

    const typeNext = () => {
      const msg = bootMessages[msgIdx];
      if (!msg) {
        startLoading();
        return;
      }

      const isLast = msgIdx === bootMessages.length - 1;

      if (charIdx < msg.length) {
        const next = msg.slice(0, charIdx + 1);
        setCurrentLine(next);
        playBootCharTick();

        if (isLast && charIdx === 0) {
          setGlitchActive(true);
          playBootGlitch();
          after(() => setGlitchActive(false), 600);
        }

        charIdx++;
        after(typeNext, isLast ? CHAR_DELAY_MS * 1.4 : CHAR_DELAY_MS);
      } else {
        setCompletedLines((prev) => [...prev, msg]);
        setCurrentLine("");
        charIdx = 0;
        msgIdx++;
        after(typeNext, PAUSE_BETWEEN_MS);
      }
    };

    after(typeNext, 200);
  }, [startLoading, bootMessages]);

  const startLogs = useCallback(() => {
    setPhase("logs");
    setLogs([]);
    let count = 0;

    const addLog = () => {
      if (count >= LOG_COUNT) {
        after(() => {
          setLogs([]);
          startTyping();
        }, 300);
        return;
      }
      const entry = FAKE_LOGS[Math.floor(Math.random() * FAKE_LOGS.length)]!;
      const hex = Math.random().toString(16).slice(2, 8);
      const line = `> ${entry} [${hex}]`;
      setLogs((prev) => [...prev.slice(-6), line]);
      count++;
      after(addLog, LOG_INTERVAL_MS + Math.random() * 60);
    };

    after(addLog, 100);
  }, [startTyping]);

  const enterGate = useCallback(() => {
    if (phase !== "gate" || finishedRef.current || gateOpenedRef.current) return;
    gateOpenedRef.current = true;
    unlockAuthAudio();
    playGateBum();
    onGateEnter?.();
    setPhase("logs");
    startLogs();
  }, [phase, onGateEnter, startLogs]);

  useEffect(() => {
    if (!active) return;

    finishedRef.current = false;
    gateOpenedRef.current = false;
    setPhase("gate");
    setVisible(true);
    setFading(false);
    setCompletedLines([]);
    setCurrentLine("");
    setProgress(0);
    setGranted(false);
    setGlitchActive(false);

    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    };
  }, [active]);

  const showText = phase === "type" || phase === "loading" || phase === "granted";
  const allLines =
    phase === "loading" || phase === "granted"
      ? bootMessages
      : completedLines;

  if (!visible) return null;

  return (
    <div
      className={`sys-boot${fading ? " sys-boot--fade" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="System boot sequence"
    >
      <div className="sys-boot__scanlines" aria-hidden />

      <button
        type="button"
        className="sys-boot__skip"
        onClick={skipBoot}
        aria-label="Skip intro and go to wallet login"
      >
        {t.boot.skip}
      </button>

      {phase === "gate" && (
        <button
          type="button"
          className="sys-boot__gate"
          onClick={enterGate}
          aria-label="Enter the gate"
        >
          <span className="sys-boot__gate-ring" aria-hidden />
          <span className="sys-boot__gate-title">{t.boot.enterGate}</span>
          <span className="sys-boot__gate-hint">{t.boot.gateHint}</span>
        </button>
      )}

      {phase !== "gate" && (
      <div className="sys-boot__inner">
        <div
          className={`sys-boot__logs${phase !== "logs" ? " sys-boot__logs--hidden" : ""}`}
          aria-hidden
        >
          {logs.map((l, i) => (
            <div key={i} className="sys-boot__log-line">
              {l}
            </div>
          ))}
        </div>

        {showText && (
          <div className="sys-boot__text">
            {allLines.map((line, i) => (
              <p key={i} className="sys-boot__line">
                {line}
              </p>
            ))}
            {phase === "type" && (
              <p
                className={`sys-boot__line${
                  glitchActive ? " sys-boot__line--glitch" : ""
                }`}
              >
                {currentLine}
                <span className="sys-boot__cursor" aria-hidden />
              </p>
            )}
          </div>
        )}

        {(phase === "loading" || phase === "granted") && (
          <div className="sys-boot__bar-wrap">
            <div className="sys-boot__bar-fill" style={{ width: `${progress}%` }} />
            <span className="sys-boot__bar-pct">{Math.floor(progress)}%</span>
          </div>
        )}

        {phase === "granted" && granted && (
          <p className="sys-boot__granted">{t.boot.accessGranted}</p>
        )}
      </div>
      )}
    </div>
  );
}
