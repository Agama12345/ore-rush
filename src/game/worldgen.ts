import { B } from "./blocks";

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 128;
export const SEA_LEVEL = 34;
export const CHUNK_VOLUME = CHUNK_SIZE * CHUNK_SIZE * WORLD_HEIGHT;

export const Biome = {
  OCEAN: 0,
  BEACH: 1,
  PLAINS: 2,
  FOREST: 3,
  DESERT: 4,
  SNOWY: 5,
  MOUNTAINS: 6,
  SAVANNA: 7,
  MEADOW: 8,
  TAIGA: 9,
} as const;

export const BIOME_NAMES: Record<number, string> = {
  [Biome.OCEAN]: "Ocean",
  [Biome.BEACH]: "Beach",
  [Biome.PLAINS]: "Plains",
  [Biome.FOREST]: "Forest",
  [Biome.DESERT]: "Desert",
  [Biome.SNOWY]: "Snowy Peaks",
  [Biome.MOUNTAINS]: "Mountains",
  [Biome.SAVANNA]: "Savanna",
  [Biome.MEADOW]: "Flower Meadow",
  [Biome.TAIGA]: "Taiga",
};

export const blockIndex = (x: number, y: number, z: number) => x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;

/* ---------------- Fast deterministic noise ---------------- */
const INV32 = 1 / 4294967296;

