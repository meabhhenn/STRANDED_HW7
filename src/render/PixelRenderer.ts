import * as THREE from 'three';
import { PALETTE_LEVELS, PIXEL_RENDER_HEIGHT } from '../config';

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/**
 * Converts to sRGB, then snaps every channel to a small number of steps. This
 * gives the limited-palette "retro" look and keeps colours flat and chunky.
 */
const FRAGMENT = /* glsl */ `
uniform sampler2D tDiffuse;
uniform float levels;
varying vec2 vUv;
void main() {
  vec3 linear = texture2D(tDiffuse, vUv).rgb;
  vec3 srgb = linearToOutputTexel(vec4(linear, 1.0)).rgb;
  gl_FragColor = vec4(floor(srgb * levels + 0.5) / levels, 1.0);
}`;

/**
 * Retro renderer: draws the scene into a small fixed-height render target
 * (so every "pixel" is a big chunky square), then blows it up to the screen
 * with nearest-neighbour sampling and a colour-quantising pass.
 *
 * DOM UI (HUD, menus) is drawn on top at full resolution and is unaffected.
 * Tune the look with PIXEL_RENDER_HEIGHT and PALETTE_LEVELS in config.ts.
 */
export class PixelRenderer {
  readonly renderer: THREE.WebGLRenderer;
  private readonly target: THREE.WebGLRenderTarget;
  private readonly quadScene = new THREE.Scene();
  private readonly quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  constructor(container: HTMLElement) {
    // No MSAA: anti-aliased edges would smear the pixel look.
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    // Full device resolution so the upscaled pixels stay sharp on retina screens.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.target = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
    });

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: { tDiffuse: { value: this.target.texture }, levels: { value: PALETTE_LEVELS } },
      depthTest: false,
      depthWrite: false,
    });
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    this.resize();
  }

  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  resize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const h = PIXEL_RENDER_HEIGHT;
    const w = Math.max(1, Math.round((h * window.innerWidth) / window.innerHeight));
    this.target.setSize(w, h);
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.quadScene, this.quadCamera);
  }
}
