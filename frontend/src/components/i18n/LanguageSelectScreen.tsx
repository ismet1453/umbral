"use client";

import { useCallback } from "react";
import { LOCALE_OPTIONS } from "@/lib/i18n/locales";
import { useLocale, usePreviewT } from "@/components/i18n/LocaleProvider";
import { playUiClick } from "@/lib/authAudio";
import { SystemGateBackground } from "@/components/auth/SystemGateBackground";

export function LanguageSelectScreen() {
  const { previewLocale, setPreviewLocale, confirmLocale, skipLocalePicker } =
    useLocale();
  const t = usePreviewT();

  const handleContinue = useCallback(() => {
    playUiClick();
    confirmLocale();
  }, [confirmLocale]);

  const handleSkip = useCallback(() => {
    playUiClick();
    skipLocalePicker();
  }, [skipLocalePicker]);

  return (
    <div className="lang-select-root">
      <SystemGateBackground />
      <div className="lang-select">
        <p className="lang-select__eyebrow">UMBRAL</p>
        <h1 className="lang-select__title">{t.language.title}</h1>
        <p className="lang-select__subtitle">{t.language.subtitle}</p>

        <ul className="lang-select__grid" role="listbox" aria-label={t.language.title}>
          {LOCALE_OPTIONS.map((opt) => {
            const selected = previewLocale === opt.code;
            return (
              <li key={opt.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`lang-select__opt${selected ? " lang-select__opt--active" : ""}`}
                  onClick={() => {
                    playUiClick();
                    setPreviewLocale(opt.code);
                  }}
                >
                  <span className="lang-select__native">{opt.nativeName}</span>
                  <span className="lang-select__english">{opt.englishName}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="lang-select__actions">
          <button
            type="button"
            className="lang-select__skip"
            onClick={handleSkip}
          >
            {t.language.skip}
          </button>
          <button
            type="button"
            className="lang-select__continue"
            onClick={handleContinue}
          >
            {t.language.continue}
          </button>
        </div>
      </div>
    </div>
  );
}
