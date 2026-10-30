import * as THREE from 'three';
import {
  BASE_UNLOCK_RADIUS,
  CAMPFIRE_GROUND_HEIGHT,
  CAMPFIRE_SAFE_RADIUS,
  CRAFT_TABLE_REACH,
  CRAFT_TABLE_X,
  CRAFT_TABLE_Z,
  DIFFICULTY_EVERY_N_DAYS,
  DIFFICULTY_MAX_TIER,
  DESERT_UNLOCK_LEVEL,
  ISLAND_RADIUS,
  MIN_WALK_HEIGHT,
  TERRAIN_SIZE,
  UNLOCK_RADIUS_PER_LEVEL,
  WATER_LEVEL,
} from '../config';
import { Chests } from '../entities/Chests';
import { Livestock } from '../entities/Livestock';
import { Monsters } from '../entities/Monsters';
import type { PlayerStats } from '../player/Stats';
import { toon } from '../render/materials';
import { textures } from '../render/textures';
import { Sky } from './Sky';
import { Campfire } from './Campfire';
import { CraftingTable } from './CraftingTable';
import { ColliderGrid } from './Colliders';
import { DayNight } from './DayNight';
import { DroppedItems } from './DroppedItems';
import { Forest } from './Forest';
import { Terrain } from './Terrain';

/**
 * Owns everything that exists in the 3D world and answers spatial questions
 * ("what's the ground height here?", "can I stand here?"). Systems like the
 * player, monsters and wolves should ask the World rather than reaching into
 * Terrain/Forest directly.
 */
export class World {
  readonly scene = new THREE.Scene();
  readonly terrain = new Terrain();
  readonly colliders = new ColliderGrid();
  readonly campfire: Campfire;
  readonly craftingTable: CraftingTable;
  readonly forest: Forest;
  readonly dayNight: DayNight;
  readonly drops: DroppedItems;
  readonly livestock: Livestock;
  readonly monsters: Monsters;
  readonly chests: Chests;
  /** Set by Game so night monsters can damage the player. */
  stats: PlayerStats | null = null;
  private readonly sky: Sky;

  constructor() {
    this.dayNight = new DayNight(this.scene);

    this.scene.add(this.terrain.createMesh());

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(TERRAIN_SIZE * 4, TERRAIN_SIZE * 4).rotateX(-Math.PI / 2),
      toon(0xffffff, { map: this.waterTexture(), transparent: true, opacity: 0.9 }),
    );
    water.position.y = WATER_LEVEL;
    water.name = 'water';
    this.scene.add(water);

    this.campfire = new Campfire(0, CAMPFIRE_GROUND_HEIGHT, 0);
    this.colliders.add(0, 0, this.campfire.collisionRadius);
    this.scene.add(this.campfire.group);

    // Crafting table on the flat ground beside the fire (SPEC feature 7).
    this.craftingTable = new CraftingTable(CRAFT_TABLE_X, CAMPFIRE_GROUND_HEIGHT, CRAFT_TABLE_Z);
    this.colliders.add(CRAFT_TABLE_X, CRAFT_TABLE_Z, this.craftingTable.collisionRadius);
    this.scene.add(this.craftingTable.group);

    this.forest = new Forest(this.terrain, this.colliders);
    this.scene.add(this.forest.group);

    this.drops = new DroppedItems((x, z) => this.terrain.heightAt(x, z));
    this.scene.add(this.drops.group);

    // Cooked meat appears on the ground beside the fire, ready to pick up with E.
    this.campfire.onCooked = (count) => {
      const a = Math.random() * Math.PI * 2;
      const p = this.campfire.group.position;
      this.drops.spawn('cooked_meat', count, p.x + Math.cos(a) * 1.7, p.z + Math.sin(a) * 1.7);
    };

    this.sky = new Sky();
    this.scene.add(this.sky.group);

    this.livestock = new Livestock(this);
    this.scene.add(this.livestock.group);

