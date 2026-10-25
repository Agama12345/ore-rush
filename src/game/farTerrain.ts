import * as THREE from "three";
import { Biome, SEA_LEVEL, sampleColumn } from "./worldgen";

/**
 * Distant terrain: a cheap, coarse heightmap drawn out to about 1000 blocks around the player.
 * Real chunks (full voxels) only exist a few chunks away; everything beyond is this low-detail
 * surface, built from the same noise as the world generator so the horizon matches what you
 * will walk into. The mesh is hidden inside the area already covered by real chunks.
 */
const TILE = 128; // blocks per tile side
const STEP = 8; // blocks between vertices
const CELLS = TILE / STEP;
const VERTS = CELLS + 1;

const rgb = (hex: number): [number, number, number] => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];

const BIOME_COLOR: Record<number, [number, number, number]> = {
  [Biome.OCEAN]: rgb(0x2f5fb8),
  [Biome.BEACH]: rgb(0xe3cf9a),
  [Biome.PLAINS]: rgb(0x6cb24c),
  [Biome.FOREST]: rgb(0x3f8a38),
  [Biome.DESERT]: rgb(0xdac290),
  [Biome.SNOWY]: rgb(0xf2f6f8),
  [Biome.MOUNTAINS]: rgb(0x8a9297),
  [Biome.SAVANNA]: rgb(0xa8a846),
  [Biome.MEADOW]: rgb(0x7ac657),
  [Biome.TAIGA]: rgb(0x3d7552),
};
const STONE = rgb(0x8a9297);
const SNOW = rgb(0xf2f6f8);

