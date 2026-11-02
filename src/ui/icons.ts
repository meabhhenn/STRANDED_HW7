import type { ItemId } from '../inventory/Item';

/**
 * 12x12 pixel-art item icons, defined as ASCII art so they are easy to edit.
 * Each character maps to a colour in PALETTE ('.' = transparent). Icons are
 * rendered once to a data URL and shown with `image-rendering: pixelated`.
 */
const PALETTE: Record<string, string> = {
  k: '#2b1d14', // outline
  b: '#7b4b26', // bark
  B: '#5a3418', // dark bark
  w: '#e3b36b', // pale wood
  W: '#b8843f', // wood ring
  r: '#cf4358', // raw meat
  R: '#a52c46', // dark raw meat
  p: '#f08a96', // light raw meat
  f: '#f4e2d6', // fat
  c: '#8f4f27', // cooked
  C: '#5e3217', // dark cooked / grill
  l: '#c98a4e', // light cooked
  h: '#9c6a3a', // hide
  H: '#6e4524', // dark hide
  y: '#f6f3ea', // wool
  Y: '#d5d0c0', // wool shade
  e: '#ffffff', // feather
  E: '#c9d6e2', // feather shade
  g: '#9aa0a6', // grey
  s: '#8b9096', // stone
  S: '#cfd4d8', // stone highlight / blade edge
  t: '#f0e6cf', // pale carved wood tip
  z: '#f2ece0', // gauze / white
  Z: '#d9423e', // medical red
  m: '#4a4f57', // iron / dark trim
  o: '#7f868d', // ore stone
  O: '#d8b25a', // ore vein (brassy)
  n: '#cfd4d8', // steel / blade
  u: '#26292e', // gunmetal dark
};

const ICONS: Record<ItemId, string[]> = {
  log: [
    '............',
    '..kkkkkkk...',
    '.kbbBbbbkkk.',
    'kbbbbBbbkwWk',
    'kbBbbbbbkWwk',
    'kbbbbbBbkwWk',
    'kbbBbbbbkWwk',
    'kbbbbBbbkwWk',
    '.kbbbbbbkkkk',
    '..kkkkkkk...',
    '............',
    '............',
  ],
  wooden_axe: [
    '........kkk.',
    '.......kwwWk',
    '......kwwWWk',
    '.....kkwwWk.',
    '....kbkkkk..',
    '...kbk......',
    '..kbk.......',
    '.kbk........',
    'kbk.........',
    'kk..........',
    '............',
    '............',
  ],
  raw_meat: [
    '............',
    '............',
    '...kkkkkk...',
    '..kffffffk..',
    '.kfpprpppfk.',
    '.kfprpppprfk',
    '.kfppprpppfk',
    '.kfpppppprfk',
    '..kfpprpffk.',
    '...kkkkkk...',
    '............',
    '............',
  ],
  wooden_spear: [
    '..........kk',
    '.........ktk',
    '........kttk',
    '.......kttk.',
    '......kBBk..',
    '.....kbbk...',
    '....kbbk....',
    '...kbbk.....',
    '..kbbk......',
    '.kbbk.......',
    'kbk.........',
    'kk..........',
  ],
  stone_axe: [
    '......kkkk..',
    '....kkSssSk.',
    '...kSsssssk.',
    '..kSsssssk..',
    '..kSskkkk...',
    '...kbk......',
    '..kbk.......',
    '..kbk.......',
    '.kbk........',
    '.kbk........',
    'kbk.........',
    'kk..........',
  ],
  bandage: [
    '............',
    '............',
    '...kkkkkk...',
    '..kzzZZzzk..',
    '.kzzzZZzzzk.',
    '.kzzzZZzzzk.',
    '.kzzzZZzzzk.',
    '.kzzzZZzzzk.',
    '..kzzZZzzk..',
    '...kkkkkk...',
    '............',
    '............',
  ],
  medkit: [
    '............',
    '..kkkkkkkk..',
    '.kZZZZZZZZk.',
    '.kzzzZZzzzk.',
    '.kzzzZZzzzk.',
    '.kzZZZZZZzk.',
    '.kzzzZZzzzk.',
    '.kzzzZZzzzk.',
    '.kzzzzzzzzk.',
    '.kmmmmmmmmk.',
    '..kkkkkkkk..',
    '............',
  ],
  metal_ore: [
    '............',
    '............',
    '...kkkk.....',
    '..koooOkk...',
    '.kooOoookk..',
    '.koooooOok..',
    'kooOooooook.',
    'kooooOooook.',
    '.kooooooook.',
    '..kkkkkkkk..',
    '............',
    '............',
  ],
  iron_spear: [
    '..........kk',
    '.........knk',
    '........knnk',
    '.......knnk.',
    '......kmmk..',
    '.....kbbk...',
    '....kbbk....',
    '...kbbk.....',
    '..kbbk......',
    '.kbbk.......',
    'kbk.........',
    'kk..........',
  ],
  gun: [
    '............',
    '............',
    '....kkkkkkkk',
    '...kuuuuuuuk',
    'kkkmmmmmk...',
    'kuuuuuuk....',
    'kkbbkkmk....',
    '..kbbk......',
    '..kbbk......',
    '..kkk.......',
    '............',
    '............',
  ],
  cooked_meat: [], // derived from raw_meat below
  leather: [
    '............',
    '............',
    '..kkkkkkk...',
    '.khhhhhhhk..',
    'khhHhhhhhhk.',
    'khhhhhHhhhk.',
    'khHhhhhhhhk.',
    '.khhhhhhhk..',
    '..kkkkkkk...',
    '............',
    '............',
    '............',
  ],
  wool: [
    '............',
    '............',
    '...kkk.kkk..',
    '..kyyykyyyk.',
    '.kyyyyyyyyyk',
    'kyyyYyyyYyyk',
    'kyyyyyyyyyyk',
    'kyYyyyyyyYyk',
    '.kyyyyyyyyk.',
    '..kkkkkkkk..',
    '............',
    '............',
  ],
  feather: [
    '..........kk',
    '........keek',
    '......kkeeEk',
    '.....keeeEk.',
    '....keeeEk..',
    '...keeeEk...',
    '..keeEkk....',
    '.kgkkk......',
    'kgk.........',
    'kk..........',
    '............',
    '............',
  ],
};

// Cooked meat is the raw steak recoloured: same shape, browned.
ICONS.cooked_meat = ICONS.raw_meat.map((row) => row.replace(/f/g, 'l').replace(/[pr]/g, 'c').replace(/R/g, 'C'));

const cache = new Map<ItemId, string>();

/** Data URL (PNG) of the item's pixel icon. */
export function itemIconUrl(id: ItemId): string {
  const hit = cache.get(id);
  if (hit) return hit;
  const rows = ICONS[id];
  const canvas = document.createElement('canvas');
  canvas.width = 12;
  canvas.height = 12;
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = PALETTE[ch];
      if (!color) return;
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    });
  });
  const url = canvas.toDataURL();
  cache.set(id, url);
  return url;
}
