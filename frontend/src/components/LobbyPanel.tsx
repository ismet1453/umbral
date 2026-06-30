"use client";

import { useState } from "react";
import { lamportsToSol, MIN_BET_SOL, shortenWallet } from "@/lib/config";
import type { PublicLobbyView } from "@/lib/types";

const QUICK_MATCH_PRESETS = [0.1, 0.5, 1];

interface LobbyPanelProps {
  lobbies: PublicLobbyView[];
  wallet: string | null;
  queued: boolean;
  onCreate: (sol: number) => void;
  onJoin: (matchId: string) => void;
  onQuickMatch: (sol: number) => void;
  onLeaveQueue: () => void;
}

export function LobbyPanel({
  lobbies,
  wallet,
  queued,
  onCreate,
  onJoin,
  onQuickMatch,
  onLeaveQueue,
}: LobbyPanelProps) {
  const disabled = !wallet;
  const [betAmount, setBetAmount] = useState("0.1");
  const [inputError, setInputError] = useState<string | null>(null);

  const parseBet = (): number | null => {
    const value = Number.parseFloat(betAmount.replace(",", "."));
    if (!Number.isFinite(value)) {
      setInputError("Enter a valid amount");
      return null;
    }
    if (value < MIN_BET_SOL) {
      setInputError(`Minimum bet is ${MIN_BET_SOL} SOL`);
      return null;
    }
    setInputError(null);
    return value;
  };

  const handleCreate = () => {
    const sol = parseBet();
    if (sol !== null) onCreate(sol);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className="card p-6 shadow-glow">
        <h2 className="mb-1 text-xl font-semibold">Create Match</h2>
        <p className="mb-5 text-sm text-white/60">
          Enter a bet amount and wait in the lobby, or use quick match.
        </p>

        <div className="mb-4">
          <label htmlFor="bet-amount" className="mb-2 block text-sm text-white/70">
            Bet amount (SOL)
          </label>
          <div className="flex gap-2">
            <input
              id="bet-amount"
              type="text"
              inputMode="decimal"
              value={betAmount}
              disabled={disabled}
              onChange={(e) => {
                setBetAmount(e.target.value);
                setInputError(null);
              }}
              placeholder={`Min ${MIN_BET_SOL}`}
              className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-white outline-none transition focus:border-neon-lime/50 disabled:opacity-40"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={handleCreate}
              className="btn-secondary shrink-0"
            >
              Open lobby
            </button>
          </div>
          {inputError && (
            <p className="mt-2 text-sm text-red-300">{inputError}</p>
          )}
          <p className="mt-2 text-xs text-white/40">Minimum {MIN_BET_SOL} SOL</p>
        </div>

        <p className="mb-2 text-sm text-white/70">Quick match vs CPU</p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_MATCH_PRESETS.map((sol) => (
            <button
              key={`q-${sol}`}
              type="button"
              disabled={disabled || queued}
              onClick={() => onQuickMatch(sol)}
              className="btn-primary text-sm"
              title="Instant match against CPU bot"
            >
              {sol} SOL
            </button>
          ))}
        </div>

        {queued && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-neon-lime/20 bg-neon-lime/5 px-4 py-3">
            <p className="text-sm text-neon-lime">
              Finding human opponent… (use Quick match for instant CPU)
            </p>
            <button type="button" onClick={onLeaveQueue} className="btn-danger text-sm">
              Cancel
            </button>
          </div>
        )}

        {!wallet && (
          <p className="mt-4 text-sm text-amber-200/80">
            Connect Phantom or set NEXT_PUBLIC_DEV_WALLET to play.
          </p>
        )}
      </section>

      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Open Lobbies</h2>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
            {lobbies.length} open
          </span>
        </div>

        {lobbies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/50">
            No open lobbies yet. Create the first match.
          </div>
        ) : (
          <ul className="space-y-3">
            {lobbies.map((lobby) => (
              <li
                key={lobby.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-neon-lime">
                    {lamportsToSol(lobby.betLamports)} SOL
                  </p>
                  <p className="text-xs text-white/50">
                    {shortenWallet(lobby.creatorWallet, 6)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={disabled || lobby.creatorWallet === wallet}
                  onClick={() => onJoin(lobby.id)}
                  className="btn-primary text-sm"
                >
                  Join
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
