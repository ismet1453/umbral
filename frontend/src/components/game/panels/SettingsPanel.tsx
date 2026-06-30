"use client";

import { LOCALE_OPTIONS } from "@/lib/i18n/locales";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";

interface SettingsPanelProps {
  onLogout?: () => void;
}

export function SettingsPanel({ onLogout }: SettingsPanelProps) {
  const { locale, setLocale } = useLocale();
  const t = useT().game;

  return (
    <div className="um-panel um-panel--settings">
      <section className="um-settings-block">
        <h3 className="um-settings-block__title">{t.settingsLanguage}</h3>
        <div className="um-settings-langs">
          {LOCALE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              type="button"
              className={`um-settings-lang${locale === opt.code ? " um-settings-lang--active" : ""}`}
              onClick={() => setLocale(opt.code)}
            >
              {opt.nativeName}
            </button>
          ))}
        </div>
      </section>

      {onLogout && (
        <section className="um-settings-block">
          <h3 className="um-settings-block__title">{t.settingsAccount}</h3>
          <button type="button" className="um-settings-logout" onClick={onLogout}>
            {t.settingsLogout}
          </button>
        </section>
      )}
    </div>
  );
}
