export type WeaponId = "longsword" | "axe" | "chainsaw";

export interface WeaponDef {
  id: WeaponId;
  name: string;
  emoji: string;
  attackIntervalMs: number; // overrides AGI-based interval
  strMultiplier: number;    // scales rollCombatDamage result
  hasShake: boolean;
  shakeIntensityPx: number;
  bodyFrame: "idle" | "stride"; // which idle frame to prefer
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  longsword: {
    id: "longsword",
    name: "Long Sword",
    emoji: "⚔",
    attackIntervalMs: 1000,
    strMultiplier: 1.0,
    hasShake: true,
    shakeIntensityPx: 1.5,
    bodyFrame: "idle",
  },
  axe: {
    id: "axe",
    name: "Battle Axe",
    emoji: "🪓",
    attackIntervalMs: 2000,
    strMultiplier: 2.5,
    hasShake: true,
    shakeIntensityPx: 3,
    bodyFrame: "idle",
  },
  chainsaw: {
    id: "chainsaw",
    name: "Chain Blade",
    emoji: "⚙",
    attackIntervalMs: 300,
    strMultiplier: 0.4,
    hasShake: false,
    shakeIntensityPx: 0,
    bodyFrame: "stride",
  },
};

export const WEAPON_STORAGE_KEY = "umbral-active-weapon";
