import type { Direction } from "@/lib/types";

/** Virtual stage size — scaled to fit the canvas */
export const STAGE = { width: 800, height: 600 } as const;

export const LAYOUT = {
  goal: { x: 400, y: 130, w: 220, h: 90 },
  keeper: { x: 400, y: 210 },
  striker: { x: 400, y: 470 },
  ballRest: { x: 400, y: 430 },
  spotlight: { x: 400, y: 0 },
} as const;

export const GOAL_TARGETS: Record<Direction, { x: number; y: number }> = {
  left: { x: 310, y: 155 },
  center: { x: 400, y: 145 },
  right: { x: 490, y: 155 },
};

export const KEEPER_DIVE: Record<Direction, { x: number; y: number; rot: number }> = {
  left: { x: 340, y: 220, rot: -0.55 },
  center: { x: 400, y: 195, rot: 0 },
  right: { x: 460, y: 220, rot: 0.55 },
};

export const COLORS_2D = {
  bg: 0x04070d,
  floor: 0x080d15,
  grid: 0x22e6ff,
  shooter: 0x2f86ff,
  shooterDark: 0x1546ff,
  keeper: 0xff6a2b,
  keeperDark: 0xc43a00,
  outline: 0x03060c,
  ball: 0xf5f5f5,
  neon: 0x22e6ff,
  aura: 0x2b6bff,
};
