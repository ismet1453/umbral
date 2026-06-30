import type { GearSlot } from "@/lib/lootSystem";
import type { ItemRarity } from "@/lib/lootSystem";

/** Kenney UI Pack RPG Expansion (CC0) — /public/assets/kenney/rpg-ui/PNG */
const K = "/assets/kenney/rpg-ui/PNG";

export const UI_ASSETS = {
  panelBg: `${K}/panel_beige.png`,
  equipSlotFrame: `${K}/panel_brown.png`,
  inventoryCell: `${K}/panelInset_beige.png`,
  plus9Badge: `${K}/iconCircle_grey.png`,
} as const;

export const SLOT_ITEM_ICONS: Record<GearSlot, string> = {
  weapon: `${K}/cursorSword_silver.png`,
  armor: `${K}/panel_blue.png`,
  helm: `${K}/iconCircle_blue.png`,
  gauntlet: `${K}/cursorGauntlet_bronze.png`,
  ring: `${K}/iconCircle_grey.png`,
  talisman: `${K}/iconCross_brown.png`,
};

export const RARITY_FRAMES: Record<ItemRarity, string> = {
  common: `${K}/iconCircle_blue.png`,
  rare: `${K}/iconCircle_brown.png`,
  epic: `${K}/iconCircle_beige.png`,
  legendary: `${K}/cursorSword_gold.png`,
};