function mixHash(h: number) {
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

function hash2(x: number, y: number, seed: number) {
  const xi = Math.round(x * 16);
  const yi = Math.round(y * 16);
  return mixHash((Math.imul(xi, 374761393) ^ Math.imul(yi, 668265263) ^ Math.imul(seed | 0, 2246822519)) >>> 0) * INV32;
}

function hash3(x: number, y: number, z: number, seed: number) {
  const xi = Math.round(x * 16);
  const yi = Math.round(y * 16);
  const zi = Math.round(z * 16);
  return (
    mixHash((Math.imul(xi, 374761393) ^ Math.imul(yi, 668265263) ^ Math.imul(zi, 1274126177) ^ Math.imul(seed | 0, 2246822519)) >>> 0) * INV32
  );
}

const smooth = (t: number) => t * t * (3 - 2 * t);

export function noise2(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf;
}

export function noise3(x: number, y: number, z: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const zf = smooth(z - zi);
  const c000 = hash3(xi, yi, zi, seed);
  const c100 = hash3(xi + 1, yi, zi, seed);
  const c010 = hash3(xi, yi + 1, zi, seed);
  const c110 = hash3(xi + 1, yi + 1, zi, seed);
  const c001 = hash3(xi, yi, zi + 1, seed);
  const c101 = hash3(xi + 1, yi, zi + 1, seed);
  const c011 = hash3(xi, yi + 1, zi + 1, seed);
  const c111 = hash3(xi + 1, yi + 1, zi + 1, seed);
  const x00 = c000 + (c100 - c000) * xf;
  const x10 = c010 + (c110 - c010) * xf;
  const x01 = c001 + (c101 - c001) * xf;
  const x11 = c011 + (c111 - c011) * xf;
  const y0 = x00 + (x10 - x00) * yf;
  const y1 = x01 + (x11 - x01) * yf;
  return y0 + (y1 - y0) * zf;
}

export function fbm2(x: number, y: number, seed: number, octaves = 4, lacunarity = 2, gain = 0.5) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise2(x * freq, y * freq, seed + i * 31) * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/* ---------------- Column shape ---------------- */
export type ColumnInfo = { height: number; biome: number };

export function sampleColumn(wx: number, wz: number, seed: number, coldMode = false): ColumnInfo {
  const contrast = (v: number, amount: number) => Math.max(0, Math.min(1, (v - 0.5) * amount + 0.5));
  const continent = contrast(fbm2(wx * 0.0042, wz * 0.0042, seed, 4), 2.1);
  const hills = fbm2(wx * 0.016, wz * 0.016, seed + 97, 3);
  const detail = fbm2(wx * 0.06, wz * 0.06, seed + 311, 2);
  const mountainMask = contrast(fbm2(wx * 0.0031, wz * 0.0031, seed + 555, 3), 2.3);
  const temperature = fbm2(wx * 0.0027, wz * 0.0027, seed + 1201, 1);
  const humidity = fbm2(wx * 0.003, wz * 0.003, seed + 2203, 1);
  const flatness = fbm2(wx * 0.0072, wz * 0.0072, seed + 3307, 2);

  let height = 24 + continent * 26 + hills * 9 + detail * 3;
  if (flatness > 0.54 && mountainMask < 0.56) {
    const t = Math.min(1, (flatness - 0.54) / 0.24);
    height = height * (1 - t * 0.55) + (SEA_LEVEL + 5) * (t * 0.55);
  }
  if (mountainMask > 0.6) {
    const m = (mountainMask - 0.6) / 0.4;
    height += m * m * 62;
  }
  if (height < SEA_LEVEL - 2) height = SEA_LEVEL - 2 - (SEA_LEVEL - 2 - height) * 0.75;
  height = Math.max(3, Math.min(WORLD_HEIGHT - 10, Math.round(height)));

  if (coldMode) {
    return {
      height,
      biome: height > SEA_LEVEL + 24 ? Biome.SNOWY : height > SEA_LEVEL + 8 ? Biome.TAIGA : Biome.SNOWY,
    };
  }

  let biome: number;
  if (height <= SEA_LEVEL - 2) biome = Biome.OCEAN;
  else if (height <= SEA_LEVEL + 1) biome = Biome.BEACH;
  else if (height > SEA_LEVEL + 34) biome = Biome.SNOWY;
  else if (height > SEA_LEVEL + 21) biome = Biome.MOUNTAINS;
  else if (temperature < 0.24) biome = Biome.SNOWY;
  else if (temperature < 0.36 && humidity > 0.5) biome = Biome.TAIGA;
  else if (temperature > 0.72 && humidity < 0.36) biome = Biome.DESERT;
  else if (temperature > 0.62 && humidity < 0.46) biome = Biome.SAVANNA;
  else if (flatness > 0.54 && humidity > 0.38) biome = Biome.MEADOW;
  else if (humidity > 0.64) biome = Biome.FOREST;
  else biome = Biome.PLAINS;

  return { height, biome };
}

/* ---------------- Caves, ore veins, lava lakes ---------------- */
export type GenOptions = { seed: number; oreBoost: boolean; coldMode?: boolean };

function caveAt(wx: number, y: number, wz: number, seed: number) {
  const region = noise2(wx * 0.006, wz * 0.006, seed + 1511);
  if (region < 0.46) return false;

  const worm = noise3(wx * 0.042, y * 0.075, wz * 0.042, seed + 77);
  const threshold = 0.74 - (region - 0.46) * 0.12;
  if (worm > threshold) return true;

  if (y < 30) {
    const cavern = noise3(wx * 0.02, y * 0.045, wz * 0.02, seed + 909);
    if (cavern > 0.8) return true;
  }
  return false;
}

/* Ores: small veins. Coal is common near the top, iron is the main ore in the middle and deep,
   gold and redstone/lapis come from deeper, diamonds only in the deepest layer, emeralds only in mountains.
   Nothing grows on the surface. */
/* Ore bands by depth, modelled on how ores are usually laid out in voxel games:
 * coal is common everywhere, iron sits mid-depth, gold / redstone / lapis are
 * deeper and rarer, diamonds are the deepest and rarest. Each band is a bell
 * curve around `peak`, so the chance is highest at its peak and fades out. */
const ORE_BANDS: { id: number; peak: number; spread: number; min: number; max: number; weight: number }[] = [
  { id: B.COAL, peak: 58, spread: 34, min: 6, max: 999, weight: 1.2 },
  { id: B.IRON, peak: 30, spread: 14, min: 8, max: 64, weight: 0.9 },
  { id: B.GOLD, peak: 12, spread: 6, min: 3, max: 32, weight: 0.3 },
  { id: B.REDSTONE, peak: 9, spread: 5, min: 3, max: 26, weight: 0.45 },
  { id: B.LAPIS, peak: 8, spread: 5, min: 3, max: 24, weight: 0.25 },
  { id: B.DIAMOND, peak: 5, spread: 3.5, min: 2, max: 16, weight: 0.1 },
];

function oreAt(wx: number, y: number, wz: number, seed: number, height: number, boost: boolean): number {
  if (y < 2 || y > height - 2) return 0;
  const vein = noise3(wx * 0.55, y * 0.55, wz * 0.55, seed + 4242);
  if (vein < (boost ? 0.8 : 0.84)) return 0;
  const roll = hash3(wx, y, wz, seed + 31337);
  if (height > SEA_LEVEL + 20 && y >= 40 && roll < 0.03) return B.EMERALD;
  // weight of every ore that can exist at this depth
  let total = 0;
  const weights: number[] = [];
  for (const band of ORE_BANDS) {
    let w = 0;
    if (y >= band.min && y <= band.max) {
      const d = (y - band.peak) / band.spread;
      w = band.weight * Math.exp(-0.5 * d * d);
    }
    weights.push(w);
    total += w;
  }
  if (total <= 0) return 0;
  // choose the ore for this block in proportion to its weight
  let pick = hash3(wx, y, wz, seed + 90210) * total;
  for (let i = 0; i < ORE_BANDS.length; i++) {
    pick -= weights[i];
    if (pick <= 0) return ORE_BANDS[i].id;
  }
  return ORE_BANDS[ORE_BANDS.length - 1].id;
}

function lavaLakeAt(wx: number, y: number, wz: number, seed: number) {
  if (y > 12) return false;
  const lake = noise2(wx * 0.021, wz * 0.021, seed + 6101);
  if (lake < 0.63) return false;
  const depth = 4 + Math.floor((lake - 0.63) * 22);
  return y <= depth;
}

function stoneVariant(wx: number, y: number, wz: number, seed: number): number {
  const v = noise3(wx * 0.045, y * 0.045, wz * 0.045, seed + 7777);
  if (v > 0.74) return B.GRANITE;
  if (v < 0.26) return B.DIORITE;
  const a = noise3(wx * 0.05 + 11, y * 0.05, wz * 0.05 - 7, seed + 8888);
  if (a > 0.76) return B.ANDESITE;
  return B.STONE;
}

/* ---------------- Chunk generation ---------------- */
export function generateChunk(
  cx: number,
  cz: number,
  blocks: Uint8Array,
  heights: Uint8Array,
  biomes: Uint8Array,
  opts: GenOptions
) {
  const { seed, coldMode } = opts;
  blocks.fill(0);

  for (let lz = 0; lz < CHUNK_SIZE; lz++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      const { height, biome } = sampleColumn(wx, wz, seed, coldMode);
      const colIdx = lx + lz * CHUNK_SIZE;
      heights[colIdx] = height;
      biomes[colIdx] = biome;

      const dirtDepth = biome === Biome.MOUNTAINS || biome === Biome.SNOWY ? 2 : biome === Biome.MEADOW ? 5 : 4;
      const sandy = !coldMode && (biome === Biome.DESERT || biome === Biome.BEACH || biome === Biome.OCEAN);

      let variant: number = B.STONE;
      for (let y = 0; y <= height; y++) {
        const depth = height - y;
        if ((y & 3) === 0) variant = stoneVariant(wx, y, wz, seed);
        let id: number;

        if (y <= 1) {
          id = hash3(wx, y, wz, seed + 5) > 0.35 || y === 0 ? B.BEDROCK : B.STONE;
        } else if (depth === 0) {
          if (coldMode) {
            id = height > SEA_LEVEL + 28 ? B.SNOW : B.SNOW_GRASS;
          } else if (sandy) {
            id = B.SAND;
          } else if (biome === Biome.SNOWY) {
            id = B.SNOW_GRASS;
          } else if (biome === Biome.TAIGA) {
            id = hash2(wx, wz, seed + 51) > 0.6 ? B.PODZOL : B.GRASS;
          } else if (biome === Biome.MOUNTAINS && height > SEA_LEVEL + 26) {
            id = variant;
          } else {
            id = B.GRASS;
          }
          if (height <= SEA_LEVEL && !sandy && !coldMode) id = B.GRAVEL;
        } else if (depth <= dirtDepth) {
          if (coldMode && depth === 1) id = B.DIRT;
          else if (sandy) id = depth <= 2 ? B.SAND : B.SANDSTONE;
          else if (biome === Biome.TAIGA && depth === 1) id = B.DIRT;
          else id = B.DIRT;
        } else {
          id = variant;
          const ore = oreAt(wx, y, wz, seed, height, opts.oreBoost);
          if (ore) id = ore;
          else if (noise3(wx * 0.09, y * 0.09, wz * 0.09, seed + 808) > 0.88) id = B.GRAVEL;
          else if (y < 20 && noise3(wx * 0.1, y * 0.12, wz * 0.1, seed + 2048) > 0.84) id = B.CLAY;
        }

        // keep the top two layers solid so grass, flowers and trees never hang over a cave
        if (y > 2 && depth > 1 && caveAt(wx, y, wz, seed)) {
          // lava pools only sit on something solid, never float in mid-air
          const below = blocks[blockIndex(lx, y - 1, lz)];
          const supported = below !== 0 && below !== B.COBWEB;
          if (supported && lavaLakeAt(wx, y, wz, seed)) blocks[blockIndex(lx, y, lz)] = B.LAVA;
          else if (supported && hash3(wx, y, wz, seed + 4141) > 0.992) blocks[blockIndex(lx, y, lz)] = B.COBWEB; // webs only sit on a floor
          continue;
        }

        blocks[blockIndex(lx, y, lz)] = id;
      }

      // Underground lava basins
      for (let y = 3; y <= 12; y++) {
        if (blocks[blockIndex(lx, y, lz)] !== 0) continue;
        if (lavaLakeAt(wx, y, wz, seed)) blocks[blockIndex(lx, y, lz)] = B.LAVA;
      }

      // Oceans and lakes (frozen in cold mode)
      for (let y = height + 1; y <= SEA_LEVEL; y++) {
        if (coldMode) {
          blocks[blockIndex(lx, y, lz)] = y === SEA_LEVEL ? B.ICE : B.WATER;
        } else {
          blocks[blockIndex(lx, y, lz)] = biome === Biome.SNOWY && y === SEA_LEVEL ? B.ICE : B.WATER;
        }
      }

      if (height >= SEA_LEVEL) {
        const surfaceY = height + 1;
        const r = hash2(wx * 7.3, wz * 3.1, seed + 99);
        if ((coldMode || biome === Biome.SNOWY) && blocks[blockIndex(lx, height, lz)] !== B.SNOW_GRASS && r > 0.35) {
          blocks[blockIndex(lx, surfaceY, lz)] = B.SNOW;
        }
      }
    }
  }

  decorate(cx, cz, blocks, heights, biomes, opts);
}

