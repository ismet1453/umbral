import type { Locale } from "@/lib/i18n/types";

export type LocaleOption = {
  code: Locale;
  nativeName: string;
  englishName: string;
  dir?: "rtl";
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "tr", nativeName: "Türkçe", englishName: "Turkish" },
  { code: "en", nativeName: "English", englishName: "English" },
  { code: "ru", nativeName: "Русский", englishName: "Russian" },
  { code: "zh", nativeName: "中文", englishName: "Chinese" },
  { code: "ja", nativeName: "日本語", englishName: "Japanese" },
  { code: "ko", nativeName: "한국어", englishName: "Korean" },
  { code: "es", nativeName: "Español", englishName: "Spanish" },
  { code: "de", nativeName: "Deutsch", englishName: "German" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi" },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", dir: "rtl" },
];
