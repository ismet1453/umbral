"use client";

interface GateAtmosphereProps {
  /** More intense star density during system alarm charge */
  intense?: boolean;
}

const STAR_COUNT = 28;

function seededStars(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const seed = (i * 7919 + 104729) % 1000;
    return {
      id: i,
      left: `${(seed * 0.097) % 100}%`,
      top: `${((seed * 0.173) + 17) % 100}%`,
      delay: `${((seed % 40) / 10).toFixed(2)}s`,
      duration: `${(2.2 + (seed % 30) / 10).toFixed(2)}s`,
      size: seed % 3 === 0 ? "lg" : seed % 2 === 0 ? "md" : "sm",
    };
  });
}

const STARS = seededStars(STAR_COUNT);

export function GateAtmosphere({ intense = false }: GateAtmosphereProps) {
  return (
    <div
      className={`gate-atmosphere${intense ? " gate-atmosphere--intense" : ""}`}
      aria-hidden
    >
      <div className="gate-atmosphere__nebula gate-atmosphere__nebula--a" />
      <div className="gate-atmosphere__nebula gate-atmosphere__nebula--b" />
      <div className="gate-atmosphere__grid" />

      {STARS.map((star) => (
        <span
          key={star.id}
          className={`gate-atmosphere__star gate-atmosphere__star--${star.size}`}
          style={{
            left: star.left,
            top: star.top,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}

      <div className="gate-atmosphere__shooting gate-atmosphere__shooting--1" />
      <div className="gate-atmosphere__shooting gate-atmosphere__shooting--2" />
      <div className="gate-atmosphere__shooting gate-atmosphere__shooting--3" />
      <div className="gate-atmosphere__shooting gate-atmosphere__shooting--4" />

      <div className="gate-atmosphere__vignette" />
    </div>
  );
}
