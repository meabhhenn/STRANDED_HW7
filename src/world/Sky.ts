import * as THREE from 'three';
import { faceted } from '../render/materials';
import { mulberry32 } from './noise';
import type { DayNight } from './DayNight';

const CLOUD_COUNT = 14;
const CLOUD_RANGE = 260; // clouds live in a square this far (+/-) around the player
const CLOUD_HEIGHT = 85;

/**
 * Chunky low-poly sky dressing: drifting flat-white clouds, a blocky sun and a
 * pale moon. Everything is unlit and ignores fog, and follows the player so it
 * never feels like you can walk out from under it.
 */
export class Sky {
  readonly group = new THREE.Group();
  private readonly clouds = new THREE.Group();
  private readonly cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  private readonly sun: THREE.Mesh;
  private readonly moon: THREE.Mesh;
  private readonly day = new THREE.Color(0xffffff);
  private readonly night = new THREE.Color(0x3a4468);

  constructor() {
    this.group.name = 'sky';
    const rand = mulberry32(777);
    const puff = faceted(new THREE.IcosahedronGeometry(1, 1));
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cloud = new THREE.Group();
      const n = 4 + Math.floor(rand() * 3);
      for (let k = 0; k < n; k++) {
        const m = new THREE.Mesh(puff, this.cloudMat);
        const s = 7 + rand() * 6;
        m.scale.set(s * 1.4, s * 0.6, s);
        m.position.set((k - n / 2) * 9 + rand() * 4, rand() * 3, (rand() - 0.5) * 8);
        cloud.add(m);
      }
      cloud.position.set((rand() * 2 - 1) * CLOUD_RANGE, CLOUD_HEIGHT + rand() * 25, (rand() * 2 - 1) * CLOUD_RANGE);
      this.clouds.add(cloud);
    }
    this.group.add(this.clouds);

    this.sun = new THREE.Mesh(
      faceted(new THREE.IcosahedronGeometry(22, 1)),
      new THREE.MeshBasicMaterial({ color: 0xfff08a, fog: false }),
    );
    this.moon = new THREE.Mesh(
      faceted(new THREE.IcosahedronGeometry(14, 1)),
      new THREE.MeshBasicMaterial({ color: 0xdfe6f5, fog: false }),
    );
    this.group.add(this.sun, this.moon);
  }

  update(dt: number, focus: THREE.Vector3, dayNight: DayNight): void {
    // Everything is positioned relative to the player.
    this.group.position.set(focus.x, 0, focus.z);
    for (const c of this.clouds.children) {
      c.position.x += dt * 2.2;
      if (c.position.x > CLOUD_RANGE) c.position.x -= CLOUD_RANGE * 2;
    }
    this.cloudMat.color.copy(this.night).lerp(this.day, dayNight.daylight);

    const dir = dayNight.sunDirection;
    this.sun.position.copy(dir).multiplyScalar(380);
    this.moon.position.copy(dir).multiplyScalar(-380);
    this.sun.visible = dir.y > -0.12;
    this.moon.visible = dir.y < 0.12;
  }
}
