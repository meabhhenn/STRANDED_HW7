import * as THREE from 'three';
import {
  ANIMAL_FLEE_SECONDS,
  ISLAND_RADIUS,
  LIVESTOCK_COUNTS,
  LIVESTOCK_RESPAWN_MIN_DISTANCE,
  LIVESTOCK_RESPAWN_SECONDS,
  WORLD_SEED,
} from '../config';
import type { ColliderGrid } from '../world/Colliders';
import type { DroppedItems } from '../world/DroppedItems';
import { mulberry32 } from '../world/noise';
import { ANIMALS, createAnimalModel, type AnimalKind } from './animals';

/** The slice of World that livestock needs (avoids a circular import). */
export interface LivestockHost {
  colliders: ColliderGrid;
  drops: DroppedItems;
  groundHeight(x: number, z: number): number;
  /** Forest ground an animal may stand on (dry, not desert, on the island). */
  isLand(x: number, z: number): boolean;
}

type AnimalState = 'idle' | 'wander' | 'flee' | 'dead';

export interface Animal {
  kind: AnimalKind;
  hp: number;
  x: number;
  y: number;
  z: number;
  /** Heading: forward = (-sin yaw, -cos yaw), same as the player. */
  yaw: number;
  state: AnimalState;
  /** Seconds left in the current state (death: seconds since death). */
  timer: number;
  /** Seconds of hit squash animation left. */
  hurt: number;
  group: THREE.Group;
  legs: THREE.Object3D[];
  swingPhase: number;
  swingAmp: number;
  visualYaw: number;
}

const HURT_TIME = 0.25;
const DEATH_TIME = 0.8;

const rand = (min: number, max: number): number => min + Math.random() * (max - min);
const randInt = (min: number, max: number): number => min + Math.floor(Math.random() * (max - min + 1));

/**
 * Wandering farm animals. Each stands idle, wanders in short strolls, and
 * flees from the player for a few seconds after being hit. Killing one drops
 * items (see ANIMALS in animals.ts) and queues a respawn so the island never
 * runs out of livestock.
 */
export class Livestock {
  readonly group = new THREE.Group();
  readonly animals: Animal[] = [];
  private readonly respawns: { kind: AnimalKind; timer: number }[] = [];

  constructor(private readonly host: LivestockHost) {
    this.group.name = 'livestock';
    const seeded = mulberry32(WORLD_SEED + 200);
    for (const kind of Object.keys(LIVESTOCK_COUNTS) as AnimalKind[]) {
      for (let i = 0; i < LIVESTOCK_COUNTS[kind]; i++) {
        const spot = this.findSpawnSpot(seeded, 15, null);
        if (spot) this.spawn(kind, spot.x, spot.z);
      }
    }
  }

  /** Best living animal in front of (x, z): within reach and aim cone, closest first. */
  findTarget(x: number, z: number, fx: number, fz: number, reach: number, minDot: number): Animal | null {
    let best: Animal | null = null;
    let bestD = reach;
    for (const a of this.animals) {
      if (a.state === 'dead') continue;
      const dx = a.x - x;
      const dz = a.z - z;
      const d = Math.hypot(dx, dz) - ANIMALS[a.kind].radius * 0.5;
      if (d > bestD) continue;
      if (d > 0.3 && (dx * fx + dz * fz) / Math.hypot(dx, dz) < minDot) continue;
      bestD = d;
      best = a;
    }
    return best;
  }

  /**
   * Hit an animal. It flees from (fromX, fromZ). On death it drops its items
   * and queues a respawn. Returns true if this hit killed it.
   */
  hit(animal: Animal, damage: number, fromX: number, fromZ: number): boolean {
    if (animal.state === 'dead') return false;
    animal.hp -= damage;
    animal.hurt = HURT_TIME;
    if (animal.hp <= 0) {
      this.kill(animal);
      return true;
    }
    animal.state = 'flee';
    animal.timer = ANIMAL_FLEE_SECONDS;
    animal.yaw = Math.atan2(-(animal.x - fromX), -(animal.z - fromZ)) + rand(-0.4, 0.4);
    this.step(animal, 0.5, 1); // small knockback
    return false;
  }

  update(dt: number, px: number, pz: number): void {
    for (let i = this.animals.length - 1; i >= 0; i--) {
      const a = this.animals[i];
      if (a.state === 'dead') {
        a.timer += dt;
        a.group.rotation.z = Math.min(1, a.timer / (DEATH_TIME * 0.6)) * (Math.PI / 2);
        if (a.timer >= DEATH_TIME) {
          this.group.remove(a.group);
          this.animals.splice(i, 1);
        }
        continue;
      }
      this.think(a, dt);
      this.animate(a, dt);
    }
    this.updateRespawns(dt, px, pz);
  }

  // ---- behaviour ----

