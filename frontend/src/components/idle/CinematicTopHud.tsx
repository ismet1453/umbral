"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { formatMsg } from "@/lib/i18n/format";
import { formatGold } from "@/lib/idleGame";

interface CinematicTopHudProps {
  level: number;
  xpPct: number;
  currentChapter: number;
  chapterMax: number;
  chapterKills: number;
  killsPerChapter: number;
  essence: number;
  essencePerSec: number;
  coin: number;
  enemyName: string;
  isBoss: boolean;
  enemyHpPct: number;
  varekHp: number;
  varekMaxHp: number;
  varekDeathFlash: boolean;
}

export function CinematicTopHud({
  level,
  xpPct,
  currentChapter,
  chapterMax,
  chapterKills,
  killsPerChapter,
  essence,
  essencePerSec,
  coin,
  enemyName,
  isBoss,
  enemyHpPct,
  varekHp,
  varekMaxHp,
  varekDeathFlash,
}: CinematicTopHudProps) {
  const g = useT().game;
  const varekHpPct = Math.max(0, (varekHp / varekMaxHp) * 100);
  const varekHpLow = varekHpPct < 25;

  return (
    <header className="sl-cine-top sl-glass">
      {/* Chapter */}
      <div className="sl-cine-top__stat sl-cine-top__stat--chapter">
        <span className="sl-cine-top__label">{g.chapterLabel}</span>
        <span className="sl-cine-top__value sl-cine-top__value--chapter">
          {formatMsg(g.chapterProgress, {
            cur: currentChapter,
            max: chapterMax,
          })}
        </span>
        <span className="sl-cine-top__sub">
          {formatMsg(g.chapterKills, {
            cur: chapterKills,
            max: killsPerChapter,
          })}
        </span>
      </div>

      {/* Varek HP */}
      <div className="sl-cine-top__stat">
        <span className="sl-cine-top__label">{g.statHp}</span>
        <div
          className={`sl-cine-top__hp-bar sl-cine-top__hp-bar--varek${varekDeathFlash ? " sl-cine-top__hp-bar--flash" : ""}`}
          aria-label={`Varek HP: ${Math.round(varekHpPct)}%`}
        >
          <div
            className={`sl-cine-top__hp-fill sl-cine-top__hp-fill--varek${varekHpLow ? " sl-cine-top__hp-fill--low" : ""}`}
            style={{ width: `${varekHpPct}%` }}
          />
        </div>
        <span className="sl-cine-top__sub">
          {Math.floor(varekHp)} / {varekMaxHp}
        </span>
      </div>

      {/* Level + XP */}
      <div className="sl-cine-top__stat sl-cine-top__stat--level">
        <span className="sl-cine-top__label">{g.statLevel}</span>
        <span className="sl-cine-top__value sl-cine-top__value--gold">
          {level}
          <span className="sl-cine-top__sub">/ 99</span>
        </span>
        <div className="sl-cine-top__xp-bar" aria-hidden>
          <div
            className="sl-cine-top__xp-fill"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      {/* Essence (idle currency) */}
      <div className="sl-cine-top__stat">
        <span className="sl-cine-top__label">{g.statGold}</span>
        <span className="sl-cine-top__value">{formatGold(essence)}</span>
        <span className="sl-cine-top__sub">
          {formatMsg(g.statGoldPerSec, { amount: formatGold(essencePerSec) })}
        </span>
      </div>

      {/* UMBRAL Coin (claimed currency) */}
      <div className="sl-cine-top__stat">
        <span className="sl-cine-top__label">{g.statToken}</span>
        <span className="sl-cine-top__value">{formatGold(coin)}</span>
      </div>

      {/* Enemy target */}
      <div className="sl-cine-top__target">
        <span
          className={`sl-cine-top__badge${isBoss ? " sl-cine-top__badge--boss" : ""}`}
        >
          {isBoss ? g.enemyBoss : g.enemyMob}
        </span>
        <div className="sl-cine-top__enemy-info">
          <span className="sl-cine-top__enemy">{enemyName}</span>
          <div
            className="sl-cine-top__hp-bar"
            aria-label={`Enemy HP: ${Math.round(enemyHpPct)}%`}
          >
            <div
              className={`sl-cine-top__hp-fill${isBoss ? " sl-cine-top__hp-fill--boss" : ""}`}
              style={{ width: `${Math.max(0, enemyHpPct)}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
