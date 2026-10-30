import * as THREE from 'three';
import type { ItemId } from '../inventory/Item';
import { blobShadow, faceted, toon } from '../render/materials';
import { textures } from '../render/textures';

export type AnimalKind = 'cow' | 'sheep' | 'chicken';

export interface DropRule {
  item: ItemId;
  min: number;
  max: number;
}

/** Static stats for each animal. Tweak balance here. */
export interface AnimalDef {
  name: string;
  hp: number;
  /** Collision radius (metres). */
  radius: number;
  walkSpeed: number;
  fleeSpeed: number;
  drops: DropRule[];
}

export const ANIMALS: Record<AnimalKind, AnimalDef> = {
  cow: {
    name: 'cow',
    hp: 6,
    radius: 0.6,
    walkSpeed: 0.9,
    fleeSpeed: 3.2,
    drops: [
      { item: 'raw_meat', min: 2, max: 3 },
      { item: 'leather', min: 1, max: 2 },
    ],
  },
  sheep: {
    name: 'sheep',
    hp: 4,
    radius: 0.5,
    walkSpeed: 0.8,
    fleeSpeed: 3.4,
    drops: [
      { item: 'raw_meat', min: 1, max: 2 },
      { item: 'wool', min: 1, max: 3 },
    ],
  },
  chicken: {
    name: 'chicken',
    hp: 2,
    radius: 0.25,
    walkSpeed: 0.7,
    fleeSpeed: 3.8,
    drops: [
      { item: 'raw_meat', min: 1, max: 1 },
      { item: 'feather', min: 1, max: 3 },
    ],
  },
};

export interface AnimalModel {
  group: THREE.Group;
  /** Pivots at the hip; rotate .x to swing. Pairs (0,1) and (2,3) swing opposite. */
  legs: THREE.Object3D[];
}

type Mat = THREE.Material;

function box(w: number, h: number, d: number, m: Mat, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  return mesh;
}

