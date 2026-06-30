"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { formatMsg } from "@/lib/i18n/format";
import { SLOT_ITEM_ICONS } from "@/lib/itemAssets";
import type { StatKey } from "@/lib/idleGame";
import type { GearItem } from "@/lib/lootSystem";

interface EquipSuggestToastProps {
  item: GearItem;
  onEquip: () => void;
  onDismiss: () => void;
}

export function EquipSuggestToast({
  item,
  onEquip,
  onDismiss,
}: EquipSuggestToastProps) {
  const g = useT().game;

  const statLabel: Record<StatKey, string> = {
    str: g.statStr,
    agi: g.statAgi,
    luk: g.statCc,
    monarch: g.statMonarch,
  };

  return (
    <div className="sl-equip-suggest sl-glass" role="status">
      <img
        className="sl-equip-suggest__icon"
        src={SLOT_ITEM_ICONS[item.slot]}
        alt=""
        draggable={false}
      />
      <div className="sl-equip-suggest__info">
        <span className="sl-equip-suggest__title">
          {g.equipSuggestTitle ?? "Better gear found!"}
        </span>
        <span
          className={`sl-equip-suggest__name sl-equip-suggest__name--${item.rarity}`}
        >
          {item.name.split("·")[0]?.trim()}
        </span>
        <span className="sl-equip-suggest__bonus">
          {formatMsg(g.equipSuggestBonus ?? "+{bonus} {stat}", {
            bonus: item.bonus,
            stat: statLabel[item.stat],
          })}
        </span>
      </div>
      <div className="sl-equip-suggest__actions">
        <button
          type="button"
          className="sl-equip-suggest__btn sl-equip-suggest__btn--equip"
          onClick={onEquip}
        >
          {g.equipSuggestEquip ?? "Equip"}
        </button>
        <button
          type="button"
          className="sl-equip-suggest__btn sl-equip-suggest__btn--dismiss"
          onClick={onDismiss}
        >
          {g.equipSuggestDismiss ?? "Dismiss"}
        </button>
      </div>
    </div>
  );
}
