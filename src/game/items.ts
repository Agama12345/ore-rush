import { B, BLOCKS, type ToolKind } from "./blocks";
import { localName } from "./i18n";

export type { ToolKind };
export type IconKind =
  | ToolKind
  | "stick"
  | "ingot"
  | "nugget"
  | "gem"
  | "dust"
  | "food"
  | "meat"
  | "arrow"
  | "bucket"
  | "shears"
  | "flint_steel"
  | "snowball"
  | "armor"
  | "misc";

export type ItemDef = {
  id: number;
  /** key into SWORD_MODELS: drawn as a 3D model in hand and as its pre-rendered icon */
  model?: string;
  name: string;
  kind: ToolKind | "material" | "food" | "special";
  icon: IconKind;
  speed: number;
  damage: number;
  tier: number;
  color: number;
  accent: number;
  stack: number;
  food?: number;
  tag?: string;
  warmth?: number; // Warmth boost or insulation
};

/* Negative ids = items, positive = blocks */
export const I = {
  /* Tools */
  WOOD_PICK: -1,
  STONE_PICK: -2,
  IRON_PICK: -3,
  DIAMOND_PICK: -4,
  WOOD_SWORD: -5,
  STONE_SWORD: -6,
  IRON_SWORD: -7,
  DIAMOND_SWORD: -8,
  WOOD_AXE: -9,
  STONE_AXE: -10,
  IRON_AXE: -11,
  DIAMOND_AXE: -12,
  WOOD_SHOVEL: -13,
  STONE_SHOVEL: -14,
  IRON_SHOVEL: -15,
  DIAMOND_SHOVEL: -16,
  BOW: -17,
  BUCKET: -18,
  WATER_BUCKET: -19,
  LAVA_BUCKET: -40,
  FLINT_AND_STEEL: -41,
  SHEARS: -42,
  SNOWBALL: -43,
  LEATHER_COAT: -44,
  IRON_CHESTPLATE: -45,
  DIAMOND_CHESTPLATE: -46,

  /* Materials */
  STICK: -20,
  COAL: -21,
  CHARCOAL: -22,
  RAW_IRON: -23,
  IRON_INGOT: -24,
  RAW_GOLD: -25,
  GOLD_INGOT: -26,
  DIAMOND: -27,
  EMERALD: -28,
  LAPIS: -29,
  REDSTONE: -30,
  FLINT: -31,
  LEATHER: -32,
  STRING: -33,
  FEATHER: -34,
  CLAY_BALL: -35,
  BRICK: -36,
  BONE: -37,
  ARROW: -38,
  WHEAT: -39,

  /* Food */
  APPLE: -50,
  BREAD: -51,
  RAW_PORK: -52,
  COOKED_PORK: -53,
  RAW_BEEF: -54,
  STEAK: -55,
  ROTTEN_FLESH: -56,
  MELON_SLICE: -57,
  RAW_CHICKEN: -58,
  COOKED_CHICKEN: -59,
  EGG: -60,
  PORTAL_SWORD: -62,
  MONKEY_SWORD: -63,
  NEST_SWORD: -64,
  WAX_SWORD: -65,
  MANDRAKE_SWORD: -66,
  PUMPKIN_PIE: -61,
} as const;

const tool = (
  id: number,
  name: string,
  kind: ToolKind,
  tier: number,
  speed: number,
  damage: number,
  color: number,
  accent: number,
  tag: string
): ItemDef => ({ id, name, kind, icon: kind, speed, damage, tier, color, accent, stack: 1, tag });

const material = (id: number, name: string, icon: IconKind, color: number, accent = color): ItemDef => ({
  id,
  name,
  kind: "material",
  icon,
  speed: 1,
  damage: 1,
  tier: 0,
  color,
  accent,
  stack: 64,
});

const food = (id: number, name: string, icon: IconKind, color: number, accent: number, hunger: number, warmth = 0): ItemDef => ({
  id,
  name,
  kind: "food",
  icon,
  speed: 1,
  damage: 1,
  tier: 0,
  color,
  accent,
  stack: 16,
  food: hunger,
  warmth,
});

const special = (id: number, name: string, icon: IconKind, color: number, accent: number, stack = 1, warmth = 0): ItemDef => ({
  id,
  name,
  kind: "special",
  icon,
  speed: 1,
  damage: 2,
  tier: 0,
  color,
  accent,
  stack,
  warmth,
});

