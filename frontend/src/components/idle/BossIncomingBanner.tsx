"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { formatMsg } from "@/lib/i18n/format";

interface BossIncomingBannerProps {
  visible: boolean;
}

export function BossIncomingBanner({ visible }: BossIncomingBannerProps) {
  const g = useT().game;
  if (!visible) return null;

  return (
    <div className="sl-boss-incoming" role="alert">
      <p className="sl-boss-incoming__text">{g.bossIncoming}</p>
      <p className="sl-boss-incoming__sub">{g.bossIncomingSub}</p>
    </div>
  );
}
