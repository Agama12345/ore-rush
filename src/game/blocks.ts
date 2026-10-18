import type { CSSProperties } from "react";

/* ------------------------------------------------------------------ *
 *  Block ids
 * ------------------------------------------------------------------ */
export const B = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLE: 4,
  SAND: 5,
  SANDSTONE: 6,
  GRAVEL: 7,
  LOG: 8,
  LEAVES: 9,
  PLANKS: 10,
  BEDROCK: 11,
  WATER: 12,
  COAL: 13,
  IRON: 14,
  GOLD: 15,
  DIAMOND: 16,
  EMERALD: 17,
  REDSTONE: 18,
  LAPIS: 19,
  SNOW: 20,
  ICE: 21,
  GLASS: 22,
  BRICKS: 23,
  GLOWSTONE: 24,
  TNT: 25,
  CACTUS: 26,
  OBSIDIAN: 27,
  BIRCH_LOG: 28,
  BIRCH_LEAVES: 29,
  MOSSY: 30,
  STONE_BRICKS: 31,
  PUMPKIN: 32,
  WOOL_RED: 33,
  WOOL_BLUE: 34,
  WOOL_YELLOW: 35,
  LAVA: 36,
  CLAY: 37,
  SNOW_GRASS: 38,
  /* new in this update */
  GRANITE: 39,
  DIORITE: 40,
  ANDESITE: 41,
  IRON_BLOCK: 42,
  GOLD_BLOCK: 43,
  DIAMOND_BLOCK: 44,
  BOOKSHELF: 45,
  CRAFTING: 46,
  FURNACE: 47,
  HAY: 48,
  MELON: 49,
  SPRUCE_LOG: 50,
  SPRUCE_LEAVES: 51,
  PODZOL: 52,
  TALL_GRASS: 53,
  POPPY: 54,
  DANDELION: 55,
  CORNFLOWER: 56,
  MUSHROOM_RED: 57,
  MUSHROOM_BROWN: 58,
  DEAD_BUSH: 59,
  SAPLING: 60,
  TORCH: 61,
  WOOL_WHITE: 62,
  WOOL_GREEN: 63,
  WOOL_BLACK: 64,
  JUNGLE_LOG: 65,
  JUNGLE_LEAVES: 66,
  ACACIA_LOG: 67,
  ACACIA_LEAVES: 68,
  SUGAR_CANE: 69,
  LILY_PAD: 70,
  COBWEB: 71,
  CHEST: 72,
  TERRACOTTA: 73,
  NETHERRACK: 74,
  WOOL_ORANGE: 75,
  WOOL_PINK: 76,
  WOOL_CYAN: 77,
  WOOL_PURPLE: 78,
  CAMPFIRE: 79,
  PACKED_ICE: 80,
  BLUE_ICE: 81,
} as const;

/* ------------------------------------------------------------------ *
 *  Texture atlas tiles (12 x 12 grid of 16px tiles)
 * ------------------------------------------------------------------ */
export const T = {
  GRASS_TOP: 0,
  GRASS_SIDE: 1,
  DIRT: 2,
  STONE: 3,
  COBBLE: 4,
  SAND: 5,
  SANDSTONE_TOP: 6,
  SANDSTONE_SIDE: 7,
  GRAVEL: 8,
  LOG_SIDE: 9,
  LOG_TOP: 10,
  LEAVES: 11,
  PLANKS: 12,
  BEDROCK: 13,
  WATER: 14,
  COAL: 15,
  IRON: 16,
  GOLD: 17,
  DIAMOND: 18,
  EMERALD: 19,
  REDSTONE: 20,
  LAPIS: 21,
  SNOW: 22,
  SNOW_SIDE: 23,
  ICE: 24,
  GLASS: 25,
  BRICKS: 26,
  GLOWSTONE: 27,
  TNT_TOP: 28,
  TNT_SIDE: 29,
  TNT_BOTTOM: 30,
  CACTUS_TOP: 31,
  CACTUS_SIDE: 32,
  OBSIDIAN: 33,
  BIRCH_SIDE: 34,
  BIRCH_TOP: 35,
  BIRCH_LEAVES: 36,
  MOSSY: 37,
  STONE_BRICKS: 38,
  PUMPKIN_TOP: 39,
  PUMPKIN_SIDE: 40,
  WOOL_RED: 41,
  WOOL_BLUE: 42,
  WOOL_YELLOW: 43,
  LAVA: 44,
  CLAY: 45,
  GRANITE: 46,
  DIORITE: 47,
  ANDESITE: 48,
  IRON_BLOCK: 49,
  GOLD_BLOCK: 50,
  DIAMOND_BLOCK: 51,
  BOOKSHELF: 52,
  CRAFT_TOP: 53,
  CRAFT_SIDE: 54,
  FURNACE_FRONT: 55,
  FURNACE_SIDE: 56,
  HAY_TOP: 57,
  HAY_SIDE: 58,
  MELON: 59,
  SPRUCE_SIDE: 60,
  SPRUCE_TOP: 61,
  SPRUCE_LEAVES: 62,
  PODZOL_TOP: 63,
  PODZOL_SIDE: 64,
  TALL_GRASS: 65,
  POPPY: 66,
  DANDELION: 67,
  CORNFLOWER: 68,
  MUSH_RED: 69,
  MUSH_BROWN: 70,
  DEAD_BUSH: 71,
  SAPLING: 72,
  TORCH: 73,
  WOOL_WHITE: 74,
  WOOL_GREEN: 75,
  WOOL_BLACK: 76,
  JUNGLE_SIDE: 77,
  JUNGLE_TOP: 78,
  JUNGLE_LEAVES: 79,
  ACACIA_SIDE: 80,
  ACACIA_TOP: 81,
  ACACIA_LEAVES: 82,
  SUGAR_CANE: 83,
  LILY: 84,
  COBWEB: 85,
  CHEST_FRONT: 86,
  CHEST_SIDE: 87,
  CHEST_TOP: 88,
  TERRACOTTA: 89,
  NETHERRACK: 90,
  WOOL_ORANGE: 91,
  WOOL_PINK: 92,
  WOOL_CYAN: 93,
  WOOL_PURPLE: 94,
  CAMPFIRE: 95,
  PACKED_ICE: 96,
  BLUE_ICE: 97,
  CAMPFIRE_TOP: 98,
  CAMPFIRE_SIDE: 99,
  PACKED_ICE_TILE: 100,
  BLUE_ICE_TILE: 101,
} as const;

export type ToolKind = "none" | "pickaxe" | "axe" | "shovel" | "sword" | "bow";

export type BlockDef = {
  id: number;
  name: string;
  top: number;
  bottom: number;
  side: number;
  hardness: number;
  score: number;
  color: number;
  solid: boolean;
  transparent: boolean;
  liquid: boolean;
  translucent: boolean;
  emissive: boolean;
  /** rendered as two crossed quads (flowers, grass, torch) */
  cross: boolean;
  /** alpha-tested foliage (leaves, cobweb) */
  cutout: boolean;
  /** can be replaced by placing a block into it */
  replaceable: boolean;
  isOre: boolean;
  creative: boolean;
  drop: number;
  /** tool that speeds this block up */
  tool: ToolKind;
  timeBonus?: number;
  glow?: number;
};

type Partial0 = Partial<BlockDef> & { id: number; name: string; color: number };

function def(base: Partial0, tiles: { top: number; side?: number; bottom?: number }): BlockDef {
  return {
    hardness: 0.4,
    score: 4,
    solid: true,
    transparent: false,
    liquid: false,
    translucent: false,
    emissive: false,
    cross: false,
    cutout: false,
    replaceable: false,
    isOre: false,
    creative: true,
    tool: "none",
    drop: base.id,
    ...base,
    top: tiles.top,
    side: tiles.side ?? tiles.top,
    bottom: tiles.bottom ?? tiles.side ?? tiles.top,
  } as BlockDef;
}

const plant = (id: number, name: string, color: number, tile: number, extra: Partial<BlockDef> = {}): BlockDef =>
  def(
    {
      id,
      name,
      color,
      hardness: 0.04,
      score: 1,
      solid: false,
      transparent: true,
      cross: true,
      replaceable: true,
      tool: "sword",
      ...extra,
    },
    { top: tile }
  );

