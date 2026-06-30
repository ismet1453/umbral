import type { Direction } from "@/lib/types";

export function pickDirections(outcome: "goal" | "save"): {
  ball: Direction;
  keeper: Direction;
} {
  const dirs: Direction[] = ["left", "center", "right"];
  const ball = dirs[Math.floor(Math.random() * dirs.length)]!;
  if (outcome === "save") return { ball, keeper: ball };
  const keeper = dirs.find((d) => d !== ball) ?? "left";
  return { ball, keeper };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
