import type { BaseMessages, Locale, Messages } from "@/lib/i18n/types";
import { CHARACTER_COPY } from "@/lib/i18n/characterCopy";
import { GAME_MESSAGES } from "@/lib/i18n/gameMessages";
import { STORY_SCENE_SUBTITLES } from "@/lib/i18n/storySubtitles";
import { ar } from "@/lib/i18n/messages/ar";
import { de } from "@/lib/i18n/messages/de";
import { en } from "@/lib/i18n/messages/en";
import { es } from "@/lib/i18n/messages/es";
import { hi } from "@/lib/i18n/messages/hi";
import { ja } from "@/lib/i18n/messages/ja";
import { ko } from "@/lib/i18n/messages/ko";
import { ru } from "@/lib/i18n/messages/ru";
import { tr } from "@/lib/i18n/messages/tr";
import { zh } from "@/lib/i18n/messages/zh";

export const MESSAGES: Record<Locale, BaseMessages> = {
  tr,
  en,
  ru,
  zh,
  ja,
  ko,
  es,
  de,
  hi,
  ar,
};

export function getMessages(locale: Locale): Messages {
  const base = MESSAGES[locale] ?? en;
  return {
    ...base,
    game: GAME_MESSAGES[locale] ?? GAME_MESSAGES.en,
    characters: CHARACTER_COPY[locale] ?? CHARACTER_COPY.en,
    story: {
      ...base.story,
      scenes: STORY_SCENE_SUBTITLES[locale],
    },
  };
}