export const BLOCKS: Record<number, BlockDef> = {
  [B.GRASS]: def({ id: B.GRASS, name: "Grass Block", color: 0x6cb24c, hardness: 0.28, score: 4, drop: B.DIRT, tool: "shovel" }, { top: T.GRASS_TOP, side: T.GRASS_SIDE, bottom: T.DIRT }),
  [B.DIRT]: def({ id: B.DIRT, name: "Dirt", color: 0x8a5c3b, hardness: 0.3, score: 4, tool: "shovel" }, { top: T.DIRT }),
  [B.PODZOL]: def({ id: B.PODZOL, name: "Podzol", color: 0x6b4a27, hardness: 0.3, score: 4, drop: B.DIRT, tool: "shovel" }, { top: T.PODZOL_TOP, side: T.PODZOL_SIDE, bottom: T.DIRT }),
  [B.STONE]: def({ id: B.STONE, name: "Stone", color: 0x8a9297, hardness: 0.75, score: 6, drop: B.COBBLE, tool: "pickaxe" }, { top: T.STONE }),
  [B.COBBLE]: def({ id: B.COBBLE, name: "Cobblestone", color: 0x83898b, hardness: 0.8, score: 6, tool: "pickaxe" }, { top: T.COBBLE }),
  [B.GRANITE]: def({ id: B.GRANITE, name: "Granite", color: 0xa07461, hardness: 0.78, score: 6, tool: "pickaxe" }, { top: T.GRANITE }),
  [B.DIORITE]: def({ id: B.DIORITE, name: "Diorite", color: 0xcfcfcf, hardness: 0.78, score: 6, tool: "pickaxe" }, { top: T.DIORITE }),
  [B.ANDESITE]: def({ id: B.ANDESITE, name: "Andesite", color: 0x888a88, hardness: 0.78, score: 6, tool: "pickaxe" }, { top: T.ANDESITE }),
  [B.SAND]: def({ id: B.SAND, name: "Sand", color: 0xe3cf9a, hardness: 0.26, score: 4, tool: "shovel" }, { top: T.SAND }),
  [B.SANDSTONE]: def({ id: B.SANDSTONE, name: "Sandstone", color: 0xdac290, hardness: 0.6, score: 6, tool: "pickaxe" }, { top: T.SANDSTONE_TOP, side: T.SANDSTONE_SIDE }),
  [B.GRAVEL]: def({ id: B.GRAVEL, name: "Gravel", color: 0x8d8984, hardness: 0.34, score: 4, tool: "shovel" }, { top: T.GRAVEL }),
  [B.CLAY]: def({ id: B.CLAY, name: "Clay", color: 0xa4aab9, hardness: 0.35, score: 5, tool: "shovel" }, { top: T.CLAY }),
  [B.LOG]: def({ id: B.LOG, name: "Oak Log", color: 0x7b5431, hardness: 0.55, score: 8, tool: "axe" }, { top: T.LOG_TOP, side: T.LOG_SIDE }),
  [B.BIRCH_LOG]: def({ id: B.BIRCH_LOG, name: "Birch Log", color: 0xd7cfb4, hardness: 0.52, score: 8, tool: "axe" }, { top: T.BIRCH_TOP, side: T.BIRCH_SIDE }),
  [B.SPRUCE_LOG]: def({ id: B.SPRUCE_LOG, name: "Spruce Log", color: 0x4a3524, hardness: 0.55, score: 8, tool: "axe" }, { top: T.SPRUCE_TOP, side: T.SPRUCE_SIDE }),
  [B.JUNGLE_LOG]: def({ id: B.JUNGLE_LOG, name: "Jungle Log", color: 0x58432b, hardness: 0.55, score: 8, tool: "axe" }, { top: T.JUNGLE_TOP, side: T.JUNGLE_SIDE }),
  [B.ACACIA_LOG]: def({ id: B.ACACIA_LOG, name: "Acacia Log", color: 0x70685a, hardness: 0.55, score: 8, tool: "axe" }, { top: T.ACACIA_TOP, side: T.ACACIA_SIDE }),
  [B.LEAVES]: def({ id: B.LEAVES, name: "Oak Leaves", color: 0x3d7a37, hardness: 0.12, score: 3, transparent: true, cutout: true, tool: "sword" }, { top: T.LEAVES }),
  [B.BIRCH_LEAVES]: def({ id: B.BIRCH_LEAVES, name: "Birch Leaves", color: 0x5f9444, hardness: 0.12, score: 3, transparent: true, cutout: true, tool: "sword" }, { top: T.BIRCH_LEAVES }),
  [B.SPRUCE_LEAVES]: def({ id: B.SPRUCE_LEAVES, name: "Spruce Leaves", color: 0x2f5a35, hardness: 0.12, score: 3, transparent: true, cutout: true, tool: "sword" }, { top: T.SPRUCE_LEAVES }),
  [B.JUNGLE_LEAVES]: def({ id: B.JUNGLE_LEAVES, name: "Jungle Leaves", color: 0x2f7a28, hardness: 0.12, score: 3, transparent: true, cutout: true, tool: "sword" }, { top: T.JUNGLE_LEAVES }),
  [B.ACACIA_LEAVES]: def({ id: B.ACACIA_LEAVES, name: "Acacia Leaves", color: 0x97a51d, hardness: 0.12, score: 3, transparent: true, cutout: true, tool: "sword" }, { top: T.ACACIA_LEAVES }),
  [B.PLANKS]: def({ id: B.PLANKS, name: "Oak Planks", color: 0xbb8a52, hardness: 0.42, score: 5, tool: "axe" }, { top: T.PLANKS }),
  [B.BOOKSHELF]: def({ id: B.BOOKSHELF, name: "Bookshelf", color: 0x9c7446, hardness: 0.5, score: 8, tool: "axe" }, { top: T.PLANKS, side: T.BOOKSHELF }),
  [B.CRAFTING]: def({ id: B.CRAFTING, name: "Crafting Table", color: 0xa9793f, hardness: 0.5, score: 8, tool: "axe" }, { top: T.CRAFT_TOP, side: T.CRAFT_SIDE, bottom: T.PLANKS }),
  [B.FURNACE]: def({ id: B.FURNACE, name: "Furnace", color: 0x7c8083, hardness: 0.8, score: 8, tool: "pickaxe" }, { top: T.FURNACE_SIDE, side: T.FURNACE_FRONT }),
  [B.HAY]: def({ id: B.HAY, name: "Hay Bale", color: 0xd3a827, hardness: 0.3, score: 6 }, { top: T.HAY_TOP, side: T.HAY_SIDE }),
  [B.MELON]: def({ id: B.MELON, name: "Melon", color: 0x6f9c2b, hardness: 0.3, score: 8, tool: "axe" }, { top: T.MELON }),
  [B.BEDROCK]: def({ id: B.BEDROCK, name: "Bedrock", color: 0x3c3f42, hardness: 999, score: 0 }, { top: T.BEDROCK }),
  [B.WATER]: def(
    { id: B.WATER, name: "Water", color: 0x3f76e4, hardness: 999, score: 0, solid: false, transparent: true, liquid: true, translucent: true, replaceable: true, creative: true },
    { top: T.WATER }
  ),
  [B.LAVA]: def(
    { id: B.LAVA, name: "Lava", color: 0xf06a16, hardness: 999, score: 0, solid: false, transparent: true, liquid: true, emissive: true, replaceable: true, creative: true, glow: 0xff9a3c },
    { top: T.LAVA }
  ),
  [B.COAL]: def({ id: B.COAL, name: "Coal Ore", color: 0x4a4d51, hardness: 0.85, score: 30, isOre: true, timeBonus: 0.15, glow: 0xb9c2c6, tool: "pickaxe" }, { top: T.COAL }),
  [B.IRON]: def({ id: B.IRON, name: "Iron Ore", color: 0xd8af92, hardness: 0.95, score: 60, isOre: true, timeBonus: 0.25, glow: 0xf0c6a6, tool: "pickaxe" }, { top: T.IRON }),
  [B.GOLD]: def({ id: B.GOLD, name: "Gold Ore", color: 0xf3c242, hardness: 0.95, score: 120, isOre: true, timeBonus: 0.35, glow: 0xffd75e, tool: "pickaxe" }, { top: T.GOLD }),
  [B.DIAMOND]: def({ id: B.DIAMOND, name: "Diamond Ore", color: 0x6fe8ea, hardness: 1.1, score: 260, isOre: true, timeBonus: 0.7, glow: 0x7df7ff, tool: "pickaxe" }, { top: T.DIAMOND }),
  [B.EMERALD]: def({ id: B.EMERALD, name: "Emerald Ore", color: 0x49dd8c, hardness: 1.1, score: 480, isOre: true, timeBonus: 1.2, glow: 0x66ffa8, tool: "pickaxe" }, { top: T.EMERALD }),
  [B.REDSTONE]: def({ id: B.REDSTONE, name: "Redstone Ore", color: 0xd14b3c, hardness: 0.95, score: 80, isOre: true, timeBonus: 0.25, glow: 0xff6a52, tool: "pickaxe" }, { top: T.REDSTONE }),
  [B.LAPIS]: def({ id: B.LAPIS, name: "Lapis Ore", color: 0x2c57b8, hardness: 0.95, score: 100, isOre: true, timeBonus: 0.3, glow: 0x5a86ff, tool: "pickaxe" }, { top: T.LAPIS }),
  [B.IRON_BLOCK]: def({ id: B.IRON_BLOCK, name: "Block of Iron", color: 0xdcdcdc, hardness: 1.1, score: 20, tool: "pickaxe" }, { top: T.IRON_BLOCK }),
  [B.GOLD_BLOCK]: def({ id: B.GOLD_BLOCK, name: "Block of Gold", color: 0xf7d33c, hardness: 1.0, score: 40, tool: "pickaxe" }, { top: T.GOLD_BLOCK }),
  [B.DIAMOND_BLOCK]: def({ id: B.DIAMOND_BLOCK, name: "Block of Diamond", color: 0x5de3e3, hardness: 1.2, score: 80, tool: "pickaxe" }, { top: T.DIAMOND_BLOCK }),
  [B.SNOW]: def({ id: B.SNOW, name: "Snow Block", color: 0xf2fbff, hardness: 0.18, score: 4, tool: "shovel" }, { top: T.SNOW }),
  [B.SNOW_GRASS]: def({ id: B.SNOW_GRASS, name: "Snowy Grass", color: 0xe9f5fa, hardness: 0.3, score: 4, drop: B.DIRT, tool: "shovel" }, { top: T.SNOW, side: T.SNOW_SIDE, bottom: T.DIRT }),
  [B.ICE]: def({ id: B.ICE, name: "Ice", color: 0x93c7f5, hardness: 0.35, score: 6, transparent: true, translucent: true, tool: "pickaxe" }, { top: T.ICE }),
  [B.GLASS]: def({ id: B.GLASS, name: "Glass", color: 0xcfeaf2, hardness: 0.22, score: 6, transparent: true, translucent: true }, { top: T.GLASS }),
  [B.BRICKS]: def({ id: B.BRICKS, name: "Bricks", color: 0xa2584a, hardness: 0.8, score: 8, tool: "pickaxe" }, { top: T.BRICKS }),
  [B.STONE_BRICKS]: def({ id: B.STONE_BRICKS, name: "Stone Bricks", color: 0x909693, hardness: 0.8, score: 8, tool: "pickaxe" }, { top: T.STONE_BRICKS }),
  [B.MOSSY]: def({ id: B.MOSSY, name: "Mossy Cobble", color: 0x6f8257, hardness: 0.8, score: 8, tool: "pickaxe" }, { top: T.MOSSY }),
  [B.OBSIDIAN]: def({ id: B.OBSIDIAN, name: "Obsidian", color: 0x1c1726, hardness: 2.4, score: 40, tool: "pickaxe" }, { top: T.OBSIDIAN }),
  [B.GLOWSTONE]: def({ id: B.GLOWSTONE, name: "Glowstone", color: 0xf2c45c, hardness: 0.24, score: 18, emissive: true, glow: 0xffcf6b }, { top: T.GLOWSTONE }),
  [B.TNT]: def({ id: B.TNT, name: "TNT", color: 0xe14c3e, hardness: 0.14, score: 75, timeBonus: 0.2, glow: 0xff7a4a }, { top: T.TNT_TOP, side: T.TNT_SIDE, bottom: T.TNT_BOTTOM }),
  [B.CACTUS]: def({ id: B.CACTUS, name: "Cactus", color: 0x4e8f3c, hardness: 0.2, score: 6 }, { top: T.CACTUS_TOP, side: T.CACTUS_SIDE }),
  [B.PUMPKIN]: def({ id: B.PUMPKIN, name: "Pumpkin", color: 0xe08528, hardness: 0.3, score: 12, tool: "axe" }, { top: T.PUMPKIN_TOP, side: T.PUMPKIN_SIDE }),
  [B.WOOL_WHITE]: def({ id: B.WOOL_WHITE, name: "White Wool", color: 0xeceff0, hardness: 0.25, score: 5 }, { top: T.WOOL_WHITE }),
  [B.WOOL_RED]: def({ id: B.WOOL_RED, name: "Red Wool", color: 0xb02e26, hardness: 0.25, score: 5 }, { top: T.WOOL_RED }),
  [B.WOOL_BLUE]: def({ id: B.WOOL_BLUE, name: "Blue Wool", color: 0x3c44aa, hardness: 0.25, score: 5 }, { top: T.WOOL_BLUE }),
  [B.WOOL_YELLOW]: def({ id: B.WOOL_YELLOW, name: "Yellow Wool", color: 0xf9c62c, hardness: 0.25, score: 5 }, { top: T.WOOL_YELLOW }),
  [B.WOOL_GREEN]: def({ id: B.WOOL_GREEN, name: "Green Wool", color: 0x5e7c16, hardness: 0.25, score: 5 }, { top: T.WOOL_GREEN }),
  [B.WOOL_BLACK]: def({ id: B.WOOL_BLACK, name: "Black Wool", color: 0x1d1c21, hardness: 0.25, score: 5 }, { top: T.WOOL_BLACK }),
  [B.WOOL_ORANGE]: def({ id: B.WOOL_ORANGE, name: "Orange Wool", color: 0xf07613, hardness: 0.25, score: 5 }, { top: T.WOOL_ORANGE }),
  [B.WOOL_PINK]: def({ id: B.WOOL_PINK, name: "Pink Wool", color: 0xed8dac, hardness: 0.25, score: 5 }, { top: T.WOOL_PINK }),
  [B.WOOL_CYAN]: def({ id: B.WOOL_CYAN, name: "Cyan Wool", color: 0x169b9c, hardness: 0.25, score: 5 }, { top: T.WOOL_CYAN }),
  [B.WOOL_PURPLE]: def({ id: B.WOOL_PURPLE, name: "Purple Wool", color: 0x7b2fbe, hardness: 0.25, score: 5 }, { top: T.WOOL_PURPLE }),
  [B.CAMPFIRE]: def({ id: B.CAMPFIRE, name: "Campfire", color: 0xe87b1a, hardness: 0.5, score: 10, tool: "axe", emissive: true, glow: 0xffcf6b, replaceable: false, creative: true }, { top: T.CAMPFIRE_TOP, side: T.CAMPFIRE_SIDE }),

  /* plants */
  [B.TALL_GRASS]: plant(B.TALL_GRASS, "Tall Grass", 0x6cb24c, T.TALL_GRASS),
  [B.POPPY]: plant(B.POPPY, "Poppy", 0xd13b32, T.POPPY),
  [B.DANDELION]: plant(B.DANDELION, "Dandelion", 0xf2d33c, T.DANDELION),
  [B.CORNFLOWER]: plant(B.CORNFLOWER, "Cornflower", 0x4a63d8, T.CORNFLOWER),
  [B.MUSHROOM_RED]: plant(B.MUSHROOM_RED, "Red Mushroom", 0xd04a42, T.MUSH_RED),
  [B.MUSHROOM_BROWN]: plant(B.MUSHROOM_BROWN, "Brown Mushroom", 0xa1764f, T.MUSH_BROWN),
  [B.DEAD_BUSH]: plant(B.DEAD_BUSH, "Dead Bush", 0x946428, T.DEAD_BUSH),
  [B.SAPLING]: plant(B.SAPLING, "Oak Sapling", 0x58883a, T.SAPLING),
  [B.TORCH]: plant(B.TORCH, "Torch", 0xffc24a, T.TORCH, { emissive: true, glow: 0xffb13c, score: 4, replaceable: false }),
  [B.SUGAR_CANE]: plant(B.SUGAR_CANE, "Sugar Cane", 0x73a14b, T.SUGAR_CANE, { replaceable: false }),
  [B.LILY_PAD]: def(
    { id: B.LILY_PAD, name: "Lily Pad", color: 0x2f7a28, hardness: 0.04, score: 1, solid: false, transparent: true, cutout: true, replaceable: true, tool: "sword" },
    { top: T.LILY }
  ),
  [B.COBWEB]: plant(B.COBWEB, "Cobweb", 0xe8e8e8, T.COBWEB, { replaceable: false, hardness: 0.3 }),
  [B.CHEST]: def({ id: B.CHEST, name: "Chest", color: 0xb8943a, hardness: 0.5, score: 8, tool: "axe" }, { top: T.CHEST_TOP, side: T.CHEST_FRONT, bottom: T.CHEST_SIDE }),
  [B.TERRACOTTA]: def({ id: B.TERRACOTTA, name: "Terracotta", color: 0x9a5a3c, hardness: 0.7, score: 6, tool: "pickaxe" }, { top: T.TERRACOTTA }),
  [B.NETHERRACK]: def({ id: B.NETHERRACK, name: "Netherrack", color: 0x723636, hardness: 0.25, score: 4, tool: "pickaxe" }, { top: T.NETHERRACK }),
};export const ORE_IDS = [B.COAL, B.IRON, B.GOLD, B.REDSTONE, B.LAPIS, B.DIAMOND, B.EMERALD];

