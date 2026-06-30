import * as THREE from "three";

export function fitToGround(
  object: THREE.Object3D,
  options: { targetHeight?: number; targetWidth?: number } = {}
): THREE.Object3D {
  const clone = object.clone(true);
  clone.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(clone);
  const size = box.getSize(new THREE.Vector3());

  let scale = 1;
  if (options.targetHeight && size.y > 0) {
    scale = options.targetHeight / size.y;
  } else if (options.targetWidth && Math.max(size.x, size.z) > 0) {
    scale = options.targetWidth / Math.max(size.x, size.z);
  }

  clone.scale.setScalar(scale);
  clone.updateMatrixWorld(true);

  const grounded = new THREE.Box3().setFromObject(clone);
  clone.position.y -= grounded.min.y;

  return clone;
}

/** Hard 3-band toon gradient for crisp anime cel shading */
let cachedGradient: THREE.DataTexture | null = null;
export function toonGradient(): THREE.DataTexture {
  if (cachedGradient) return cachedGradient;
  const steps = new Uint8Array([45, 150, 255]);
  const tex = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  cachedGradient = tex;
  return tex;
}

/**
 * Convert all meshes under `root` to cel-shaded MeshToonMaterial.
 * Preserves base color maps and skinning. Adds a subtle emissive tint.
 */
export function applyCelShading(
  root: THREE.Object3D,
  options: {
    tint?: THREE.ColorRepresentation;
    tintStrength?: number;
    emissive?: THREE.ColorRepresentation;
    emissiveIntensity?: number;
  } = {}
): void {
  const gradient = toonGradient();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = false;

    const fromArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const toon = fromArray.map((src) => {
      const prev = src as THREE.MeshStandardMaterial;
      const mat = new THREE.MeshToonMaterial({
        color: prev?.color ? prev.color.clone() : new THREE.Color("#dfe9f5"),
        map: prev?.map ?? null,
        gradientMap: gradient,
        transparent: prev?.transparent ?? false,
        opacity: prev?.opacity ?? 1,
        side: THREE.FrontSide,
      });
      if (options.tint) mat.color.lerp(new THREE.Color(options.tint), options.tintStrength ?? 0.45);
      if (options.emissive) {
        mat.emissive = new THREE.Color(options.emissive);
        mat.emissiveIntensity = options.emissiveIntensity ?? 0.25;
      }
      return mat;
    });
    mesh.material = Array.isArray(mesh.material) ? toon : toon[0]!;
  });
}

/**
 * Add crisp black anime outlines via the inverted-hull technique.
 * For each skinned mesh, a back-face black copy is inflated along normals
 * (before skinning) so it tracks animation. `thickness` is in geometry units.
 */
export function addOutline(
  root: THREE.Object3D,
  options: { thickness?: number; color?: THREE.ColorRepresentation } = {}
): void {
  const thickness = options.thickness ?? 1.5;
  const color = new THREE.Color(options.color ?? "#03060c");
  const toAdd: Array<{ parent: THREE.Object3D; mesh: THREE.Mesh }> = [];

  root.traverse((obj) => {
    const sk = obj as THREE.SkinnedMesh;
    if (!sk.isSkinnedMesh || !sk.geometry || !sk.parent) return;

    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.outlineThickness = { value: thickness };
      shader.vertexShader =
        "uniform float outlineThickness;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\n\ttransformed += objectNormal * outlineThickness;"
        );
    };

    const outline = new THREE.SkinnedMesh(sk.geometry, mat);
    outline.bind(sk.skeleton, sk.bindMatrix);
    outline.bindMode = sk.bindMode;
    outline.position.copy(sk.position);
    outline.quaternion.copy(sk.quaternion);
    outline.scale.copy(sk.scale);
    outline.castShadow = false;
    outline.receiveShadow = false;
    outline.renderOrder = -1;

    toAdd.push({ parent: sk.parent, mesh: outline });
  });

  toAdd.forEach(({ parent, mesh }) => parent.add(mesh));
}

/** Stadium GLB: align goal mouth to world z = goalZ, used as dark backdrop */
export function prepareStadium(
  scene: THREE.Object3D,
  options: { goalZ?: number; targetWidth?: number } = {}
): THREE.Object3D {
  const goalZ = options.goalZ ?? -5.2;
  const targetWidth = options.targetWidth ?? 16;

  const root = scene.clone(true);
  root.updateMatrixWorld(true);

  let box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const scale = targetWidth / Math.max(size.x, size.z);
  root.scale.setScalar(scale);

  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);

  const centerX = (box.min.x + box.max.x) / 2;
  root.position.set(-centerX, -box.min.y, goalZ - box.min.z);

  // Darken stadium materials so it recedes into the moody arena
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.receiveShadow = true;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      const sm = m as THREE.MeshStandardMaterial;
      if (sm.color) sm.color.multiplyScalar(0.22);
      if ("metalness" in sm) sm.metalness = 0.6;
      if ("roughness" in sm) sm.roughness = 0.7;
      if (sm.emissive) sm.emissive = new THREE.Color("#04121a");
    });
  });

  return root;
}