export const ITEMS: Record<number, ItemDef> = {
  [I.WOOD_PICK]: tool(I.WOOD_PICK, "Wooden Pickaxe", "pickaxe", 1, 2.2, 2, 0xb98a4f, 0x7d5a2f, "PICK"),
  [I.STONE_PICK]: tool(I.STONE_PICK, "Stone Pickaxe", "pickaxe", 2, 3.4, 3, 0x9aa0a2, 0x6f7578, "PICK"),
  [I.IRON_PICK]: tool(I.IRON_PICK, "Iron Pickaxe", "pickaxe", 3, 5, 4, 0xdadada, 0x8c8c8c, "PICK"),
  [I.DIAMOND_PICK]: tool(I.DIAMOND_PICK, "Diamond Pickaxe", "pickaxe", 4, 7.5, 5, 0x5de3e3, 0x2f9fa3, "PICK"),
  [I.WOOD_SWORD]: tool(I.WOOD_SWORD, "Wooden Sword", "sword", 1, 1.4, 4, 0xb98a4f, 0x7d5a2f, "SWD"),
  [I.STONE_SWORD]: tool(I.STONE_SWORD, "Stone Sword", "sword", 2, 1.5, 5, 0x9aa0a2, 0x6f7578, "SWD"),
  [I.IRON_SWORD]: tool(I.IRON_SWORD, "Iron Sword", "sword", 3, 1.6, 7, 0xdadada, 0x8c8c8c, "SWD"),
  [I.DIAMOND_SWORD]: tool(I.DIAMOND_SWORD, "Diamond Sword", "sword", 4, 1.8, 10, 0x5de3e3, 0x2f9fa3, "SWD"),
  [I.PORTAL_SWORD]: { ...tool(I.PORTAL_SWORD, "Portal Sword", "sword", 3, 1.7, 7, 0x3fb6c6, 0x7a1f1f, "SWD"), model: "portal" },
  [I.MONKEY_SWORD]: { ...tool(I.MONKEY_SWORD, "Monkey Sword", "sword", 3, 1.7, 6, 0x4a7a3a, 0x8a6a3a, "SWD"), model: "monkey" },
  [I.NEST_SWORD]: { ...tool(I.NEST_SWORD, "Nest Sword", "sword", 3, 1.7, 6, 0x8b5a2b, 0xf0e6d0, "SWD"), model: "nest" },
  [I.WAX_SWORD]: { ...tool(I.WAX_SWORD, "Wax Sword", "sword", 3, 1.7, 6, 0xc9913d, 0xefe0b0, "SWD"), model: "wax" },
  [I.MANDRAKE_SWORD]: { ...tool(I.MANDRAKE_SWORD, "Mandrake Sword", "sword", 3, 1.7, 7, 0x7a8c5a, 0x9b6b3a, "SWD"), model: "mandrake" },
  [I.WOOD_AXE]: tool(I.WOOD_AXE, "Wooden Axe", "axe", 1, 2.2, 3, 0xb98a4f, 0x7d5a2f, "AXE"),
  [I.STONE_AXE]: tool(I.STONE_AXE, "Stone Axe", "axe", 2, 3.4, 4, 0x9aa0a2, 0x6f7578, "AXE"),
  [I.IRON_AXE]: tool(I.IRON_AXE, "Iron Axe", "axe", 3, 5, 6, 0xdadada, 0x8c8c8c, "AXE"),
  [I.DIAMOND_AXE]: tool(I.DIAMOND_AXE, "Diamond Axe", "axe", 4, 7.5, 7, 0x5de3e3, 0x2f9fa3, "AXE"),
  [I.WOOD_SHOVEL]: tool(I.WOOD_SHOVEL, "Wooden Shovel", "shovel", 1, 2.4, 2, 0xb98a4f, 0x7d5a2f, "SHVL"),
  [I.STONE_SHOVEL]: tool(I.STONE_SHOVEL, "Stone Shovel", "shovel", 2, 3.8, 3, 0x9aa0a2, 0x6f7578, "SHVL"),
  [I.IRON_SHOVEL]: tool(I.IRON_SHOVEL, "Iron Shovel", "shovel", 3, 5.4, 4, 0xdadada, 0x8c8c8c, "SHVL"),
  [I.DIAMOND_SHOVEL]: tool(I.DIAMOND_SHOVEL, "Diamond Shovel", "shovel", 4, 8, 5, 0x5de3e3, 0x2f9fa3, "SHVL"),
  [I.BOW]: tool(I.BOW, "Bow", "bow", 0, 1, 7, 0x9a6b33, 0xe8e0cd, "BOW"),

  [I.BUCKET]: special(I.BUCKET, "Bucket", "bucket", 0xdadada, 0x8c8c8c, 16),
  [I.WATER_BUCKET]: special(I.WATER_BUCKET, "Water Bucket", "bucket", 0x3f76e4, 0xdadada, 1),
  [I.LAVA_BUCKET]: special(I.LAVA_BUCKET, "Lava Bucket", "bucket", 0xf06a16, 0xdadada, 1, 6),
  [I.FLINT_AND_STEEL]: special(I.FLINT_AND_STEEL, "Flint and Steel", "flint_steel", 0x4a4a4e, 0xdadada, 1, 2),
  [I.SHEARS]: special(I.SHEARS, "Shears", "shears", 0xdadada, 0x8c8c8c, 1),
  [I.SNOWBALL]: special(I.SNOWBALL, "Snowball", "snowball", 0xffffff, 0xdcebf3, 16),
  [I.LEATHER_COAT]: special(I.LEATHER_COAT, "Warm Leather Coat", "armor", 0xa0714a, 0xc69368, 1, 8),
  [I.IRON_CHESTPLATE]: special(I.IRON_CHESTPLATE, "Iron Chestplate", "armor", 0xdadada, 0xf0f0f0, 1, 4),
  [I.DIAMOND_CHESTPLATE]: special(I.DIAMOND_CHESTPLATE, "Diamond Chestplate", "armor", 0x5de3e3, 0xc7fbfb, 1, 6),

  [I.STICK]: material(I.STICK, "Stick", "stick", 0x9a6b33, 0x6f4a25),
  [I.COAL]: material(I.COAL, "Coal", "nugget", 0x2e3134, 0x55595c),
  [I.CHARCOAL]: material(I.CHARCOAL, "Charcoal", "nugget", 0x40382f, 0x6a5f52),
  [I.RAW_IRON]: material(I.RAW_IRON, "Raw Iron", "nugget", 0xd8a07a, 0xf0c6a6),
  [I.IRON_INGOT]: material(I.IRON_INGOT, "Iron Ingot", "ingot", 0xdcdcdc, 0xf6f6f6),
  [I.RAW_GOLD]: material(I.RAW_GOLD, "Raw Gold", "nugget", 0xd9a92c, 0xffe587),
  [I.GOLD_INGOT]: material(I.GOLD_INGOT, "Gold Ingot", "ingot", 0xf7d33c, 0xfff0a0),
  [I.DIAMOND]: material(I.DIAMOND, "Diamond", "gem", 0x5de3e3, 0xc7fbfb),
  [I.EMERALD]: material(I.EMERALD, "Emerald", "gem", 0x35b96f, 0xb7ffd4),
  [I.LAPIS]: material(I.LAPIS, "Lapis Lazuli", "dust", 0x2c57b8, 0x6f9bff),
  [I.REDSTONE]: material(I.REDSTONE, "Redstone Dust", "dust", 0xc3372a, 0xff7a63),
  [I.FLINT]: material(I.FLINT, "Flint", "nugget", 0x4a4a4e, 0x6f7074),
  [I.LEATHER]: material(I.LEATHER, "Leather", "misc", 0xa0714a, 0xc69368),
  [I.STRING]: material(I.STRING, "String", "misc", 0xe6e6e6, 0xffffff),
  [I.FEATHER]: material(I.FEATHER, "Feather", "misc", 0xf2f2f2, 0xd8d8d8),
  [I.CLAY_BALL]: material(I.CLAY_BALL, "Clay Ball", "nugget", 0xa4aab9, 0xc5cad6),
  [I.BRICK]: material(I.BRICK, "Brick", "ingot", 0xa2584a, 0xc47464),
  [I.BONE]: material(I.BONE, "Bone", "misc", 0xe8e4d4, 0xffffff),
  [I.ARROW]: material(I.ARROW, "Arrow", "arrow", 0xd8cdb6, 0x8c8c8c),
  [I.WHEAT]: material(I.WHEAT, "Wheat", "misc", 0xd9b45e, 0xf0d98a),

  [I.APPLE]: food(I.APPLE, "Apple", "food", 0xd2342b, 0x4e8f3c, 4, 1),
  [I.BREAD]: food(I.BREAD, "Bread", "food", 0xc08b3e, 0xe0b369, 5, 2),
  [I.RAW_PORK]: food(I.RAW_PORK, "Raw Porkchop", "meat", 0xef9a9a, 0xd36f6f, 3, 0),
  [I.COOKED_PORK]: food(I.COOKED_PORK, "Cooked Porkchop", "meat", 0xc2763c, 0xe09a5c, 8, 5),
  [I.RAW_BEEF]: food(I.RAW_BEEF, "Raw Beef", "meat", 0xd64b4b, 0xb13737, 3, 0),
  [I.STEAK]: food(I.STEAK, "Steak", "meat", 0x8b4a24, 0xb9703c, 8, 6),
  [I.ROTTEN_FLESH]: food(I.ROTTEN_FLESH, "Rotten Flesh", "meat", 0x6b5134, 0x8a6a45, 2, 0),
  [I.MELON_SLICE]: food(I.MELON_SLICE, "Melon Slice", "food", 0xd2342b, 0x6f9c2b, 2, 1),
  [I.RAW_CHICKEN]: food(I.RAW_CHICKEN, "Raw Chicken", "meat", 0xf3c9b4, 0xe0a88e, 2, 0),
  [I.COOKED_CHICKEN]: food(I.COOKED_CHICKEN, "Cooked Chicken", "meat", 0xc98a4a, 0xe7b57a, 6, 4),
  [I.PUMPKIN_PIE]: food(I.PUMPKIN_PIE, "Pumpkin Pie", "food", 0xc8782a, 0xf0b060, 8, 0),
  [I.EGG]: material(I.EGG, "Egg", "nugget", 0xf2e6cf, 0xffffff),
};

