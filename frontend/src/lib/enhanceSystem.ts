import type { GearItem } from "@/lib/lootSystem";
import type { PlayerProfile } from "@/lib/idleGame";

export const MAX_ENHANCE = 9;

/** Success % when attempting +1 … +9 (index = current enhance level). */
export const ENHANCE_SUCCESS_PCT = [100, 90, 80, 70, 55, 45, 35, 25, 15] as const;

/** Each + level adds this fraction to the item's base bonus. */
export const ENHANCE_BONUS_PER_LEVEL = 0.06;

export const PROTECTION_SCROLL_COST = 5_000;

export type EnhanceOutcome = "success" | "fail" | "break";

export function canEnhance(item: GearItem | null): boolean {
  return item !== null && item.enhance < MAX_ENHANCE;
}

/** Coin cost to attempt +1 from `currentEnhance`. */
export function enhanceCoinCost(currentEnhance: number): number {
  if (currentEnhance >= MAX_ENHANCE) return 0;
  return Math.floor(500 * Math.pow(1.65, currentEnhance));
}

/** Display success rate for the next + attempt. */
export function successRatePercent(currentEnhance: number): number {
  if (currentEnhance >= MAX_ENHANCE) return 0;
  return ENHANCE_SUCCESS_PCT[currentEnhance] ?? 0;
}

/** Stat bonus after enhancement tiers. */
export function effectiveBonus(item: GearItem): number {
  const mult = 1 + item.enhance * ENHANCE_BONUS_PER_LEVEL;
  return Math.max(1, Math.round(item.bonus * mult));
}

/**
 * Roll raw outcome (before scroll protection).
 * +5 attempt and above (current >= 4): fail without scroll → 50% break / 50% fail.
 */
export function rollEnhanceOutcome(
  currentEnhance: number,
  hasScroll: boolean
): EnhanceOutcome {
  if (currentEnhance >= MAX_ENHANCE) return "fail";

  const rate = (ENHANCE_SUCCESS_PCT[currentEnhance] ?? 0) / 100;
  if (Math.random() < rate) return "success";

  // Failed — check break risk (+5 and above attempts).
  if (currentEnhance >= 4 && !hasScroll) {
    return Math.random() < 0.5 ? "break" : "fail";
  }
  return "fail";
}

export interface EnhanceAttemptResult {
  profile: PlayerProfile;
  outcome: EnhanceOutcome;
  scrollConsumed: boolean;
}

/**
 * Apply one enhance attempt: deduct coin, roll, update item or remove on break.
 * Scroll is consumed only when it prevents a break.
 */
export function applyEnhanceAttempt(
  profile: PlayerProfile,
  itemId: string,
  useScroll: boolean
): EnhanceAttemptResult | { error: string } {
  const item = profile.gearItems.find((i) => i.id === itemId);
  if (!item) return { error: "Item not found" };
  if (!canEnhance(item)) return { error: "Already max enhance" };

  const cost = enhanceCoinCost(item.enhance);
  if (profile.walletCoin < cost) return { error: "Not enough UMBRAL Coin" };
  if (useScroll && profile.protectionScrolls < 1) {
    return { error: "No protection scroll" };
  }

  let outcome = rollEnhanceOutcome(item.enhance, useScroll);
  let scrollConsumed = false;

  if (outcome === "break" && useScroll) {
    outcome = "fail";
    scrollConsumed = true;
  }

  let gearItems = profile.gearItems;
  let equippedSlots = profile.equippedSlots;

  if (outcome === "success") {
    gearItems = gearItems.map((i) =>
      i.id === itemId ? { ...i, enhance: i.enhance + 1 } : i
    );
  } else if (outcome === "break") {
    gearItems = gearItems.filter((i) => i.id !== itemId);
    equippedSlots = { ...equippedSlots };
    for (const slot of Object.keys(equippedSlots) as (keyof typeof equippedSlots)[]) {
      if (equippedSlots[slot] === itemId) equippedSlots[slot] = null;
    }
  }

  return {
    profile: {
      ...profile,
      walletCoin: profile.walletCoin - cost,
      protectionScrolls: scrollConsumed
        ? profile.protectionScrolls - 1
        : profile.protectionScrolls,
      gearItems,
      equippedSlots,
    },
    outcome,
    scrollConsumed,
  };
}

export function buyProtectionScroll(
  profile: PlayerProfile
): PlayerProfile | { error: string } {
  if (profile.walletCoin < PROTECTION_SCROLL_COST) {
    return { error: "Not enough UMBRAL Coin" };
  }
  return {
    ...profile,
    walletCoin: profile.walletCoin - PROTECTION_SCROLL_COST,
    protectionScrolls: profile.protectionScrolls + 1,
  };
}