function placeLeafSphere(
  blocks: Uint8Array,
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
  leafId: number,
  seed: number
) {
  for (let dy = -ry; dy <= ry; dy++) {
    const sy = 1 - Math.abs(dy) / (ry + 0.5);
    const crx = rx * sy;
    const crz = rz * sy;
    for (let dx = -Math.floor(crx); dx <= Math.floor(crx); dx++) {
      if (Math.abs(dx) > crx) continue;
      for (let dz = -Math.floor(crz); dz <= Math.floor(crz); dz++) {
        if (Math.abs(dz) > crz) continue;
        if (Math.abs(dx) / crx + Math.abs(dz) / crz > 1.1) continue;
        if (hash3(cx + dx, cy + dy, cz + dz, seed + 777) > 0.82) continue;
        placeIfAir(blocks, cx + dx, cy + dy, cz + dz, leafId);
      }
    }
  }
}

function placeIfAir(blocks: Uint8Array, lx: number, y: number, lz: number, id: number) {
  if (lx < 0 || lz < 0 || lx >= CHUNK_SIZE || lz >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT) return;
  const i = blockIndex(lx, y, lz);
  if (blocks[i] === 0) blocks[i] = id;
}

function surfaceKind(biome: number, height: number): "grass" | "sand" | "snow" | "stone" | "none" {
  if (height <= SEA_LEVEL) return "none";
  if (biome === Biome.DESERT || biome === Biome.BEACH || biome === Biome.OCEAN) return "sand";
  if (biome === Biome.SNOWY) return "snow";
  if (biome === Biome.MOUNTAINS && height > SEA_LEVEL + 26) return "stone";
  return "grass";
}

