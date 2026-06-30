import type { Direction } from "@/lib/types";

export const MODELS = {
  ball: "/models/ball.glb",
  stadium: "/models/stadium.glb",
} as const;

export const ANIMS = {
  juggle: "/models/anim_juggle.fbx",
  dive: "/models/anim_dive.fbx",
  kick: "/models/anim_kick.fbx",
  block: "/models/anim_block.fbx",
} as const;

export const COLORS = {
  cyan: "#22e6ff",
  blue: "#2b6bff",
  ice: "#7fdfff",
  shooter: "#2f86ff",
  shooterEmissive: "#1546ff",
  keeper: "#ff6a2b",
  keeperEmissive: "#ff3d00",
  netEmissive: "#22e6ff",
  floor: "#080d15",
  wall: "#070b14",
  outline: "#03060c",
};

export const CHARACTER_HEIGHT = 1.8;
export const BALL_SIZE = 0.4;
export const STADIUM_WIDTH = 26;
export const GOAL_Z = -5.0;
export const GOAL_WIDTH = 3.4;
export const GOAL_HEIGHT = 1.5;

export const SHOOTER_POS: [number, number, number] = [0, 0, 2.0];
export const KEEPER_POS: [number, number, number] = [0, 0, -4.2];
export const BALL_REST: [number, number, number] = [0, BALL_SIZE / 2, 0.9];

export const SHOT_TARGETS: Record<Direction, [number, number, number]> = {
  left: [-1.4, 1.1, GOAL_Z + 0.3],
  center: [0, 1.2, GOAL_Z + 0.15],
  right: [1.4, 1.1, GOAL_Z + 0.3],
};

export const KEEPER_DIVE: Record<Direction, [number, number, number]> = {
  left: [-1.3, 0.5, -4.2],
  center: [0, 0.7, -4.05],
  right: [1.3, 0.5, -4.2],
};

export const CAMERA = {
  position: [1.1, 2.05, 6.3] as [number, number, number],
  lookAt: [0, 0.95, GOAL_Z + 0.4] as [number, number, number],
  fov: 46,
};

/** Shot choreography timing (seconds) — slow, deliberate Blue Lock feel */
export const SHOT_TIMELINE = {
  settle: 1.2, // ball drops, player relaxes
  adjust: 3.0, // run-up / positioning
  kick: 3.5, // kick contact -> ball launches, keeper dives
  resolve: 5.2, // outcome revealed
  total: 5.6,
};

export const JUGGLE_DELAY = 5.0; // seconds before shooter starts juggling

export function shooterIsMiku(roundIndex: number): boolean {
  return roundIndex % 2 === 0;
}
