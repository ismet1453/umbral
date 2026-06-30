import type { CharacterId } from "@/lib/idleGame";

export type CharacterTheme = {
  src: string;
  volume: number;
  loop?: boolean;
};

/** Per-character select screen themes — files in /public/audio/ */
export const CHARACTER_THEMES: Record<CharacterId, CharacterTheme> = {
  varek: { src: "/audio/valeria.mp3", volume: 0.52, loop: true },
};
