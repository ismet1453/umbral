"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.9}
        luminanceThreshold={0.45}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.7}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.85} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
