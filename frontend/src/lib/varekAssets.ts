export type VarekWeaponId = "longsword" | "axe" | "chainsaw";

export interface WeaponDef {
  id: VarekWeaponId;
  label: string;
  baseIntervalMs: number;
  strMultiplier: number;
  critMultiplier: number;
  shake: "none" | "light" | "heavy";
  blood: "normal" | "heavy";
  icon: string;
}

export const WEAPON_DEFS: Record<VarekWeaponId, WeaponDef> = {
  longsword: {
    id: "longsword",
    label: "Longsword",
    baseIntervalMs: 1000,
    strMultiplier: 1.0,
    critMultiplier: 2.2,
    shake: "light",
    blood: "normal",
    icon: "⚔",
  },
  axe: {
    id: "axe",
    label: "Battle Axe",
    baseIntervalMs: 2000,
    strMultiplier: 2.5,
    critMultiplier: 3.0,
    shake: "heavy",
    blood: "normal",
    icon: "🪓",
  },
  chainsaw: {
    id: "chainsaw",
    label: "Chainsaw Blade",
    baseIntervalMs: 300,
    strMultiplier: 0.4,
    critMultiplier: 1.8,
    shake: "none",
    blood: "heavy",
    icon: "⚙",
  },
};

const K = "/assets/kenney/rpg-ui/PNG";

export function weaponInterval(weapon: WeaponDef, agi: number): number {
  const agiFactor = 1 + agi / 120;
  return Math.max(160, Math.round(weapon.baseIntervalMs / agiFactor));
}

export function computeWeaponDamage(
  weapon: WeaponDef,
  str: number,
  luk: number
): { amount: number; crit: boolean } {
  const critChance = Math.min(0.75, luk * 0.0085);
  const crit = Math.random() < critChance;
  const base = (20 + str * 5.5) * weapon.strMultiplier;
  const amount = Math.floor(base * (crit ? weapon.critMultiplier : 1));
  return { amount, crit };
}

/** Body idle frames (Kenney CC0 placeholders until custom Varek art ships). */
export const VAREK_BODY_IDLE_FRAMES = [
  `${K}/cursorHand_beige.png`,
  `${K}/cursorHand_beige.png`,
  `${K}/cursorHand_grey.png`,
] as const;

export const VAREK_WEAPONS: Record<
  VarekWeaponId,
  { idle: string; swing: string }
> = {
  longsword: {
    idle: `${K}/cursorSword_silver.png`,
    swing: `${K}/cursorSword_gold.png`,
  },
  axe: {
    idle: `${K}/cursorSword_silver.png`,
    swing: `${K}/cursorSword_gold.png`,
  },
  chainsaw: {
    idle: `${K}/cursorSword_silver.png`,
    swing: `${K}/cursorSword_gold.png`,
  },
};
