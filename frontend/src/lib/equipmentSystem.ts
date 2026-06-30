import type { PlayerProfile } from "@/lib/idleGame";
import type { GearItem } from "@/lib/lootSystem";
import { GEAR_SLOTS, type GearSlot } from "@/lib/lootSystem";

export type { GearSlot };
export { GEAR_SLOTS };

type GearSlice = Pick<PlayerProfile, "gearItems" | "equippedSlots">;

/** Fixed layout — position implies slot type (no labels). */
export const EQUIP_SLOT_LAYOUT: readonly GearSlot[] = [
  "helm",
  "weapon",
  "armor",
  "gauntlet",
  "ring",
  "talisman",
];

export const INVENTORY_CAPACITY = 24;

/* ============================================================
   Weapon combat profile (drives attack cadence + damage scaling)
   v1: every weapon uses the "longsword" archetype.
   ============================================================ */

export type WeaponArchetype = "longsword";

export interface WeaponCombatProfile {
  archetype: WeaponArchetype;
  attackIntervalMs: number;
  strMultiplier: number;
  hasShake: boolean;
}

export const WEAPON_PROFILES: Record<WeaponArchetype, WeaponCombatProfile> = {
  longsword: {
    archetype: "longsword",
    attackIntervalMs: 1000,
    strMultiplier: 1.0,
    hasShake: true,
  },
};

/**
 * Resolve the combat profile from the equipped weapon item.
 * v1: all weapons map to the longsword archetype (incl. empty slot).
 */
export function getWeaponCombatProfile(
  _weaponItem: GearItem | null
): WeaponCombatProfile {
  return WEAPON_PROFILES.longsword;
}

export function emptyEquippedSlots(): Record<GearSlot, string | null> {
  return {
    weapon: null,
    armor: null,
    helm: null,
    gauntlet: null,
    ring: null,
    talisman: null,
  };
}

export function findGearItem(
  gearItems: GearItem[],
  itemId: string
): GearItem | undefined {
  return gearItems.find((i) => i.id === itemId);
}

export function getItemInSlot(
  profile: GearSlice,
  slot: GearSlot
): GearItem | null {
  const id = profile.equippedSlots[slot];
  if (!id) return null;
  return findGearItem(profile.gearItems, id) ?? null;
}

export function getEquippedGear(profile: GearSlice): GearItem[] {
  return GEAR_SLOTS.map((slot) => getItemInSlot(profile, slot)).filter(
    (i): i is GearItem => i !== null
  );
}

export function getEquippedItemIds(profile: GearSlice): Set<string> {
  return new Set(
    GEAR_SLOTS.map((s) => profile.equippedSlots[s]).filter(
      (id): id is string => id !== null
    )
  );
}

export function getInventoryItems(profile: GearSlice): GearItem[] {
  const equipped = getEquippedItemIds(profile);
  return profile.gearItems.filter((i) => !equipped.has(i.id));
}

export function canEquipToSlot(item: GearItem, slot: GearSlot): boolean {
  return item.slot === slot;
}

export function equipItem(
  profile: PlayerProfile,
  itemId: string,
  targetSlot: GearSlot
): PlayerProfile {
  const item = findGearItem(profile.gearItems, itemId);
  if (!item || !canEquipToSlot(item, targetSlot)) return profile;

  const slots = { ...profile.equippedSlots };

  for (const s of GEAR_SLOTS) {
    if (slots[s] === itemId) slots[s] = null;
  }

  const displacedId = slots[targetSlot];
  slots[targetSlot] = itemId;

  if (displacedId && displacedId !== itemId) {
    const displaced = findGearItem(profile.gearItems, displacedId);
    if (displaced && displaced.slot !== targetSlot) {
      const free = GEAR_SLOTS.find(
        (s) => s !== targetSlot && slots[s] === null && displaced.slot === s
      );
      if (free) slots[free] = displacedId;
    }
  }

  return { ...profile, equippedSlots: slots };
}

export function unequipSlot(
  profile: PlayerProfile,
  slot: GearSlot
): PlayerProfile {
  if (!profile.equippedSlots[slot]) return profile;
  const slots = { ...profile.equippedSlots, [slot]: null };
  return { ...profile, equippedSlots: slots };
}

/** Click inventory item → first matching empty slot, or swap if full. */
export function quickEquip(profile: PlayerProfile, itemId: string): PlayerProfile {
  const item = findGearItem(profile.gearItems, itemId);
  if (!item) return profile;

  const empty = GEAR_SLOTS.find(
    (s) => profile.equippedSlots[s] === null && item.slot === s
  );
  if (empty) return equipItem(profile, itemId, empty);

  const occupied = GEAR_SLOTS.find((s) => profile.equippedSlots[s] !== null && item.slot === s);
  if (occupied) return equipItem(profile, itemId, occupied);

  return profile;
}

function inferLegacySlot(item: Partial<GearItem> & { name?: string }): GearSlot {
  if (item.slot && GEAR_SLOTS.includes(item.slot)) return item.slot;
  const n = (item.name ?? "").toLowerCase();
  if (n.includes("ring")) return "ring";
  if (n.includes("gauntlet") || n.includes("glove")) return "gauntlet";
  if (n.includes("helm") || n.includes("helmet")) return "helm";
  if (n.includes("talisman") || n.includes("sigil") || n.includes("amulet"))
    return "talisman";
  if (
    n.includes("chest") ||
    n.includes("armor") ||
    n.includes("plate") ||
    n.includes("hauberk")
  )
    return "armor";
  if (n.includes("sword") || n.includes("blade") || n.includes("axe"))
    return "weapon";
  return "weapon";
}

export function normalizeGearItem(
  raw: Partial<GearItem> & { equippedAt?: number }
): GearItem {
  const slot = inferLegacySlot(raw);
  return {
    id: raw.id ?? `item-${Date.now()}`,
    slot,
    name: raw.name ?? `Worn ${slot}`,
    stat: raw.stat ?? "str",
    bonus: raw.bonus ?? 1,
    rarity: raw.rarity ?? "common",
    level: raw.level ?? 1,
    enhance: raw.enhance ?? 0,
    acquiredAt: raw.acquiredAt ?? raw.equippedAt ?? Date.now(),
  };
}

/** Migrate legacy `equippedItems[]` (all counted as worn) into bag + slots. */
export function migrateLegacyEquipped(
  legacy: Array<Partial<GearItem> & { equippedAt?: number }>
): Pick<PlayerProfile, "gearItems" | "equippedSlots"> {
  const gearItems = legacy.map(normalizeGearItem);
  const equippedSlots = emptyEquippedSlots();

  for (const slot of GEAR_SLOTS) {
    const best = gearItems
      .filter((i) => i.slot === slot)
      .sort((a, b) => b.bonus - a.bonus)[0];
    if (best) equippedSlots[slot] = best.id;
  }

  return { gearItems, equippedSlots };
}

export function normalizeEquippedSlots(
  raw: Partial<Record<GearSlot, string | null>> | undefined
): Record<GearSlot, string | null> {
  const base = emptyEquippedSlots();
  if (!raw) return base;
  for (const slot of GEAR_SLOTS) {
    const id = raw[slot];
    base[slot] = typeof id === "string" ? id : null;
  }
  return base;
}
