"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { displayWallet, formatCountdown, lamportsToSol } from "@/lib/config";
import { SHOT_TIMELINE } from "@/lib/sceneConfig";
import type { PublicMatchView, RoundResolvedEvent } from "@/lib/types";
import { DirectionPicker } from "./DirectionPicker";

const PenaltyScene2D = dynamic(
  () => import("./scene2d/PenaltyScene2D").then((m) => m.PenaltyScene2D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#04070d] text-sm text-neon-cyan/50">
        Loading arena…
      </div>
    ),
  }
);

interface MatchViewProps {
  match: PublicMatchView;
  wallet: string;
  loading: boolean;
  lastRound: RoundResolvedEvent | null;
  onCommit: (direction: "left" | "center" | "right") => void;
  onReveal: () => void;
  onCancelWaiting: () => void;
  onPlayVsCpu: () => void;
  onLeave: () => void;
}

export function MatchView({
  match,
  wallet,
  loading,
  lastRound,
  onCommit,
  onReveal,
  onCancelWaiting,
  onPlayVsCpu,
  onLeave,
}: MatchViewProps) {
  const [now, setNow] = useState(Date.now());
  const [flashOutcome, setFlashOutcome] = useState<"goal" | "save" | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const round = match.currentRound;
  const roundIndex = round?.index ?? lastRound?.round.index ?? 0;
  const isCreator = match.creator.wallet === wallet;
  const myGoals = isCreator
    ? match.creator.goals
    : (match.opponent?.goals ?? 0);
  const theirGoals = isCreator
    ? (match.opponent?.goals ?? 0)
    : match.creator.goals;
  const opponentWallet = isCreator
    ? (match.opponent?.wallet ?? "—")
    : match.creator.wallet;

  const role =
    round && wallet === round.shooterWallet
      ? "shooter"
      : round && wallet === round.keeperWallet
        ? "keeper"
        : null;

  const alreadyCommitted = round?.commitsReceived.includes(wallet);
  const alreadyRevealed = round?.revealsReceived.includes(wallet);
  const deadline =
    round?.phase === "reveal" ? round.revealDeadline : round?.commitDeadline;

  const isActiveGame =
    match.phase.startsWith("round_") || match.phase === "starting";

  const lastOutcome =
    lastRound && lastRound.matchId === match.id
      ? lastRound.round.outcome
      : null;

  // Reveal the GOAL/SAVED flash only after the shot choreography completes
  useEffect(() => {
    if (!lastOutcome) {
      setFlashOutcome(null);
      return;
    }
    setFlashOutcome(null);
    const timer = setTimeout(
      () => setFlashOutcome(lastOutcome),
      SHOT_TIMELINE.resolve * 1000
    );
    return () => clearTimeout(timer);
  }, [lastOutcome, lastRound?.round.index, match.id]);

  const showPick =
    round &&
    match.phase === "round_commit" &&
    !alreadyCommitted &&
    Boolean(role);

  const showReveal =
    round &&
    match.phase === "round_reveal" &&
    !alreadyRevealed &&
    Boolean(role);

  useEffect(() => {
    if (!isActiveGame) return;
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [isActiveGame]);

  if (isActiveGame) {
    const roleLabel =
      role === "shooter" ? "You Strike" : role === "keeper" ? "You Guard" : "Watch";

    return (
      <div
        className={`match-arena fixed inset-0 z-50 bg-[#030508]${
          flashOutcome === "goal"
            ? " arena-shake arena-shake--goal"
            : flashOutcome === "save"
              ? " arena-shake arena-shake--save"
              : ""
        }`}
      >
        <PenaltyScene2D
          fullscreen
          shotOutcome={lastOutcome}
          roundIndex={roundIndex}
        />

        {/* Top HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pb-10 pt-4 md:px-8 md:pt-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4">
            <div className="hud-panel pointer-events-none px-5 py-3">
              <p className="hud-label">
                {match.suddenDeath ? "Sudden Death" : "Penalties"} · Round{" "}
                {roundIndex + 1}
              </p>
              <p className="mt-1 font-display text-lg font-black italic tracking-wide text-white md:text-2xl">
                <span className="neon-text">{roleLabel}</span>
                <span className="ml-2 text-xs font-semibold not-italic uppercase tracking-[0.25em] text-neon-ice/45">
                  · Striker vs Keeper
                </span>
              </p>
            </div>

            <div className="hud-scoreboard flex items-stretch gap-3 md:gap-4">
              <div className="hud-panel hud-panel--score px-5 py-3 text-center">
                <p className="hud-label">You</p>
                <p className="hud-score">{myGoals}</p>
              </div>
              <div className="flex items-center font-display text-2xl font-black italic tracking-widest text-neon-cyan/40 md:text-3xl">
                VS
              </div>
              <div className="hud-panel hud-panel--score px-5 py-3 text-center">
                <p className="hud-label">CPU</p>
                <p className="hud-score">{theirGoals}</p>
              </div>
              {deadline && (
                <div className="hud-panel hud-panel--score px-5 py-3 text-center">
                  <p className="hud-label">Time</p>
                  <p className="hud-score hud-score--time font-mono not-italic">
                    {formatCountdown(deadline, now)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goal / save flash — appears after the shot resolves */}
        {flashOutcome && (
          <>
            <div
              key={`flash-${flashOutcome}-${roundIndex}`}
              className={`impact-flash pointer-events-none absolute inset-0 z-10 ${
                flashOutcome === "goal" ? "impact-flash--goal" : "impact-flash--save"
              }`}
            />
            <div className="pointer-events-none absolute left-1/2 top-1/3 z-20 -translate-x-1/2">
              <span
                key={`impact-${flashOutcome}-${roundIndex}`}
                className={`impact-text font-display text-5xl font-black uppercase tracking-[0.15em] md:text-8xl ${
                  flashOutcome === "goal"
                    ? "impact-text--goal neon-text-strong"
                    : "impact-text--save"
                }`}
              >
                {flashOutcome === "goal" ? "GOAL!!" : "SAVED!"}
              </span>
            </div>
          </>
        )}

        {/* Center-bottom controls */}
        {(showPick || showReveal) && (
          <div className="match-controls absolute inset-x-0 bottom-0 z-30 flex flex-col items-center px-4">
            {showPick && (
              <>
                <p className="match-controls__hint mb-5 max-w-md text-center font-display text-base tracking-wide neon-text md:text-lg">
                  {role === "shooter"
                    ? "Pick your shot — opponent cannot see"
                    : "Pick your dive — opponent cannot see"}
                </p>
                <DirectionPicker
                  disabled={loading}
                  loading={loading}
                  onPick={onCommit}
                />
              </>
            )}

            {showReveal && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-center font-display tracking-wide neon-text">
                  Revealing your move…
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={onReveal}
                  className="btn-primary min-w-[200px] px-8 py-3 text-lg"
                >
                  {loading ? "Sending…" : "Reveal move"}
                </button>
              </div>
            )}

            {alreadyCommitted && round?.phase === "commit" && (
              <p className="mt-4 font-display text-sm tracking-wide neon-text animate-pulse-neon">
                Move locked — waiting for opponent…
              </p>
            )}
          </div>
        )}

        {/* Bet badge */}
        <div className="match-stake hud-panel pointer-events-none absolute z-20 px-3 py-1.5">
          <span className="hud-label">Stake</span>{" "}
          <span className="font-display text-sm font-bold neon-text">
            {lamportsToSol(match.betLamports)} SOL
          </span>
        </div>
      </div>
    );
  }

  /* Waiting lobby / finished */
  return (
    <div className="card mx-auto max-w-2xl overflow-hidden shadow-glow">
      <div className="border-b border-white/10 bg-pitch-800/60 px-6 py-4">
        <h2 className="text-xl font-bold">
          {match.phase === "waiting_opponent"
            ? "Waiting for opponent"
            : match.phase === "finished"
              ? "Match finished"
              : "Match"}
        </h2>
        <p className="text-sm text-white/50">
          Bet {lamportsToSol(match.betLamports)} SOL
        </p>
      </div>

      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-black/25 p-4 text-center">
          <div>
            <p className="text-xs text-white/50">You</p>
            <p className="text-3xl font-bold text-neon-lime">{myGoals}</p>
            <p className="text-xs text-white/40">{displayWallet(wallet, 5)}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Opponent</p>
            <p className="text-3xl font-bold">{theirGoals}</p>
            <p className="text-xs text-white/40">
              {displayWallet(opponentWallet, 5)}
            </p>
          </div>
        </div>

        {match.phase === "waiting_opponent" && isCreator && (
          <div className="space-y-2">
            <button type="button" onClick={onPlayVsCpu} className="btn-primary w-full">
              Play vs CPU
            </button>
            <button type="button" onClick={onCancelWaiting} className="btn-danger w-full">
              Cancel lobby
            </button>
          </div>
        )}

        {(match.phase === "finished" || match.phase === "cancelled") && (
          <button type="button" onClick={onLeave} className="btn-secondary w-full">
            Back to lobby
          </button>
        )}

        {match.phase === "waiting_opponent" && !isCreator && (
          <p className="text-center text-sm text-white/60">Waiting for opponent…</p>
        )}
      </div>
    </div>
  );
}