/** armor points per chestplate; each point cuts incoming damage by 5% */
export const ARMOR_POINTS: Record<number, number> = {
  [I.LEATHER_COAT]: 3,
  [I.IRON_CHESTPLATE]: 6,
  [I.DIAMOND_CHESTPLATE]: 8,
};

export const isItem = (id: number) => id < 0;
export const itemDef = (id: number) => ITEMS[id];
export const stackSize = (id: number) => (isItem(id) ? ITEMS[id]?.stack ?? 64 : 64);

export function displayName(id: number) {
  if (id === 0) return localName("Empty");
  return localName((isItem(id) ? ITEMS[id]?.name : BLOCKS[id]?.name) ?? "Unknown");
}

export function toolTier(id: number) {
  return isItem(id) ? ITEMS[id]?.tier ?? 0 : 0;
}

export function toolKind(id: number): ToolKind {
  if (!isItem(id)) return "none";
  const item = ITEMS[id];
  return item && item.kind !== "material" && item.kind !== "food" && item.kind !== "special"
    ? item.kind
    : "none";
}

export function attackDamage(id: number) {
  if (!isItem(id)) return 1;
  return ITEMS[id]?.damage ?? 1;
}

export function toolMultiplier(itemId: number, blockId: number) {
  const block = BLOCKS[blockId];
  if (!block) return 1;
  const kind = toolKind(itemId);
  if (kind === "none") {
    if (itemId === I.SHEARS && (block.id === B.LEAVES || block.id === B.BIRCH_LEAVES || block.id === B.SPRUCE_LEAVES || block.id === B.JUNGLE_LEAVES || block.id === B.ACACIA_LEAVES || block.id === B.COBWEB)) {
      return 15;
    }
    return block.cross ? 1.6 : 1;
  }
  if (kind === block.tool) return ITEMS[itemId]?.speed ?? 1;
  if (kind === "sword" && (block.cross || block.tool === "sword")) return 4;
  return 1.2;
}

