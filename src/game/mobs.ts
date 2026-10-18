import * as THREE from "three";

/*
 * Minecraft-style mob models with authentic pixel textures:
 * - Cow: horns, nostrils muzzle, pink udders, spotted hide, ears
 * - Pig: 3D snout with nostrils, floppy ears, trotters
 * - Sheep: volumetric wool coat (detachable on shearing!)
 * - Chicken: red wattle, yellow beak, flapping wings, lays eggs
 * - Zombie: Steve shirt and pants, reaching arms, animated breathing
 * - Skeleton: bony skull, ribs, legs, holding a bow!
 * - Creeper: mottled camouflage green texture, 4 walking feet, swells up before exploding!
 */

export const MOB = {
  PIG: 0,
  SHEEP: 1,
  COW: 2,
  ZOMBIE: 3,
  CHICKEN: 4,
  SKELETON: 5,
  CREEPER: 6,
} as const;

export type MobModel = {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Object3D;
  legs: THREE.Object3D[];
  arms: THREE.Object3D[];
  wings: THREE.Object3D[];
  woolMesh?: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  height: number;
  width: number;
  setSheared?: (sheared: boolean) => void;
};

/* ---------------- Atlas Generation ---------------- */
const TILE = 8;
const COLS = 8;
const SIZE = TILE * COLS;

const enum Tile {
  PigSkin,
  PigFace,
  PigSnout,
  PigHoof,
  CowHide,
  CowFace,
  CowMuzzle,
  CowHorn,
  CowUdder,
  CowHoof,
  Wool,
  SheepFace,
  SheepSkin,
  Feather,
  ChickenFace,
  Beak,
  Wattle,
  ChickenLeg,
  ZombieSkin,
  ZombieFace,
  ZombieHair,
  Shirt,
  Pants,
  Shoe,
  WoolFace,
  Bone,
  SkeletonFace,
  CreeperBody,
  CreeperFace,
  CreeperFoot,
}

type Rng = () => number;
const rng = (seed: number): Rng => {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

let atlasTexture: THREE.CanvasTexture | null = null;

function paint(
  ctx: CanvasRenderingContext2D,
  tile: number,
  fn: (
    px: (x: number, y: number, c: string) => void,
    fill: (c: string[]) => void,
    r: Rng
  ) => void
) {
  const ox = (tile % COLS) * TILE;
  const oy = Math.floor(tile / COLS) * TILE;
  const r = rng(1000 + tile * 97);
  const px = (x: number, y: number, c: string) => {
    if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
    ctx.fillStyle = c;
    ctx.fillRect(ox + x, oy + y, 1, 1);
  };
  const fill = (palette: string[]) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(x, y, palette[Math.floor(r() * palette.length)]);
      }
    }
  };
  fn(px, fill, r);
}

function eyes(
  px: (x: number, y: number, c: string) => void,
  y: number,
  white = "#ffffff",
  pupil = "#1d1d1d",
  inset = 1
) {
  px(inset, y, white);
  px(inset + 1, y, pupil);
  px(7 - inset - 1, y, pupil);
  px(7 - inset, y, white);
}

function buildAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const pink = ["#efa2a6", "#f2abae", "#e8979c", "#f0a6aa"];
  paint(ctx, Tile.PigSkin, (px, fill, r) => {
    fill(pink);
    for (let i = 0; i < 5; i++) px(Math.floor(r() * 8), Math.floor(r() * 8), "#dc8a90");
  });
  paint(ctx, Tile.PigFace, (px, fill) => {
    fill(pink);
    eyes(px, 3);
  });
  paint(ctx, Tile.PigSnout, (px, fill) => {
    fill(["#f5b5b8", "#f3b0b4"]);
    px(2, 3, "#9b4a52");
    px(2, 4, "#9b4a52");
    px(5, 3, "#9b4a52");
    px(5, 4, "#9b4a52");
  });
  paint(ctx, Tile.PigHoof, (_px, fill) => fill(["#c47a7f", "#b9727a"]));

  // Cow
  paint(ctx, Tile.CowHide, (px, fill, r) => {
    fill(["#4a3121", "#523726", "#432c1d"]);
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(r() * 6);
      const y = Math.floor(r() * 6);
      for (let dy = 0; dy < 2 + Math.floor(r() * 2); dy++) {
        for (let dx = 0; dx < 2 + Math.floor(r() * 2); dx++) {
          px(x + dx, y + dy, r() > 0.2 ? "#ece6dc" : "#d8d0c4");
        }
      }
    }
  });
  paint(ctx, Tile.CowFace, (px, fill) => {
    fill(["#4a3121", "#523726"]);
    for (let y = 0; y < 3; y++) {
      for (let x = 2; x < 6; x++) px(x, y, "#ece6dc");
    }
    eyes(px, 3, "#ffffff", "#141414", 0);
  });
  paint(ctx, Tile.CowMuzzle, (px, fill) => {
    fill(["#cfc2b0", "#c6b8a4"]);
    px(1, 3, "#2b2016");
    px(6, 3, "#2b2016");
  });
  paint(ctx, Tile.CowHorn, (_px, fill) => fill(["#e9e2cf", "#d9d0b8"]));
  paint(ctx, Tile.CowUdder, (_px, fill) => fill(["#e9a7ae", "#e39aa2"]));
  paint(ctx, Tile.CowHoof, (_px, fill) => fill(["#2c2018", "#261b14"]));

  // Sheep
  paint(ctx, Tile.Wool, (px, fill, r) => {
    fill(["#f4f1e8", "#ebe7dc", "#fbf9f2"]);
    for (let i = 0; i < 8; i++) px(Math.floor(r() * 8), Math.floor(r() * 8), "#d9d4c6");
  });
  paint(ctx, Tile.SheepFace, (px, fill) => {
    fill(["#e3cdb4", "#dcc4a9"]);
    eyes(px, 3, "#ffffff", "#2b2b2b");
    px(3, 5, "#c79c94");
    px(4, 5, "#c79c94");
  });
  paint(ctx, Tile.WoolFace, (px, fill) => {
    fill(["#f4f1e8", "#ebe7dc"]);
    for (let y = 2; y < 7; y++) {
      for (let x = 1; x < 7; x++) px(x, y, "#e3cdb4");
    }
    eyes(px, 3, "#ffffff", "#2b2b2b");
    px(3, 5, "#c79c94");
    px(4, 5, "#c79c94");
  });
  paint(ctx, Tile.SheepSkin, (_px, fill) => fill(["#e3cdb4", "#d8c0a5"]));

  // Chicken
  paint(ctx, Tile.Feather, (px, fill, r) => {
    fill(["#fbfbf8", "#f1f0ea", "#ffffff"]);
    for (let i = 0; i < 6; i++) px(Math.floor(r() * 8), Math.floor(r() * 8), "#dcdad2");
  });
  paint(ctx, Tile.ChickenFace, (px, fill) => {
    fill(["#fbfbf8", "#f1f0ea"]);
    px(1, 2, "#111111");
    px(6, 2, "#111111");
  });
  paint(ctx, Tile.Beak, (_px, fill) => fill(["#f2b233", "#e7a326"]));
  paint(ctx, Tile.Wattle, (_px, fill) => fill(["#d8302b", "#c72824"]));
  paint(ctx, Tile.ChickenLeg, (_px, fill) => fill(["#e8a12f", "#d99127"]));

  // Zombie
  paint(ctx, Tile.ZombieSkin, (px, fill, r) => {
    fill(["#5c9b63", "#548f5a", "#62a369"]);
    for (let i = 0; i < 5; i++) px(Math.floor(r() * 8), Math.floor(r() * 8), "#477a4c");
  });
  paint(ctx, Tile.ZombieFace, (px, fill) => {
    fill(["#5c9b63", "#548f5a"]);
    for (let x = 0; x < 8; x++) px(x, 0, "#2f5e34");
    px(1, 3, "#1f1f1f");
    px(2, 3, "#1f1f1f");
    px(5, 3, "#1f1f1f");
    px(6, 3, "#1f1f1f");
    px(3, 5, "#3d6b42");
    px(4, 5, "#3d6b42");
    for (let x = 2; x < 6; x++) px(x, 6, "#2f5233");
  });
  paint(ctx, Tile.ZombieHair, (px, fill, r) => {
    fill(["#2f5e34", "#2a5530"]);
    for (let i = 0; i < 6; i++) px(Math.floor(r() * 8), Math.floor(r() * 8), "#3c6d42");
  });
  paint(ctx, Tile.Shirt, (px, fill, r) => {
    fill(["#2aa8a8", "#279c9c", "#30b2b2"]);
    for (let i = 0; i < 5; i++) px(Math.floor(r() * 8), Math.floor(r() * 8), "#1f8585");
  });
  paint(ctx, Tile.Pants, (px, fill, r) => {
    fill(["#3a3fa0", "#353a92", "#4046ad"]);
    for (let i = 0; i < 4; i++) px(Math.floor(r() * 8), Math.floor(r() * 8), "#2b2f78");
  });
  paint(ctx, Tile.Shoe, (_px, fill) => fill(["#4a4a4a", "#3e3e3e"]));

  // Skeleton
  paint(ctx, Tile.Bone, (px, fill, r) => {
    fill(["#dcdcd4", "#cecec6", "#e8e8e0"]);
    for (let i = 0; i < 4; i++) px(Math.floor(r() * 8), Math.floor(r() * 8), "#b8b8b0");
  });
  paint(ctx, Tile.SkeletonFace, (px, fill) => {
    fill(["#dcdcd4", "#cecec6"]);
    px(1, 2, "#181818");
    px(2, 2, "#181818");
    px(5, 2, "#181818");
    px(6, 2, "#181818");
    px(3, 4, "#2a2a2a");
    px(4, 4, "#2a2a2a");
    for (let x = 1; x < 7; x++) px(x, 6, "#222222");
    px(2, 5, "#222222");
    px(5, 5, "#222222");
  });

  // Creeper
  paint(ctx, Tile.CreeperBody, (px, fill, r) => {
    fill(["#48a044", "#52b84e", "#3a8436", "#64c860"]);
    for (let i = 0; i < 8; i++) {
      px(Math.floor(r() * 8), Math.floor(r() * 8), r() > 0.5 ? "#2a6226" : "#7adc74");
    }
  });
  paint(ctx, Tile.CreeperFace, (px, fill) => {
    fill(["#48a044", "#52b84e", "#3a8436"]);
    // Iconic Creeper Face Pattern
    px(1, 1, "#181818"); px(2, 1, "#181818");
    px(1, 2, "#181818"); px(2, 2, "#181818");
    px(5, 1, "#181818"); px(6, 1, "#181818");
    px(5, 2, "#181818"); px(6, 2, "#181818");
    px(3, 3, "#181818"); px(4, 3, "#181818");
    px(2, 4, "#181818"); px(3, 4, "#181818"); px(4, 4, "#181818"); px(5, 4, "#181818");
    px(2, 5, "#181818"); px(2, 6, "#181818");
    px(5, 5, "#181818"); px(5, 6, "#181818");
    px(3, 5, "#181818"); px(4, 5, "#181818");
  });
  paint(ctx, Tile.CreeperFoot, (_px, fill) => fill(["#3a8436", "#2f6c2c"]));

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function atlas(): THREE.CanvasTexture {
  if (!atlasTexture) atlasTexture = buildAtlas();
  return atlasTexture;
}

