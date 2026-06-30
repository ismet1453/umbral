"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LOCALE_OPTIONS } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";
import {
  detectBrowserLocale,
  loadStoredLocale,
  saveLocale,
} from "@/lib/i18n/storage";
import type { Locale, Messages } from "@/lib/i18n/types";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  localeReady: boolean;
  localeChosen: boolean;
  setLocale: (locale: Locale) => void;
  confirmLocale: () => void;
  skipLocalePicker: () => void;
  previewLocale: Locale;
  setPreviewLocale: (locale: Locale) => void;
  previewMessages: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyDocumentLocale(locale: Locale): void {
  const opt = LOCALE_OPTIONS.find((o) => o.code === locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = opt?.dir ?? "ltr";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [localeReady, setLocaleReady] = useState(false);
  const [localeChosen, setLocaleChosen] = useState(false);
  const [locale, setLocaleState] = useState<Locale>("en");
  const [previewLocale, setPreviewLocale] = useState<Locale>("en");

  useEffect(() => {
    const stored = loadStoredLocale();
    const initial = stored ?? detectBrowserLocale();
    setLocaleState(initial);
    setPreviewLocale(initial);
    applyDocumentLocale(initial);
    setLocaleReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    saveLocale(next);
    applyDocumentLocale(next);
  }, []);

  const confirmLocale = useCallback(() => {
    setLocale(previewLocale);
    setLocaleChosen(true);
  }, [previewLocale, setLocale]);

  const skipLocalePicker = useCallback(() => {
    setLocaleChosen(true);
  }, []);

  const messages = useMemo(() => getMessages(locale), [locale]);
  const previewMessages = useMemo(
    () => getMessages(previewLocale),
    [previewLocale]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      messages,
      localeReady,
      localeChosen,
      setLocale,
      confirmLocale,
      skipLocalePicker,
      previewLocale,
      setPreviewLocale,
      previewMessages,
    }),
    [
      locale,
      messages,
      localeReady,
      localeChosen,
      setLocale,
      confirmLocale,
      skipLocalePicker,
      previewLocale,
      previewMessages,
    ]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT(): Messages {
  return useLocale().messages;
}

export function usePreviewT(): Messages {
  return useLocale().previewMessages;
}