type TreeKind = {
  log: number;
  leaf: number;
  trunk: number;
  spruce: boolean;
  jungle: boolean;
  acacia: boolean;
} | null;

function treeAt(wx: number, wz: number, seed: number, coldMode = false): TreeKind {
  // Only one tree can win within a 5x5 area, so trunks are always 3+ blocks apart and never merge.
  const score = hash2(wx * 3.77, wz * 8.11, seed + 404);
  if (score < 0.9) return null;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (dx === 0 && dz === 0) continue;
      if (hash2((wx + dx) * 3.77, (wz + dz) * 8.11, seed + 404) >= score) return null;
    }
  }

  const { height, biome } = sampleColumn(wx, wz, seed, coldMode);
  const kind = surfaceKind(biome, height);
  if (kind !== "grass" && kind !== "snow") return null;

  const accept = coldMode
    ? 0.85
    : biome === Biome.FOREST
    ? 0.92
    : biome === Biome.TAIGA
    ? 0.9
    : biome === Biome.PLAINS
    ? 0.45
    : biome === Biome.SNOWY
    ? 0.5
    : biome === Biome.SAVANNA
    ? 0.35
    : biome === Biome.MEADOW
    ? 0.3
    : 0;
  if (hash2(wx * 1.9, wz * 5.3, seed + 405) > accept) return null;

  const spruce = coldMode || biome === Biome.TAIGA || biome === Biome.SNOWY;
  const acacia = !coldMode && biome === Biome.SAVANNA;
  const jungle = !coldMode && biome === Biome.FOREST && hash2(wx * 2.1, wz * 4.4, seed + 55) > 0.72;
  const birch = !spruce && !acacia && !jungle && hash2(wx * 1.3, wz * 2.9, seed + 77) > 0.66;
  const trunk = spruce
    ? 6 + Math.floor(hash2(wx * 5.1, wz * 1.9, seed + 808) * 4)
    : jungle
    ? 5 + Math.floor(hash2(wx * 5.1, wz * 1.9, seed + 808) * 5)
    : 4 + Math.floor(hash2(wx * 5.1, wz * 1.9, seed + 808) * 3);

  return {
    log: spruce ? B.SPRUCE_LOG : acacia ? B.ACACIA_LOG : jungle ? B.JUNGLE_LOG : birch ? B.BIRCH_LOG : B.LOG,
    leaf: spruce ? B.SPRUCE_LEAVES : acacia ? B.ACACIA_LEAVES : jungle ? B.JUNGLE_LEAVES : birch ? B.BIRCH_LEAVES : B.LEAVES,
    trunk,
    spruce,
    jungle,
    acacia,
  };
}

