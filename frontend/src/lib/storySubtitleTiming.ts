import type { StorySceneSubtitle } from "@/lib/i18n/types";

export function initialSubtitleText(entry: StorySceneSubtitle): string {
  if (typeof entry === "string") return entry.trim();
  return entry[0]?.text.trim() ?? "";
}

export function scheduleSubtitleCues(
  entry: StorySceneSubtitle,
  onText: (text: string) => void
): () => void {
  if (typeof entry === "string") {
    onText(entry.trim());
    return () => {};
  }

  const timers: number[] = [];
  for (const cue of entry) {
    const id = window.setTimeout(() => onText(cue.text.trim()), cue.atMs);
    timers.push(id);
  }

  return () => timers.forEach((id) => window.clearTimeout(id));
}