/* ---------------- Block Drops ---------------- */
export type Drop = { id: number; min: number; max: number; chance?: number };
const D = (id: number, min = 1, max = min, chance = 1): Drop => ({ id, min, max, chance });

export const BLOCK_DROPS: Record<number, Drop[]> = {
  [B.GRASS]: [D(B.DIRT)],
  [B.SNOW_GRASS]: [D(B.DIRT)],
  [B.PODZOL]: [D(B.DIRT)],
  [B.STONE]: [D(B.COBBLE)],
  [B.GRAVEL]: [D(B.GRAVEL, 1, 1, 0.75), D(I.FLINT, 1, 1, 0.25)],
  [B.CLAY]: [D(I.CLAY_BALL, 3, 4)],
  [B.COAL]: [D(I.COAL, 1, 2)],
  [B.IRON]: [D(I.RAW_IRON, 1, 1)],
  [B.GOLD]: [D(I.RAW_GOLD, 1, 1)],
  [B.DIAMOND]: [D(I.DIAMOND, 1, 1)],
  [B.EMERALD]: [D(I.EMERALD, 1, 1)],
  [B.LAPIS]: [D(I.LAPIS, 4, 7)],
  [B.REDSTONE]: [D(I.REDSTONE, 4, 5)],
  [B.LEAVES]: [D(B.SAPLING, 1, 1, 0.1), D(I.APPLE, 1, 1, 0.05), D(I.STICK, 1, 1, 0.12)],
  [B.BIRCH_LEAVES]: [D(B.SAPLING, 1, 1, 0.1), D(I.STICK, 1, 1, 0.12)],
  [B.SPRUCE_LEAVES]: [D(B.SAPLING, 1, 1, 0.1), D(I.STICK, 1, 1, 0.14)],
  [B.JUNGLE_LEAVES]: [D(B.SAPLING, 1, 1, 0.1), D(I.STICK, 1, 1, 0.12)],
  [B.ACACIA_LEAVES]: [D(B.SAPLING, 1, 1, 0.1), D(I.STICK, 1, 1, 0.12)],
  [B.TALL_GRASS]: [D(I.WHEAT, 1, 1, 0.18), D(B.SAPLING, 1, 1, 0.02)],
  [B.DEAD_BUSH]: [D(I.STICK, 1, 2)],
  [B.MELON]: [D(I.MELON_SLICE, 3, 5)],
  [B.SUGAR_CANE]: [D(B.SUGAR_CANE, 1, 1)],
  [B.LILY_PAD]: [D(B.LILY_PAD, 1, 1)],
  [B.COBWEB]: [D(I.STRING, 1, 2)],
  [B.CHEST]: [D(B.CHEST, 1, 1)],
  [B.CAMPFIRE]: [D(I.CHARCOAL, 2, 2)],
  [B.ICE]: [],
  [B.SNOW]: [D(I.SNOWBALL, 1, 4)],
  [B.BRICKS]: [D(B.BRICKS)],
};

export const BLOCK_TIER: Record<number, number> = {
  [B.STONE]: 1,
  [B.COBBLE]: 1,
  [B.GRANITE]: 1,
  [B.DIORITE]: 1,
  [B.ANDESITE]: 1,
  [B.SANDSTONE]: 1,
  [B.BRICKS]: 1,
  [B.STONE_BRICKS]: 1,
  [B.MOSSY]: 1,
  [B.FURNACE]: 1,
  [B.COAL]: 1,
  [B.IRON]: 2,
  [B.LAPIS]: 2,
  [B.IRON_BLOCK]: 2,
  [B.GOLD]: 3,
  [B.REDSTONE]: 3,
  [B.DIAMOND]: 3,
  [B.EMERALD]: 3,
  [B.GOLD_BLOCK]: 3,
  [B.DIAMOND_BLOCK]: 3,
  [B.OBSIDIAN]: 4,
  [B.ICE]: 1,
};