export const WARMTH_BLOCKS = [B.CAMPFIRE, B.LAVA];
export const COLD_BLOCKS = [B.ICE, B.SNOW, B.SNOW_GRASS];

export const isSolid = (id: number) => id !== 0 && (BLOCKS[id]?.solid ?? true);
export const isTransparent = (id: number) => id === 0 || (BLOCKS[id]?.transparent ?? false);
export const isLiquid = (id: number) => id !== 0 && (BLOCKS[id]?.liquid ?? false);
export const isReplaceable = (id: number) => id === 0 || (BLOCKS[id]?.replaceable ?? false);
export const isCross = (id: number) => (BLOCKS[id]?.cross ?? false);

/** coarse material family, used for audio */
export function materialOf(id: number): "grass" | "stone" | "wood" | "sand" | "glass" | "wool" | "metal" | "plant" | "liquid" | "snow" {
  const d = BLOCKS[id];
  if (!d) return "stone";
  if (d.liquid) return "liquid";
  if (d.cross) return "plant";
  switch (id) {
    case B.GRASS:
    case B.DIRT:
    case B.PODZOL:
    case B.LEAVES:
    case B.BIRCH_LEAVES:
    case B.SPRUCE_LEAVES:
    case B.JUNGLE_LEAVES:
    case B.ACACIA_LEAVES:
    case B.LILY_PAD:
    case B.SUGAR_CANE:
    case B.HAY:
    case B.MELON:
    case B.PUMPKIN:
      return "grass";
    case B.SAND:
    case B.SANDSTONE:
    case B.GRAVEL:
    case B.CLAY:
      return "sand";
    case B.LOG:
    case B.BIRCH_LOG:
    case B.SPRUCE_LOG:
    case B.JUNGLE_LOG:
    case B.ACACIA_LOG:
    case B.PLANKS:
    case B.CHEST:
    case B.BOOKSHELF:
    case B.CRAFTING:
      return "wood";
    case B.GLASS:
    case B.ICE:
      return "glass";
    case B.WOOL_WHITE:
    case B.WOOL_RED:
    case B.WOOL_BLUE:
    case B.WOOL_YELLOW:
    case B.WOOL_GREEN:
    case B.WOOL_BLACK:
    case B.WOOL_ORANGE:
    case B.WOOL_PINK:
    case B.WOOL_CYAN:
    case B.WOOL_PURPLE:
      return "wool";
    case B.IRON_BLOCK:
    case B.GOLD_BLOCK:
    case B.DIAMOND_BLOCK:
      return "metal";
    case B.SNOW:
    case B.SNOW_GRASS:
      return "snow";
    default:
      return "stone";
  }
}

