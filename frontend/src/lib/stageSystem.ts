/** Chapter / stage progression constants */
export const CHAPTER_MAX = 10;
export const KILLS_PER_CHAPTER = 5;
export const DEATH_COOLDOWN_MS = 90 * 1000; // 90s — web session friendly
export const BOSS_INCOMING_DELAY_MS = 2800;
export const BOSS_LOOT_CHANCE = 0.3;

/** When boss chapter is reached without a Bloodstone, fall back to this chapter. */
export const BOSS_LOCKED_FALLBACK_CHAPTER = 9;

/** Berserker: cost, duration, and stat multipliers. */
export const BERSERK_DURATION_MS = 60 * 1000; // 1 minute (v1 demo)
export const BERSERK_STR_MULT = 2;
export const BERSERK_SPEED_MULT = 1.5;

export type StagePhase =
  | "normal"
  | "boss_incoming"
  | "boss_locked"
  | "boss_fight"
  | "dead";

export function isBossChapter(chapter: number): boolean {
  return chapter >= CHAPTER_MAX;
}

/** After a normal mob kill, return updated chapter + kills. */
export function advanceChapterOnMobKill(
  chapter: number,
  chapterKills: number
): { chapter: number; chapterKills: number; triggerBoss: boolean } {
  if (chapter >= CHAPTER_MAX) {
    return { chapter, chapterKills, triggerBoss: false };
  }

  const nextKills = chapterKills + 1;
  if (nextKills < KILLS_PER_CHAPTER) {
    return { chapter, chapterKills: nextKills, triggerBoss: false };
  }

  const nextChapter = Math.min(CHAPTER_MAX, chapter + 1);
  return {
    chapter: nextChapter,
    chapterKills: 0,
    triggerBoss: nextChapter >= CHAPTER_MAX,
  };
}

export function resetStageAfterBoss(): {
  chapter: number;
  chapterKills: number;
} {
  return { chapter: 1, chapterKills: 0 };
}

export function formatCooldownMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
