import * as THREE from 'three';
import {
  CAMPFIRE_GROUND_HEIGHT,
  ISLAND_RADIUS,
  TREE_ATTEMPTS,
  TREE_CLEARING_RADIUS,
  TREE_GROW_SECONDS,
  TREE_HITS,
  TREE_MIN_HEIGHT,
  TREE_MIN_SPACING,
  TREE_REGROW_CLEARANCE,
  TREE_REGROW_SECONDS,
  WORLD_SEED,
} from '../config';
import { faceted, toon } from '../render/materials';
import { textures } from '../render/textures';
import { ColliderGrid } from './Colliders';
import { mulberry32 } from './noise';
import type { Terrain } from './Terrain';

/**
 * alive   - full size, choppable, has a collider
 * felled  - chopped down, invisible, waiting `timer` seconds to regrow
 * growing - sapling scaling up to full size (has a collider, not choppable)
 */
export type TreeState = 'alive' | 'felled' | 'growing';

export interface Tree {
  /** Index of this tree's instance in the InstancedMeshes (stable forever). */
  index: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  state: TreeState;
  /** Remaining hits before it falls. */
  hp: number;
  /** Current collider id, or -1 when felled. */
  colliderId: number;
  /** felled: seconds until regrow starts. growing: seconds grown so far. */
  timer: number;
  /** Seconds of "hit wobble" remaining. */
  shake: number;
  yaw: number;
}

const TRUNK_RADIUS = 0.35;
const SHAKE_TIME = 0.35;

/**
 * Procedurally scattered trees rendered with InstancedMesh (3 draw calls for
 * the whole forest). Every tree slot is permanent: felling hides the instance
 * and, after TREE_REGROW_SECONDS, the same tree grows back, so the forest
 * never runs out. Call `update()` every frame.
 */
export class Forest {
  readonly trees: Tree[] = [];
  readonly group = new THREE.Group();
  private readonly trunks: THREE.InstancedMesh;
  private readonly lowerLeaves: THREE.InstancedMesh;
  private readonly upperLeaves: THREE.InstancedMesh;
  /** Felled trees waiting to regrow. */
  private readonly felled = new Set<Tree>();
  /** Trees whose matrices must be rewritten each frame (shaking/growing). */
  private readonly animating = new Set<Tree>();

  // scratch objects to avoid per-frame allocations
  private readonly m = new THREE.Matrix4();
  private readonly p = new THREE.Vector3();
  private readonly s = new THREE.Vector3();
  private readonly q = new THREE.Quaternion();
  private readonly tilt = new THREE.Quaternion();
  private readonly euler = new THREE.Euler();

  constructor(terrain: Terrain, private readonly colliders: ColliderGrid) {
    const rand = mulberry32(WORLD_SEED + 100);
    const placed: { colliderId: number; x: number; y: number; z: number; scale: number }[] = [];

    for (let i = 0; i < TREE_ATTEMPTS; i++) {
      const angle = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * ISLAND_RADIUS;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (r < TREE_CLEARING_RADIUS) continue;
      if (terrain.biomeAt(x, z) !== 'forest') continue;
      const y = terrain.heightAt(x, z);
      if (y < TREE_MIN_HEIGHT || y > CAMPFIRE_GROUND_HEIGHT + 6) continue;
      if (colliders.overlaps(x, z, TREE_MIN_SPACING / 2)) continue;
      const scale = 0.8 + rand() * 0.7;
      const collider = colliders.add(x, z, TRUNK_RADIUS * scale);
      placed.push({ colliderId: collider.id, x, y, z, scale });
    }

    // Chunky, slightly oversized pines (bigger than life reads better at low res).
    const trunkGeo = faceted(new THREE.CylinderGeometry(0.3, 0.42, 3, 6).translate(0, 1.5, 0));
    const lowerGeo = faceted(new THREE.ConeGeometry(2.0, 3.2, 7).translate(0, 3.5, 0));
    const upperGeo = faceted(new THREE.ConeGeometry(1.45, 2.8, 7).translate(0, 5.3, 0));
    const bark = toon(0xffffff, { map: textures.bark() });
    const leaves = toon(0xffffff, { map: textures.leaves() });

    const n = placed.length;
    this.trunks = new THREE.InstancedMesh(trunkGeo, bark, n);
    this.lowerLeaves = new THREE.InstancedMesh(lowerGeo, leaves, n);
    this.upperLeaves = new THREE.InstancedMesh(upperGeo, leaves, n);
    // Trees are removed/added at runtime, so don't rely on a static bounding sphere.
    for (const mesh of [this.trunks, this.lowerLeaves, this.upperLeaves]) mesh.frustumCulled = false;

    const col = new THREE.Color();
    placed.forEach((t, index) => {
      const tree: Tree = {
        index,
        x: t.x,
        y: t.y,
        z: t.z,
        scale: t.scale,
        state: 'alive',
        hp: TREE_HITS,
        colliderId: t.colliderId,
        timer: 0,
        shake: 0,
        yaw: rand() * Math.PI * 2,
      };
      this.trees.push(tree);
      this.writeMatrix(tree, 1);
      // Bright, saturated greens: the daytime look should feel almost too perfect.
      col.setHSL(0.29 + rand() * 0.06, 0.62, 0.36 + rand() * 0.1);
      this.lowerLeaves.setColorAt(index, col);
      this.upperLeaves.setColorAt(index, col);
    });

    this.group.add(this.trunks, this.lowerLeaves, this.upperLeaves);
    this.group.name = 'forest';
  }

