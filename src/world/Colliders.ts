/** A static circular obstacle on the XZ plane (tree trunk, campfire, rock...). */
export interface Collider {
  id: number;
  x: number;
  z: number;
  radius: number;
}

/**
 * Uniform spatial hash for circle colliders. Cheap neighbour queries so the
 * player (and later monsters/wolves) can collide with thousands of trees.
 */
export class ColliderGrid {
  private readonly cells = new Map<number, Collider[]>();
  private readonly byId = new Map<number, Collider>();
  private nextId = 1;

  constructor(private readonly cellSize = 8) {}

  private key(cx: number, cz: number): number {
    return (cx + 1024) * 4096 + (cz + 1024);
  }

  add(x: number, z: number, radius: number): Collider {
    const c: Collider = { id: this.nextId++, x, z, radius };
    const k = this.key(Math.floor(x / this.cellSize), Math.floor(z / this.cellSize));
    const bucket = this.cells.get(k);
    if (bucket) bucket.push(c);
    else this.cells.set(k, [c]);
    this.byId.set(c.id, c);
    return c;
  }

  remove(id: number): void {
    const c = this.byId.get(id);
    if (!c) return;
    this.byId.delete(id);
    const k = this.key(Math.floor(c.x / this.cellSize), Math.floor(c.z / this.cellSize));
    const bucket = this.cells.get(k);
    if (bucket) {
      const i = bucket.indexOf(c);
      if (i >= 0) bucket.splice(i, 1);
    }
  }

  /** Visit every collider whose cell overlaps the query circle. */
  query(x: number, z: number, r: number, visit: (c: Collider) => void): void {
    const s = this.cellSize;
    for (let cx = Math.floor((x - r) / s); cx <= Math.floor((x + r) / s); cx++) {
      for (let cz = Math.floor((z - r) / s); cz <= Math.floor((z + r) / s); cz++) {
        const bucket = this.cells.get(this.key(cx, cz));
        if (bucket) for (const c of bucket) visit(c);
      }
    }
  }

  /** True if a circle at (x,z) with `radius` overlaps any collider. */
  overlaps(x: number, z: number, radius: number): boolean {
    let hit = false;
    this.query(x, z, radius + 4, (c) => {
      const rr = c.radius + radius;
      if ((c.x - x) ** 2 + (c.z - z) ** 2 < rr * rr) hit = true;
    });
    return hit;
  }

  /** Push a circle out of any overlapping colliders; returns the new position. */
  resolve(x: number, z: number, radius: number): { x: number; z: number } {
    this.query(x, z, radius + 4, (c) => {
      const dx = x - c.x;
      const dz = z - c.z;
      const min = c.radius + radius;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min) return;
      const d = Math.sqrt(d2) || 0.0001;
      x = c.x + (dx / d) * min;
      z = c.z + (dz / d) * min;
    });
    return { x, z };
  }
}
