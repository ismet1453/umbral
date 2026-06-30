"use client";

import { useShotAnimation } from "./useShotAnimation";

type ShotOutcome = "goal" | "save" | null;

interface PenaltyScene2DProps {
  roundIndex?: number;
  shotOutcome?: ShotOutcome;
  fullscreen?: boolean;
}

const KEEPER_DIVE_CLASS: Record<string, string> = {
  left: "arena-portrait--dive-left",
  center: "arena-portrait--dive-center",
  right: "arena-portrait--dive-right",
};

export function PenaltyScene2D({
  shotOutcome,
  roundIndex = 0,
  fullscreen = false,
}: PenaltyScene2DProps) {
  const { ballX, ballY, keeperMode, keeperTarget } = useShotAnimation(
    shotOutcome,
    roundIndex
  );

  const keeperDive =
    keeperMode === "save" ? KEEPER_DIVE_CLASS[keeperTarget] ?? "" : "";

  return (
    <div
      className={
        fullscreen
          ? "arena absolute inset-0 overflow-hidden"
          : "arena relative h-[360px] w-full overflow-hidden rounded-none border border-neon-cyan/25"
      }
    >
      {/* Animated tech grid */}
      <div className="arena-grid" aria-hidden />
      <div className="arena-grid arena-grid--slow" aria-hidden />
      <div className="arena-vignette" aria-hidden />

      {/* Center VS neon line */}
      <div className="arena-vs-line" aria-hidden>
        <span className="arena-vs-badge">VS</span>
      </div>

      {/* Spotlight cone */}
      <div className="arena-spotlight" aria-hidden />

      {/* Cyber goal */}
      <div className="cyber-goal" aria-hidden>
        <div className="cyber-goal__frame" />
        <div className="cyber-goal__net" />
        <div className="cyber-goal__glow" />
      </div>

      {/* Keeper portrait */}
      <div
        className={`arena-portrait arena-portrait--keeper ${keeperDive}`}
        aria-label="Keeper"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/teto.jpg"
          alt="Keeper"
          className="arena-portrait__img arena-portrait__img--keeper"
          draggable={false}
        />
        <div className="arena-portrait__glow arena-portrait__glow--keeper" aria-hidden />
        <div className="arena-portrait__overlay">
          <span className="arena-portrait__label">KEEPER</span>
        </div>
      </div>

      {/* Striker portrait */}
      <div className="arena-portrait arena-portrait--striker" aria-label="Striker">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/miku.webp"
          alt="Striker"
          className="arena-portrait__img arena-portrait__img--striker"
          draggable={false}
        />
        <div className="arena-portrait__glow arena-portrait__glow--striker" aria-hidden />
        <div className="arena-portrait__overlay">
          <span className="arena-portrait__label">STRIKER</span>
        </div>
      </div>

      {/* Penalty spot */}
      <div className="arena-spot" aria-hidden />

      {/* Ball */}
      <div
        className="arena-ball"
        style={{ left: `${ballX}%`, top: `${ballY}%` }}
        aria-hidden
      />

      {/* Floating particles (CSS) */}
      <div className="arena-particles" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="arena-particle" style={{ animationDelay: `${i * 0.7}s` }} />
        ))}
      </div>
    </div>
  );
}
