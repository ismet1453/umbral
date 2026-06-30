import type { HunterStats, StatKey } from "@/lib/idleGame";
import { applyStatBonus } from "@/lib/idleGame";
import { itemLevelFromChapter } from "@/lib/gamePacing";
import { effectiveBonus } from "@/lib/enhanceSystem";

export type ChestType = "common" | "boss";
export type ItemRarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_ORDER: ItemRarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
];

export const RARITY_LABEL: Record<ItemRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/** Multiplier applied to an item's base bonus per rarity tier. */
export const RARITY_MULTIPLIER: Record<ItemRarity, number> = {
  common: 1,
  rare: 2.2,
  epic: 4.5,
  legendary: 9,
};

export const MERGE_REQUIRED = 5;
export const MAX_ITEM_LEVEL = 99;

export const GEAR_SLOTS = [
  "weapon",
  "armor",
  "helm",
  "gauntlet",
  "ring",
  "talisman",
] as const;

export type GearSlot = (typeof GEAR_SLOTS)[number];

export interface StoredChest {
  id: string;
  type: ChestType;
  earnedAt: number;
}

export interface GearItem {
  id: string;
  /** Item type — ring gear only fits the ring slot, etc. */
  slot: GearSlot;
  name: string;
  stat: StatKey;
  bonus: number;
  rarity: ItemRarity;
  level: number;
  /** Enhancement tier 0–9 (+badge overlay when > 0). */
  enhance: number;
  acquiredAt: number;
}

/** @deprecated Alias — use GearItem */
export type EquippedItem = GearItem;

export const PITY_MIN_MS = 3 * 60 * 1000;
export const PITY_MAX_MS = 10 * 60 * 1000;

/** Chance a slain mob / timed chest yields a Bloodstone key. */
export const BLOODSTONE_DROP_CHANCE = 0.05;

const RARITY_PREFIXES: Record<ItemRarity, readonly string[]> = {
  common: ["Rusty", "Worn", "Cracked", "Dusty"],
  rare: ["Honed", "Tempered", "Gleaming", "Silvered"],
  epic: ["Umbral", "Cursed", "Vengeful", "Eclipsed"],
  legendary: ["Throne", "Godforged", "Eternal", "Sovereign"],
};

const SLOT_ITEM_NAMES: Record<GearSlot, readonly string[]> = {
  weapon: ["Longsword", "Greatsword", "Umbral Blade", "War Axe"],
  armor: ["Chestplate", "Hauberk", "Plate Cuirass"],
  helm: ["Great Helm", "Visored Helm", "Crown Helm"],
  gauntlet: ["Gauntlet", "Iron Grips", "War Gloves"],
  ring: ["Signet Ring", "Umbral Band", "Blood Seal"],
  talisman: ["Talisman", "Void Sigil", "Fractured Relic"],
};

const STAT_LABELS: Record<StatKey, string> = {
  str: "STR",
  agi: "AGI",
  luk: "LUK",
  monarch: "MONARCH",
};

export function randomPityDurationMs(): number {
  return (
    PITY_MIN_MS + Math.floor(Math.random() * (PITY_MAX_MS - PITY_MIN_MS + 1))
  );
}

