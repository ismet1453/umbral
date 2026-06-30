"use client";

export type AlarmVariant = "welcome" | "name";

interface SystemAlarmWindowProps {
  variant: AlarmVariant;
  hunterName?: string;
  exiting?: boolean;
}

export function SystemAlarmWindow({
  variant,
  hunterName = "",
  exiting = false,
}: SystemAlarmWindowProps) {
  const nameDisplay = hunterName.length > 0 ? hunterName : "...";

  return (
    <div
      className={`sl-alarm${exiting ? " sl-alarm--exit" : " sl-alarm--enter"}`}
      role="dialog"
      aria-label={variant === "welcome" ? "System Welcome" : "Name Registration"}
    >
      <div className="sl-alarm__outer-glow" aria-hidden />
      <div className="sl-alarm__frame">
        <span className="sl-alarm__orn sl-alarm__orn--tl" aria-hidden />
        <span className="sl-alarm__orn sl-alarm__orn--tr" aria-hidden />
        <span className="sl-alarm__orn sl-alarm__orn--bl" aria-hidden />
        <span className="sl-alarm__orn sl-alarm__orn--br" aria-hidden />
        <div className="sl-alarm__scan" aria-hidden />

        <header className="sl-alarm__header">
          <span className="sl-alarm__title">ALARM</span>
          <span className="sl-alarm__close" aria-hidden>
            — ×
          </span>
        </header>

        <div className="sl-alarm__body">
          {variant === "welcome" ? (
            <p className="sl-alarm__line">
              [<span className="sl-alarm__muted">WELCOME, </span>
              <span className="sl-alarm__highlight">PLAYER</span>.]
            </p>
          ) : (
            <p className="sl-alarm__line">
              [<span className="sl-alarm__muted">Please enter your name, </span>
              <span className="sl-alarm__highlight sl-alarm__highlight--live">
                {nameDisplay}
              </span>
              .]
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
