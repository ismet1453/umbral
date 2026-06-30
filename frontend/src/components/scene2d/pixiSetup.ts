import { extend } from "@pixi/react";
import { Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";

let registered = false;

/** Register Pixi classes once for @pixi/react v8 JSX (pixiContainer, pixiGraphics, …) */
export function registerPixi(): void {
  if (registered) return;
  extend({ Container, Graphics, Sprite, Text, TextStyle });
  registered = true;
}
