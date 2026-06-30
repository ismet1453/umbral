/**
 * Game pacing helpers (TBH-inspired).
 *
 * NOTE: UMBRAL grants NO offline / AFK rewards — the game must stay open to
 * earn. Offline XP/essence helpers are intentionally absent.
 */

/** Hard cap on item level (mirrors lootSystem.MAX_ITEM_LEVEL). */
const ITEM_LEVEL_CAP = 99;

/** Derive an item level from chapter progression (chapter 1 → Lv.10, etc.). */
export function itemLevelFromChapter(chapter: number): number {
  return Math.min(ITEM_LEVEL_CAP, Math.max(1, chapter * 10));
}