type Faces = { all: Tile; front?: Tile; back?: Tile; top?: Tile; bottom?: Tile; side?: Tile };
const SHADE = [0.86, 0.78, 1.0, 0.6, 0.94, 0.72]; // +x -x +y -y +z -z

function tileRect(tile: Tile): [number, number, number, number] {
  const col = tile % COLS;
  const row = Math.floor(tile / COLS);
  const e = 0.002;
  return [col / COLS + e, 1 - (row + 1) / COLS + e, (col + 1) / COLS - e, 1 - row / COLS - e];
}

function box(w: number, h: number, d: number, faces: Faces, material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
  const order: Tile[] = [
    faces.side ?? faces.all,
    faces.side ?? faces.all,
    faces.top ?? faces.all,
    faces.bottom ?? faces.all,
    faces.front ?? faces.all,
    faces.back ?? faces.all,
  ];
  const colors: number[] = [];
  order.forEach((tile, f) => {
    const [u0, v0, u1, v1] = tileRect(tile);
    uv.setXY(f * 4, u0, v1);
    uv.setXY(f * 4 + 1, u1, v1);
    uv.setXY(f * 4 + 2, u0, v0);
    uv.setXY(f * 4 + 3, u1, v0);
    for (let i = 0; i < 4; i++) colors.push(SHADE[f], SHADE[f], SHADE[f]);
  });
  uv.needsUpdate = true;
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Mesh(geometry, material);
}

function limb(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  faces: Faces,
  material: THREE.Material
): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  const mesh = box(w, h, d, faces, material);
  mesh.position.y = -h / 2;
  pivot.add(mesh);
  return pivot;
}

/* =====================================================================
 *  Mob Model Builder
 * ===================================================================== */
