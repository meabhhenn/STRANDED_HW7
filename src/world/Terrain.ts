import * as THREE from 'three';
import {
  CAMPFIRE_BLEND_RADIUS,
  CAMPFIRE_FLAT_RADIUS,
  CAMPFIRE_GROUND_HEIGHT,
  DESERT_START_Z,
  ISLAND_RADIUS,
  TERRAIN_SEGMENTS,
  TERRAIN_SIZE,
  WATER_LEVEL,
  WORLD_SEED,
} from '../config';
import { faceted, toon } from '../render/materials';
import { textures } from '../render/textures';
import { ValueNoise2D, lerp, smoothstep } from './noise';

export type Biome = 'forest' | 'desert';

/**
 * Procedural island heightfield. The height/biome functions are pure and
 * deterministic (seeded), so gameplay code can sample them anywhere without
 * needing the mesh. The mesh is just a visualisation of heightAt().
 */
export class Terrain {
  private readonly shape = new ValueNoise2D(WORLD_SEED);
  private readonly detail = new ValueNoise2D(WORLD_SEED + 1);
  private readonly biomeNoise = new ValueNoise2D(WORLD_SEED + 2);

  /** Ground height in metres at world (x, z). Sea level is WATER_LEVEL. */
  heightAt(x: number, z: number): number {
    const r = Math.hypot(x, z);
    const n = this.shape.fbm(x * 0.015, z * 0.015, 4);
    // Noisy coastline: perturb the normalised distance with low-freq noise.
    const d = r / ISLAND_RADIUS + (n - 0.5) * 0.35;
    const island = 1 - smoothstep(0.55, 1.0, d);
    const hills = this.detail.fbm(x * 0.04, z * 0.04, 3);
    let h = -3 + island * (5.5 + hills * 4);
    // Flatten a clearing for the campfire.
    const flat = 1 - smoothstep(CAMPFIRE_FLAT_RADIUS, CAMPFIRE_BLEND_RADIUS, r);
    h = lerp(h, CAMPFIRE_GROUND_HEIGHT, flat);
    return h;
  }

  /** 0 = pure forest, 1 = pure desert. Edge is wobbled by noise. */
  desertAmount(x: number, z: number): number {
    const wobble = (this.biomeNoise.fbm(x * 0.02, z * 0.02, 3) - 0.5) * 50;
    return 1 - smoothstep(DESERT_START_Z - 6, DESERT_START_Z + 6, z + wobble);
  }

  biomeAt(x: number, z: number): Biome {
    return this.desertAmount(x, z) > 0.5 ? 'desert' : 'forest';
  }

  /** Builds the terrain mesh with per-vertex colours (no textures needed). */
  createMesh(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = this.heightAt(x, z);
      pos.setY(i, h);
      this.colorAt(x, z, h, c);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // Low-poly look: split vertices so every triangle is one flat colour + flat normal.
    const flat = faceted(geo);
    const fc = flat.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < fc.count; i += 3) {
      const r = (fc.getX(i) + fc.getX(i + 1) + fc.getX(i + 2)) / 3;
      const g = (fc.getY(i) + fc.getY(i + 1) + fc.getY(i + 2)) / 3;
      const b = (fc.getZ(i) + fc.getZ(i + 1) + fc.getZ(i + 2)) / 3;
      for (let k = 0; k < 3; k++) fc.setXYZ(i + k, r, g, b);
    }
    // The pixel texture repeats every 8 m (UVs span the whole 500 m plane).
    const grass = textures.grass();
    grass.repeat.set(TERRAIN_SIZE / 8, TERRAIN_SIZE / 8);
    const mesh = new THREE.Mesh(flat, toon(0xffffff, { vertexColors: true, map: grass }));
    mesh.name = 'terrain';
    return mesh;
  }

  private static readonly SAND = new THREE.Color(0xf2dc8c);
  private static readonly WET_SAND = new THREE.Color(0xc9b370);
  private static readonly GRASS_A = new THREE.Color(0x4fc03a);
  private static readonly GRASS_B = new THREE.Color(0x74d44a);
  private static readonly DESERT_A = new THREE.Color(0xe8b85c);
  private static readonly DESERT_B = new THREE.Color(0xd8a048);

  private colorAt(x: number, z: number, h: number, out: THREE.Color): void {
    const t = this.detail.noise(x * 0.15, z * 0.15);
    const grass = out.copy(Terrain.GRASS_A).lerp(Terrain.GRASS_B, t);
    const desert = Terrain.DESERT_A.clone().lerp(Terrain.DESERT_B, t);
    out.copy(grass).lerp(desert, this.desertAmount(x, z));
    // Beach band near the waterline, wet sand below it.
    const beach = 1 - smoothstep(WATER_LEVEL + 0.4, WATER_LEVEL + 1.2, h);
    out.lerp(Terrain.SAND, beach);
    const wet = 1 - smoothstep(WATER_LEVEL - 0.8, WATER_LEVEL + 0.1, h);
    out.lerp(Terrain.WET_SAND, wet);
  }
}
