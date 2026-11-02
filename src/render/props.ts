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

/** Wooden spear pointing up (+Y), tip toward -Z lean; origin at the grip. A long shaft with a sharp tip. */
export function createSpear(): THREE.Group {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(
    faceted(new THREE.CylinderGeometry(0.026, 0.03, 1.15, 6)).translate(0, 0.45, 0),
    toon(0xa87340, { map: textures.plank() }),
  );
  // Lashing just below the head.
  const lash = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.06).translate(0, 0.92, 0), toon(0x5a3418));
  // Carved wooden tip (a short pyramid-ish cone).
  const tip = new THREE.Mesh(faceted(new THREE.ConeGeometry(0.06, 0.26, 4)).translate(0, 1.12, 0), toon(0xf0e6cf));
  g.add(shaft, lash, tip);
  return g;
}

/** Stone axe pointing up (+Y), blade toward -Z; origin at the grip. Like createAxe but with a grey stone head. */
export function createStoneAxe(): THREE.Group {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(
    faceted(new THREE.CylinderGeometry(0.032, 0.038, 0.82, 6)).translate(0, 0.28, 0),
    toon(0x8a5a2b, { map: textures.plank() }),
  );
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.32).translate(0, 0.6, -0.11), toon(0x8b9096));
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.06).translate(0, 0.6, -0.3), toon(0xcfd4d8));
  const binding = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08).translate(0, 0.47, 0), toon(0x4a2d16));
  g.add(handle, head, edge, binding);
  return g;
}

// ---- Medical ------------------------------------------------------------------

/** A rolled bandage: a pale gauze cylinder with a red stripe, lying flat. */
export function createBandage(): THREE.Group {
  const g = new THREE.Group();
  const roll = new THREE.Mesh(
    faceted(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 8).rotateZ(Math.PI / 2)),
    toon(0xf2ece0),
  );
  roll.position.y = 0.1;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.205, 0.205), toon(0xd9423e));
  stripe.position.y = 0.1;
  g.add(roll, stripe);
  return g;
}

/** A medkit: a white box with a red cross on top. */
export function createMedkit(): THREE.Group {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.26), toon(0xf4f1ea));
  box.position.y = 0.12;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.27), toon(0xd9423e));
  lid.position.y = 0.25;
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.16), toon(0xd9423e));
  crossV.position.y = 0.235;
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.06), toon(0xd9423e));
  crossH.position.y = 0.235;
  g.add(box, lid, crossV, crossH);
  return g;
}

// ---- Loot chest ----------------------------------------------------------------

/**
 * A wooden loot chest with iron bands and a lid. `opened` tilts the lid back so
 * a looted chest reads as empty. Origin at ground level, facing -Z.
 */
export function createChest(opened: boolean): THREE.Group {
  const g = new THREE.Group();
  const wood = toon(0xffffff, { map: textures.plank() });
  const iron = toon(0x4a4f57);

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.5), wood);
  base.position.y = 0.21;
  g.add(base);
  for (const x of [-0.3, 0.3]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.52), iron);
    band.position.set(x, 0.21, 0);
    g.add(band);
  }

  // Lid pivots at the back-top edge so it can swing open.
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.42, 0.25);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.5), wood);
  lid.position.set(0, 0.09, -0.25);
  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.06), iron);
  latch.position.set(0, 0.02, -0.5);
  lidPivot.add(lid, latch);
  lidPivot.rotation.x = opened ? -1.9 : 0;
  g.add(lidPivot);
  return g;
}

// ---- Ore & metal ---------------------------------------------------------------

/**
 * A grey boulder with glinting metal veins. Used both for the mineable rock in
 * the world and (smaller) for dropped metal_ore piles. Origin at ground level.
 */
export function createOreRock(): THREE.Group {
  const g = new THREE.Group();
  const stone = toon(0x7f868d);
  const stoneDark = toon(0x5c6268);
  const ore = toon(0xd8b25a); // brassy ore veins
  const rock = new THREE.Mesh(faceted(new THREE.DodecahedronGeometry(0.5, 0)), stone);
  rock.position.y = 0.4;
  rock.scale.set(1, 0.8, 1);
  g.add(rock);
  // A couple of smaller chunks and ore nuggets clustered around it.
  const chunk = new THREE.Mesh(faceted(new THREE.DodecahedronGeometry(0.26, 0)), stoneDark);
  chunk.position.set(0.34, 0.2, 0.14);
  g.add(chunk);
  for (const [x, y, z] of [
    [0.12, 0.5, -0.28],
    [-0.26, 0.42, 0.1],
    [0.1, 0.62, 0.16],
  ]) {
    const nugget = new THREE.Mesh(faceted(new THREE.IcosahedronGeometry(0.1, 0)), ore);
    nugget.position.set(x, y, z);
    g.add(nugget);
  }
  return g;
}

/** A small metal ore nugget for dropped piles (origin at ground level). */
export function createOreNugget(): THREE.Group {
  const g = new THREE.Group();
  const nugget = new THREE.Mesh(faceted(new THREE.IcosahedronGeometry(0.16, 0)), toon(0x9a8f7a));
  nugget.position.y = 0.14;
  const vein = new THREE.Mesh(faceted(new THREE.IcosahedronGeometry(0.08, 0)), toon(0xd8b25a));
  vein.position.set(0.06, 0.2, 0.04);
  g.add(nugget, vein);
  return g;
}

/** Iron spear pointing up (+Y); like the wooden spear but with a steel head. Origin at grip. */
export function createIronSpear(): THREE.Group {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(
    faceted(new THREE.CylinderGeometry(0.028, 0.032, 1.15, 6)).translate(0, 0.45, 0),
    toon(0x7a5230, { map: textures.plank() }),
  );
  const lash = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.06).translate(0, 0.92, 0), toon(0x4a4f57));
  // Steel leaf-blade tip.
  const tip = new THREE.Mesh(faceted(new THREE.ConeGeometry(0.08, 0.34, 4)).translate(0, 1.16, 0), toon(0xcfd4d8));
  g.add(shaft, lash, tip);
  return g;
}

/** A simple rifle held level, barrel toward -Z; origin at the grip. */
export function createGun(): THREE.Group {
  const g = new THREE.Group();
  const metal = toon(0x40454c);
  const dark = toon(0x26292e);
  const wood = toon(0x6e4524);
  // Body/receiver.
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.42).translate(0, 0.04, -0.1), metal));
  // Barrel.
  g.add(new THREE.Mesh(faceted(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6)).rotateX(Math.PI / 2).translate(0, 0.06, -0.5), dark));
  // Wooden stock behind the grip.
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.26).translate(0, 0.02, 0.22), wood));
  // Grip.
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.08).translate(0, -0.08, 0.02), dark);
  grip.rotation.x = 0.3;
  g.add(grip);
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