export function createMobModel(kind: number): MobModel {
  const material = new THREE.MeshBasicMaterial({ map: atlas(), vertexColors: true });
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const legs: THREE.Object3D[] = [];
  const arms: THREE.Object3D[] = [];
  const wings: THREE.Object3D[] = [];
  let woolMesh: THREE.Mesh | undefined;
  let head: THREE.Object3D;
  let height = 1.0;
  let width = 0.9;
  let setSheared: ((s: boolean) => void) | undefined;

  if (kind === MOB.PIG) {
    const torso = box(0.62, 0.5, 1.0, { all: Tile.PigSkin }, material);
    torso.position.set(0, 0.62, 0);
    body.add(torso);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.72, 0.5);
    const skull = box(0.5, 0.5, 0.5, { all: Tile.PigSkin, front: Tile.PigFace }, material);
    skull.position.set(0, 0.05, 0.22);
    const snout = box(0.26, 0.18, 0.08, { all: Tile.PigSnout }, material);
    snout.position.set(0, -0.02, 0.5);
    const earL = box(0.12, 0.12, 0.04, { all: Tile.PigSkin }, material);
    earL.position.set(-0.2, 0.33, 0.12);
    earL.rotation.z = 0.3;
    const earR = earL.clone();
    earR.position.x = 0.2;
    earR.rotation.z = -0.3;
    headPivot.add(skull, snout, earL, earR);
    body.add(headPivot);
    head = headPivot;

    [
      [-0.18, 0.36],
      [0.18, 0.36],
      [-0.18, -0.36],
      [0.18, -0.36],
    ].forEach(([x, z]) => {
      const leg = limb(x, 0.38, z, 0.22, 0.38, 0.22, { all: Tile.PigSkin, bottom: Tile.PigHoof }, material);
      body.add(leg);
      legs.push(leg);
    });
    height = 0.95;
    width = 0.8;
  } else if (kind === MOB.COW) {
    const torso = box(0.78, 0.66, 1.12, { all: Tile.CowHide }, material);
    torso.position.set(0, 1.0, 0);
    const udder = box(0.28, 0.12, 0.3, { all: Tile.CowUdder }, material);
    udder.position.set(0, 0.62, -0.2);
    body.add(torso, udder);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.12, 0.56);
    const skull = box(0.52, 0.5, 0.38, { all: Tile.CowHide, front: Tile.CowFace }, material);
    skull.position.set(0, 0.05, 0.16);
    const muzzle = box(0.34, 0.2, 0.08, { all: Tile.CowMuzzle }, material);
    muzzle.position.set(0, -0.1, 0.38);
    const hornL = box(0.08, 0.16, 0.08, { all: Tile.CowHorn }, material);
    hornL.position.set(-0.28, 0.3, 0.12);
    const hornR = hornL.clone();
    hornR.position.x = 0.28;
    headPivot.add(skull, muzzle, hornL, hornR);
    body.add(headPivot);
    head = headPivot;

    [
      [-0.24, 0.4],
      [0.24, 0.4],
      [-0.24, -0.4],
      [0.24, -0.4],
    ].forEach(([x, z]) => {
      const leg = limb(x, 0.68, z, 0.24, 0.68, 0.24, { all: Tile.CowHide, bottom: Tile.CowHoof }, material);
      body.add(leg);
      legs.push(leg);
    });
    height = 1.45;
    width = 0.95;
  } else if (kind === MOB.SHEEP) {
    const torsoSkin = box(0.66, 0.58, 0.96, { all: Tile.SheepSkin }, material);
    torsoSkin.position.set(0, 0.9, 0);
    body.add(torsoSkin);

    const wool = box(0.78, 0.72, 1.08, { all: Tile.Wool }, material);
    wool.position.set(0, 0.9, 0);
    body.add(wool);
    woolMesh = wool;

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.06, 0.5);
    const skull = box(0.42, 0.42, 0.46, { all: Tile.Wool, front: Tile.WoolFace }, material);
    skull.position.set(0, 0.04, 0.2);
    headPivot.add(skull);
    body.add(headPivot);
    head = headPivot;

    setSheared = (sheared: boolean) => {
      if (woolMesh) woolMesh.visible = !sheared;
    };

    [
      [-0.2, 0.34],
      [0.2, 0.34],
      [-0.2, -0.34],
      [0.2, -0.34],
    ].forEach(([x, z]) => {
      const leg = limb(x, 0.6, z, 0.2, 0.6, 0.2, { all: Tile.SheepSkin, top: Tile.Wool }, material);
      body.add(leg);
      legs.push(leg);
    });
    height = 1.3;
    width = 0.9;
  } else if (kind === MOB.CHICKEN) {
    const torso = box(0.36, 0.34, 0.46, { all: Tile.Feather }, material);
    torso.position.set(0, 0.42, 0);
    body.add(torso);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.55, 0.2);
    const skull = box(0.24, 0.3, 0.18, { all: Tile.Feather, front: Tile.ChickenFace }, material);
    skull.position.set(0, 0.15, 0.04);
    const beak = box(0.2, 0.08, 0.1, { all: Tile.Beak }, material);
    beak.position.set(0, 0.17, 0.18);
    const wattle = box(0.1, 0.1, 0.06, { all: Tile.Wattle }, material);
    wattle.position.set(0, 0.06, 0.16);
    headPivot.add(skull, beak, wattle);
    body.add(headPivot);
    head = headPivot;

    [-0.19, 0.19].forEach((x) => {
      const wing = new THREE.Group();
      wing.position.set(x, 0.56, 0);
      const mesh = box(0.04, 0.24, 0.36, { all: Tile.Feather }, material);
      mesh.position.y = -0.1;
      wing.add(mesh);
      body.add(wing);
      wings.push(wing);
    });

    [-0.08, 0.08].forEach((x) => {
      const leg = limb(x, 0.26, 0.02, 0.06, 0.26, 0.06, { all: Tile.ChickenLeg }, material);
      body.add(leg);
      legs.push(leg);
    });
    height = 0.75;
    width = 0.5;
  } else if (kind === MOB.SKELETON) {
    // Skeleton
    const torso = box(0.48, 0.68, 0.24, { all: Tile.Bone }, material);
    torso.position.set(0, 1.08, 0);
    body.add(torso);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.44, 0);
    const skull = box(0.48, 0.48, 0.48, { all: Tile.Bone, front: Tile.SkeletonFace }, material);
    skull.position.y = 0.24;
    headPivot.add(skull);
    body.add(headPivot);
    head = headPivot;

    [-0.34, 0.34].forEach((x) => {
      const arm = limb(x, 1.38, 0, 0.16, 0.68, 0.16, { all: Tile.Bone }, material);
      arm.rotation.x = -Math.PI / 2 + 0.1;
      body.add(arm);
      arms.push(arm);
    });

    [-0.12, 0.12].forEach((x) => {
      const leg = limb(x, 0.72, 0, 0.16, 0.72, 0.16, { all: Tile.Bone }, material);
      body.add(leg);
      legs.push(leg);
    });
    height = 1.95;
    width = 0.6;
  } else if (kind === MOB.CREEPER) {
    // Creeper
    const torso = box(0.5, 0.72, 0.26, { all: Tile.CreeperBody }, material);
    torso.position.set(0, 0.82, 0);
    body.add(torso);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.18, 0);
    const skull = box(0.5, 0.5, 0.5, { all: Tile.CreeperBody, front: Tile.CreeperFace }, material);
    skull.position.y = 0.25;
    headPivot.add(skull);
    body.add(headPivot);
    head = headPivot;

    // 4 Creeper feet
    [
      [-0.18, 0.18],
      [0.18, 0.18],
      [-0.18, -0.18],
      [0.18, -0.18],
    ].forEach(([x, z]) => {
      const foot = limb(x, 0.36, z, 0.22, 0.36, 0.22, { all: Tile.CreeperBody, bottom: Tile.CreeperFoot }, material);
      body.add(foot);
      legs.push(foot);
    });
    height = 1.7;
    width = 0.6;
  } else {
    // Zombie
    const torso = box(0.5, 0.72, 0.26, { all: Tile.Shirt }, material);
    torso.position.set(0, 1.08, 0);
    body.add(torso);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.44, 0);
    const skull = box(0.5, 0.5, 0.5, { all: Tile.ZombieSkin, front: Tile.ZombieFace, top: Tile.ZombieHair }, material);
    skull.position.y = 0.25;
    headPivot.add(skull);
    body.add(headPivot);
    head = headPivot;

    [-0.37, 0.37].forEach((x) => {
      const arm = limb(x, 1.38, 0, 0.24, 0.72, 0.24, { all: Tile.ZombieSkin, top: Tile.Shirt }, material);
      arm.rotation.x = -Math.PI / 2;
      body.add(arm);
      arms.push(arm);
    });

    [-0.125, 0.125].forEach((x) => {
      const leg = limb(x, 0.72, 0, 0.25, 0.72, 0.25, { all: Tile.Pants, bottom: Tile.Shoe }, material);
      body.add(leg);
      legs.push(leg);
    });
    height = 1.95;
    width = 0.6;
  }

  return { root, body, head, legs, arms, wings, woolMesh, material, height, width, setSheared };
}
