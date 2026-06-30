"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  initialSubtitleText,
  scheduleSubtitleCues,
} from "@/lib/storySubtitleTiming";
import { STORY_CROSSFADE_MS, STORY_SCENES } from "@/lib/storyIntro";
import {
  isStoryIntroPrimed,
  primeStoryIntroFromGesture,
  skipStoryIntro,
  startStoryIntroTimeline,
  stopStoryIntroAudio,
} from "@/lib/storyIntroAudio";

interface StoryIntroScreenProps {
  onComplete: () => void;
}

const EXIT_FADE_MS = 900;

export function StoryIntroScreen({ onComplete }: StoryIntroScreenProps) {
  const t = useT();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [subtitle, setSubtitle] = useState("");
  const [subtitleKey, setSubtitleKey] = useState(0);
  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setExiting(true);
    window.setTimeout(() => {
      stopStoryIntroAudio();
      onCompleteRef.current();
    }, EXIT_FADE_MS);
  }, []);

  const handleSkip = useCallback(() => {
    skipStoryIntro();
    finish();
  }, [finish]);

  useEffect(() => {
    if (!isStoryIntroPrimed()) {
      primeStoryIntroFromGesture();
    }

    startStoryIntroTimeline(
      (idx) => {
        setSceneIndex((prev) => {
          if (prev !== idx) setPrevIndex(prev);
          return idx;
        });
      },
      finish
    );

    return () => stopStoryIntroAudio();
  }, [finish]);

  useEffect(() => {
    if (prevIndex === null) return;
    const t = window.setTimeout(() => setPrevIndex(null), STORY_CROSSFADE_MS);
    return () => window.clearTimeout(t);
  }, [sceneIndex, prevIndex]);

  const sceneEntry = t.story.scenes[sceneIndex];

  useEffect(() => {
    if (sceneEntry === undefined) {
      setSubtitle("");
      return;
    }

    setSubtitle(initialSubtitleText(sceneEntry));
    setSubtitleKey((k) => k + 1);

    const cancel = scheduleSubtitleCues(sceneEntry, (text) => {
      setSubtitle(text);
      setSubtitleKey((k) => k + 1);
    });

    return cancel;
  }, [sceneIndex, sceneEntry]);

  const scene = STORY_SCENES[sceneIndex];
  const prevScene = prevIndex !== null ? STORY_SCENES[prevIndex] : null;
  if (!scene) return null;

  return (
    <div
      className={`story-intro story-intro--entered${exiting ? " story-intro--exit" : ""}`}
      role="dialog"
      aria-label="Story introduction"
    >
      <button
        type="button"
        className="story-intro__skip"
        onClick={handleSkip}
        aria-label="Skip story"
      >
        {t.story.skip}
      </button>

      <p className="story-intro__progress" aria-live="polite">
        {sceneIndex + 1} / {STORY_SCENES.length}
      </p>

      {prevScene && (
        <div
          className="story-intro__slide story-intro__slide--out"
          style={{
            backgroundImage: `url(${prevScene.image})`,
            ["--story-scene-ms" as string]: `${prevScene.durationMs}ms`,
          }}
          aria-hidden
        />
      )}

      <div
        key={sceneIndex}
        className="story-intro__slide story-intro__slide--in"
        style={{
          backgroundImage: `url(${scene.image})`,
          ["--story-scene-ms" as string]: `${scene.durationMs}ms`,
        }}
        aria-hidden
      />

      <div className="story-intro__vignette" aria-hidden />

      {subtitle && (
        <div className="story-intro__subtitle-wrap" aria-live="polite">
          <p key={`${sceneIndex}-${subtitleKey}`} className="story-intro__subtitle">
            {subtitle}
          </p>
        </div>
      )}

      <div className="story-intro__letterbox story-intro__letterbox--top" aria-hidden />
      <div className="story-intro__letterbox story-intro__letterbox--bottom" aria-hidden />
    </div>
  );
}
