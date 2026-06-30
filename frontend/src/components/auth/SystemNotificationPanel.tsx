"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { formatMsg } from "@/lib/i18n/format";
import type { AuthPhase } from "@/lib/authFlow";
import {
  HUNTER_NAME_MAX,
  HUNTER_NAME_MIN,
  sanitizeHunterName,
  shortWallet,
} from "@/lib/authFlow";
import { CHARACTERS } from "@/lib/idleGame";
import type { AuthBusy } from "@/hooks/useAuth";
import type { PlayerProfile } from "@/lib/idleGame";
import { isPhantomAuthorized } from "@/lib/phantomAuth";
import { playTypeTick, playUiClick } from "@/lib/authAudio";

interface SystemNotificationPanelProps {
  active: boolean;
  phase: AuthPhase;
  profile: PlayerProfile | null;
  walletAddress: string | null;
  hunterName: string;
  error: string | null;
  busy: AuthBusy;
  uiLocked: boolean;
  inputShake: boolean;
  onNameChange: (value: string) => void;
  onConnect: () => void;
  onConfirm: () => void;
  onDecline: () => void;
  onClearError: () => void;
}

export function SystemNotificationPanel({
  active,
  phase,
  profile,
  walletAddress,
  hunterName,
  error,
  busy,
  uiLocked,
  inputShake,
  onNameChange,
  onConnect,
  onConfirm,
  onDecline,
  onClearError,
}: SystemNotificationPanelProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const connecting  = busy === "connecting";
  const registering = busy === "registering";
  const walletConnected = Boolean(walletAddress);
  const walletSigned =
    walletConnected && walletAddress
      ? isPhantomAuthorized(walletAddress)
      : false;
  const showWelcome   = phase === "welcome" || (uiLocked && Boolean(profile));
  const showNameField = !showWelcome;

  useEffect(() => {
    if (!active || !showNameField || showWelcome) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 3400);
    return () => window.clearTimeout(t);
  }, [active, showNameField, showWelcome]);

  const yesLabel = uiLocked
    ? t.notify.restoring
    : registering
      ? t.notify.registering
      : showWelcome
        ? t.notify.selectHunter
        : connecting
          ? t.notify.connecting
          : t.notify.yes;

  const inputsDisabled = connecting || registering || uiLocked;

  const walletLabel = connecting
    ? t.notify.awaitingPhantom
    : walletSigned && walletAddress
      ? `✓ ${shortWallet(walletAddress)}`
      : walletConnected && walletAddress
        ? `${t.notify.signWallet} · ${shortWallet(walletAddress)}`
        : t.notify.connectWallet;

  const headline =
    showWelcome && profile ? (
      <>
        {t.notify.welcome}{" "}
        <em className="snp-em">{profile.hunterName}</em>. {t.notify.resume}
      </>
    ) : (
      <>
        {t.notify.qualify}{" "}
        <em className="snp-em">{t.notify.survive}</em>?
      </>
    );

  const subline =
    showWelcome && profile
      ? formatMsg(t.notify.subSessionRestore, {
          level: profile.level,
        })
      : t.notify.subAwakening;

  return (
    <div className={`hologram-wrapper${active ? " hologram-wrapper--active" : ""}${uiLocked ? " hologram-wrapper--locked" : ""}`}>

      {/* Ember gate frame */}
      <div className="hologram-frame-img hologram-frame-img--css" aria-hidden />

      {/* ── Layer 2: Content ── */}
      <div className="hologram-content">

        {/* HEADER */}
        <header className="hn-header snp-fade snp-fade--1">
          <div className="hn-icon" aria-hidden>!</div>
          <div className="hn-title-box">
            <span className="hn-title">{t.notify.title}</span>
          </div>
        </header>

        {/* DIVIDER */}
        <div className="hn-divider snp-fade snp-fade--1" aria-hidden />

        {/* HEADLINE */}
        <p className="hn-headline snp-fade snp-fade--2">
          {headline}
        </p>
        <p className="hn-sub snp-fade snp-fade--2">
          {subline}
        </p>

        {/* FORM */}
        <div className="hn-body snp-fade snp-fade--3">

          {uiLocked && profile && (
            <p className="hn-restore" role="status">
              {t.notify.restoreStatus}
            </p>
          )}

          {showWelcome && profile && !uiLocked && (
            <p className="hn-meta">
              {CHARACTERS[profile.selectedCharacter].name} · Lv {profile.level}
            </p>
          )}

          {showNameField && (
            <div className="hn-field">
              <input
                ref={inputRef}
                id="hunter-name"
                type="text"
                className={`hn-input${inputShake ? " hn-input--error" : ""}`}
                placeholder={t.notify.enterName}
                maxLength={HUNTER_NAME_MAX}
                value={hunterName}
                disabled={inputsDisabled}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => {
                  onClearError();
                  playTypeTick();
                  onNameChange(sanitizeHunterName(e.target.value).toUpperCase());
                }}
                onKeyDown={(e) => { if (e.key === "Enter") onConfirm(); }}
              />
              <span className="hn-count">{hunterName.length}/{HUNTER_NAME_MAX}</span>
            </div>
          )}

          {!showWelcome && (
            <button
              type="button"
              className={`hn-wallet${
                walletSigned ? " hn-wallet--ok" : walletConnected ? " hn-wallet--pending" : ""
              }`}
              disabled={inputsDisabled}
              onClick={() => {
                if (!walletSigned && !uiLocked) onConnect();
              }}
            >
              <WalletIcon connected={walletSigned} pending={walletConnected && !walletSigned} />
              <span>{walletLabel}</span>
            </button>
          )}

          {error && (
            <p className="hn-error" role="alert">{error}</p>
          )}

          <div className="hn-actions">
            <button
              type="button"
              className="hn-btn hn-btn--yes"
              disabled={inputsDisabled}
              onClick={onConfirm}
            >
              {yesLabel}
            </button>
            <button
              type="button"
              className="hn-btn hn-btn--no"
              disabled={inputsDisabled}
              onClick={() => { if (!uiLocked) { playUiClick(); onDecline(); } }}
            >
              {t.notify.no}
            </button>
          </div>

          {showWelcome && !uiLocked && (
            <p className="hn-hint">
              {t.notify.chooseHunter}
            </p>
          )}

          {!showWelcome && (
            <p className="hn-hint">
              {walletSigned
                ? t.notify.hintAuthorized
                : walletConnected
                  ? t.notify.hintSign
                  : hunterName.length >= HUNTER_NAME_MIN
                    ? t.notify.hintGuest
                    : formatMsg(t.notify.hintMin, { min: HUNTER_NAME_MIN })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function WalletIcon({
  connected,
  pending = false,
}: {
  connected: boolean;
  pending?: boolean;
}) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {connected
        ? <path d="M20 6L9 17l-5-5" />
        : pending
          ? <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          : <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />}
    </svg>
  );
}