const hash = (x: number, z: number) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export class FarTerrain {
  readonly group = new THREE.Group();
  private tiles = new Map<string, THREE.Mesh>();
  private pending: { tx: number; tz: number }[] = [];
  private lastTx = Number.NaN;
  private lastTz = Number.NaN;
  private material: THREE.MeshBasicMaterial;
  private uniforms = { uCam: { value: new THREE.Vector2() }, uNear: { value: 0 } };
  private indexData: Uint16Array;
  private seed = 0;
  private cold = false;
  private radius = 1000;

  constructor() {
    this.material = new THREE.MeshBasicMaterial({ vertexColors: true });
    // keep the surface clear of the area drawn by real chunks
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uCam = this.uniforms.uCam;
      shader.uniforms.uNear = this.uniforms.uNear;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vFarXZ;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFarXZ = (modelMatrix * vec4(transformed, 1.0)).xz;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vFarXZ;\nuniform vec2 uCam;\nuniform float uNear;")
        .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nvec2 dd = abs(vFarXZ - uCam);\nif (max(dd.x, dd.y) < uNear) discard;");
    };

    const idx: number[] = [];
    for (let z = 0; z < CELLS; z++) {
      for (let x = 0; x < CELLS; x++) {
        const a = x + z * VERTS;
        const b = a + 1;
        const c = a + VERTS;
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    this.indexData = new Uint16Array(idx);
  }

  setRadius(blocks: number) {
    this.radius = Math.max(0, blocks);
    this.lastTx = Number.NaN; // rescan
  }

  setTint(color: THREE.Color) {
    this.material.color.copy(color);
  }

  /** a new world: forget every tile */
  reset(seed: number, cold: boolean) {
    this.seed = seed;
    this.cold = cold;
    this.clear();
  }

  clear() {
    this.tiles.forEach((mesh) => {
      this.group.remove(mesh);
      mesh.geometry.dispose();
    });
    this.tiles.clear();
    this.pending = [];
    this.lastTx = Number.NaN;
  }

  dispose() {
    this.clear();
    this.material.dispose();
  }

  /**
   * @param px player x
   * @param pz player z
   * @param hideCx centre of the area covered by real chunks (x)
   * @param hideCz centre of the area covered by real chunks (z)
   * @param hideHalf half-size of that area in blocks
   */
  update(px: number, pz: number, hideCx: number, hideCz: number, hideHalf: number, maxBuild = 2) {
    this.uniforms.uCam.value.set(hideCx, hideCz);
    this.uniforms.uNear.value = hideHalf;
    if (this.radius <= 0) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    const tx = Math.floor(px / TILE);
    const tz = Math.floor(pz / TILE);
    if (tx !== this.lastTx || tz !== this.lastTz) {
      this.lastTx = tx;
      this.lastTz = tz;
      this.rescan(px, pz, tx, tz);
    }

    for (let n = 0; n < maxBuild && this.pending.length; n++) {
      const next = this.pending.shift()!;
      const key = `${next.tx},${next.tz}`;
      if (this.tiles.has(key)) continue;
      const mesh = this.buildTile(next.tx, next.tz);
      this.tiles.set(key, mesh);
      this.group.add(mesh);
    }
  }

  private rescan(px: number, pz: number, tx: number, tz: number) {
    const reach = Math.ceil(this.radius / TILE) + 1;
    const want: { tx: number; tz: number; d: number }[] = [];
    for (let dz = -reach; dz <= reach; dz++) {
      for (let dx = -reach; dx <= reach; dx++) {
        const cx = (tx + dx + 0.5) * TILE;
        const cz = (tz + dz + 0.5) * TILE;
        const d = Math.hypot(cx - px, cz - pz);
        if (d > this.radius + TILE * 0.75) continue;
        want.push({ tx: tx + dx, tz: tz + dz, d });
      }
    }
    // drop tiles that fell well outside the range
    this.tiles.forEach((mesh, key) => {
      const [kx, kz] = key.split(",").map(Number);
      const d = Math.hypot((kx + 0.5) * TILE - px, (kz + 0.5) * TILE - pz);
      if (d > this.radius + TILE * 1.6) {
        this.group.remove(mesh);
        mesh.geometry.dispose();
        this.tiles.delete(key);
      }
    });
    want.sort((a, b) => a.d - b.d);
    this.pending = want.filter((w) => !this.tiles.has(`${w.tx},${w.tz}`)).map(({ tx: x, tz: z }) => ({ tx: x, tz: z }));
  }

  private buildTile(tx: number, tz: number): THREE.Mesh {
    const ox = tx * TILE;
    const oz = tz * TILE;
    const N = VERTS + 2; // one extra ring for slope shading
    const heights = new Float32Array(N * N);
    const biomes = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const col = sampleColumn(ox + (i - 1) * STEP, oz + (j - 1) * STEP, this.seed, this.cold);
        const water = col.height < SEA_LEVEL;
        heights[i + j * N] = water ? SEA_LEVEL + 0.9 : col.height + 1;
        biomes[i + j * N] = col.biome;
      }
    }

    const pos = new Float32Array(VERTS * VERTS * 3);
    const col = new Float32Array(VERTS * VERTS * 3);
    for (let j = 0; j < VERTS; j++) {
      for (let i = 0; i < VERTS; i++) {
        const k = i + 1 + (j + 1) * N;
        const h = heights[k];
        const v = i + j * VERTS;
        const wx = ox + i * STEP;
        const wz = oz + j * STEP;
        pos[v * 3] = i * STEP;
        // sit just under the real terrain so it never pokes through where the two overlap
        pos[v * 3 + 1] = h - 0.6;
        pos[v * 3 + 2] = j * STEP;

        let base = BIOME_COLOR[biomes[k]] ?? BIOME_COLOR[Biome.PLAINS];
        if (this.cold) base = h > SEA_LEVEL + 28 ? SNOW : BIOME_COLOR[Biome.SNOWY];
        else if (biomes[k] === Biome.MOUNTAINS) base = h > SEA_LEVEL + 34 ? SNOW : STONE;
        // light from the west: slopes facing it are brighter
        const slope = (heights[k - 1] - heights[k + 1]) * 0.04 + (heights[k - N] - heights[k + N]) * 0.02;
        const shade = Math.min(1.25, Math.max(0.7, 0.95 + slope + (hash(wx, wz) - 0.5) * 0.08));
        col[v * 3] = base[0] * shade;
        col[v * 3 + 1] = base[1] * shade;
        col[v * 3 + 2] = base[2] * shade;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(col, 3));
    // own attribute object per tile (they share the data but are uploaded and freed separately)
    geometry.setIndex(new THREE.BufferAttribute(this.indexData, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(TILE / 2, 60, TILE / 2), TILE * 0.9);
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.set(ox, 0, oz);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.renderOrder = -1;
    return mesh;
  }
}
