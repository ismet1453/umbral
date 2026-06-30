/**
 * Story intro scene manifest — deterministic timeline (durationMs only).
 *
 * Place assets under public/story/:
 *   images/page1.png … page9.png
 *   audio/vo_1.mp3 … vo_9.mp3  (one voice clip per page)
 *
 * Fill durationMs after you split & measure each vo_*.mp3 in a DAW / player.
 */

export type StoryScene = {
  /** 1-based page index */
  id: number;
  image: string;
  voice: string;
  /** How long this slide stays on screen — sole timing source */
  durationMs: number;
};

/**
 * Example structure — replace durationMs with your measured values.
 *
 * | id | voice file  | suggested start |
 * |----|-------------|-----------------|
 * |  1 | vo_1.mp3    | page1.png       |
 * |  2 | vo_2.mp3    | page2.png       |
 * | …  | …           | …               |
 * |  8 | vo_8.mp3    | page8.png       |
 * |  9 | vo_9.mp3    | page9.png       |
 */
export const STORY_SCENES: StoryScene[] = [
  {
    id: 1,
    image: "/story/images/page1.png",
    voice: "/story/audio/vo_1.mp3",
    durationMs: 13_000,
  },
  {
    id: 2,
    image: "/story/images/page2.png",
    voice: "/story/audio/vo_2.mp3",
    durationMs: 16_000,
  },
  {
    id: 3,
    image: "/story/images/page3.png",
    voice: "/story/audio/vo_3.mp3",
    durationMs: 13_000,
  },
  {
    id: 4,
    image: "/story/images/page4.png",
    voice: "/story/audio/vo_4.mp3",
    durationMs: 26_000,
  },
  {
    id: 5,
    image: "/story/images/page5.png",
    voice: "/story/audio/vo_5.mp3",
    durationMs: 29_000, // subtitle part 2 starts at 10s (VO5_PART2_AT_MS)
  },
  {
    id: 6,
    image: "/story/images/page6.png",
    voice: "/story/audio/vo_6.mp3",
    durationMs: 30_000,
  },
  {
    id: 7,
    image: "/story/images/page7.png",
    voice: "/story/audio/vo_7.mp3",
    durationMs: 29_000,
  },
  {
    id: 8,
    image: "/story/images/page8.png",
    voice: "/story/audio/vo_8.mp3",
    durationMs: 22_500,
  },
  {
    id: 9,
    image: "/story/images/page9.png",
    voice: "/story/audio/vo_9.mp3",
    durationMs: 15_300,
  },
];

export const STORY_TOTAL_MS = STORY_SCENES.reduce(
  (sum, s) => sum + s.durationMs,
  0
);

export const STORY_CROSSFADE_MS = 1_200;
