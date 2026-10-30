import * as THREE from 'three';
import { faceted, toon } from './materials';
import { textures } from './textures';

/**
 * Reusable low-poly prop builders shared by items, the campfire and the world.
 * Props are intentionally chunky (bigger than life) so they read at low
 * resolution. Origin conventions are noted on each builder.
 */

// ---- Logs ------------------------------------------------------------------

let logGeo: THREE.BufferGeometry | null = null;
let logMats: THREE.Material[] | null = null;

/**
 * A cut log lying along the X axis (length 0.9), resting on the ground at
 * y = radius. Bark sides, pale ringed end caps.
 */
export function createLog(): THREE.Mesh {
  logGeo ??= faceted(new THREE.CylinderGeometry(0.13, 0.13, 0.9, 8).rotateZ(Math.PI / 2));
  logMats ??= [
    toon(0xffffff, { map: textures.logSide() }),
    toon(0xffffff, { map: textures.logEnd() }),
    toon(0xffffff, { map: textures.logEnd() }),
  ];
  const m = new THREE.Mesh(logGeo, logMats);
  m.position.y = 0.13;
  return m;
}

// ---- Meat ------------------------------------------------------------------

const BONE = 0xf1ecdc;
const steakGeo = faceted(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 8)).scale(1.35, 1, 1);

/**
 * A steak on a bone, lying flat and pointing along X. Raw = pink-red with a
 * pale fat rim; cooked = browned with grill marks.
 */
export function createSteak(cooked: boolean): THREE.Group {
  const g = new THREE.Group();
  const side = toon(cooked ? 0xb37a43 : 0xefd9ca);
  const top = toon(0xffffff, { map: cooked ? textures.meatCooked() : textures.meatRaw() });
  const meat = new THREE.Mesh(steakGeo, [side, top, top]);
  meat.position.y = 0.05;
  g.add(meat);
  const bone = toon(BONE);
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.045), bone);
  stick.position.set(0.3, 0.05, 0);
  const knobA = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.06), bone);
  knobA.position.set(0.43, 0.05, 0.035);
  const knobB = knobA.clone();
  knobB.position.z = -0.035;
  g.add(stick, knobA, knobB);
  return g;
}

// ---- Wool, leather, feathers ---------------------------------------------------

const puffGeo = faceted(new THREE.IcosahedronGeometry(0.14, 1));

/** A fluffy pile of wool tufts. */
export function createWoolPuffs(count: number): THREE.Group {
  const g = new THREE.Group();
  const mat = toon(0xffffff, { map: textures.wool() });
  const spots: [number, number, number][] = [
    [0, 0.13, 0],
    [0.17, 0.11, 0.08],
    [-0.13, 0.11, 0.12],
    [0.02, 0.28, 0.02],
  ];
  for (let i = 0; i < Math.min(spots.length, Math.max(1, count + 1)); i++) {
    const p = new THREE.Mesh(puffGeo, mat);
    p.position.set(...spots[i]);
    p.rotation.y = i * 1.3;
    g.add(p);
  }
  return g;
}

/** A folded animal hide. */
export function createHide(): THREE.Group {
  const g = new THREE.Group();
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.38), toon(0x9c6a3a));
  a.position.y = 0.03;
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.3), toon(0x7e5229));
  b.position.y = 0.09;
  b.rotation.y = 0.35;
  g.add(a, b);
  return g;
}

/** A single white feather with a grey quill, lying flat. */
export function createFeather(): THREE.Group {
  const g = new THREE.Group();
  const vane = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.34), toon(0xffffff));
  vane.position.set(0, 0.03, -0.02);
  const quill = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.42), toon(0xb8c4cf));
  quill.position.set(0, 0.035, 0);
  g.add(vane, quill);
  return g;
}

// ---- Tools ---------------------------------------------------------------------

/** Axe pointing up (+Y), blade toward -Z; origin at the grip. */
export function createAxe(): THREE.Group {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(
    faceted(new THREE.CylinderGeometry(0.03, 0.036, 0.8, 6)).translate(0, 0.27, 0),
    toon(0xa87340, { map: textures.plank() }),
  );
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.24, 0.3).translate(0, 0.58, -0.11),
    toon(0xffffff, { map: textures.plank() }),
  );
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.05).translate(0, 0.58, -0.28), toon(0xf0e6cf));
  const binding = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.05, 0.075).translate(0, 0.46, 0), toon(0x5a3418));
  g.add(handle, head, edge, binding);
  return g;
}

/** Place `count` copies of `make()` in a tight ring so piles read as piles. */
export function arrange(count: number, max: number, radius: number, make: (i: number) => THREE.Object3D): THREE.Group {
  const g = new THREE.Group();
  const n = Math.min(max, Math.max(1, count));
  for (let i = 0; i < n; i++) {
    const o = make(i);
    const a = (i / n) * Math.PI * 2 + 0.4;
    o.position.x += n > 1 ? Math.cos(a) * radius : 0;
    o.position.z += n > 1 ? Math.sin(a) * radius : 0;
    o.rotation.y += i * 1.9;
    g.add(o);
  }
  return g;
}
