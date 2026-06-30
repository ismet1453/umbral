import type { PlayerProfile } from "@/lib/idleGame";
import { getItemInSlot } from "@/lib/equipmentSystem";
import type { GearItem } from "@/lib/lootSystem";
import { effectiveBonus } from "@/lib/enhanceSystem";

export function itemPowerScore(item: GearItem | null): number {
  return item ? effectiveBonus(item) : 0;
}

/** True if `candidate` is a strict upgrade over the same-slot `equipped`. */
export function shouldSuggest(
  candidate: GearItem,
  equipped: GearItem | null
): boolean {
  if (!equipped) return true;
  if (candidate.slot !== equipped.slot) return false;
  return itemPowerScore(candidate) > itemPowerScore(equipped);
}

/** All bag items that beat the currently-equipped item in their slot. */
export function findBetterItems(profile: PlayerProfile): GearItem[] {
  const equippedIds = new Set(
    Object.values(profile.equippedSlots).filter(
      (id): id is string => id !== null
    )
  );
  const inventory = profile.gearItems.filter((i) => !equippedIds.has(i.id));
  return inventory.filter((item) =>
    shouldSuggest(item, getItemInSlot(profile, item.slot))
  );
}

/** The single bag item with the largest power gain over what's worn. */
export function bestUpgrade(profile: PlayerProfile): GearItem | null {
  const better = findBetterItems(profile);
  if (better.length === 0) return null;

  const delta = (item: GearItem) =>
    itemPowerScore(item) - itemPowerScore(getItemInSlot(profile, item.slot));

  return better.reduce((best, cur) =>
    delta(cur) > delta(best) ? cur : best
  );
}
