"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import type { HunterStats } from "@/lib/idleGame";
import type { GearSlot } from "@/lib/equipmentSystem";
import type { GearItem } from "@/lib/lootSystem";
import { PaperDoll } from "./PaperDoll";
import { InventoryGrid } from "./InventoryGrid";
import { EnhancePanel } from "./EnhancePanel";
import type { EnhanceOutcome } from "@/lib/enhanceSystem";

type PanelTab = "equip" | "bag" | "enhance";

interface EquipmentPanelProps {
  gearItems: GearItem[];
  equippedSlots: Record<GearSlot, string | null>;
  baseStats: HunterStats;
  effectiveStats: HunterStats;
  onEquip: (itemId: string, slot: GearSlot) => void;
  onUnequip: (slot: GearSlot) => void;
  onQuickEquip: (itemId: string) => void;
  onClose: () => void;
  walletCoin: number;
  protectionScrolls: number;
  onEnhance: (
    itemId: string,
    useScroll: boolean
  ) => EnhanceOutcome | { error: string };
  onBuyScroll: () => string | null;
}

export function EquipmentPanel({
  gearItems,
  equippedSlots,
  baseStats,
  effectiveStats,
  onEquip,
  onUnequip,
  onQuickEquip,
  onClose,
  walletCoin,
  protectionScrolls,
  onEnhance,
  onBuyScroll,
}: EquipmentPanelProps) {
  const g = useT().game;
  const [tab, setTab] = useState<PanelTab>("equip");

  const equippedIds = useMemo(
    () =>
      new Set(
        Object.values(equippedSlots).filter((id): id is string => id !== null)
      ),
    [equippedSlots]
  );

  const inventory = useMemo(
    () => gearItems.filter((i) => !equippedIds.has(i.id)),
    [gearItems, equippedIds]
  );

  const tabs: { id: PanelTab; label: string }[] = [
    { id: "equip", label: g.tabEquip ?? "Equipment" },
    {
      id: "bag",
      label: `${g.tabBag ?? "Bag"}${
        inventory.length > 0 ? ` (${inventory.length})` : ""
      }`,
    },
    { id: "enhance", label: g.tabEnhance ?? "Enhance" },
  ];

  const statDelta = (key: keyof HunterStats) =>
    effectiveStats[key] - baseStats[key];

  return (
    <div className="sl-ep">
      {/* ── Header: tabs + close ───────────────────────── */}
      <div className="sl-ep__header">
        <div className="sl-ep__tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`sl-ep__tab${tab === t.id ? " sl-ep__tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="sl-ep__close"
          onClick={onClose}
          aria-label={g.modalClose}
        >
          ✕
        </button>
      </div>

      {/* ── Body: paper doll (left) + tab panel (right) ── */}
      <div className="sl-ep__body">
        <div className="sl-ep__left">
          <PaperDoll
            gearItems={gearItems}
            equippedSlots={equippedSlots}
            onEquip={onEquip}
            onUnequip={onUnequip}
          />
          <p className="sl-ep__hint">{g.equipHint ?? "Drag & drop to equip"}</p>
        </div>

        <div className="sl-ep__right">
          {tab === "equip" && (
            <div className="sl-ep__summary">
              <PanelStat label={g.statStr} value={effectiveStats.str} delta={statDelta("str")} />
              <PanelStat label={g.statAgi} value={effectiveStats.agi} delta={statDelta("agi")} />
              <PanelStat label={g.statCc} value={effectiveStats.luk} delta={statDelta("luk")} />
              <PanelStat label={g.statMonarch} value={effectiveStats.monarch} delta={statDelta("monarch")} />
            </div>
          )}

          {tab === "bag" && (
            <InventoryGrid
              items={inventory}
              emptyLabel={g.bagEmpty ?? "Your bag is empty"}
              onQuickEquip={onQuickEquip}
              onDropFromEquip={onUnequip}
            />
          )}

          {tab === "enhance" && (
            <EnhancePanel
              gearItems={gearItems}
              walletCoin={walletCoin}
              protectionScrolls={protectionScrolls}
              onEnhance={onEnhance}
              onBuyScroll={onBuyScroll}
            />
          )}
        </div>
      </div>

      {/* ── Footer: stats strip ────────────────────────── */}
      <div className="sl-ep__stats">
        <span>{g.statStr} <b>{effectiveStats.str}</b>{statDelta("str") > 0 && <em> +{statDelta("str")}</em>}</span>
        <span>{g.statAgi} <b>{effectiveStats.agi}</b>{statDelta("agi") > 0 && <em> +{statDelta("agi")}</em>}</span>
        <span>{g.statCc} <b>{effectiveStats.luk}</b>{statDelta("luk") > 0 && <em> +{statDelta("luk")}</em>}</span>
        <span>{g.statMonarch} <b>{effectiveStats.monarch}</b>{statDelta("monarch") > 0 && <em> +{statDelta("monarch")}</em>}</span>
      </div>
    </div>
  );
}

function PanelStat({
  label,
  value,
  delta,
}: {
  label: string;
  value: number;
  delta: number;
}) {
  return (
    <div className="sl-ep__summary-stat">
      <span className="sl-ep__summary-label">{label}</span>
      <span className="sl-ep__summary-value">
        {value}
        {delta > 0 && <em> +{delta}</em>}
      </span>
    </div>
  );
}
