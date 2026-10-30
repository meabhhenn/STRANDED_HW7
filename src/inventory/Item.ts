import * as THREE from 'three';
import { arrange, createAxe, createFeather, createHide, createLog, createSteak, createWoolPuffs } from '../render/props';

/** Add new item ids here, then give them an entry in ITEMS below (and an icon in ui/icons.ts). */
export type ItemId = 'log' | 'wooden_axe' | 'raw_meat' | 'cooked_meat' | 'leather' | 'wool' | 'feather';

export interface ItemDef {
  id: ItemId;
  name: string;
  maxStack: number;
  /** Fallback CSS colour (the hotbar normally shows the pixel icon from ui/icons.ts). */
  color: string;
  /** If set, the item can be used with click and restores this much hunger. */
  hunger?: number;
  /** If set, using the item also restores this much health (food, bandage, medkit). */
  heal?: number;
  /** Damage dealt per hit when this is the selected item (default: fists, PUNCH_DAMAGE). */
  damage?: number;
  /**
   * Tree damage per hit when selected (default: bare hands, PUNCH_CHOP_POWER).
   * Trees have TREE_HITS hit points, so power 2 fells one in 3 hits.
   */
  chopPower?: number;
  /** Model shown in the player's hand when this is the selected item. Origin = grip. */
  createHeldMesh?(): THREE.Object3D;
  /** 3D model for a dropped pile of `count` items (origin at ground level). */
  createMesh(count: number): THREE.Object3D;
}

/** Local offsets (x, y, z) for up to 6 visible logs stacked in a pyramid. */
const LOG_SLOTS: [number, number, number][] = [
  [0, 0, -0.16],
  [0, 0, 0.16],
  [0, 0, 0.48],
  [0, 0.22, 0],
  [0, 0.22, 0.32],
  [0, 0.44, 0.16],
];

export const ITEMS: Record<ItemId, ItemDef> = {
  wooden_axe: {
    id: 'wooden_axe',
    name: 'Wooden Axe',
    maxStack: 1,
    color: '#a8854f',
    damage: 2,
    chopPower: 2,
    createHeldMesh: () => createAxe(),
    createMesh() {
      // Lying flat on the ground.
      const g = new THREE.Group();
      const axe = createAxe();
      axe.rotation.x = Math.PI / 2;
      axe.position.y = 0.07;
      g.add(axe);
      return g;
    },
  },
  log: {
    id: 'log',
    name: 'Log',
    maxStack: 99,
    color: '#8a5a2b',
    createMesh(count) {
      const g = new THREE.Group();
      const visible = Math.min(LOG_SLOTS.length, Math.max(1, Math.ceil(count / 2)));
      for (let i = 0; i < visible; i++) {
        const log = createLog();
        const [x, y, z] = LOG_SLOTS[i];
        log.position.set(x, log.position.y + y, z - 0.16);
        log.rotation.y = (i % 3) * 0.12 - 0.1;
        g.add(log);
      }
      return g;
    },
  },
  raw_meat: {
    id: 'raw_meat',
    name: 'Raw Meat',
    maxStack: 20,
    color: '#cf4358',
    hunger: 8, // cook it in the campfire for much more
    createMesh: (count) => arrange(count, 3, 0.2, () => createSteak(false)),
  },
  cooked_meat: {
    id: 'cooked_meat',
    name: 'Cooked Meat',
    maxStack: 20,
    color: '#8f4f27',
    hunger: 35,
    heal: 5,
    createMesh: (count) => arrange(count, 3, 0.2, () => createSteak(true)),
  },
  leather: {
    id: 'leather',
    name: 'Leather',
    maxStack: 50,
    color: '#9c6a3a',
    createMesh: (count) => arrange(count, 2, 0.15, () => createHide()),
  },
  wool: {
    id: 'wool',
    name: 'Wool',
    maxStack: 50,
    color: '#f5f1e6',
    createMesh: (count) => createWoolPuffs(count),
  },
  feather: {
    id: 'feather',
    name: 'Feather',
    maxStack: 50,
    color: '#dfe9f2',
    createMesh: (count) => arrange(count, 3, 0.12, () => createFeather()),
  },
};