export function createChestId(): string {
  return `chest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Bonus = base × rarity multiplier × (1 + level/12), rounded. */
export function computeItemBonus(rarity: ItemRarity, level: number): number {
  const base = 3;
  const raw = base * RARITY_MULTIPLIER[rarity] * (1 + level / 12);
  return Math.max(1, Math.round(raw));
}

function buildItem(
  rarity: ItemRarity,
  level: number,
  statPool: StatKey[],
  slot?: GearSlot
): GearItem {
  const gearSlot = slot ?? pick(GEAR_SLOTS);
  const stat = pick(statPool);
  const bonus = computeItemBonus(rarity, level);
  const prefix = pick(RARITY_PREFIXES[rarity]);
  const itemType = pick(SLOT_ITEM_NAMES[gearSlot]);
  return {
    id: createItemId(),
    slot: gearSlot,
    name: `Lv.${level} ${prefix} ${itemType} · +${bonus} ${STAT_LABELS[stat]}`,
    stat,
    bonus,
    rarity,
    level,
    enhance: 0,
    acquiredAt: Date.now(),
  };
}

/** Weighted rarity roll for a boss chest (high-tier skew). */
function rollRarity(isBoss: boolean): ItemRarity {
  const r = Math.random();
  if (isBoss) {
    if (r < 0.08) return "legendary";
    if (r < 0.45) return "epic";
    if (r < 0.85) return "rare";
    return "common";
  }
  if (r < 0.01) return "legendary";
  if (r < 0.08) return "epic";
  if (r < 0.28) return "rare";
  return "common";
}

/**
 * TBH-inspired rarity roll scaled by chapter progression.
 * Higher chapters (→ higher item level) unlock better odds.
 */
export function rollRarityByChapter(chapter: number): ItemRarity {
  const lv = itemLevelFromChapter(chapter);
  const r = Math.random();
  if (lv >= 50) {
    if (r < 0.12) return "legendary";
    if (r < 0.35) return "epic";
    if (r < 0.65) return "rare";
    return "common";
  }
  if (lv >= 20) {
    if (r < 0.05) return "legendary";
    if (r < 0.2) return "epic";
    if (r < 0.45) return "rare";
    return "common";
  }
  if (r < 0.02) return "legendary";
  if (r < 0.1) return "epic";
  if (r < 0.3) return "rare";
  return "common";
}

/** Roll a placeholder loot item with rarity + level scaled by chapter. */
export function rollLootItem(isBoss: boolean, chapter: number): GearItem {
  const statPool: StatKey[] = isBoss
    ? ["str", "agi", "luk", "monarch"]
    : ["str", "agi", "luk"];

  if (isBoss) {
    // Boss loot keeps the high-tier skew + high level band.
    const rarity = rollRarity(true);
    const level = Math.floor(Math.random() * 50) + 50;
    return buildItem(rarity, level, statPool);
  }

  const rarity = rollRarityByChapter(chapter);
  // ±2 jitter around the chapter's item level, clamped 1–99.
  const base = itemLevelFromChapter(chapter);
  const level = Math.min(
    MAX_ITEM_LEVEL,
    Math.max(1, base + Math.floor(Math.random() * 5) - 2)
  );
  return buildItem(rarity, level, statPool);
}

/** Next rarity up (legendary stays legendary). */
export function nextRarity(rarity: ItemRarity): ItemRarity {
  const idx = RARITY_ORDER.indexOf(rarity);
  return RARITY_ORDER[Math.min(RARITY_ORDER.length - 1, idx + 1)]!;
}

/**
 * Merge MERGE_REQUIRED items of the same rarity into one of the next tier.
 * Result level = average of merged levels (+ small bonus), clamped to 99.
 */
export function mergeItems(items: GearItem[]): GearItem | null {
  if (items.length !== MERGE_REQUIRED) return null;
  const rarity = items[0]!.rarity;
  if (!items.every((i) => i.rarity === rarity)) return null;

  const avgLevel = Math.round(
    items.reduce((sum, i) => sum + i.level, 0) / items.length
  );
  const resultLevel = Math.min(MAX_ITEM_LEVEL, avgLevel + 5);
  const resultRarity = nextRarity(rarity);
  const statPool: StatKey[] = ["str", "agi", "luk", "monarch"];
  const slot = items[0]!.slot;
  return buildItem(resultRarity, resultLevel, statPool, slot);
}

export function applyEquippedItems(
  base: HunterStats,
  items: GearItem[]
): HunterStats {
  return items.reduce(
    (stats, item) => applyStatBonus(stats, item.stat, effectiveBonus(item)),
    base
  );
}

export function totalEquippedBonus(
  items: GearItem[],
  stat: StatKey
): number {
  return items
    .filter((i) => i.stat === stat)
    .reduce((sum, i) => sum + effectiveBonus(i), 0);
}

/** Count items grouped by rarity (for merge UI availability). */
export function countByRarity(
  items: GearItem[]
): Record<ItemRarity, number> {
  const counts: Record<ItemRarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  for (const item of items) counts[item.rarity] += 1;
  return counts;
}