export function rollDrops(blockId: number, heldItem: number): { id: number; count: number }[] {
  const def = BLOCKS[blockId];
  if (!def) return [];
  const needed = BLOCK_TIER[blockId] ?? 0;
  if (needed > 0 && toolTier(heldItem) < needed) return [];
  const table = BLOCK_DROPS[blockId];
  if (!table) return [{ id: def.drop ?? blockId, count: 1 }];
  const out: { id: number; count: number }[] = [];
  for (const drop of table) {
    if (drop.chance !== undefined && Math.random() > drop.chance) continue;
    const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
    if (count > 0) out.push({ id: drop.id, count });
  }
  return out;
}

/* ---------------- Crafting Recipes ---------------- */
export type Recipe = {
  id: string;
  out: { id: number; count: number };
  pattern?: string[];
  key?: Record<string, number>;
  shapeless?: number[];
  size: 2 | 3;
};

function shaped(id: string, out: number, count: number, pattern: string[], key: Record<string, number>): Recipe {
  const width = Math.max(...pattern.map((row) => row.length));
  const rows = pattern.map((row) => row.padEnd(width, " "));
  return { id, out: { id: out, count }, pattern: rows, key, size: rows.length <= 2 && width <= 2 ? 2 : 3 };
}

function shapeless(id: string, out: number, count: number, items: number[]): Recipe {
  return { id, out: { id: out, count }, shapeless: items, size: items.length <= 4 ? 2 : 3 };
}

const nine = (id: number) => new Array(9).fill(id) as number[];

