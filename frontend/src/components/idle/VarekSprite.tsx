"use client";

import { useEffect, useRef, useState } from "react";
import {
  VAREK_BODY_IDLE_FRAMES,
  VAREK_WEAPONS,
} from "@/lib/varekAssets";
import type { WeaponId } from "@/lib/weapons";

export interface VarekSpriteProps {
  weapon?: WeaponId;
  attacking?: boolean;
}

/**
 * Layered Varek: body layer (idle cycling) + weapon layer (separate asset).
 * Weapons swap independently without disturbing the body animation.
 * CSS lighten blend hides dark PNG mattes until transparent exports ship.
 */
export function VarekSprite({
  weapon = "longsword",
  attacking = false,
}: VarekSpriteProps) {
  const [bodyFrame, setBodyFrame] = useState(0);
  const [weaponSwing, setWeaponSwing] = useState(false);
  const idleRef = useRef(0);

  const weaponSet = VAREK_WEAPONS[weapon];

  /* Idle body frame cycle – pauses during attack */
  useEffect(() => {
    if (attacking) return;
    const t = setInterval(() => {
      idleRef.current = (idleRef.current + 1) % VAREK_BODY_IDLE_FRAMES.length;
      setBodyFrame(idleRef.current);
    }, 720);
    return () => clearInterval(t);
  }, [attacking]);

  /* Weapon swing overlay */
  useEffect(() => {
    if (!attacking) return;
    setWeaponSwing(true);
    const t = setTimeout(() => setWeaponSwing(false), 380);
    return () => clearTimeout(t);
  }, [attacking]);

  return (
    <div
      className={`sl-varek-sprite${attacking ? " sl-varek-sprite--attack" : ""}`}
      aria-hidden
    >
      {/* Body layer */}
      <img
        className="sl-varek-sprite__body"
        src={VAREK_BODY_IDLE_FRAMES[bodyFrame]!}
        alt=""
        draggable={false}
      />
      {/* Weapon layer — shows swing frame on attack, idle otherwise */}
      <img
        className={`sl-varek-sprite__weapon${weaponSwing ? " sl-varek-sprite__weapon--visible" : ""}`}
        src={weaponSwing ? weaponSet.swing : weaponSet.idle}
        alt=""
        draggable={false}
      />
    </div>
  );
}
