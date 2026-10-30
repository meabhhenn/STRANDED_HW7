import * as THREE from 'three';
import { DAY_LENGTH_SECONDS, START_HOUR } from '../config';
import { smoothstep } from './noise';

const NIGHT_SKY = new THREE.Color(0x05070f);
const DUSK_SKY = new THREE.Color(0xe8955a);
const DAY_SKY = new THREE.Color(0x8fd0ff);

/**
 * Drives sun, sky/fog colour and ambient light from an in-game clock.
 *
 * `hour` runs 0-24 (6 = sunrise, 12 = noon, 18 = sunset). `day` counts from 1
 * and increments at midnight-to-midnight rollover; this is the hook for the
 * "survive 50 nights" counter. Daytime is deliberately bright and saturated.
 */
export class DayNight {
  hour = START_HOUR;
  day = 1;
  /** Nights fully survived this run (counted at each dawn, 6:00). Drives the streak. */
  nightsSurvived = 0;

  readonly sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
  readonly hemi = new THREE.HemisphereLight(0xbfe3ff, 0x6a8a4a, 0.9);
  private readonly sky = new THREE.Color();

  constructor(private readonly scene: THREE.Scene) {
    scene.add(this.sun, this.sun.target, this.hemi);
    scene.background = this.sky;
    scene.fog = new THREE.Fog(this.sky, 40, 220);
    this.apply();
  }

  /** Height of the sun in [-1, 1]; > 0 means above the horizon. */
  get sunElevation(): number {
    return Math.sin(((this.hour - 6) / 24) * Math.PI * 2);
  }

  /** 0 at night, 1 in full daylight (smooth). Used to tint clouds, sun and moon. */
  get daylight(): number {
    return smoothstep(-0.05, 0.35, this.sunElevation);
  }

  /** Unit-ish direction from the player toward the sun. */
  get sunDirection(): THREE.Vector3 {
    const a = ((this.hour - 6) / 24) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a), Math.sin(a), 0.3).normalize();
  }

  get isNight(): boolean {
    return this.sunElevation < 0.05;
  }

  setHour(hour: number): void {
    this.hour = ((hour % 24) + 24) % 24;
    this.apply();
  }

  update(dt: number): void {
    const prev = this.hour;
    this.hour += (dt / DAY_LENGTH_SECONDS) * 24;
    if (this.hour >= 24) {
      this.hour -= 24;
      this.day++;
    }
    if (prev < 6 && this.hour >= 6) this.nightsSurvived++;
    else if (prev > this.hour && this.hour >= 6) this.nightsSurvived++; // skipped past dawn in one step
    this.apply();
  }

  /** Keep the sun's shadow/target centred on the player. */
  follow(target: THREE.Vector3): void {
    this.sun.target.position.copy(target);
    const a = ((this.hour - 6) / 24) * Math.PI * 2;
    this.sun.position.set(target.x + Math.cos(a) * 100, target.y + Math.sin(a) * 100, target.z + 30);
  }

  private apply(): void {
    const e = this.sunElevation;
    const day = smoothstep(-0.05, 0.35, e);
    const dusk = 1 - Math.abs(smoothstep(-0.2, 0.25, e) * 2 - 1); // peaks near horizon
    this.sky.copy(NIGHT_SKY).lerp(DAY_SKY, day).lerp(DUSK_SKY, dusk * 0.6);
    (this.scene.fog as THREE.Fog).color.copy(this.sky);
    this.sun.intensity = 2.2 * smoothstep(0, 0.3, e);
    this.hemi.intensity = 0.12 + 0.78 * day;
  }
}
