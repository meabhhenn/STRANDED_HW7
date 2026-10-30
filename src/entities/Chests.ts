import * as THREE from 'three';
import {
  CHEST_AIM_MIN_DOT,
  CHEST_COUNT,
  CHEST_LOOT,
  CHEST_MAX_DROPS,
  CHEST_MIN_DROPS,
  CHEST_REACH,
  CHEST_RESPAWN_SECONDS,
  ISLAND_RADIUS,
  WORLD_SEED,
} from '../config';
import type { ItemId } from '../inventory/Item';
import { createChest } from '../render/props';
import type { ColliderGrid } from '../world/Colliders';
import type { DroppedItems } from '../world/DroppedItems';
import { mulberry32 } from '../world/noise';

/** The slice of World that chests need (avoids a circular import). */
export interface ChestHost {
  colliders: ColliderGrid;
  drops: DroppedItems;
  groundHeight(x: number, z: number): number;
  /** Forest ground a chest may sit on (dry, not desert, on the island). */
  isLand(x: number, z: number): boolean;
}

export interface Chest {
  x: number;
  y: number;
  z: number;
  yaw: number;
  opened: boolean;
  /** Seconds until this looted chest respawns in a new spot (0 when not waiting). */
  respawn: number;
  group: THREE.Group;
}

const randInt = (min: number, max: number): number => min + Math.floor(Math.random() * (max - min + 1));

/**
 * Random loot chests scattered on forest ground (SPEC feature 8). Facing one
 * and pressing E opens it (see Interaction): it drops 1-3 random loot piles via
 * the shared DroppedItems system and then shows as opened. A looted chest
 * respawns in a fresh spot after CHEST_RESPAWN_SECONDS. Seeded like the forest
 * so the starting layout is deterministic.
 */
export class Chests {
  readonly group = new THREE.Group();
  readonly chests: Chest[] = [];

  constructor(private readonly host: ChestHost) {
    this.group.name = 'chests';
    const seeded = mulberry32(WORLD_SEED + 300);
    for (let i = 0; i < CHEST_COUNT; i++) {
      const spot = this.findSpot(seeded);
      if (spot) this.spawn(spot.x, spot.z);
    }
  }

  /** Closest unopened chest in front of (x, z): within reach and aim cone. */
  findTarget(x: number, z: number, fx: number, fz: number): Chest | null {
    let best: Chest | null = null;
    let bestD = CHEST_REACH;
    for (const c of this.chests) {
      if (c.opened) continue;
      const dx = c.x - x;
      const dz = c.z - z;
      const d = Math.hypot(dx, dz);
      if (d > bestD) continue;
      if (d > 0.3 && (dx * fx + dz * fz) / d < CHEST_AIM_MIN_DOT) continue;
      bestD = d;
      best = c;
    }
    return best;
  }

  /**
   * Open a chest: roll the loot table and drop 1-3 piles beside it, then mark it
   * opened (lid swings back) and queue a respawn. Returns the ItemIds dropped
   * (for a toast), or null if it was already open.
   */
  open(chest: Chest): ItemId[] | null {
    if (chest.opened) return null;
    chest.opened = true;
    chest.respawn = CHEST_RESPAWN_SECONDS;
    this.setMesh(chest);

    const dropped: ItemId[] = [];
    const rolls = randInt(CHEST_MIN_DROPS, CHEST_MAX_DROPS);
    for (let i = 0; i < rolls; i++) {
      const entry = this.rollLoot();
      const n = randInt(entry.min, entry.max);
      const a = Math.random() * Math.PI * 2;
      const r = 0.7 + Math.random() * 0.4;
      this.host.drops.spawn(entry.item as ItemId, n, chest.x + Math.cos(a) * r, chest.z + Math.sin(a) * r);
      dropped.push(entry.item as ItemId);
    }
    return dropped;
  }

  update(dt: number): void {
    for (const c of this.chests) {
      if (!c.opened) continue;
      c.respawn -= dt;
      if (c.respawn <= 0) this.relocate(c);
    }
  }

  // ---- internals ----

  /** Weighted pick from CHEST_LOOT. */
  private rollLoot(): (typeof CHEST_LOOT)[number] {
    let total = 0;
    for (const e of CHEST_LOOT) total += e.weight;
    let roll = Math.random() * total;
    for (const e of CHEST_LOOT) {
      roll -= e.weight;
      if (roll <= 0) return e;
    }
    return CHEST_LOOT[0];
  }

  /** Move a looted chest to a fresh spot and reset it to closed. */
  private relocate(chest: Chest): void {
    const spot = this.findSpot(Math.random);
    if (!spot) {
      chest.respawn = 5; // no valid spot right now; try again shortly
      return;
    }
    chest.x = spot.x;
    chest.z = spot.z;
    chest.y = this.host.groundHeight(spot.x, spot.z);
    chest.yaw = Math.random() * Math.PI * 2;
    chest.opened = false;
    chest.respawn = 0;
    this.setMesh(chest);
  }

  /** Rebuild the chest's mesh for its current opened/closed state. */
  private setMesh(chest: Chest): void {
    this.group.remove(chest.group);
    const g = createChest(chest.opened);
    g.position.set(chest.x, chest.y, chest.z);
    g.rotation.y = chest.yaw;
    this.group.add(g);
    chest.group = g;
  }

  private findSpot(random: () => number): { x: number; z: number } | null {
    for (let i = 0; i < 40; i++) {
      const angle = random() * Math.PI * 2;
      const r = 14 + random() * (ISLAND_RADIUS - 30 - 14);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!this.host.isLand(x, z)) continue;
      if (this.host.colliders.overlaps(x, z, 1)) continue;
      return { x, z };
    }
    return null;
  }

  private spawn(x: number, z: number): Chest {
    const y = this.host.groundHeight(x, z);
    const yaw = Math.random() * Math.PI * 2;
    const g = createChest(false);
    g.position.set(x, y, z);
    g.rotation.y = yaw;
    this.group.add(g);
    const chest: Chest = { x, y, z, yaw, opened: false, respawn: 0, group: g };
    this.chests.push(chest);
    return chest;
  }
}