/* ------------------------------------------------------------------ *
 *  Procedural pixel texture atlas
 * ------------------------------------------------------------------ */
const COLS = 12;
const ROWS = 12;
const TS = 16;
const ATLAS_SIZE = COLS * TS;

type Rng = () => number;
const makeRng = (seed: number): Rng => {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
type Painter = (ctx: CanvasRenderingContext2D, ox: number, oy: number, rnd: Rng) => void;

const px = (ctx: CanvasRenderingContext2D, ox: number, oy: number, x: number, y: number, color: string) => {
  if (x < 0 || y < 0 || x > 15 || y > 15) return;
  ctx.fillStyle = color;
  ctx.fillRect(ox + x, oy + y, 1, 1);
};

const fill = (ctx: CanvasRenderingContext2D, ox: number, oy: number, rnd: Rng, palette: string[]) => {
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px(ctx, ox, oy, x, y, palette[Math.floor(rnd() * palette.length)]);
};

const speckle = (ctx: CanvasRenderingContext2D, ox: number, oy: number, rnd: Rng, count: number, colors: string[]) => {
  for (let i = 0; i < count; i++) px(ctx, ox, oy, Math.floor(rnd() * 16), Math.floor(rnd() * 16), colors[Math.floor(rnd() * colors.length)]);
};

const plainTex = (palette: string[], specks = 14, speckColors: string[] = []): Painter => (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, palette);
  if (speckColors.length) speckle(ctx, ox, oy, rnd, specks, speckColors);
};

const grassTop: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#5f9e41", "#6bab48", "#77b951", "#548f39", "#6fb54a"]);
  speckle(ctx, ox, oy, rnd, 20, ["#8ccb5f", "#4b8433"]);
  speckle(ctx, ox, oy, rnd, 2, ["#f6ed9b", "#f2f4dd"]);
};

const dirtPainter: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#86593a", "#976845", "#7a4f33", "#8e603f"]);
  speckle(ctx, ox, oy, rnd, 16, ["#6e472e", "#a97851"]);
};

const overlaySide = (base: Painter, top: string[], line: string, depthBase = 3): Painter => (ctx, ox, oy, rnd) => {
  base(ctx, ox, oy, rnd);
  for (let x = 0; x < 16; x++) {
    const depth = depthBase + (rnd() > 0.68 ? 2 : 0) + (rnd() > 0.9 ? 1 : 0);
    for (let y = 0; y < depth; y++) px(ctx, ox, oy, x, y, top[Math.floor(rnd() * top.length)]);
    px(ctx, ox, oy, x, depth, line);
  }
};

const stonePainter: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#7f878c", "#8b9499", "#767e83", "#90999e", "#828a8f"]);
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(rnd() * 16);
    let y = Math.floor(rnd() * 16);
    const len = 2 + Math.floor(rnd() * 3);
    for (let j = 0; j < len; j++) {
      px(ctx, ox, oy, (x + j) % 16, y, "#697176");
      if (rnd() > 0.6) y = (y + 1) % 16;
    }
  }
  speckle(ctx, ox, oy, rnd, 5, ["#a0a8ac"]);
};

const orePainter = (colors: [string, string, string], small = false): Painter => (ctx, ox, oy, rnd) => {
  stonePainter(ctx, ox, oy, rnd);
  const clusters = small ? 3 : 4 + Math.floor(rnd() * 2);
  for (let c = 0; c < clusters; c++) {
    const x = 1 + Math.floor(rnd() * 12);
    const y = 1 + Math.floor(rnd() * 12);
    const w = 2 + Math.floor(rnd() * 2);
    const h = 2 + Math.floor(rnd() * 2);
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) px(ctx, ox, oy, x + dx, y + dy, dx === 0 && dy === 0 ? colors[2] : colors[1]);
    px(ctx, ox, oy, x, y + h, colors[0]);
  }
  speckle(ctx, ox, oy, rnd, 3, [colors[0]]);
};

const cobblePainter: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#6f767a", "#7d8489", "#888f94"]);
  const stones: [number, number, number, number][] = [
    [1, 1, 5, 4], [7, 1, 6, 5], [2, 7, 4, 5], [8, 8, 6, 5], [1, 13, 6, 2], [11, 14, 4, 1],
  ];
  stones.forEach(([x, y, w, h], idx) => {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (rnd() > 0.12) px(ctx, ox, oy, x + dx, y + dy, idx % 2 ? "#93999c" : "#8b9296");
    for (let dx = 0; dx < w; dx++) px(ctx, ox, oy, x + dx, y + h - 1, "#5d6468");
  });
};

const mossyPainter: Painter = (ctx, ox, oy, rnd) => {
  cobblePainter(ctx, ox, oy, rnd);
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rnd() * 16);
    const y = Math.floor(rnd() * 16);
    if (rnd() > 0.45) px(ctx, ox, oy, x, y, rnd() > 0.5 ? "#5b7a42" : "#6d8c4c");
  }
};

const brickPainter = (mortar: string, brick: string[], shade: string): Painter => (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, [mortar]);
  for (let row = 0; row < 4; row++) {
    const y = row * 4;
    const offset = row % 2 ? 0 : 4;
    for (let b = 0; b < 2; b++) {
      const x = (offset + b * 8) % 16;
      for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 7; dx++) px(ctx, ox, oy, (x + dx) % 16, y + dy, brick[Math.floor(rnd() * brick.length)]);
      for (let dx = 0; dx < 7; dx++) px(ctx, ox, oy, (x + dx) % 16, y + 2, shade);
    }
  }
};

const stoneBrickPainter: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#8d938f", "#979d99", "#848a86"]);
  for (let y = 7; y < 16; y += 8) for (let x = 0; x < 16; x++) px(ctx, ox, oy, x, y, "#6c726e");
  for (let x = 7; x < 16; x += 8) for (let y = 0; y < 7; y++) px(ctx, ox, oy, x, y, "#6c726e");
  for (let x = 3; x < 16; x += 8) for (let y = 8; y < 16; y++) px(ctx, ox, oy, x, y, "#6c726e");
  speckle(ctx, ox, oy, rnd, 18, ["#a3a9a5", "#7b817d"]);
};

const planksPainter = (palette: string[], line: string, light: string): Painter => (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, palette);
  for (let y = 3; y < 16; y += 4) for (let x = 0; x < 16; x++) px(ctx, ox, oy, x, y, line);
  for (let board = 0; board < 4; board++) {
    const jx = (board * 6 + 3) % 16;
    for (let y = board * 4; y < Math.min(board * 4 + 3, 16); y++) px(ctx, ox, oy, jx, y, line);
    speckle(ctx, ox, oy, rnd, 3, [light]);
  }
};

const leavesPainter = (palette: string[], dark: string, light: string): Painter => (ctx, ox, oy, rnd) => {
  /* clustered blobs with real holes so trees don't look like solid cubes */
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const edge = x === 0 || y === 0 || x === 15 || y === 15;
      const hole = rnd() < (edge ? 0.55 : 0.22);
      if (hole) continue;
      const blob = Math.sin(x * 1.7 + y * 2.1) + rnd();
      px(ctx, ox, oy, x, y, blob > 1.1 ? light : blob < 0.35 ? dark : palette[Math.floor(rnd() * palette.length)]);
    }
  }
};