export const RECIPES: Recipe[] = [
  shapeless("planks-oak", B.PLANKS, 4, [B.LOG]),
  shapeless("planks-birch", B.PLANKS, 4, [B.BIRCH_LOG]),
  shapeless("planks-spruce", B.PLANKS, 4, [B.SPRUCE_LOG]),
  shapeless("spruce-planks", B.SPRUCE_PLANKS, 4, [B.SPRUCE_LOG, B.SPRUCE_LOG]),
  shapeless("pumpkin-pie", I.PUMPKIN_PIE, 1, [B.PUMPKIN, I.EGG]),
  shapeless("planks-jungle", B.PLANKS, 4, [B.JUNGLE_LOG]),
  shapeless("planks-acacia", B.PLANKS, 4, [B.ACACIA_LOG]),
  shaped("stick", I.STICK, 4, ["P", "P"], { P: B.PLANKS }),
  shaped("crafting-table", B.CRAFTING, 1, ["PP", "PP"], { P: B.PLANKS }),
  shaped("torch", B.TORCH, 4, ["C", "S"], { C: I.COAL, S: I.STICK }),
  shaped("torch-charcoal", B.TORCH, 4, ["C", "S"], { C: I.CHARCOAL, S: I.STICK }),
  shaped("furnace", B.FURNACE, 1, ["CCC", "C C", "CCC"], { C: B.COBBLE }),
  shaped("chest", B.CHEST, 1, ["PPP", "P P", "PPP"], { P: B.PLANKS }),
  shaped("bed", B.BED, 1, ["WWW", "PPP"], { W: B.WOOL_WHITE, P: B.PLANKS }),
  shaped("coal-block", B.COAL_BLOCK, 1, ["CCC", "CCC", "CCC"], { C: I.COAL }),

  // Campfire recipe (Logs + Sticks + Coal)
  shaped("campfire", B.CAMPFIRE, 1, [" S ", "SCS", "LLL"], { S: I.STICK, C: I.COAL, L: B.LOG }),
  shaped("campfire-charcoal", B.CAMPFIRE, 1, [" S ", "SCS", "LLL"], { S: I.STICK, C: I.CHARCOAL, L: B.LOG }),

  // Buckets & Tools
  shaped("bucket", I.BUCKET, 1, ["I I", " I "], { I: I.IRON_INGOT }),
  shapeless("flint-steel", I.FLINT_AND_STEEL, 1, [I.IRON_INGOT, I.FLINT]),
  shaped("shears", I.SHEARS, 1, [" I", "I "], { I: I.IRON_INGOT }),

  // Armor & Coats (Warmth for cold mode!)
  shaped("leather-coat", I.LEATHER_COAT, 1, ["L L", "LLL", "LLL"], { L: I.LEATHER }),
  shaped("iron-chestplate", I.IRON_CHESTPLATE, 1, ["I I", "III", "III"], { I: I.IRON_INGOT }),
  shaped("diamond-chestplate", I.DIAMOND_CHESTPLATE, 1, ["D D", "DDD", "DDD"], { D: I.DIAMOND }),

  // Tools & Weapons
  shaped("wood-pick", I.WOOD_PICK, 1, ["MMM", " S ", " S "], { M: B.PLANKS, S: I.STICK }),
  shaped("wood-axe", I.WOOD_AXE, 1, ["MM", "MS", " S"], { M: B.PLANKS, S: I.STICK }),
  shaped("wood-shovel", I.WOOD_SHOVEL, 1, ["M", "S", "S"], { M: B.PLANKS, S: I.STICK }),
  shaped("wood-sword", I.WOOD_SWORD, 1, ["M", "M", "S"], { M: B.PLANKS, S: I.STICK }),
  shaped("stone-pick", I.STONE_PICK, 1, ["MMM", " S ", " S "], { M: B.COBBLE, S: I.STICK }),
  shaped("stone-axe", I.STONE_AXE, 1, ["MM", "MS", " S"], { M: B.COBBLE, S: I.STICK }),
  shaped("stone-shovel", I.STONE_SHOVEL, 1, ["M", "S", "S"], { M: B.COBBLE, S: I.STICK }),
  shaped("stone-sword", I.STONE_SWORD, 1, ["M", "M", "S"], { M: B.COBBLE, S: I.STICK }),
  shaped("iron-pick", I.IRON_PICK, 1, ["MMM", " S ", " S "], { M: I.IRON_INGOT, S: I.STICK }),
  shaped("iron-axe", I.IRON_AXE, 1, ["MM", "MS", " S"], { M: I.IRON_INGOT, S: I.STICK }),
  shaped("iron-shovel", I.IRON_SHOVEL, 1, ["M", "S", "S"], { M: I.IRON_INGOT, S: I.STICK }),
  shaped("iron-sword", I.IRON_SWORD, 1, ["M", "M", "S"], { M: I.IRON_INGOT, S: I.STICK }),
  shaped("diamond-pick", I.DIAMOND_PICK, 1, ["MMM", " S ", " S "], { M: I.DIAMOND, S: I.STICK }),
  shaped("diamond-axe", I.DIAMOND_AXE, 1, ["MM", "MS", " S"], { M: I.DIAMOND, S: I.STICK }),
  shaped("diamond-shovel", I.DIAMOND_SHOVEL, 1, ["M", "S", "S"], { M: I.DIAMOND, S: I.STICK }),
  shaped("diamond-sword", I.DIAMOND_SWORD, 1, ["M", "M", "S"], { M: I.DIAMOND, S: I.STICK }),
  shaped("portal-sword", I.PORTAL_SWORD, 1, ["G", "D", "S"], { G: I.GOLD_INGOT, D: I.DIAMOND, S: I.STICK }),
  shaped("monkey-sword", I.MONKEY_SWORD, 1, ["L", "I", "S"], { L: B.LOG, I: I.IRON_INGOT, S: I.STICK }),
  shaped("nest-sword", I.NEST_SWORD, 1, ["F", "P", "S"], { F: I.FEATHER, P: B.PLANKS, S: I.STICK }),
  shaped("wax-sword", I.WAX_SWORD, 1, ["G", "G", "S"], { G: I.GOLD_INGOT, S: I.STICK }),
  shaped("mandrake-sword", I.MANDRAKE_SWORD, 1, ["E", "I", "S"], { E: I.EGG, I: I.IRON_INGOT, S: I.STICK }),
  shaped("bow", I.BOW, 1, [" TS", "T S", " TS"], { T: I.STICK, S: I.STRING }),
  shaped("arrow", I.ARROW, 4, ["F", "S", "E"], { F: I.FLINT, S: I.STICK, E: I.FEATHER }),

  shaped("bread", I.BREAD, 1, ["WWW"], { W: I.WHEAT }),
  shaped("hay", B.HAY, 1, ["WWW", "WWW", "WWW"], { W: I.WHEAT }),
  shapeless("hay-back", I.WHEAT, 9, [B.HAY]),
  shaped("melon", B.MELON, 1, ["MMM", "MMM", "MMM"], { M: I.MELON_SLICE }),
  shaped("tnt", B.TNT, 1, ["RSR", "SRS", "RSR"], { R: I.REDSTONE, S: B.SAND }),
  shaped("sandstone", B.SANDSTONE, 1, ["SS", "SS"], { S: B.SAND }),
  shaped("stone-bricks", B.STONE_BRICKS, 4, ["SS", "SS"], { S: B.STONE }),
  shaped("bricks", B.BRICKS, 1, ["BB", "BB"], { B: I.BRICK }),
  shaped("clay", B.CLAY, 1, ["CC", "CC"], { C: I.CLAY_BALL }),
  shaped("snow-block", B.SNOW, 1, ["SS", "SS"], { S: I.SNOWBALL }),
  shaped("wool", B.WOOL_WHITE, 1, ["SS", "SS"], { S: I.STRING }),
  shapeless("mossy", B.MOSSY, 1, [B.COBBLE, B.TALL_GRASS]),
  shaped("bookshelf", B.BOOKSHELF, 1, ["PPP", "LLL", "PPP"], { P: B.PLANKS, L: I.LEATHER }),
  shapeless("iron-block", B.IRON_BLOCK, 1, nine(I.IRON_INGOT)),
  shapeless("gold-block", B.GOLD_BLOCK, 1, nine(I.GOLD_INGOT)),
  shapeless("diamond-block", B.DIAMOND_BLOCK, 1, nine(I.DIAMOND)),
  shapeless("iron-back", I.IRON_INGOT, 9, [B.IRON_BLOCK]),
  shapeless("gold-back", I.GOLD_INGOT, 9, [B.GOLD_BLOCK]),
  shapeless("diamond-back", I.DIAMOND, 9, [B.DIAMOND_BLOCK]),
  shapeless("wool-red", B.WOOL_RED, 1, [B.WOOL_WHITE, B.POPPY]),
  shapeless("wool-yellow", B.WOOL_YELLOW, 1, [B.WOOL_WHITE, B.DANDELION]),
  shapeless("wool-blue", B.WOOL_BLUE, 1, [B.WOOL_WHITE, B.CORNFLOWER]),
  shapeless("wool-green", B.WOOL_GREEN, 1, [B.WOOL_WHITE, B.CACTUS]),
  shapeless("wool-black", B.WOOL_BLACK, 1, [B.WOOL_WHITE, I.COAL]),
];

