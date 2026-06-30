"use client";

import { useEffect } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { formatMsg } from "@/lib/i18n/format";
import type { LeaderboardEntry } from "@/lib/firebase/syncProfile";

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  selfWallet: string | null;
  onRefresh: () => void;
  onClose: () => void;
}

export function LeaderboardPanel({
  entries,
  loading,
  selfWallet,
  onRefresh,
  onClose,
}: LeaderboardPanelProps) {
  const g = useT().game;

  useEffect(() => {
    onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sl-leaderboard">
      <div className="sl-leaderboard__header">
        <span className="sl-leaderboard__title">
          {g.leaderboardTitle ?? "Hunter Rankings"}
        </span>
        <button
          type="button"
          className="sl-leaderboard__close"
          onClick={onClose}
          aria-label={g.modalClose}
        >
          ✕
        </button>
      </div>

      <div className="sl-leaderboard__cols">
        <span className="sl-leaderboard__col sl-leaderboard__col--rank">
          {g.leaderboardRank ?? "Rank"}
        </span>
        <span className="sl-leaderboard__col sl-leaderboard__col--name">
          {g.leaderboardHunter ?? "Hunter"}
        </span>
        <span className="sl-leaderboard__col sl-leaderboard__col--level">
          {g.leaderboardLevel ?? "Level"}
        </span>
      </div>

      <div className="sl-leaderboard__body">
        {loading ? (
          <p className="sl-leaderboard__state">
            {g.leaderboardLoading ?? "Loading…"}
          </p>
        ) : entries.length === 0 ? (
          <p className="sl-leaderboard__state">
            {g.leaderboardEmpty ?? "No rankings yet"}
          </p>
        ) : (
          entries.map((e) => {
            const isSelf = selfWallet != null && e.walletAddress === selfWallet;
            return (
              <div
                key={e.walletAddress}
                className={`sl-leaderboard__row${
                  isSelf ? " sl-leaderboard__row--self" : ""
                }`}
              >
                <span className="sl-leaderboard__col sl-leaderboard__col--rank">
                  {e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : `#${e.rank}`}
                </span>
                <span className="sl-leaderboard__col sl-leaderboard__col--name">
                  {e.hunterName}
                  {isSelf && (
                    <em className="sl-leaderboard__you">
                      {" "}
                      ({g.leaderboardYou ?? "You"})
                    </em>
                  )}
                </span>
                <span className="sl-leaderboard__col sl-leaderboard__col--level">
                  {formatMsg(g.leaderboardLevelValue ?? "Lv.{level}", {
                    level: e.level,
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>

      <button
        type="button"
        className="sl-leaderboard__refresh"
        onClick={onRefresh}
        disabled={loading}
      >
        {g.leaderboardRefresh ?? "Refresh"}
      </button>
    </div>
  );
}