const logSidePainter = (palette: string[], bark: string, light: string): Painter => (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, palette);
  for (let x = 0; x < 16; x++) {
    const stripe = x % 4 === 0 || (x % 4 === 1 && rnd() > 0.35);
    for (let y = 0; y < 16; y++) {
      if (stripe) px(ctx, ox, oy, x, y, bark);
      else if (rnd() > 0.86) px(ctx, ox, oy, x, y, light);
      else if (rnd() > 0.93) px(ctx, ox, oy, x, y, bark);
    }
  }
  /* knots */
  for (let i = 0; i < 2; i++) {
    const kx = 2 + Math.floor(rnd() * 12);
    const ky = 2 + Math.floor(rnd() * 12);
    px(ctx, ox, oy, kx, ky, bark);
    px(ctx, ox, oy, kx + 1, ky, light);
    px(ctx, ox, oy, kx, ky + 1, bark);
  }
};

const logTopPainter = (palette: string[], ring: string, core: string): Painter => (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, palette);
  for (let r = 0; r < 4; r++) {
    const inset = 1 + r * 2;
    for (let i = inset; i < 16 - inset; i++) {
      px(ctx, ox, oy, i, inset, ring);
      px(ctx, ox, oy, i, 15 - inset, ring);
      px(ctx, ox, oy, inset, i, ring);
      px(ctx, ox, oy, 15 - inset, i, ring);
    }
  }
  px(ctx, ox, oy, 8, 8, core);
};

const birchSide: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#d9d4bd", "#e3dec8", "#cdc7b0"]);
  for (let i = 0; i < 7; i++) {
    const y = Math.floor(rnd() * 16);
    const x = Math.floor(rnd() * 13);
    const w = 2 + Math.floor(rnd() * 3);
    for (let dx = 0; dx < w; dx++) px(ctx, ox, oy, x + dx, y, "#3f3a32");
  }
  speckle(ctx, ox, oy, rnd, 10, ["#b5af98"]);
};

const waterPainter: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#3a6fd8", "#3f76e4", "#3668cd", "#4982ef"]);
  for (let i = 0; i < 10; i++) {
    const y = Math.floor(rnd() * 16);
    const x = Math.floor(rnd() * 12);
    for (let dx = 0; dx < 3 + Math.floor(rnd() * 3); dx++) px(ctx, ox, oy, x + dx, y, "#5c93f5");
  }
  speckle(ctx, ox, oy, rnd, 8, ["#8fc0ff"]);
};

const lavaPainter: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#e2560f", "#f06a16", "#cf4709", "#ff8a24"]);
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(rnd() * 15);
    const y = Math.floor(rnd() * 15);
    px(ctx, ox, oy, x, y, "#ffd05a");
    px(ctx, ox, oy, x + 1, y, "#ffae36");
  }
  speckle(ctx, ox, oy, rnd, 10, ["#8c2b05"]);
};

const glassPainter: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#d8eef5", "#cfe9f2", "#e2f4fa"]);
  for (let i = 0; i < 16; i++) {
    px(ctx, ox, oy, i, 0, "#a9cfdb");
    px(ctx, ox, oy, i, 15, "#a9cfdb");
    px(ctx, ox, oy, 0, i, "#a9cfdb");
    px(ctx, ox, oy, 15, i, "#a9cfdb");
  }
  for (let i = 2; i < 7; i++) px(ctx, ox, oy, i, 14 - i, "#ffffff");
  speckle(ctx, ox, oy, rnd, 4, ["#ffffff"]);
};

const icePainter: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#8fc5f4", "#9ccdf7", "#82bbee", "#a8d8fb"]);
  for (let i = 0; i < 6; i++) {
    let x = Math.floor(rnd() * 16);
    let y = Math.floor(rnd() * 16);
    for (let j = 0; j < 5; j++) {
      px(ctx, ox, oy, x, y, "#c7e7ff");
      x = (x + (rnd() > 0.5 ? 1 : 0)) % 16;
      y = (y + 1) % 16;
    }
  }
};

const glowstonePainter: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#e5b550", "#c99a3d", "#f2c961", "#b98a35"]);
  for (let i = 0; i < 16; i++) {
    const x = 1 + Math.floor(rnd() * 13);
    const y = 1 + Math.floor(rnd() * 13);
    px(ctx, ox, oy, x, y, "#fff2b0");
    px(ctx, ox, oy, x + 1, y, "#e8c761");
    px(ctx, ox, oy, x, y + 1, "#e8c761");
  }
};

const tntTop: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#b53a2f", "#c84335", "#a7342a"]);
  for (let i = 0; i < 16; i++) {
    px(ctx, ox, oy, i, 0, "#7c2019");
    px(ctx, ox, oy, i, 15, "#7c2019");
    px(ctx, ox, oy, 0, i, "#7c2019");
    px(ctx, ox, oy, 15, i, "#7c2019");
  }
  for (let x = 5; x < 11; x++) for (let y = 5; y < 11; y++) px(ctx, ox, oy, x, y, "#5b3a2a");
  for (let x = 6; x < 10; x++) for (let y = 6; y < 10; y++) px(ctx, ox, oy, x, y, "#d1c7ad");
  px(ctx, ox, oy, 8, 4, "#e8dfc8");
  px(ctx, ox, oy, 8, 3, "#e8dfc8");
  px(ctx, ox, oy, 9, 2, "#f0b64b");
};

const tntSide: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#b53a2f", "#c84335", "#a7342a", "#bb3d31"]);
  for (let y = 6; y < 11; y++) for (let x = 0; x < 16; x++) px(ctx, ox, oy, x, y, "#e8e0cd");
  for (let x = 0; x < 16; x++) {
    px(ctx, ox, oy, x, 6, "#f7f1e2");
    px(ctx, ox, oy, x, 10, "#c6bca6");
    px(ctx, ox, oy, x, 0, "#8c291f");
  }
  const letters: Record<string, string[]> = { T: ["###", ".#.", ".#.", ".#.", ".#."], N: ["#.#", "##.", "#.#", "#.#", "#.#"] };
  const draw = (letter: string, sx: number) =>
    letters[letter].forEach((row, y) =>
      row.split("").forEach((cell, x) => {
        if (cell === "#") px(ctx, ox, oy, sx + x, 7 + y, "#2f3437");
      })
    );
  draw("T", 2);
  draw("N", 6);
  draw("T", 10);
  speckle(ctx, ox, oy, rnd, 8, ["#7c2019"]);
};

const cactusTop: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#4e8f3c", "#589b45", "#447f35"]);
  for (let i = 1; i < 15; i++) {
    px(ctx, ox, oy, i, 1, "#2f5e26");
    px(ctx, ox, oy, i, 14, "#2f5e26");
    px(ctx, ox, oy, 1, i, "#2f5e26");
    px(ctx, ox, oy, 14, i, "#2f5e26");
  }
  speckle(ctx, ox, oy, rnd, 8, ["#6bb253"]);
};

const cactusSide: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#3f7d31", "#48883a", "#376f2b"]);
  for (let y = 0; y < 16; y++) {
    px(ctx, ox, oy, 0, y, "#2b5721");
    px(ctx, ox, oy, 15, y, "#2b5721");
    px(ctx, ox, oy, 3, y, "#5aa047");
    px(ctx, ox, oy, 12, y, "#2f5e26");
  }
  for (let i = 0; i < 10; i++) px(ctx, ox, oy, 4 + Math.floor(rnd() * 8), Math.floor(rnd() * 16), "#d6e7b5");
};

const pumpkinSide: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#dd8324", "#e8912f", "#c9731d"]);
  for (let x = 2; x < 16; x += 4) for (let y = 0; y < 16; y++) px(ctx, ox, oy, x, y, "#b4651a");
  ["..####..", ".##..##.", "########", "..#..#.."].forEach((row, y) =>
    row.split("").forEach((cell, x) => {
      if (cell === "#") px(ctx, ox, oy, 4 + x, 6 + y, "#3c2410");
    })
  );
  speckle(ctx, ox, oy, rnd, 6, ["#f0a749"]);
};

const pumpkinTop: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#d88025", "#c9731d", "#e08528"]);
  for (let x = 2; x < 16; x += 3) for (let y = 0; y < 16; y++) if (rnd() > 0.2) px(ctx, ox, oy, x, y, "#b4651a");
  for (let x = 6; x < 10; x++) for (let y = 6; y < 10; y++) px(ctx, ox, oy, x, y, "#7a6327");
};

const sandstoneTop: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#dcc591", "#e5d09d", "#d2ba86"]);
  speckle(ctx, ox, oy, rnd, 14, ["#c7ad79", "#efe0b4"]);
};

const sandstoneSide: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#dcc591", "#e5d09d", "#d2ba86"]);
  for (let x = 0; x < 16; x++) {
    px(ctx, ox, oy, x, 2, "#c4a870");
    px(ctx, ox, oy, x, 12, "#c4a870");
    px(ctx, ox, oy, x, 15, "#b99e67");
  }
  for (let y = 3; y < 12; y++) if (rnd() > 0.72) px(ctx, ox, oy, Math.floor(rnd() * 16), y, "#eee0b7");
};

