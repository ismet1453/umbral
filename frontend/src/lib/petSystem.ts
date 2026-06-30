import type { HunterStats } from "@/lib/idleGame";

export type PetEffectKind = "xp_gain" | "crit_chance" | "flat_str";

export interface PetDef {
  kind: PetEffectKind;
  name: string;
  emoji: string;
  /** Magnitude: percent for xp_gain/crit_chance, flat points for flat_str */
  value: number;
  description: string;
}

export interface Pet {
  id: string;
  kind: PetEffectKind;
  name: string;
  emoji: string;
  value: number;
}

export const PET_SLOTS = 3;

/** Drop chance for a pet from any chest. */
export const PET_DROP_CHANCE = 0.12;

export const PET_DEFS: PetDef[] = [
  {
    kind: "xp_gain",
    name: "Shade Imp",
    emoji: "👾",
    value: 20,
    description: "+20% Essence & XP",
  },
  {
    kind: "crit_chance",
    name: "Ember Wisp",
    emoji: "🔥",
    value: 10,
    description: "+10% Crit Chance",
  },
  {
    kind: "flat_str",
    name: "Stone Golem",
    emoji: "🗿",
    value: 50,
    description: "+50 STR",
  },
];

export function createPetId(): string {
  return `pet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function rollPet(): Pet {
  const def = PET_DEFS[Math.floor(Math.random() * PET_DEFS.length)]!;
  return {
    id: createPetId(),
    kind: def.kind,
    name: def.name,
    emoji: def.emoji,
    value: def.value,
  };
}

export interface PetEffects {
  /** Multiplier on XP / gold gain (1 = none) */
  gainMultiplier: number;
  /** Additional crit chance percentage points */
  critBonus: number;
  /** Flat STR added */
  flatStr: number;
}

/** Aggregate effects from equipped pets (null slots ignored). */
export function computePetEffects(
  pets: Pet[],
  equippedPetIds: (string | null)[]
): PetEffects {
  const equipped = equippedPetIds
    .map((id) => (id ? pets.find((p) => p.id === id) : null))
    .filter((p): p is Pet => Boolean(p));

  let gainMultiplier = 1;
  let critBonus = 0;
  let flatStr = 0;

  for (const pet of equipped) {
    if (pet.kind === "xp_gain") gainMultiplier += pet.value / 100;
    else if (pet.kind === "crit_chance") critBonus += pet.value;
    else if (pet.kind === "flat_str") flatStr += pet.value;
  }

  return { gainMultiplier, critBonus, flatStr };
}

/** Apply pet flat-stat effects to a stats object. */
export function applyPetStats(
  stats: HunterStats,
  effects: PetEffects
): HunterStats {
  return { ...stats, str: stats.str + effects.flatStr };
}