export function matchRecipe(grid: number[], size: number): Recipe | null {
  const filled = grid.map((id, i) => ({ id, x: i % size, y: Math.floor(i / size) })).filter((c) => c.id !== 0);
  if (!filled.length) return null;

  const minX = Math.min(...filled.map((c) => c.x));
  const maxX = Math.max(...filled.map((c) => c.x));
  const minY = Math.min(...filled.map((c) => c.y));
  const maxY = Math.max(...filled.map((c) => c.y));
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const at = (x: number, y: number) => grid[(minY + y) * size + (minX + x)];

  for (const recipe of RECIPES) {
    if (recipe.size > size) continue;
    if (recipe.shapeless) {
      const need = [...recipe.shapeless].sort((a, b) => a - b);
      const have = filled.map((c) => c.id).sort((a, b) => a - b);
      if (need.length === have.length && need.every((id, i) => id === have[i])) return recipe;
      continue;
    }
    const pattern = recipe.pattern!;
    const ph = pattern.length;
    const pw = pattern[0].length;
    if (ph !== h || pw !== w) continue;
    for (const mirror of [false, true]) {
      let ok = true;
      for (let y = 0; y < h && ok; y++) {
        for (let x = 0; x < w && ok; x++) {
          const ch = pattern[y][mirror ? w - 1 - x : x];
          const want = ch === " " ? 0 : recipe.key![ch];
          if (at(x, y) !== want) ok = false;
        }
      }
      if (ok) return recipe;
    }
  }
  return null;
}

export function recipeNeeds(recipe: Recipe): { id: number; count: number }[] {
  const counts = new Map<number, number>();
  const add = (id: number) => counts.set(id, (counts.get(id) ?? 0) + 1);
  if (recipe.shapeless) recipe.shapeless.forEach(add);
  else recipe.pattern!.forEach((row) => row.split("").forEach((ch) => ch !== " " && add(recipe.key![ch])));
  return Array.from(counts, ([id, count]) => ({ id, count }));
}

export function recipeLayout(recipe: Recipe, size: number): number[] {
  const grid = new Array(size * size).fill(0);
  if (recipe.shapeless) {
    recipe.shapeless.forEach((id, i) => (grid[i] = id));
    return grid;
  }
  recipe.pattern!.forEach((row, y) =>
    row.split("").forEach((ch, x) => {
      if (ch !== " ") grid[y * size + x] = recipe.key![ch];
    })
  );
  return grid;
}

/* ---------------- Smelting & Fuel ---------------- */
export const SMELTING: Record<number, number> = {
  [I.RAW_IRON]: I.IRON_INGOT,
  [I.RAW_GOLD]: I.GOLD_INGOT,
  [B.IRON]: I.IRON_INGOT,
  [B.GOLD]: I.GOLD_INGOT,
  [B.SAND]: B.GLASS,
  [B.COBBLE]: B.STONE,
  [I.CLAY_BALL]: I.BRICK,
  [B.LOG]: I.CHARCOAL,
  [B.BIRCH_LOG]: I.CHARCOAL,
  [B.SPRUCE_LOG]: I.CHARCOAL,
  [B.JUNGLE_LOG]: I.CHARCOAL,
  [B.ACACIA_LOG]: I.CHARCOAL,
  [I.RAW_PORK]: I.COOKED_PORK,
  [I.RAW_BEEF]: I.STEAK,
  [I.RAW_CHICKEN]: I.COOKED_CHICKEN,
  [B.CACTUS]: B.WOOL_GREEN,
};

export const FUEL: Record<number, number> = {
  [I.COAL]: 8,
  [I.CHARCOAL]: 8,
  [I.LAVA_BUCKET]: 100,
  [B.LOG]: 1.5,
  [B.BIRCH_LOG]: 1.5,
  [B.SPRUCE_LOG]: 1.5,
  [B.JUNGLE_LOG]: 1.5,
  [B.ACACIA_LOG]: 1.5,
  [B.PLANKS]: 1.5,
  [B.CRAFTING]: 1.5,
  [B.BOOKSHELF]: 1.5,
  [B.CHEST]: 1.5,
  [I.STICK]: 0.5,
  [B.SAPLING]: 0.5,
  [I.WOOD_PICK]: 1,
  [I.WOOD_AXE]: 1,
  [I.WOOD_SHOVEL]: 1,
  [I.WOOD_SWORD]: 1,
  [B.HAY]: 1,
};

export const SMELT_TIME = 4;