function decorate(
  cx: number,
  cz: number,
  blocks: Uint8Array,
  heights: Uint8Array,
  biomes: Uint8Array,
  opts: GenOptions
) {
  const { seed, coldMode } = opts;
  const MARGIN = 4;

  /* Trees */
  for (let gz = -MARGIN; gz < CHUNK_SIZE + MARGIN; gz++) {
    for (let gx = -MARGIN; gx < CHUNK_SIZE + MARGIN; gx++) {
      const wx = cx * CHUNK_SIZE + gx;
      const wz = cz * CHUNK_SIZE + gz;
      const tree = treeAt(wx, wz, seed, coldMode);
      if (!tree) continue;
      const { height } = sampleColumn(wx, wz, seed, coldMode);

      for (let i = 1; i <= tree.trunk; i++) placeIfAir(blocks, gx, height + i, gz, tree.log);

      const crownY = height + tree.trunk;
      if (tree.spruce) {
        for (let dy = 0; dy <= 4; dy++) {
          const r = Math.max(1, 3 - Math.floor(dy * 0.7));
          for (let dx = -r; dx <= r; dx++) {
            for (let dz = -r; dz <= r; dz++) {
              if (Math.abs(dx) + Math.abs(dz) > r + 1) continue;
              if (hash3(wx + dx, crownY + dy, wz + dz, seed + 1717) > 0.88) continue;
              placeIfAir(blocks, gx + dx, crownY + dy, gz + dz, tree.leaf);
            }
          }
        }
        placeIfAir(blocks, gx, crownY + 5, gz, tree.leaf);
      } else if (tree.jungle) {
        placeLeafSphere(blocks, gx, crownY + 1, gz, 3, 2, 3, tree.leaf, seed);
        placeLeafSphere(blocks, gx, crownY + 3, gz, 2, 1, 2, tree.leaf, seed);
      } else if (tree.acacia) {
        for (let dx = -3; dx <= 3; dx++) {
          for (let dz = -3; dz <= 3; dz++) {
            if (Math.abs(dx) + Math.abs(dz) > 3) continue;
            if (hash3(wx + dx, crownY, wz + dz, seed + 1717) > 0.85) continue;
            placeIfAir(blocks, gx + dx, crownY, gz + dz, tree.leaf);
          }
        }
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) + Math.abs(dz) > 2) continue;
            if (hash3(wx + dx, crownY + 1, wz + dz, seed + 1717) > 0.85) continue;
            placeIfAir(blocks, gx + dx, crownY + 1, gz + dz, tree.leaf);
          }
        }
      } else {
        placeLeafSphere(blocks, gx, crownY, gz, 3, 2, 3, tree.leaf, seed);
        placeLeafSphere(blocks, gx, crownY + 2, gz, 2, 1, 2, tree.leaf, seed);
      }
    }
  }

  decorateStructures(cx, cz, blocks, opts);

  /* Ground cover */
  for (let lz = 0; lz < CHUNK_SIZE; lz++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      const colIdx = lx + lz * CHUNK_SIZE;
      const height = heights[colIdx];
      const biome = biomes[colIdx];
      if (height <= SEA_LEVEL) continue;

      const surfaceY = height + 1;
      if (blocks[blockIndex(lx, surfaceY, lz)] !== 0) continue;
      const ground = blocks[blockIndex(lx, height, lz)];
      const grassy = ground === B.GRASS || ground === B.PODZOL || ground === B.SNOW_GRASS;
      if (!grassy && ground !== B.SAND) continue;
      if (treeAt(wx, wz, seed, coldMode)) continue;

      const flora = hash2(wx * 9.13, wz * 4.57, seed + 1919);

      if (coldMode) {
        if (flora > 0.4) placeIfAir(blocks, lx, surfaceY, lz, B.SNOW);
        continue;
      }

      if (biome === Biome.DESERT) {
        const roll = hash2(wx * 3.77, wz * 8.11, seed + 404);
        if (roll > 0.988) {
          const tall = 2 + Math.floor(hash2(wx, wz, seed + 12) * 2);
          for (let i = 1; i <= tall; i++) placeIfAir(blocks, lx, height + i, lz, B.CACTUS);
        } else if (flora > 0.93) {
          placeIfAir(blocks, lx, surfaceY, lz, B.DEAD_BUSH);
        } else if (roll < 0.004) {
          placeIfAir(blocks, lx, surfaceY, lz, B.PUMPKIN);
        }
        continue;
      }

      if (!grassy || biome === Biome.SNOWY) continue;

      const meadow = biome === Biome.MEADOW;
      const grassChance = meadow ? 0.3 : biome === Biome.PLAINS ? 0.6 : biome === Biome.SAVANNA ? 0.56 : 0.7;
      const flowerChance = meadow ? 0.6 : 0.94;
      if (flora > flowerChance) {
        const pick = hash2(wx * 2.3, wz * 6.7, seed + 2727);
        placeIfAir(blocks, lx, surfaceY, lz, pick < 0.38 ? B.POPPY : pick < 0.72 ? B.DANDELION : B.CORNFLOWER);
      } else if (flora > grassChance) {
        placeIfAir(blocks, lx, surfaceY, lz, B.TALL_GRASS);
      } else if (biome === Biome.TAIGA && flora < 0.035) {
        placeIfAir(blocks, lx, surfaceY, lz, hash2(wx, wz, seed + 3) > 0.5 ? B.MUSHROOM_RED : B.MUSHROOM_BROWN);
      } else if (biome === Biome.FOREST && flora < 0.018) {
        placeIfAir(blocks, lx, surfaceY, lz, B.SAPLING);
      }

      /* Sugar cane next to water */
      if (flora > 0.97) {
        let wet = false;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = lx + dx;
          const nz = lz + dz;
          if (nx < 0 || nz < 0 || nx >= CHUNK_SIZE || nz >= CHUNK_SIZE) continue;
          const nTop = heights[nx + nz * CHUNK_SIZE];
          if (blocks[blockIndex(nx, nTop + 1, nz)] === B.WATER || nTop < SEA_LEVEL) wet = true;
        }
        if (wet) {
          const tall = 2 + Math.floor(hash2(wx, wz, seed + 90) * 2);
          for (let i = 1; i <= tall; i++) placeIfAir(blocks, lx, height + i, lz, B.SUGAR_CANE);
        }
      }
    }
  }

  /* Lily pads on still water */
  if (!coldMode) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        if (blocks[blockIndex(lx, SEA_LEVEL, lz)] !== B.WATER) continue;
        if (blocks[blockIndex(lx, SEA_LEVEL + 1, lz)] !== 0) continue;
        const wx = cx * CHUNK_SIZE + lx;
        const wz = cz * CHUNK_SIZE + lz;
        if (hash2(wx * 4.4, wz * 6.6, seed + 707) > 0.97) placeIfAir(blocks, lx, SEA_LEVEL + 1, lz, B.LILY_PAD);
      }
    }
  }
}