const snowSide: Painter = (ctx, ox, oy, rnd) => {
  dirtPainter(ctx, ox, oy, rnd);
  for (let x = 0; x < 16; x++) {
    const depth = 4 + (rnd() > 0.7 ? 1 : 0);
    for (let y = 0; y < depth; y++) px(ctx, ox, oy, x, y, rnd() > 0.5 ? "#f7fdff" : "#e8f4fa");
    px(ctx, ox, oy, x, depth, "#d3e4ee");
  }
};

const bookshelf: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#b8894f", "#c4955a", "#ac7e46"]);
  for (let y = 0; y < 16; y++) {
    if (y < 2 || (y > 6 && y < 9) || y > 13) continue;
    for (let x = 0; x < 16; x++) px(ctx, ox, oy, x, y, "#4a3521");
  }
  const colors = ["#8c3a3a", "#3a6b8c", "#6b8c3a", "#8c7a3a", "#6b3a8c"];
  [2, 9].forEach((startY) => {
    let x = 0;
    while (x < 16) {
      const w = 1 + Math.floor(rnd() * 2);
      const color = colors[Math.floor(rnd() * colors.length)];
      for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < w; dx++) px(ctx, ox, oy, x + dx, startY + dy, color);
      x += w + 1;
    }
  });
};

const craftTop: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#a9793f", "#b4854a", "#9c6f39"]);
  for (let i = 0; i < 16; i++) {
    px(ctx, ox, oy, i, 5, "#6d4824");
    px(ctx, ox, oy, i, 10, "#6d4824");
    px(ctx, ox, oy, 5, i, "#6d4824");
    px(ctx, ox, oy, 10, i, "#6d4824");
  }
  speckle(ctx, ox, oy, rnd, 10, ["#c79a5f"]);
};

const craftSide: Painter = (ctx, ox, oy, rnd) => {
  planksPainter(["#b8894f", "#c4955a", "#ac7e46"], "#7f5a31", "#d7a76a")(ctx, ox, oy, rnd);
  for (let y = 2; y < 8; y++) for (let x = 2; x < 14; x++) if (rnd() > 0.35) px(ctx, ox, oy, x, y, "#8a5f30");
  for (let x = 3; x < 7; x++) px(ctx, ox, oy, x, 4, "#d8c08c");
};

const furnaceFront: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#7c8083", "#878b8e", "#6f7376"]);
  for (let y = 5; y < 13; y++) for (let x = 3; x < 13; x++) px(ctx, ox, oy, x, y, "#3a3d40");
  for (let x = 4; x < 12; x++) {
    px(ctx, ox, oy, x, 11, "#d87b22");
    px(ctx, ox, oy, x, 12, "#f0a63c");
  }
  speckle(ctx, ox, oy, rnd, 10, ["#95999c"]);
};

const hayTop: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#c9a02a", "#d6ac32", "#b89224"]);
  for (let i = 0; i < 16; i++) {
    px(ctx, ox, oy, i, 0, "#8d6f19");
    px(ctx, ox, oy, 0, i, "#8d6f19");
  }
  speckle(ctx, ox, oy, rnd, 18, ["#e8c352", "#9b7a1c"]);
};

const haySide: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#d3a827", "#c49a21", "#dcb434"]);
  for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) px(ctx, ox, oy, x, y, "#8d6f19");
  speckle(ctx, ox, oy, rnd, 20, ["#f0cf62"]);
};

const melonTex: Painter = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#6f9c2b", "#7cab33", "#5f8a24"]);
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(rnd() * 16);
    for (let y = 0; y < 16; y++) if (rnd() > 0.55) px(ctx, ox, oy, x, y, "#3f6b1b");
  }
  speckle(ctx, ox, oy, rnd, 14, ["#9ac450"]);
};

const spruceLeaves = leavesPainter(["#2f5a35", "#27492c", "#366541", "#1f3d26"], "#18311d", "#447a4c");

/* ---- cross / plant textures (transparent background) ---- */
const tallGrass: Painter = (ctx, ox, oy, rnd) => {
  for (let x = 2; x < 14; x += 2) {
    const h = 6 + Math.floor(rnd() * 7);
    for (let y = 15; y > 15 - h; y--) px(ctx, ox, oy, x + (y % 3 === 0 ? 1 : 0), y, rnd() > 0.5 ? "#5f9e41" : "#71b64c");
  }
};

const flower = (petal: string, petal2: string, center: string): Painter => (ctx, ox, oy, rnd) => {
  for (let y = 8; y < 16; y++) px(ctx, ox, oy, 8, y, rnd() > 0.7 ? "#4c8232" : "#5f9e41");
  px(ctx, ox, oy, 7, 12, "#5f9e41");
  px(ctx, ox, oy, 9, 10, "#5f9e41");
  const petals: [number, number][] = [
    [7, 4], [8, 3], [9, 4], [6, 5], [10, 5], [7, 6], [8, 6], [9, 6], [8, 7],
  ];
  petals.forEach(([x, y], i) => px(ctx, ox, oy, x, y, i % 2 ? petal : petal2));
  px(ctx, ox, oy, 8, 5, center);
};

const mushroom = (cap: string, capDark: string, stem: string, spots?: string): Painter => (ctx, ox, oy) => {
  for (let y = 10; y < 15; y++) for (let x = 7; x < 10; x++) px(ctx, ox, oy, x, y, stem);
  for (let y = 6; y < 10; y++) {
    const inset = y === 6 ? 5 : y === 7 ? 4 : 3;
    for (let x = inset; x < 16 - inset; x++) px(ctx, ox, oy, x, y, y === 9 ? capDark : cap);
  }
  if (spots) {
    px(ctx, ox, oy, 6, 7, spots);
    px(ctx, ox, oy, 10, 8, spots);
    px(ctx, ox, oy, 8, 6, spots);
  }
};

const deadBush: Painter = (ctx, ox, oy) => {
  const strokes: [number, number][] = [
    [8, 15], [8, 14], [8, 13], [8, 12], [7, 11], [9, 11], [6, 10], [10, 10], [5, 9], [11, 9], [7, 9], [9, 8], [8, 10],
  ];
  strokes.forEach(([x, y], i) => px(ctx, ox, oy, x, y, i % 3 ? "#946428" : "#7c531f"));
};

const sapling: Painter = (ctx, ox, oy) => {
  for (let y = 10; y < 16; y++) px(ctx, ox, oy, 8, y, "#6b4a27");
  const leaves: [number, number][] = [
    [6, 8], [7, 7], [8, 6], [9, 7], [10, 8], [7, 9], [8, 8], [9, 9], [8, 10], [6, 9], [10, 9],
  ];
  leaves.forEach(([x, y], i) => px(ctx, ox, oy, x, y, i % 2 ? "#4f8a33" : "#5fa33d"));
};

const torchTex: Painter = (ctx, ox, oy) => {
  for (let y = 7; y < 16; y++) {
    px(ctx, ox, oy, 7, y, "#7a5326");
    px(ctx, ox, oy, 8, y, "#946a34");
  }
  px(ctx, ox, oy, 7, 6, "#ffd271");
  px(ctx, ox, oy, 8, 6, "#ffe9a8");
  px(ctx, ox, oy, 7, 5, "#ffb13c");
  px(ctx, ox, oy, 8, 5, "#ffd271");
  px(ctx, ox, oy, 8, 4, "#fff3cc");
};

