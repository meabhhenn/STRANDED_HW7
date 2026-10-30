import * as THREE from 'three';
import { blobShadow, toon } from '../render/materials';
import { MONSTER_HP, MONSTER_RADIUS } from '../config';

export type MonsterKind = 'stalker';

/** Static stats for each monster. Tweak balance in config.ts, not here. */
export interface MonsterDef {
  name: string;
  hp: number;
  /** Collision radius (metres). */
  radius: number;
}

export const MONSTERS: Record<MonsterKind, MonsterDef> = {
  stalker: {
    name: 'stalker',
    hp: MONSTER_HP,
    radius: MONSTER_RADIUS,
  },
};

export interface MonsterModel {
  group: THREE.Group;
  /** Hip-pivoted legs; rotate .x to swing. Pairs (0,1) swing opposite. */
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
 * Stalker: a gaunt, dark two-legged figure with glowing eyes and clawed arms.
 * Placeholder low-poly geometry in the same spirit as the livestock. Faces -Z.
 */
function buildStalker(): MonsterModel {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  const body = toon(0x201b26);
  const limb = toon(0x15121a);
  const claw = toon(0x0d0b10);
  const eye = new THREE.MeshBasicMaterial({ color: 0xff3b2f }); // glows unlit

  // Hunched torso and head.
  g.add(box(0.5, 0.8, 0.4, body, 0, 1.05, 0));
  const head = new THREE.Group();
  head.position.set(0, 1.58, -0.06);
  head.add(box(0.36, 0.38, 0.38, body));
  head.add(box(0.07, 0.07, 0.04, eye, -0.09, 0.03, -0.2), box(0.07, 0.07, 0.04, eye, 0.09, 0.03, -0.2));
  head.add(box(0.26, 0.08, 0.1, claw, 0, -0.14, -0.14)); // jaw
  g.add(head);

  // Long dangling arms with claws (static, read as a menacing silhouette).
  for (const s of [-1, 1]) {
    const arm = box(0.14, 0.7, 0.14, limb, s * 0.34, 1.0, 0.02);
    arm.rotation.z = s * 0.12;
    g.add(arm);
    g.add(box(0.16, 0.18, 0.16, claw, s * 0.4, 0.62, 0.02));
  }

  // Two swinging legs.
  for (const sx of [-1, 1]) {
    legs.push(
      legPivot(sx * 0.16, 0.66, 0, (p) => {
        p.add(box(0.16, 0.66, 0.18, limb, 0, -0.33, 0), box(0.2, 0.1, 0.26, claw, 0, -0.63, -0.04));
      }),
    );
  }
  legs.forEach((l) => g.add(l));
  g.add(blobShadow(0.55));
  return { group: g, legs };
}

export function createMonsterModel(kind: MonsterKind): MonsterModel {
  switch (kind) {
    case 'stalker':
      return buildStalker();
  }
}