  private think(a: Animal, dt: number): void {
    const def = ANIMALS[a.kind];
    a.timer -= dt;
    switch (a.state) {
      case 'idle':
        if (a.timer <= 0) {
          a.state = 'wander';
          a.timer = rand(2, 4);
          a.yaw = Math.random() * Math.PI * 2;
        }
        break;
      case 'wander':
        if (a.timer <= 0 || !this.step(a, def.walkSpeed, dt)) {
          a.state = 'idle';
          a.timer = rand(2, 6);
        }
        break;
      case 'flee':
        if (!this.step(a, def.fleeSpeed, dt)) a.yaw += Math.PI * rand(0.5, 1.5); // blocked: turn around
        if (a.timer <= 0) {
          a.state = 'idle';
          a.timer = rand(1, 3);
        }
        break;
    }
    a.swingAmp += ((a.state === 'idle' ? 0 : a.state === 'flee' ? 0.9 : 0.5) - a.swingAmp) * Math.min(1, dt * 8);
    a.swingPhase += dt * (a.state === 'flee' ? 16 : 8);
  }

  /** Walk forward; returns false if blocked by trees/water/edge. */
  private step(a: Animal, speed: number, dt: number): boolean {
    const dist = speed * dt;
    const nx = a.x - Math.sin(a.yaw) * dist;
    const nz = a.z - Math.cos(a.yaw) * dist;
    const r = this.host.colliders.resolve(nx, nz, ANIMALS[a.kind].radius);
    if (!this.host.isLand(r.x, r.z)) return false;
    a.x = r.x;
    a.z = r.z;
    return true;
  }

  private animate(a: Animal, dt: number): void {
    a.hurt = Math.max(0, a.hurt - dt);
    a.y += (this.host.groundHeight(a.x, a.z) - a.y) * Math.min(1, dt * 10);
    // Smoothly turn the model toward the heading (shortest way round).
    const diff = Math.atan2(Math.sin(a.yaw - a.visualYaw), Math.cos(a.yaw - a.visualYaw));
    a.visualYaw += diff * Math.min(1, dt * 8);
    a.group.position.set(a.x, a.y, a.z);
    a.group.rotation.y = a.visualYaw;
    const swing = Math.sin(a.swingPhase) * a.swingAmp;
    // Two legs alternate; four legs swing as diagonal pairs (0,1) vs (2,3).
    const pairSplit = a.legs.length === 2 ? 1 : 2;
    a.legs.forEach((leg, i) => (leg.rotation.x = i < pairSplit ? swing : -swing));
    // Squash when hit.
    const squash = a.hurt > 0 ? 1 - 0.2 * (a.hurt / HURT_TIME) : 1;
    a.group.scale.set(1 + (1 - squash) * 0.5, squash, 1 + (1 - squash) * 0.5);
  }

  private kill(a: Animal): void {
    a.state = 'dead';
    a.timer = 0;
    this.respawns.push({ kind: a.kind, timer: LIVESTOCK_RESPAWN_SECONDS });
    for (const rule of ANIMALS[a.kind].drops) {
      const n = randInt(rule.min, rule.max);
      const x = a.x + rand(-0.5, 0.5);
      const z = a.z + rand(-0.5, 0.5);
      this.host.drops.spawn(rule.item, n, x, z);
    }
  }

  // ---- spawning ----

  private updateRespawns(dt: number, px: number, pz: number): void {
    for (let i = this.respawns.length - 1; i >= 0; i--) {
      const r = this.respawns[i];
      r.timer -= dt;
      if (r.timer > 0) continue;
      const spot = this.findSpawnSpot(Math.random, 15, { x: px, z: pz });
      if (spot) {
        this.spawn(r.kind, spot.x, spot.z);
        this.respawns.splice(i, 1);
      } else {
        r.timer = 5; // no valid spot right now; try again shortly
      }
    }
  }

  private findSpawnSpot(random: () => number, minRadius: number, avoid: { x: number; z: number } | null) {
    for (let i = 0; i < 40; i++) {
      const angle = random() * Math.PI * 2;
      const r = minRadius + random() * (ISLAND_RADIUS - 30 - minRadius);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!this.host.isLand(x, z)) continue;
      if (this.host.colliders.overlaps(x, z, 0.8)) continue;
      if (avoid && Math.hypot(x - avoid.x, z - avoid.z) < LIVESTOCK_RESPAWN_MIN_DISTANCE) continue;
      return { x, z };
    }
    return null;
  }

  private spawn(kind: AnimalKind, x: number, z: number): Animal {
    const model = createAnimalModel(kind);
    const yaw = Math.random() * Math.PI * 2;
    const animal: Animal = {
      kind,
      hp: ANIMALS[kind].hp,
      x,
      y: this.host.groundHeight(x, z),
      z,
      yaw,
      visualYaw: yaw,
      state: 'idle',
      timer: rand(0, 4),
      hurt: 0,
      group: model.group,
      legs: model.legs,
      swingPhase: Math.random() * 6,
      swingAmp: 0,
    };
    model.group.position.set(x, animal.y, z);
    this.group.add(model.group);
    this.animals.push(animal);
    return animal;
  }
}
