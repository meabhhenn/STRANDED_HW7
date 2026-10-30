import * as THREE from 'three';

/**
 * Shared look for every 3D object: cel-shaded (MeshToonMaterial with a 4-step
 * gradient) + flat-faceted geometry + nearest-filtered pixel textures. Create
 * materials through `toon()` and fix up smooth geometry with `faceted()` so new
 * content matches the art style automatically.
 */

/** Light falls off in 4 hard steps instead of smoothly. */
const gradient = new THREE.DataTexture(new Uint8Array([105, 160, 215, 255]), 4, 1, THREE.RedFormat);
gradient.minFilter = THREE.NearestFilter;
gradient.magFilter = THREE.NearestFilter;
gradient.generateMipmaps = false;
gradient.needsUpdate = true;

const colorCache = new Map<string, THREE.MeshToonMaterial>();

export interface ToonOptions {
  map?: THREE.Texture;
  vertexColors?: boolean;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

/** Cel-shaded material. Plain-colour materials are cached and shared. */
export function toon(color: THREE.ColorRepresentation = 0xffffff, opts: ToonOptions = {}): THREE.MeshToonMaterial {
  const plain = !opts.map && !opts.vertexColors && !opts.transparent && opts.side === undefined;
  const key = plain ? new THREE.Color(color).getHexString() : '';
  if (plain) {
    const hit = colorCache.get(key);
    if (hit) return hit;
  }
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...opts });
  if (plain) colorCache.set(key, m);
  return m;
}

/**
 * Splits shared vertices so each triangle gets its own flat normal. Cones,
 * cylinders and spheres otherwise shade smoothly and lose the low-poly look.
 */
export function faceted<T extends THREE.BufferGeometry>(geo: T): THREE.BufferGeometry {
  const flat = geo.index ? geo.toNonIndexed() : geo;
  flat.computeVertexNormals();
  return flat;
}

/** Soft dark disc on the ground that anchors characters and items to the terrain. */
const shadowGeo = new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
export function blobShadow(radius: number): THREE.Mesh {
  const m = new THREE.Mesh(shadowGeo, shadowMat);
  m.scale.set(radius, 1, radius);
  m.position.y = 0.06;
  m.renderOrder = 1;
  return m;
}