/* ---------------- Ruins & wells ----------------
 * One candidate site per 48x48 region, found from the seed alone, so a structure that
 * crosses a chunk border is built identically by both chunks. */
const REGION = 48;

function setIn(blocks: Uint8Array, lx: number, y: number, lz: number, id: number) {
  if (lx < 0 || lz < 0 || lx >= CHUNK_SIZE || lz >= CHUNK_SIZE || y < 1 || y >= WORLD_HEIGHT) return;
  blocks[blockIndex(lx, y, lz)] = id;
}

function decorateStructures(cx: number, cz: number, blocks: Uint8Array, opts: GenOptions) {
  const { seed, coldMode } = opts;
  if (coldMode) return;
  const minX = cx * CHUNK_SIZE - 6;
  const maxX = cx * CHUNK_SIZE + CHUNK_SIZE + 6;
  const minZ = cz * CHUNK_SIZE - 6;
  const maxZ = cz * CHUNK_SIZE + CHUNK_SIZE + 6;

  for (let gz = Math.floor(minZ / REGION); gz <= Math.floor(maxZ / REGION); gz++) {
    for (let gx = Math.floor(minX / REGION); gx <= Math.floor(maxX / REGION); gx++) {
      if (hash2(gx * 13.1, gz * 7.7, seed + 9001) < 0.5) continue;
      const sx = gx * REGION + 8 + Math.floor(hash2(gx * 3.3, gz * 9.1, seed + 9002) * (REGION - 16));
      const sz = gz * REGION + 8 + Math.floor(hash2(gx * 5.9, gz * 2.7, seed + 9003) * (REGION - 16));
      if (sx < minX || sx > maxX || sz < minZ || sz > maxZ) continue;

      const { height, biome } = sampleColumn(sx, sz, seed);
      if (height <= SEA_LEVEL + 2 || biome === Biome.OCEAN || biome === Biome.BEACH || biome === Biome.SNOWY || biome === Biome.MOUNTAINS) continue;

      const well = hash2(gx * 1.7, gz * 8.3, seed + 9004) < (biome === Biome.DESERT ? 0.6 : 0.3);
      const base = height;
      const x0 = sx - 2;
      const z0 = sz - 2;
      const rough = (x: number, y: number, z: number) => {
        const r = hash3(x, y, z, seed + 9005);
        return r < 0.3 ? B.MOSSY : r < 0.65 ? B.STONE_BRICKS : B.COBBLE;
      };

      // level the site: foundation under low ground, clear anything above the floor
      for (let dz = 0; dz < 5; dz++) {
        for (let dx = 0; dx < 5; dx++) {
          const wx = x0 + dx;
          const wz = z0 + dz;
          const ground = sampleColumn(wx, wz, seed).height;
          for (let y = ground + 1; y < base; y++) setIn(blocks, wx - cx * CHUNK_SIZE, y, wz - cz * CHUNK_SIZE, B.COBBLE);
          for (let y = base + 1; y <= base + 7; y++) setIn(blocks, wx - cx * CHUNK_SIZE, y, wz - cz * CHUNK_SIZE, 0);
          setIn(blocks, wx - cx * CHUNK_SIZE, base, wz - cz * CHUNK_SIZE, rough(wx, base, wz));
        }
      }

      for (let dz = 0; dz < 5; dz++) {
        for (let dx = 0; dx < 5; dx++) {
          const wx = x0 + dx;
          const wz = z0 + dz;
          const lx = wx - cx * CHUNK_SIZE;
          const lz = wz - cz * CHUNK_SIZE;
          const edge = dx === 0 || dz === 0 || dx === 4 || dz === 4;
          if (well) {
            // 5x5 courtyard with a 3x3 well in the middle
            const ring = dx >= 1 && dx <= 3 && dz >= 1 && dz <= 3;
            const centre = dx === 2 && dz === 2;
            if (centre) {
              setIn(blocks, lx, base, lz, B.WATER);
              setIn(blocks, lx, base - 1, lz, B.WATER);
            } else if (ring) {
              setIn(blocks, lx, base + 1, lz, rough(wx, base + 1, wz));
              if ((dx === 1 || dx === 3) && (dz === 1 || dz === 3)) {
                for (let y = base + 2; y <= base + 3; y++) setIn(blocks, lx, y, lz, B.PLANKS);
              }
            }
            continue;
          }
          if (!edge) continue;
          const door = dz === 0 && dx === 2;
          for (let y = base + 1; y <= base + 4; y++) {
            if (door && y <= base + 2) continue;
            // the upper courses have crumbled away in places
            if (y >= base + 3 && hash3(wx, y, wz, seed + 9006) < 0.45) continue;
            setIn(blocks, lx, y, lz, rough(wx, y, wz));
          }
        }
      }
      if (!well) {
        const lx = sx - cx * CHUNK_SIZE;
        const lz = sz - cz * CHUNK_SIZE;
        setIn(blocks, lx, base + 1, lz, B.GOLD);
        setIn(blocks, lx - 1, base + 1, lz - 1, B.TORCH);
        setIn(blocks, lx + 1, base + 1, lz + 1, B.TORCH);
      }
    }
  }
}

export function columnTop(blocks: Uint8Array, lx: number, lz: number, skipLiquid = true): number {
  for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
    const id = blocks[blockIndex(lx, y, lz)];
    if (id === 0) continue;
    if (skipLiquid && (id === B.WATER || id === B.LAVA)) continue;
    return y;
  }
  return 0;
}