/* ------------------------------------------------------------------ */
const PAINTERS: Painter[] = [];
PAINTERS[T.GRASS_TOP] = grassTop;
PAINTERS[T.GRASS_SIDE] = overlaySide(dirtPainter, ["#67a646", "#71b34c", "#5c983d"], "#4e8637");
PAINTERS[T.DIRT] = dirtPainter;
PAINTERS[T.STONE] = stonePainter;
PAINTERS[T.COBBLE] = cobblePainter;
PAINTERS[T.SAND] = plainTex(["#dfcb95", "#e8d6a3", "#d4bf88", "#ecdcac"], 16, ["#c6b07a", "#f4e7bd"]);
PAINTERS[T.SANDSTONE_TOP] = sandstoneTop;
PAINTERS[T.SANDSTONE_SIDE] = sandstoneSide;
PAINTERS[T.GRAVEL] = plainTex(["#8d8984", "#9a958f", "#7e7a75", "#a7a29b"], 30, ["#6d6a65", "#b5b0a8"]);
PAINTERS[T.LOG_SIDE] = logSidePainter(["#795231", "#855b36", "#6c482b", "#8d613a"], "#654327", "#a97a49");
PAINTERS[T.LOG_TOP] = logTopPainter(["#b68a55", "#c1955f", "#a87c4b"], "#8b6238", "#6f4a28");
PAINTERS[T.LEAVES] = leavesPainter(["#356b30", "#3f7c37", "#2c5c2a", "#4a8a3e"], "#224a21", "#579b45");
PAINTERS[T.PLANKS] = planksPainter(["#b8894f", "#c4955a", "#ac7e46", "#bd8d53"], "#7f5a31", "#d7a76a");
PAINTERS[T.BEDROCK] = plainTex(["#3f4245", "#4a4d50", "#35383b", "#575b5e"], 26, ["#26292c", "#666a6d"]);
PAINTERS[T.WATER] = waterPainter;
PAINTERS[T.COAL] = orePainter(["#2c2f33", "#43484d", "#6a7075"], true);
PAINTERS[T.IRON] = orePainter(["#8a6a52", "#c99372", "#efc2a1"], true);
PAINTERS[T.GOLD] = orePainter(["#9c6b17", "#e0ab2a", "#ffe587"], true);
PAINTERS[T.DIAMOND] = orePainter(["#24768a", "#49c9d6", "#c5fbff"], true);
PAINTERS[T.EMERALD] = orePainter(["#1c7d4a", "#35b96f", "#b7ffd4"], true);
PAINTERS[T.REDSTONE] = orePainter(["#7c1f17", "#c3372a", "#ff7a63"], true);
PAINTERS[T.LAPIS] = orePainter(["#1b347c", "#2c57b8", "#6f9bff"], true);
PAINTERS[T.SNOW] = plainTex(["#f3fbff", "#eaf5fb", "#ffffff"], 10, ["#dcebf3"]);
PAINTERS[T.SNOW_SIDE] = snowSide;
PAINTERS[T.ICE] = icePainter;
PAINTERS[T.GLASS] = glassPainter;
PAINTERS[T.BRICKS] = brickPainter("#b7a697", ["#a2584a", "#ab6151", "#994f43"], "#7f3f36");
PAINTERS[T.GLOWSTONE] = glowstonePainter;
PAINTERS[T.TNT_TOP] = tntTop;
PAINTERS[T.TNT_SIDE] = tntSide;
PAINTERS[T.TNT_BOTTOM] = plainTex(["#9c3328", "#8e2d23", "#a6382c"], 12, ["#7c2019"]);
PAINTERS[T.CACTUS_TOP] = cactusTop;
PAINTERS[T.CACTUS_SIDE] = cactusSide;
PAINTERS[T.OBSIDIAN] = plainTex(["#1c1726", "#241e31", "#15111d"], 22, ["#3b2f54", "#0e0b15"]);
PAINTERS[T.BIRCH_SIDE] = birchSide;
PAINTERS[T.BIRCH_TOP] = logTopPainter(["#d8cfb0", "#e2d9bb", "#cbc2a4"], "#b1a68a", "#9c9076");
PAINTERS[T.BIRCH_LEAVES] = leavesPainter(["#5f9444", "#6aa14c", "#538739", "#74ad56"], "#3f6c2f", "#8cc269");
PAINTERS[T.MOSSY] = mossyPainter;
PAINTERS[T.STONE_BRICKS] = stoneBrickPainter;
PAINTERS[T.PUMPKIN_TOP] = pumpkinTop;
PAINTERS[T.PUMPKIN_SIDE] = pumpkinSide;
PAINTERS[T.WOOL_RED] = plainTex(["#b02e26", "#bd352c", "#a32a22"], 30, ["#cc4238", "#8f241d"]);
PAINTERS[T.WOOL_BLUE] = plainTex(["#3c44aa", "#444dbb", "#363d99"], 30, ["#5059cd", "#2b3180"]);
PAINTERS[T.WOOL_YELLOW] = plainTex(["#f9c62c", "#ffd34a", "#e9b522"], 30, ["#fff0a0", "#cf9c15"]);
PAINTERS[T.WOOL_WHITE] = plainTex(["#eceff0", "#e3e6e7", "#f6f9fa"], 26, ["#d2d6d7"]);
PAINTERS[T.WOOL_GREEN] = plainTex(["#5e7c16", "#688a19", "#536e13"], 30, ["#7ba127", "#415610"]);
PAINTERS[T.WOOL_BLACK] = plainTex(["#1d1c21", "#242328", "#161519"], 26, ["#2e2d34"]);
PAINTERS[T.LAVA] = lavaPainter;
PAINTERS[T.CLAY] = plainTex(["#a4aab9", "#b0b6c4", "#989eae"], 18, ["#c0c6d2", "#8a90a0"]);
PAINTERS[T.GRANITE] = plainTex(["#a07461", "#ab7e6a", "#976b58", "#b58b76"], 28, ["#8a5f4d", "#c29a86"]);
PAINTERS[T.DIORITE] = plainTex(["#cfcfcf", "#d9d9d9", "#c2c2c2", "#e2e2e2"], 28, ["#b0b0b0", "#f0f0f0"]);
PAINTERS[T.ANDESITE] = plainTex(["#888a88", "#929492", "#7e807e", "#9b9d9b"], 28, ["#717371", "#a6a8a6"]);
PAINTERS[T.IRON_BLOCK] = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#dcdcdc", "#e6e6e6", "#d2d2d2"]);
  for (let i = 0; i < 16; i++) {
    px(ctx, ox, oy, i, 0, "#f4f4f4");
    px(ctx, ox, oy, i, 15, "#b4b4b4");
    px(ctx, ox, oy, 0, i, "#f0f0f0");
    px(ctx, ox, oy, 15, i, "#b4b4b4");
  }
  speckle(ctx, ox, oy, rnd, 8, ["#c6c6c6"]);
};
PAINTERS[T.GOLD_BLOCK] = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#f7d33c", "#ffe05c", "#e5c02c"]);
  for (let i = 0; i < 16; i++) {
    px(ctx, ox, oy, i, 0, "#fff0a0");
    px(ctx, ox, oy, i, 15, "#c79e18");
    px(ctx, ox, oy, 15, i, "#c79e18");
  }
  speckle(ctx, ox, oy, rnd, 8, ["#ffeb8c"]);
};
PAINTERS[T.DIAMOND_BLOCK] = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#5de3e3", "#6ff0f0", "#4acfcf"]);
  [[4, 4], [10, 5], [6, 10], [11, 11]].forEach(([x, y]) => {
    px(ctx, ox, oy, x, y, "#ffffff");
    px(ctx, ox, oy, x + 1, y, "#c7fbfb");
    px(ctx, ox, oy, x, y + 1, "#c7fbfb");
  });
  speckle(ctx, ox, oy, rnd, 8, ["#2f9fa3"]);
};
PAINTERS[T.BOOKSHELF] = bookshelf;
PAINTERS[T.CRAFT_TOP] = craftTop;
PAINTERS[T.CRAFT_SIDE] = craftSide;
PAINTERS[T.FURNACE_FRONT] = furnaceFront;
PAINTERS[T.FURNACE_SIDE] = plainTex(["#7c8083", "#878b8e", "#6f7376"], 20, ["#95999c", "#616568"]);
PAINTERS[T.HAY_TOP] = hayTop;
PAINTERS[T.HAY_SIDE] = haySide;
PAINTERS[T.MELON] = melonTex;
PAINTERS[T.SPRUCE_SIDE] = logSidePainter(["#4a3524", "#533d2a", "#3f2d1e", "#5c4530"], "#332418", "#6b5139");
PAINTERS[T.SPRUCE_TOP] = logTopPainter(["#8a6a48", "#947350", "#7e6040"], "#63492f", "#4f3a25");
PAINTERS[T.SPRUCE_LEAVES] = spruceLeaves;
PAINTERS[T.PODZOL_TOP] = plainTex(["#6b4a27", "#7a5530", "#5e4122"], 24, ["#8c6639", "#4c3419"]);
PAINTERS[T.PODZOL_SIDE] = overlaySide(dirtPainter, ["#6b4a27", "#7a5530", "#5e4122"], "#4c3419", 2);
PAINTERS[T.TALL_GRASS] = tallGrass;
PAINTERS[T.POPPY] = flower("#d13b32", "#e8574c", "#2f2a1a");
PAINTERS[T.DANDELION] = flower("#f2d33c", "#ffe96b", "#b78a16");
PAINTERS[T.CORNFLOWER] = flower("#4a63d8", "#6c84f0", "#2a3480");
PAINTERS[T.MUSH_RED] = mushroom("#d04a42", "#a8362f", "#e2d9c6", "#f3e7d2");
PAINTERS[T.MUSH_BROWN] = mushroom("#a1764f", "#80593a", "#d8ccb6");
PAINTERS[T.DEAD_BUSH] = deadBush;
PAINTERS[T.SAPLING] = sapling;
PAINTERS[T.TORCH] = torchTex;
PAINTERS[T.JUNGLE_SIDE] = logSidePainter(["#5a4329", "#4e3a24", "#634b2e"], "#3a2818", "#7a5a38");
PAINTERS[T.JUNGLE_TOP] = logTopPainter(["#9a7548", "#8a6840", "#a88352"], "#6a4a2a", "#4a3018");
PAINTERS[T.JUNGLE_LEAVES] = leavesPainter(["#2f7a28", "#3a8c30", "#246620"], "#1a4a16", "#4caa3a");
PAINTERS[T.ACACIA_SIDE] = logSidePainter(["#70685a", "#7a7264", "#655e52"], "#4a453c", "#8a8274");
PAINTERS[T.ACACIA_TOP] = logTopPainter(["#c68649", "#d49252", "#b87a40"], "#8a5a28", "#6a4018");
PAINTERS[T.ACACIA_LEAVES] = leavesPainter(["#97a51d", "#a8b428", "#88961a"], "#5a6410", "#c4d44a");
PAINTERS[T.SUGAR_CANE] = (ctx, ox, oy, rnd) => {
  for (let x = 4; x < 12; x++) {
    for (let y = 0; y < 16; y++) {
      const stripe = (x + Math.floor(y / 3)) % 3 === 0;
      px(ctx, ox, oy, x, y, stripe ? "#5a8834" : rnd() > 0.7 ? "#8cbc58" : "#73a14b");
    }
  }
};
PAINTERS[T.LILY] = (ctx, ox, oy, rnd) => {
  for (let y = 2; y < 14; y++) {
    for (let x = 2; x < 14; x++) {
      const dx = x - 7.5;
      const dy = y - 7.5;
      if (dx * dx + dy * dy > 36) continue;
      if (x >= 7 && y >= 7 && x - 7 < 3 && y - 7 < 2) continue; /* notch */
      px(ctx, ox, oy, x, y, rnd() > 0.7 ? "#3a9a32" : "#2f7a28");
    }
  }
};
PAINTERS[T.COBWEB] = (ctx, ox, oy) => {
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    const n = 16;
    for (let i = 0; i <= n; i++) px(ctx, ox, oy, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), "#e8e8e8");
  };
  line(0, 0, 15, 15);
  line(15, 0, 0, 15);
  line(8, 0, 8, 15);
  line(0, 8, 15, 8);
  line(0, 4, 15, 12);
  line(4, 0, 12, 15);
};
PAINTERS[T.CHEST_FRONT] = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#b8943a", "#c4a044", "#a88432"]);
  for (let i = 0; i < 16; i++) {
    px(ctx, ox, oy, i, 0, "#6a4a18");
    px(ctx, ox, oy, i, 15, "#6a4a18");
    px(ctx, ox, oy, 0, i, "#6a4a18");
    px(ctx, ox, oy, 15, i, "#6a4a18");
    px(ctx, ox, oy, i, 7, "#6a4a18");
  }
  for (let y = 6; y < 10; y++) for (let x = 6; x < 10; x++) px(ctx, ox, oy, x, y, "#d4c04a");
  px(ctx, ox, oy, 7, 7, "#3a3a3a");
  px(ctx, ox, oy, 8, 8, "#3a3a3a");
};
PAINTERS[T.CHEST_SIDE] = plainTex(["#b8943a", "#c4a044", "#a88432"], 10, ["#6a4a18"]);
PAINTERS[T.CHEST_TOP] = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#c4a044", "#b8943a"]);
  for (let i = 0; i < 16; i++) {
    px(ctx, ox, oy, i, 0, "#6a4a18");
    px(ctx, ox, oy, i, 15, "#6a4a18");
    px(ctx, ox, oy, 0, i, "#6a4a18");
    px(ctx, ox, oy, 15, i, "#6a4a18");
  }
};
PAINTERS[T.TERRACOTTA] = plainTex(["#9a5a3c", "#a46444", "#8e5236"], 18, ["#7a4430", "#b07050"]);
PAINTERS[T.NETHERRACK] = plainTex(["#723636", "#7e3e3e", "#662e2e", "#8a4646"], 28, ["#4a2020", "#a05050"]);
PAINTERS[T.WOOL_ORANGE] = plainTex(["#f07613", "#e86a10", "#f88420"], 30, ["#c8580c", "#ff9a40"]);
PAINTERS[T.WOOL_PINK] = plainTex(["#ed8dac", "#e080a0", "#f49ab8"], 30, ["#c86888", "#ffb0c8"]);
PAINTERS[T.WOOL_CYAN] = plainTex(["#169b9c", "#148c8d", "#1aacad"], 30, ["#0e7070", "#40c4c4"]);
PAINTERS[T.WOOL_PURPLE] = plainTex(["#7b2fbe", "#6e28aa", "#8838cc"], 30, ["#5a2088", "#9a50e0"]);
PAINTERS[T.CAMPFIRE_TOP] = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#3a2a1a", "#4a3424"]);
  for (let i = 0; i < 6; i++) {
    const x = 3 + Math.floor(rnd() * 10);
    const y = 3 + Math.floor(rnd() * 10);
    px(ctx, ox, oy, x, y, "#ffd740");
    px(ctx, ox, oy, x + 1, y, "#ffeb3b");
    px(ctx, ox, oy, x, y + 1, "#ff9800");
  }
  px(ctx, ox, oy, 7, 7, "#ff5722");
  px(ctx, ox, oy, 8, 6, "#ff5722");
};
PAINTERS[T.CAMPFIRE_SIDE] = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#4a3424", "#5a4030"]);
  for (let i = 0; i < 16; i++) {
    px(ctx, ox, oy, i, 0, "#3a2a1a");
    px(ctx, ox, oy, i, 15, "#3a2a1a");
    px(ctx, ox, oy, 0, i, "#3a2a1a");
    px(ctx, ox, oy, 15, i, "#3a2a1a");
  }
};
PAINTERS[T.PACKED_ICE_TILE] = plainTex(["#b3e5fc", "#81d4fa", "#4fc3f7"], 20, ["#03a9f4", "#e1f5fe"]);
PAINTERS[T.BLUE_ICE_TILE] = plainTex(["#4fc3f7", "#29b6f6", "#03a9f4"], 20, ["#0288d1", "#b3e5fc"]);