    this.monsters = new Monsters(this);
    this.scene.add(this.monsters.group);

    this.chests = new Chests(this);
    this.scene.add(this.chests.group);
  }

  /** True only during the in-game night (hook for night monster spawns). */
  isNight(): boolean {
    return this.dayNight.isNight;
  }

  /** World position of the campfire (raid target for monsters). */
  firePos(): { x: number; z: number } {
    const p = this.campfire.group.position;
    return { x: p.x, z: p.z };
  }

  /** Apply monster damage to the campfire (drains fuel). */
  damageCampfire(fuelLoss: number): void {
    this.campfire.damage(fuelLoss);
  }

  /** Difficulty tier (0+) from the current day, capped (SPEC rule 2). */
  difficultyTier(): number {
    return Math.min(DIFFICULTY_MAX_TIER, Math.floor((this.dayNight.day - 1) / DIFFICULTY_EVERY_N_DAYS));
  }

  /** Pixel water texture, tiled every 8 m across the ocean plane. */
  private waterTexture() {
    const t = textures.water();
    t.repeat.set((TERRAIN_SIZE * 4) / 8, (TERRAIN_SIZE * 4) / 8);
    return t;
  }

  /** Campfire level. Higher levels unlock more of the map. */
  get campfireLevel(): number {
    return this.campfire.level;
  }

  /** Debug/cheat hook; normal play levels up by feeding logs to the fire. */
  set campfireLevel(level: number) {
    this.campfire.level = Math.max(1, Math.floor(level));
  }

  /** Radius around the campfire the player may currently explore. */
  get unlockedRadius(): number {
    return Math.min(ISLAND_RADIUS, BASE_UNLOCK_RADIUS + (this.campfire.level - 1) * UNLOCK_RADIUS_PER_LEVEL);
  }

  groundHeight(x: number, z: number): number {
    return this.terrain.heightAt(x, z);
  }

  /** Forest ground that animals may use: on the island, dry, and not desert. */
  isLand(x: number, z: number): boolean {
    return (
      Math.hypot(x, z) < ISLAND_RADIUS - 15 &&
      this.terrain.heightAt(x, z) >= MIN_WALK_HEIGHT + 0.3 &&
      this.terrain.biomeAt(x, z) === 'forest'
    );
  }

  /** True if the player may stand at (x, z): unlocked, dry, not locked desert. */
  isWalkable(x: number, z: number): boolean {
    if (Math.hypot(x, z) > this.unlockedRadius) return false;
    if (this.terrain.heightAt(x, z) < MIN_WALK_HEIGHT) return false;
    if (this.campfire.level < DESERT_UNLOCK_LEVEL && this.terrain.biomeAt(x, z) === 'desert') return false;
    return true;
  }

  /** True if (x, z) is inside the campfire's active safe zone. Enemies must respect this. */
  isSafe(x: number, z: number): boolean {
    return this.campfire.safeZoneActive && Math.hypot(x, z) <= CAMPFIRE_SAFE_RADIUS;
  }

  /** True if (x, z) is close enough to the crafting table to open the crafting menu. */
  nearCraftingTable(x: number, z: number): boolean {
    const p = this.craftingTable.group.position;
    return Math.hypot(x - p.x, z - p.z) <= CRAFT_TABLE_REACH;
  }

  update(dt: number, focus: THREE.Vector3): void {
    this.dayNight.update(dt);
    this.dayNight.follow(focus);
    this.dayNight.applyBloodMoonTint(); // red tint on blood-moon nights (SPEC rule 2)
    this.sky.update(dt, focus, this.dayNight);
    textures.water().offset.x = (textures.water().offset.x + dt * 0.004) % 1; // slow drifting waves
    this.campfire.update(dt);
    this.forest.update(dt, focus.x, focus.z);
    this.livestock.update(dt, focus.x, focus.z);
    if (this.stats) this.monsters.update(dt, focus.x, focus.z, this.stats);
    this.chests.update(dt);
  }
}
