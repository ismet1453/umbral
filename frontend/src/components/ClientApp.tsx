"use client";

import { LocaleProvider, useLocale } from "@/components/i18n/LocaleProvider";
import { LanguageSelectScreen } from "@/components/i18n/LanguageSelectScreen";
import { GameApp } from "@/components/GameApp";

function AppShell() {
  const { localeReady, localeChosen } = useLocale();

  if (!localeReady) {
    return null;
  }

  if (!localeChosen) {
    return <LanguageSelectScreen />;
  }

  return <GameApp />;
}

export function ClientApp() {
  return (
    <LocaleProvider>
      <AppShell />
    </LocaleProvider>
  );
}
