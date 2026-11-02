import * as THREE from 'three';
import { blobShadow, toon } from '../render/materials';
import { WOLF_HP, WOLF_RADIUS } from '../config';

export type WolfKind = 'wolf';

/** Static stats for each wolf kind. Tweak balance in config.ts, not here. */
export interface WolfDef {
  name: string;
  hp: number;
  /** Collision radius (metres). */
  radius: number;
}

export const WOLVES: Record<WolfKind, WolfDef> = {
  wolf: {
    name: 'wolf',
    hp: WOLF_HP,
    radius: WOLF_RADIUS,
  },
};

export interface WolfModel {
  group: THREE.Group;
  /** Hip-pivoted legs; four legs swing as diagonal pairs (0,1) vs (2,3). */
  legs: THREE.Object3D[];
}

type Mat = THREE.Material;

function box(w: number, h: number, d: number, m: Mat, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  return mesh;
}

/** A leg that swings from the hip: pivot at the top, mesh hanging below. */
function legPivot(x: number, y: number, z: number, parts: (pivot: THREE.Group) => void): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  parts(pivot);
  return pivot;
}

/**
 * A lean grey wolf: low body, pointed snout, ears, bushy tail, four legs.
 * Low-poly in the same spirit as the livestock/monsters. Faces -Z.
 */
function buildWolf(): WolfModel {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  const fur = toon(0x8a8f96);
  const furDark = toon(0x5f656c);
  const nose = toon(0x1c1f22);
  const eye = new THREE.MeshBasicMaterial({ color: 0xf0d24a }); // amber eyes

  // Body and chest.
  g.add(box(0.42, 0.4, 0.95, fur, 0, 0.62, 0));
  g.add(box(0.44, 0.42, 0.34, furDark, 0, 0.64, -0.36)); // shoulders

  // Head with snout and ears.
  const head = new THREE.Group();
  head.position.set(0, 0.78, -0.62);
  head.add(box(0.3, 0.3, 0.32, fur));
  head.add(box(0.18, 0.16, 0.22, fur, 0, -0.05, -0.24)); // snout
  head.add(box(0.07, 0.06, 0.05, nose, 0, -0.04, -0.37)); // nose
  head.add(box(0.05, 0.05, 0.03, eye, -0.08, 0.05, -0.18), box(0.05, 0.05, 0.03, eye, 0.08, 0.05, -0.18));
  for (const s of [-1, 1]) {
    const ear = box(0.1, 0.14, 0.05, furDark, s * 0.1, 0.2, 0.02);
    ear.rotation.z = -s * 0.2;
    head.add(ear);
  }
  g.add(head);

  // Bushy tail, angled up.
  const tail = new THREE.Group();
  tail.position.set(0, 0.7, 0.5);
  tail.rotation.x = -0.6;
  tail.add(box(0.14, 0.14, 0.5, furDark, 0, 0, 0.22));
  g.add(tail);

  // Four legs (diagonal pairs swing opposite).
  for (const [sx, sz] of [
    [-1, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
  ]) {
    legs.push(
      legPivot(sx * 0.16, 0.42, sz * 0.34, (p) => {
        p.add(box(0.13, 0.42, 0.14, fur, 0, -0.21, 0), box(0.15, 0.08, 0.17, nose, 0, -0.4, -0.02));
      }),
    );
  }
  legs.forEach((l) => g.add(l));
  g.add(blobShadow(0.45));
  return { group: g, legs };
}

export function createWolfModel(kind: WolfKind): WolfModel {
  switch (kind) {
    case 'wolf':
      return buildWolf();
  }
}