PAINTERS[T.CAMPFIRE_TOP] = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#3a2a1a", "#4a3424"]);
  for (let i = 0; i < 6; i++) {
    const x = 3 + Math.floor(rnd() * 10);
    const y = 3 + Math.floor(rnd() * 10);
    px(ctx, ox, oy, x, y, "#ffd740");
    px(ctx, ox, oy, x + 1, y, "#ffeb3b");
    px(ctx, ox, oy, x, y + 1, "#ff9800");
  }
  px(ctx, ox, oy, 7, 7, "#ff5722");
  px(ctx, ox, oy, 8, 6, "#ff5722");
};
PAINTERS[T.CAMPFIRE_SIDE] = (ctx, ox, oy, rnd) => {
  fill(ctx, ox, oy, rnd, ["#4a3424", "#5a4030"]);
  for (let i = 0; i < 16; i++) {
    px(ctx, ox, oy, i, 0, "#3a2a1a");
    px(ctx, ox, oy, i, 15, "#3a2a1a");
    px(ctx, ox, oy, 0, i, "#3a2a1a");
    px(ctx, ox, oy, 15, i, "#3a2a1a");
  }
};

const TRANSPARENT_TILES = new Set<number>([
  T.TALL_GRASS, T.POPPY, T.DANDELION, T.CORNFLOWER, T.MUSH_RED, T.MUSH_BROWN, T.DEAD_BUSH, T.SAPLING, T.TORCH,
  T.LEAVES, T.BIRCH_LEAVES, T.SPRUCE_LEAVES, T.JUNGLE_LEAVES, T.ACACIA_LEAVES, T.SUGAR_CANE, T.LILY, T.COBWEB, T.GLASS, T.PACKED_ICE_TILE, T.BLUE_ICE_TILE,
]);

type Atlas = { canvas: HTMLCanvasElement; url: string };
let cachedAtlas: Atlas | null = null;
const uvCache = new Map<number, [number, number, number, number]>();

function paintAtlas(): Atlas {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < COLS * ROWS; i++) {
    const painter = PAINTERS[i];
    const ox = (i % COLS) * TS;
    const oy = Math.floor(i / COLS) * TS;
    if (!TRANSPARENT_TILES.has(i)) {
      ctx.fillStyle = "#2b2b2b";
      ctx.fillRect(ox, oy, TS, TS);
    } else {
      ctx.clearRect(ox, oy, TS, TS);
    }
    if (painter) painter(ctx, ox, oy, makeRng(9173 + i * 733));
  }
  return { canvas, url: canvas.toDataURL("image/png") };
}

export function getAtlas(): Atlas {
  if (!cachedAtlas) cachedAtlas = paintAtlas();
  return cachedAtlas;
}

export function atlasUrl(): string {
  return getAtlas().url;
}

export function tileUV(tile: number): [number, number, number, number] {
  const cached = uvCache.get(tile);
  if (cached) return cached;
  const col = tile % COLS;
  const row = Math.floor(tile / COLS);
  const inset = 0.0012;
  const rect: [number, number, number, number] = [
    col / COLS + inset,
    1 - (row + 1) / ROWS + inset,
    (col + 1) / COLS - inset,
    1 - row / ROWS - inset,
  ];
  uvCache.set(tile, rect);
  return rect;
}

export function blockIconStyle(id: number, useSide = false): CSSProperties {
  const d = BLOCKS[id];
  const tile = d ? (useSide ? d.side : d.top) : 0;
  const col = tile % COLS;
  const row = Math.floor(tile / COLS);
  return {
    backgroundImage: `url(${atlasUrl()})`,
    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
    backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
    imageRendering: "pixelated",
  };
}