  /**
   * Best choppable tree in front of (x, z): within `reach` and inside the aim
   * cone around facing direction (fx, fz) (unit vector). Closest wins.
   */
  findTarget(x: number, z: number, fx: number, fz: number, reach: number, minDot: number): Tree | null {
    let best: Tree | null = null;
    let bestD = reach;
    for (const t of this.trees) {
      if (t.state !== 'alive') continue;
      const dx = t.x - x;
      const dz = t.z - z;
      const d = Math.hypot(dx, dz);
      if (d > bestD) continue;
      if (d > 0.0001 && (dx * fx + dz * fz) / d < minDot) continue;
      bestD = d;
      best = t;
    }
    return best;
  }

  /** Register one hit of `power` damage. Returns true if the tree was felled by this hit. */
  hit(tree: Tree, power = 1): boolean {
    if (tree.state !== 'alive') return false;
    tree.hp -= power;
    tree.shake = SHAKE_TIME;
    if (tree.hp > 0) {
      this.animating.add(tree);
      return false;
    }
    tree.state = 'felled';
    tree.timer = TREE_REGROW_SECONDS;
    tree.shake = 0;
    this.colliders.remove(tree.colliderId);
    tree.colliderId = -1;
    this.animating.delete(tree);
    this.felled.add(tree);
    this.writeMatrix(tree, 0);
    return true;
  }

  /** Advance wobble, regrowth timers and growth animation. (px, pz) = player. */
  update(dt: number, px: number, pz: number): void {
    for (const t of this.felled) {
      t.timer -= dt;
      if (t.timer > 0) continue;
      if (Math.hypot(t.x - px, t.z - pz) < TREE_REGROW_CLEARANCE) {
        t.timer = 3; // player standing there; try again shortly
        continue;
      }
      t.state = 'growing';
      t.timer = 0;
      t.hp = TREE_HITS;
      t.colliderId = this.colliders.add(t.x, t.z, TRUNK_RADIUS * t.scale).id;
      this.felled.delete(t);
      this.animating.add(t);
    }

    for (const t of this.animating) {
      t.shake = Math.max(0, t.shake - dt);
      let growth = 1;
      if (t.state === 'growing') {
        t.timer += dt;
        const g = Math.min(1, t.timer / TREE_GROW_SECONDS);
        growth = Math.max(0.05, 1 - (1 - g) ** 3); // ease-out
        if (g >= 1) t.state = 'alive';
      }
      this.writeMatrix(t, growth);
      if (t.state === 'alive' && t.shake <= 0) this.animating.delete(t);
    }
  }

  private writeMatrix(t: Tree, growth: number): void {
    this.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, t.yaw);
    if (t.shake > 0) {
      const k = t.shake / SHAKE_TIME;
      this.euler.set(Math.sin(t.shake * 45) * 0.05 * k, 0, Math.cos(t.shake * 45) * 0.05 * k);
      this.q.multiply(this.tilt.setFromEuler(this.euler));
    }
    this.p.set(t.x, t.y - 0.1, t.z);
    this.s.setScalar(t.scale * growth);
    this.m.compose(this.p, this.q, this.s);
    for (const mesh of [this.trunks, this.lowerLeaves, this.upperLeaves]) {
      mesh.setMatrixAt(t.index, this.m);
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}