/* ---------------- Creative Palettes ---------------- */
export const CREATIVE_GROUPS: { name: string; items: number[] }[] = [
  {
    name: "Tools",
    items: [
      I.DIAMOND_PICK, I.IRON_PICK, I.STONE_PICK, I.WOOD_PICK,
      I.DIAMOND_AXE, I.IRON_AXE, I.STONE_AXE, I.WOOD_AXE,
      I.DIAMOND_SHOVEL, I.IRON_SHOVEL, I.STONE_SHOVEL, I.WOOD_SHOVEL,
      I.DIAMOND_SWORD, I.PORTAL_SWORD, I.MONKEY_SWORD, I.NEST_SWORD, I.WAX_SWORD, I.MANDRAKE_SWORD, I.IRON_SWORD, I.STONE_SWORD, I.WOOD_SWORD,
      I.BOW, I.ARROW, I.FLINT_AND_STEEL, I.SHEARS,
      I.BUCKET, I.WATER_BUCKET, I.LAVA_BUCKET, I.SNOWBALL,
      I.LEATHER_COAT, I.IRON_CHESTPLATE, I.DIAMOND_CHESTPLATE,
    ],
  },
  {
    name: "Natural",
    items: [
      B.GRASS, B.DIRT, B.PODZOL, B.STONE, B.COBBLE, B.GRANITE, B.DIORITE, B.ANDESITE,
      B.SAND, B.SANDSTONE, B.GRAVEL, B.CLAY, B.SNOW, B.SNOW_GRASS, B.ICE, B.OBSIDIAN,
      B.BEDROCK, B.WATER, B.LAVA, B.NETHERRACK, B.TERRACOTTA,
    ],
  },
  {
    name: "Nature",
    items: [
      B.LOG, B.BIRCH_LOG, B.SPRUCE_LOG, B.JUNGLE_LOG, B.ACACIA_LOG, B.PLANKS,
      B.LEAVES, B.BIRCH_LEAVES, B.SPRUCE_LEAVES, B.JUNGLE_LEAVES, B.ACACIA_LEAVES,
      B.CACTUS, B.SUGAR_CANE, B.LILY_PAD, B.PUMPKIN, B.MELON, B.HAY,
      B.TALL_GRASS, B.POPPY, B.DANDELION, B.CORNFLOWER, B.MUSHROOM_RED, B.MUSHROOM_BROWN,
      B.DEAD_BUSH, B.SAPLING, B.COBWEB,
    ],
  },
  {
    name: "Ores",
    items: [
      B.COAL, B.IRON, B.GOLD, B.REDSTONE, B.LAPIS, B.DIAMOND, B.EMERALD,
      B.IRON_BLOCK, B.GOLD_BLOCK, B.DIAMOND_BLOCK,
      I.COAL, I.IRON_INGOT, I.GOLD_INGOT, I.DIAMOND, I.EMERALD, I.LAPIS, I.REDSTONE,
    ],
  },
  {
    name: "Build",
    items: [
      B.CAMPFIRE, B.TORCH, B.GLOWSTONE, B.FURNACE, B.CRAFTING, B.CHEST, B.BED, B.COAL_BLOCK, B.SPRUCE_PLANKS, B.BOOKSHELF,
      B.BRICKS, B.STONE_BRICKS, B.MOSSY, B.GLASS, B.TNT,
      B.WOOL_WHITE, B.WOOL_RED, B.WOOL_BLUE, B.WOOL_YELLOW, B.WOOL_GREEN, B.WOOL_BLACK,
      B.WOOL_ORANGE, B.WOOL_PINK, B.WOOL_CYAN, B.WOOL_PURPLE,
    ],
  },
  {
    name: "Food",
    items: [
      I.APPLE, I.BREAD, I.PUMPKIN_PIE, I.COOKED_PORK, I.STEAK, I.COOKED_CHICKEN,
      I.RAW_PORK, I.RAW_BEEF, I.RAW_CHICKEN, I.MELON_SLICE,
      I.EGG, I.WHEAT, I.STICK, I.STRING, I.FEATHER, I.LEATHER, I.FLINT, I.BONE, I.CLAY_BALL, I.BRICK,
    ],
  },
];

export const CREATIVE_HOTBAR = [I.DIAMOND_PICK, I.DIAMOND_SWORD, I.BOW, B.GRASS, B.STONE, B.PLANKS, B.CAMPFIRE, B.TORCH, B.TNT];
export const SPRINT_HOTBAR = [I.IRON_PICK, I.IRON_SWORD, I.BOW, B.COBBLE, B.PLANKS, B.DIRT, B.TORCH, B.GLASS, B.TNT];
export const COLD_HOTBAR = [I.WOOD_PICK, I.WOOD_AXE, I.FLINT_AND_STEEL, B.CAMPFIRE, B.TORCH, B.LOG, I.BREAD, I.SNOWBALL, I.LEATHER_COAT];

/* Mob Drops */
export const MOB_DROPS: Record<number, Drop[]> = {
  0: [D(I.RAW_PORK, 1, 3)],
  1: [D(B.WOOL_WHITE, 1, 2), D(I.STRING, 0, 2)],
  2: [D(I.RAW_BEEF, 1, 3), D(I.LEATHER, 0, 2)],
  3: [D(I.ROTTEN_FLESH, 1, 2), D(I.BONE, 0, 2, 0.5), D(I.FEATHER, 0, 1, 0.3)],
  4: [D(I.RAW_CHICKEN, 1, 1), D(I.FEATHER, 1, 3), D(I.EGG, 0, 1, 0.4)],
  5: [D(I.BONE, 1, 3), D(I.ARROW, 1, 4), D(I.BOW, 1, 1, 0.15)], // Skeleton
  6: [D(I.REDSTONE, 2, 5), D(I.COAL, 1, 3)], // Creeper
  7: [D(I.STRING, 0, 2), D(I.BONE, 0, 1, 0.2)], // Spider
};
