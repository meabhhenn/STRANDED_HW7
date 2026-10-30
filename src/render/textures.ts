import * as THREE from 'three';
import { mulberry32 } from '../world/noise';

/**
 * Tiny procedural pixel-art textures drawn on canvases at startup (no image
 * files). Every texture is nearest-filtered so its pixels stay crisp, and is
 * cached by name. Grey-ish "tint" textures (grass, leaves) are meant to be
 * multiplied by a vertex/instance colour.
 */

type Draw = (g: CanvasRenderingContext2D, w: number, h: number, rand: () => number) => void;

const cache = new Map<string, THREE.CanvasTexture>();

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function make(name: string, w: number, h: number, draw: Draw, mipmaps = false): THREE.CanvasTexture {
  const hit = cache.get(name);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  draw(g, w, h, mulberry32(hash(name)));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = mipmaps ? THREE.NearestMipmapNearestFilter : THREE.NearestFilter;
  tex.generateMipmaps = mipmaps;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(name, tex);
  return tex;
}

const px = (g: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1): void => {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
};

/** Random speckles of `color` covering about `amount` of the texture. */
function speckle(g: CanvasRenderingContext2D, w: number, h: number, rand: () => number, color: string, amount: number) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rand() < amount) px(g, x, y, color);
}

export const textures = {
  /** Terrain tint (greyscale; multiplied by vertex colours). Repeats every 8 m. */
  grass(): THREE.CanvasTexture {
    return make(
      'grass',
      16,
      16,
      (g, w, h, r) => {
        px(g, 0, 0, '#e4e4e4', w, h);
        speckle(g, w, h, r, '#cdcdcd', 0.16);
        speckle(g, w, h, r, '#ffffff', 0.07);
        for (let i = 0; i < 7; i++) {
          const x = Math.floor(r() * w);
          const y = Math.floor(r() * (h - 2));
          px(g, x, y, '#bdbdbd', 1, 2); // little grass blade
        }
      },
      true,
    );
  },

  bark(): THREE.CanvasTexture {
    return make('bark', 8, 16, (g, w, h, r) => {
      px(g, 0, 0, '#8a5a2f', w, h);
      for (let x = 0; x < w; x += 2) px(g, x, 0, '#6b4220', 1, h);
      speckle(g, w, h, r, '#a56f3b', 0.18);
      speckle(g, w, h, r, '#55321a', 0.08);
    });
  },

  /** Leaf tint for trees (greyscale; multiplied by per-tree colour). */
  leaves(): THREE.CanvasTexture {
    return make('leaves', 16, 16, (g, w, h, r) => {
      px(g, 0, 0, '#f2f2f2', w, h);
      for (let i = 0; i < 18; i++) px(g, Math.floor(r() * w), Math.floor(r() * h), '#c2c2c2', 2, 2);
      speckle(g, w, h, r, '#ffffff', 0.1);
    });
  },

  /** Cut-log side: dark bark with vertical grooves. */
  logSide(): THREE.CanvasTexture {
    return make('logSide', 8, 8, (g, w, h, r) => {
      px(g, 0, 0, '#7b4b26', w, h);
      px(g, 1, 0, '#5a3418', 1, h);
      px(g, 5, 0, '#5a3418', 1, h);
      speckle(g, w, h, r, '#9a6334', 0.2);
    });
  },

  /** Cut-log end: pale wood with growth rings and a bark border. */
  logEnd(): THREE.CanvasTexture {
    return make('logEnd', 16, 16, (g, w, h) => {
      px(g, 0, 0, '#7b4b26', w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const r = Math.hypot(x - 7.5, y - 7.5);
          if (r > 7.6) continue; // outside the disc: leave bark colour
          if (r > 6.4) px(g, x, y, '#7b4b26');
          else if (r < 1.2) px(g, x, y, '#8a5a2a');
          else px(g, x, y, Math.floor(r / 1.6) % 2 === 0 ? '#d9a95f' : '#b8843f');
        }
      }
    });
  },

  /** Holstein cow hide: white with black patches. */
  cow(): THREE.CanvasTexture {
    return make('cow', 16, 16, (g, w, h, r) => {
      px(g, 0, 0, '#f3efe6', w, h);
      for (let i = 0; i < 4; i++) {
        const cx = r() * w;
        const cy = r() * h;
        const rx = 2 + r() * 2.5;
        const ry = 2 + r() * 2;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            // wrap around so the patch tiles across box faces
            for (const ox of [-w, 0, w]) {
              if (((x + ox - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) px(g, x, y, '#272220');
            }
          }
        }
      }
    });
  },

  /** Fluffy sheep wool: cream with curly shadow flecks. */
  wool(): THREE.CanvasTexture {
    return make('wool', 16, 16, (g, w, h, r) => {
      px(g, 0, 0, '#f5f1e6', w, h);
      for (let i = 0; i < 14; i++) {
        const x = Math.floor(r() * w);
        const y = Math.floor(r() * h);
        px(g, x, y, '#d9d3c0', 2, 1);
        px(g, x + 1, y + 1, '#d9d3c0', 1, 1);
      }
      speckle(g, w, h, r, '#ffffff', 0.12);
    });
  },

  /** Top of a steak (circle inscribed in the texture): pink-red meat, marbling and a pale fat rim. */
  meatRaw(): THREE.CanvasTexture {
    return make('meatRaw', 16, 16, (g, w, h, r) => {
      px(g, 0, 0, '#f1dccd', w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const d = Math.hypot(x - 7.5, y - 7.5);
          if (d < 5.8) px(g, x, y, '#cf4358');
        }
      }
      speckle(g, w, h, r, '#a52c46', 0.12);
      for (let i = 0; i < 5; i++) px(g, 4 + Math.floor(r() * 8), 4 + Math.floor(r() * 8), '#f4b8bf', 2, 1); // marbling
    });
  },

  /** Cooked steak top: browned with grill marks. */
  meatCooked(): THREE.CanvasTexture {
    return make('meatCooked', 16, 16, (g, w, h, r) => {
      px(g, 0, 0, '#c98a4e', w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const d = Math.hypot(x - 7.5, y - 7.5);
          if (d < 5.8) px(g, x, y, (x + y) % 5 === 0 ? '#4e2812' : '#8f4f27');
        }
      }
      speckle(g, w, h, r, '#b06a34', 0.1);
    });
  },

  water(): THREE.CanvasTexture {
    return make(
      'water',
      16,
      16,
      (g, w, h, r) => {
        px(g, 0, 0, '#2f8fd0', w, h);
        for (let i = 0; i < 9; i++) px(g, Math.floor(r() * w), Math.floor(r() * h), '#5fb4ea', 3, 1);
        for (let i = 0; i < 4; i++) px(g, Math.floor(r() * w), Math.floor(r() * h), '#c4e8ff', 2, 1);
      },
      true,
    );
  },

  /** Player face (front of the head box). */
  face(): THREE.CanvasTexture {
    return make('face', 8, 8, (g, w, h) => {
      px(g, 0, 0, '#f1c27d', w, h);
      px(g, 0, 0, '#5a3a1e', w, 2); // fringe
      px(g, 1, 3, '#2b1d14', 2, 2); // eyes
      px(g, 5, 3, '#2b1d14', 2, 2);
      px(g, 3, 6, '#b5683c', 2, 1); // mouth
    });
  },

  /** Plank/wood grain for tool heads and handles. */
  plank(): THREE.CanvasTexture {
    return make('plank', 8, 8, (g, w, h, r) => {
      px(g, 0, 0, '#cfa467', w, h);
      for (let y = 1; y < h; y += 3) px(g, 0, y, '#a8804a', w, 1);
      speckle(g, w, h, r, '#e0b97c', 0.15);
    });
  },

  /** Fur/hide stripes for the chicken wing etc. (soft off-white). */
  plain(): THREE.CanvasTexture {
    return make('plain', 4, 4, (g, w, h, r) => {
      px(g, 0, 0, '#f6f6f6', w, h);
      speckle(g, w, h, r, '#dcdcdc', 0.2);
    });
  },
};
