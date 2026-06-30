import type { Locale } from "@/lib/i18n/types";

export const LOCALE_STORAGE_KEY = "umbral-locale";
const LEGACY_LOCALE_KEY = "egoshot-locale";

const VALID: Locale[] = [
  "tr",
  "en",
  "ru",
  "zh",
  "ja",
  "ko",
  "es",
  "de",
  "hi",
  "ar",
];

export function isLocale(value: string): value is Locale {
  return (VALID as string[]).includes(value);
}

export function loadStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const raw =
    localStorage.getItem(LOCALE_STORAGE_KEY) ??
    localStorage.getItem(LEGACY_LOCALE_KEY);
  return raw && isLocale(raw) ? raw : null;
}

export function saveLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("tr")) return "tr";
  if (lang.startsWith("ru")) return "ru";
  if (lang.startsWith("zh")) return "zh";
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("ko")) return "ko";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("hi")) return "hi";
  if (lang.startsWith("ar")) return "ar";
  return "en";
}
