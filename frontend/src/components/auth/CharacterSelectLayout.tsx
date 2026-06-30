"use client";

import { useEffect, type CSSProperties } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import type { CharacterSelectMode } from "@/lib/authFlow";
import type { CharacterId, PlayerProfile } from "@/lib/idleGame";
import { critChancePercent, defaultStats } from "@/lib/idleGame";
import { shortWallet } from "@/lib/authFlow";
import type { AuthBusy } from "@/hooks/useAuth";
import { playUiClick } from "@/lib/authAudio";

const VAREK_SCENE = "/assets/kenney/rpg-ui/PNG/sample.png";

const VAREK_PORTRAIT = {
  image: "/assets/kenney/rpg-ui/PNG/cursorSword_silver.png",
  accent: "#d4a017",
  position: "50% 12%",
  label: "VAREK",
};

function barPct(value: number, max: number) {
  return Math.min(100, Math.round((value / max) * 100));
}

interface Props {
  active: boolean;
  mode: CharacterSelectMode;
  hunterName: string;
  characterId: CharacterId;
  walletAddress: string | null;
  profile: PlayerProfile | null;
  error: string | null;
  busy: AuthBusy;
  onConfirm: () => void;
  onDecline: () => void;
}

export function CharacterSelectLayout({
  active,
  mode,
  hunterName,
  characterId,
  walletAddress,
  profile,
  error,
  busy,
  onConfirm,
  onDecline,
}: Props) {
  const t = useT();
  const copy = t.characters.varek;
  const stats = profile?.stats ?? defaultStats();
  const registering = busy === "registering";
  const returning = mode === "returning";
  const displayName = hunterName.trim() || t.charSelect.hunterFallback;

  const hpPct = barPct(stats.str + stats.agi, 50);
  const atkPct = barPct(stats.str, 25);
  const defPct = barPct(stats.agi, 25);

  const confirmLabel = registering
    ? returning
      ? t.charSelect.entering
      : t.charSelect.registering
    : t.charSelect.lockIn;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !registering) {
        e.preventDefault();
        playUiClick();
        onConfirm();
      }
    };
    window.addEventListener("keyup", onKey);
    return () => window.removeEventListener("keyup", onKey);
  }, [active, registering, onConfirm]);

  return (
    <div
      className={`cs-screen cs-screen--varek cs-screen--single cs-screen--has-scene${active ? " cs-screen--active" : ""}`}
      role="dialog"
      aria-label={returning ? "Select hunter" : "Hunter registration"}
    >
      <div
        className="cs-screen__scene"
        aria-hidden
        style={{
          backgroundImage: `url(${VAREK_SCENE})`,
          backgroundPosition: "center 38%",
        }}
      />

      <button
        type="button"
        className="cs-screen__close"
        disabled={registering}
        onClick={() => {
          playUiClick();
          onDecline();
        }}
      >
        ✕
      </button>

      <aside className="cs-col cs-col--left">
        <p className="cs-col__sys-label">{t.charSelect.sysLabel}</p>
        <h1 className="cs-col__title">
          {t.charSelect.titleLine1}
          <br />
          {t.charSelect.titleLine2}
        </h1>
        <p className="cs-col__hunter">{displayName}</p>

        <div className="cs-col__divider" />

        <blockquote className="cs-col__lore">{copy.lore}</blockquote>

        <ul className="cs-col__hints">
          <li>{t.charSelect.hintConfirm}</li>
        </ul>
      </aside>

      <div className="cs-carousel cs-carousel--single" role="listbox" aria-label="Varek">
        <div className="cs-carousel__stage">
          <div
            id="cs-panel-varek"
            role="option"
            aria-selected
            className="cs-carousel__panel cs-carousel__panel--varek cs-carousel__panel--highlight"
            style={
              {
                "--cs-accent": VAREK_PORTRAIT.accent,
                backgroundImage: `url(${VAREK_PORTRAIT.image})`,
                backgroundPosition: VAREK_PORTRAIT.position,
              } as CSSProperties
            }
          >
            <span className="cs-carousel__shimmer" aria-hidden />
            <span className="cs-carousel__panel-name">{VAREK_PORTRAIT.label}</span>
            <span className="cs-carousel__panel-role">{copy.subtitle}</span>
          </div>
        </div>
      </div>

      <aside className="cs-col cs-col--right">
        <p className="cs-col__char-name">{VAREK_PORTRAIT.label}</p>
        <p className="cs-col__char-sub">{copy.subtitle}</p>
        <p className="cs-col__char-role">
          {copy.role} · {copy.focus}
        </p>

        <div className="cs-col__stats">
          {(
            [
              ["hp", stats.str + stats.agi, hpPct],
              ["atk", stats.str, atkPct],
              ["def", stats.agi, defPct],
            ] as const
          ).map(([key, val, pct]) => (
            <div key={key} className="cs-col__stat">
              <span className="cs-col__stat-label">{t.common[key]}</span>
              <div className="cs-col__bar">
                <span style={{ width: `${pct}%` }} />
              </div>
              <span className="cs-col__stat-val">{val}</span>
            </div>
          ))}
          <div className="cs-col__stat-mini">
            <span>
              {t.common.crit} {critChancePercent(stats).toFixed(1)}%
            </span>
            <span>
              {t.common.monarch} {stats.monarch}
            </span>
          </div>
        </div>

        {returning && profile && (
          <p className="cs-col__meta">
            Lv {profile.level}
            {walletAddress && ` · ${shortWallet(walletAddress)}`}
          </p>
        )}

        {error && (
          <p className="cs-col__error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="cs-col__confirm"
          disabled={registering}
          onClick={() => {
            playUiClick();
            onConfirm();
          }}
        >
          {confirmLabel}
        </button>
      </aside>
    </div>
  );
}
