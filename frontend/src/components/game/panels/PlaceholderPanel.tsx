"use client";

import { useT } from "@/components/i18n/LocaleProvider";

interface PlaceholderPanelProps {
  title: string;
  description: string;
}

export function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  const t = useT().game;

  return (
    <div className="um-panel um-panel--placeholder">
      <div className="um-panel__placeholder-art" aria-hidden />
      <h3 className="um-panel__placeholder-title">{title}</h3>
      <p className="um-panel__placeholder-desc">{description}</p>
      <span className="um-panel__badge">{t.soon}</span>
    </div>
  );
}