/** A low-poly lump (used for wool and the chicken body), optionally squashed. */
function lump(radius: number, m: Mat, sx = 1, sy = 1, sz = 1, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(faceted(new THREE.IcosahedronGeometry(radius, 1)), m);
  mesh.scale.set(sx, sy, sz);
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

/** Holstein cow: black-and-white hide, pink muzzle, horns, ears, udder, tufted tail. Faces -Z. */
function buildCow(): AnimalModel {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  const hide = toon(0xffffff, { map: textures.cow() });
  const white = toon(0xf3efe6);
  const black = toon(0x272220);
  const pink = toon(0xf0a2a2);
  const horn = toon(0xe8dcc0);
  const hoof = toon(0x3a3330);

  g.add(box(0.9, 0.85, 1.55, hide, 0, 0.93, 0));
  g.add(box(0.46, 0.55, 0.4, white, 0, 1.08, -0.78)); // neck
  g.add(box(0.3, 0.14, 0.3, pink, 0, 0.5, 0.42)); // udder

  const head = new THREE.Group();
  head.position.set(0, 1.0, -1.02);
  head.add(box(0.46, 0.44, 0.48, white));
  head.add(box(0.34, 0.24, 0.16, pink, 0, -0.1, -0.3)); // muzzle
  head.add(box(0.05, 0.05, 0.03, black, -0.08, -0.08, -0.39), box(0.05, 0.05, 0.03, black, 0.08, -0.08, -0.39));
  head.add(box(0.07, 0.07, 0.04, black, -0.2, 0.07, -0.2), box(0.07, 0.07, 0.04, black, 0.2, 0.07, -0.2)); // eyes
  head.add(box(0.2, 0.08, 0.5, black, 0, 0.22, 0.02)); // dark crown patch
  for (const s of [-1, 1]) {
    const ear = box(0.22, 0.07, 0.13, black, s * 0.33, 0.16, 0.05);
    ear.rotation.z = -s * 0.3;
    const h = box(0.07, 0.17, 0.07, horn, s * 0.17, 0.33, 0.02);
    h.rotation.z = -s * 0.35;
    head.add(ear, h);
  }
  g.add(head);

  const tail = new THREE.Group();
  tail.position.set(0, 1.28, 0.78);
  tail.rotation.x = 0.2;
  tail.add(box(0.07, 0.6, 0.07, white, 0, -0.3, 0), box(0.13, 0.17, 0.13, black, 0, -0.66, 0));
  g.add(tail);

  for (const [sx, sz] of [
    [-1, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
  ]) {
    legs.push(
      legPivot(sx * 0.29, 0.56, sz * 0.55, (p) => {
        p.add(box(0.23, 0.56, 0.23, white, 0, -0.28, 0), box(0.25, 0.12, 0.25, hoof, 0, -0.5, 0));
      }),
    );
  }
  legs.forEach((l) => g.add(l));
  g.add(blobShadow(0.95));
  return { group: g, legs };
}

/** Fluffy sheep: lumpy cream wool, dark face with ears, thin dark legs, wool tail. Faces -Z. */
function buildSheep(): AnimalModel {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  const wool = toon(0xffffff, { map: textures.wool() });
  const dark = toon(0x4a423d);
  const darker = toon(0x2e2825);
  const eye = toon(0xe8e0b0);

  g.add(lump(0.5, wool, 0.95, 0.8, 1.2, 0, 0.8, 0));
  for (const [x, y, z] of [
    [0.34, 0.98, 0.32],
    [-0.34, 0.98, 0.32],
    [0.34, 0.98, -0.28],
    [-0.34, 0.98, -0.28],
    [0, 1.16, 0],
    [0, 0.84, 0.66],
  ]) {
    g.add(lump(0.27, wool, 1, 0.9, 1, x, y, z));
  }

  const head = new THREE.Group();
  head.position.set(0, 0.88, -0.78);
  head.add(box(0.3, 0.34, 0.4, dark, 0, 0, -0.04));
  head.add(box(0.15, 0.11, 0.08, darker, 0, -0.1, -0.26)); // nose
  head.add(box(0.05, 0.05, 0.03, eye, -0.12, 0.05, -0.24), box(0.05, 0.05, 0.03, eye, 0.12, 0.05, -0.24));
  head.add(lump(0.17, wool, 1, 0.7, 1, 0, 0.22, 0.02)); // forelock
  for (const s of [-1, 1]) {
    const ear = box(0.18, 0.07, 0.11, dark, s * 0.24, 0.08, 0.03);
    ear.rotation.z = -s * 0.45;
    head.add(ear);
  }
  g.add(head);

  for (const [sx, sz] of [
    [-1, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
  ]) {
    legs.push(
      legPivot(sx * 0.22, 0.46, sz * 0.4, (p) => {
        p.add(box(0.11, 0.46, 0.11, dark, 0, -0.23, 0), box(0.13, 0.07, 0.13, darker, 0, -0.43, 0));
      }),
    );
  }
  legs.forEach((l) => g.add(l));
  g.add(blobShadow(0.8));
  return { group: g, legs };
}

/** Chicken: white body with wings, fan tail, red comb and wattle, orange beak and legs. Faces -Z. */
function buildChicken(): AnimalModel {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  const white = toon(0xffffff, { map: textures.plain() });
  const shade = toon(0xe0e0e0);
  const red = toon(0xd9342b);
  const orange = toon(0xf0a020);
  const black = toon(0x1b1b1b);

  g.add(lump(0.22, white, 0.85, 0.9, 1.15, 0, 0.4, 0));
  const head = new THREE.Group();
  head.position.set(0, 0.68, -0.21);
  head.add(box(0.17, 0.2, 0.18, white));
  head.add(box(0.05, 0.1, 0.13, red, 0, 0.14, 0.01)); // comb
  head.add(box(0.045, 0.08, 0.04, red, 0, -0.1, -0.1)); // wattle
  head.add(box(0.07, 0.05, 0.1, orange, 0, -0.01, -0.13)); // beak
  head.add(box(0.035, 0.035, 0.03, black, -0.09, 0.03, -0.05), box(0.035, 0.035, 0.03, black, 0.09, 0.03, -0.05));
  g.add(head);
  for (const s of [-1, 1]) {
    const wing = box(0.04, 0.2, 0.3, shade, s * 0.21, 0.42, 0.04);
    wing.rotation.z = s * 0.12;
    g.add(wing);
    const feather = box(0.06, 0.3, 0.1, shade, s * 0.07, 0.56, 0.3);
    feather.rotation.set(-0.55, 0, s * 0.3);
    g.add(feather);
  }
  const tailMid = box(0.06, 0.32, 0.1, white, 0, 0.58, 0.3);
  tailMid.rotation.x = -0.55;
  g.add(tailMid);

  for (const sx of [-1, 1]) {
    legs.push(
      legPivot(sx * 0.07, 0.2, 0, (p) => {
        p.add(box(0.04, 0.2, 0.04, orange, 0, -0.1, 0), box(0.11, 0.03, 0.12, orange, 0, -0.19, -0.03));
      }),
    );
  }
  legs.forEach((l) => g.add(l));
  g.add(blobShadow(0.4));
  return { group: g, legs };
}

export function createAnimalModel(kind: AnimalKind): AnimalModel {
  switch (kind) {
    case 'cow':
      return buildCow();
    case 'sheep':
      return buildSheep();
    case 'chicken':
      return buildChicken();
  }
}
