"use client";

interface IgrisCutsceneProps {
  visible: boolean;
  dissolving: boolean;
}

export function IgrisCutscene({ visible, dissolving }: IgrisCutsceneProps) {
  if (!visible && !dissolving) return null;

  return (
    <div
      className={`intro-igris${visible ? " intro-igris--in" : ""}${dissolving ? " intro-igris--dissolve" : ""}`}
    >
      <div className="intro-igris__vignette" aria-hidden />
      <div className="intro-igris__chromatic" aria-hidden />
      <div className="intro-igris__glow" aria-hidden />
      <div className="intro-igris__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/solo-leveling-igris.gif"
          alt="Igris — Blood-Red Commander"
          className="intro-igris__gif"
          draggable={false}
        />
      </div>
      <p className="intro-igris__caption">Blood-Red Commander · IGRIS</p>
      {dissolving && <div className="intro-igris__gate" aria-hidden />}
    </div>
  );
}
