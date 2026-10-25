import * as THREE from "three";
import {
  atlasUV,
  B,
  BLOCKS,
  CAMPFIRE_ATLAS,
  LOG_BLOCKS,
  getAtlas,
  isCross,
  isLiquid,
  isReplaceable,
  isSolid,
  isTransparent,
  materialOf,
  tileUV,
  type ToolKind,
} from "./blocks";
import { CAMPFIRE_ELEMENTS } from "./campfire";
import { SWORD_MODELS } from "./swordModels";
import {
  COLD_HOTBAR,
  CREATIVE_HOTBAR,
  I,
  ITEMS,
  FUEL,
  MOB_DROPS,
  RECIPES,
  SMELTING,
  ARMOR_POINTS,
  SMELT_TIME,
  SPRINT_HOTBAR,
  attackDamage,
  displayName,
  isItem,
  rollDrops,
  stackSize,
  matchRecipe,
  recipeLayout,
  recipeNeeds,
  toolMultiplier,
  type Recipe,
} from "./items";
import { createMobModel, MOB, type MobModel } from "./mobs";
import { FarTerrain } from "./farTerrain";
import { localName, t } from "./i18n";
import {
  BIOME_NAMES,
  Biome,
  CHUNK_SIZE,
  CHUNK_VOLUME,
  SEA_LEVEL,
  WORLD_HEIGHT,
  blockIndex,
  generateChunk,
  sampleColumn,
} from "./worldgen";
import { SoundEngine, type Material } from "./audio";
import { loadSkinAsync, skinToCanvas } from "./skin";

export type GameScreen = "menu" | "playing" | "paused" | "over";
export type GameMode = "survival" | "sprint" | "creative" | "cold";

export type TargetInfo = { id: number; name: string; score: number; progress: number; color: string };
export type HotbarSlot = { id: number; count: number };
export type HeldInfo = { id: number; name: string; kind: ToolKind | "block" | "material" | "food" | "special" | "empty" };

export type PublicStats = {
  mode: GameMode;
  score: number;
  timeLeft: number;
  combo: number;
  comboPct: number;
  ores: number;
  bestCombo: number;
  blocksPlaced: number;
  blocksMined: number;
  kills: number;
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  armor: number;
  temperature: number;
  maxTemperature: number;
  backpack: HotbarSlot[];
  ui: ContainerUI;
  hotbar: HotbarSlot[];
  selected: number;
  held: HeldInfo;
  target: TargetInfo | null;
  biome: string;
  clock: string;
  night: boolean;
  position: { x: number; y: number; z: number };
  flying: boolean;
  swimming: boolean;
  onGround: boolean;
  fps: number;
  chunks: number;
  loading: number;
};

export type RunSummary = {
  id: string;
  mode: GameMode;
  score: number;
  ores: number;
  bestCombo: number;
  blocksPlaced: number;
  blocksMined: number;
  kills: number;
  mined: Record<number, number>;
  finishedAt: number;
};

/** how far (in blocks) a mob's voice can be heard */
const MOB_HEARING_RANGE = 9;

/** how far the low-detail horizon terrain reaches, in blocks */
const FAR_VIEW = 1000;

const SAVE_KEY = "oreRush.save.v1";

export type ContainerType = "inventory" | "table" | "furnace" | "chest";
export type SlotArea = "inv" | "craft" | "result" | "fIn" | "fFuel" | "fOut" | "chest";
export const CHEST_SLOTS = 27;
export type ContainerUI = {
  container: ContainerType | null;
  cursor: HotbarSlot;
  craftSize: number;
  craft: HotbarSlot[];
  result: { id: number; count: number } | null;
  furnace: { input: HotbarSlot; fuel: HotbarSlot; output: HotbarSlot; burn: number; cook: number } | null;
  chest: HotbarSlot[] | null;
};
type FurnaceState = { input: HotbarSlot; fuel: HotbarSlot; output: HotbarSlot; burn: number; burnMax: number; cook: number };

export type PopupKind = "gold" | "diamond" | "emerald" | "coal" | "tnt" | "info" | "combat";
export type FxKind = "start" | "explosion" | "fall" | "levelup" | "splash" | "hurt";

export interface GameCallbacks {
  onStats: (stats: PublicStats) => void;
  onScreen: (screen: GameScreen) => void;
  onPopup: (popup: { id: number; text: string; sub?: string; kind: PopupKind }) => void;
  onFx: (kind: FxKind) => void;
  onRunEnd: (run: RunSummary) => void;
  onContainer: (type: ContainerType | null) => void;
}

/* ------------------------------------------------------------------ */
const RUN_TIME = 90;
const COMBO_WINDOW = 4;
const REACH = 6;
const MAX_PARTICLES = 280;
const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.8;
const EYE_HEIGHT = 1.62;
const GRAVITY = 28;
const DAY_LENGTH = 320;
const MAX_MOBS = 14;
const MAX_HEALTH = 20;
const MAX_TEMPERATURE = 20;
const MAX_HUNGER = 20;

type Face = {
  n: [number, number, number];
  c: [number, number, number][];
  ao: [number, number, number][][];
  shade: number;
  kind: "top" | "bottom" | "side";
};

const FACES: Face[] = [
  {
    n: [1, 0, 0],
    c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
    ao: [
      [[1, -1, 0], [1, 0, 1], [1, -1, 1]],
      [[1, -1, 0], [1, 0, -1], [1, -1, -1]],
      [[1, 1, 0], [1, 0, -1], [1, 1, -1]],
      [[1, 1, 0], [1, 0, 1], [1, 1, 1]],
    ],
    shade: 0.82,
    kind: "side",
  },
  {
    n: [-1, 0, 0],
    c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
    ao: [
      [[-1, -1, 0], [-1, 0, -1], [-1, -1, -1]],
      [[-1, -1, 0], [-1, 0, 1], [-1, -1, 1]],
      [[-1, 1, 0], [-1, 0, 1], [-1, 1, 1]],
      [[-1, 1, 0], [-1, 0, -1], [-1, 1, -1]],
    ],
    shade: 0.76,
    kind: "side",
  },
  {
    n: [0, 1, 0],
    c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]],
    ao: [
      [[-1, 1, 0], [0, 1, -1], [-1, 1, -1]],
      [[-1, 1, 0], [0, 1, 1], [-1, 1, 1]],
      [[1, 1, 0], [0, 1, 1], [1, 1, 1]],
      [[1, 1, 0], [0, 1, -1], [1, 1, -1]],
    ],
    shade: 1,
    kind: "top",
  },
  {
    n: [0, -1, 0],
    c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
    ao: [
      [[-1, -1, 0], [0, -1, -1], [-1, -1, -1]],
      [[1, -1, 0], [0, -1, -1], [1, -1, -1]],
      [[1, -1, 0], [0, -1, 1], [1, -1, 1]],
      [[-1, -1, 0], [0, -1, 1], [-1, -1, 1]],
    ],
    shade: 0.5,
    kind: "bottom",
  },
  {
    n: [0, 0, 1],
    c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
    ao: [
      [[-1, 0, 1], [0, -1, 1], [-1, -1, 1]],
      [[1, 0, 1], [0, -1, 1], [1, -1, 1]],
      [[1, 0, 1], [0, 1, 1], [1, 1, 1]],
      [[-1, 0, 1], [0, 1, 1], [-1, 1, 1]],
    ],
    shade: 0.92,
    kind: "side",
  },
  {
    n: [0, 0, -1],
    c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
    ao: [
      [[1, 0, -1], [0, -1, -1], [1, -1, -1]],
      [[-1, 0, -1], [0, -1, -1], [-1, -1, -1]],
      [[-1, 0, -1], [0, 1, -1], [-1, 1, -1]],
      [[1, 0, -1], [0, 1, -1], [1, 1, -1]],
    ],
    shade: 0.68,
    kind: "side",
  },
];

type Chunk = {
  cx: number;
  cz: number;
  blocks: Uint8Array;
  heights: Uint16Array;
  biomes: Uint8Array;
  opaque: THREE.Mesh | null;
  cutout: THREE.Mesh | null;
  water: THREE.Mesh | null;
  dirty: boolean;
  meshed: boolean;
};

type Particle = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  ttl: number;
  size: number;
  color: THREE.Color;
  gravity: number;
};

type Mob = {
  model: MobModel;
  group: THREE.Group;
  legs: THREE.Object3D[];
  vel: THREE.Vector3;
  dir: number;
  yaw: number;
  timer: number;
  walk: number;
  kind: number; // 0 pig, 1 sheep, 2 cow, 3 zombie, 4 chicken
  hp: number;
  hostile: boolean;
  hurt: number;
  attackCd: number;
  flee: number;
  graze: number;
  dying: number;
  soundTimer: number;
  onGround: boolean;
};

type Arrow = { mesh: THREE.Mesh; vel: THREE.Vector3; life: number };
type ItemDrop = { mesh: THREE.Mesh; id: number; count: number; age: number; baseY: number };
type VoxelHit = { x: number; y: number; z: number; nx: number; ny: number; nz: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hexColor = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

/* ---- 3D block models (campfire) ---- */
/* corner keys: x/y/z = 0 for the element's `from` side, 1 for its `to` side */
const MODEL_FACE_LIST: { name: "north" | "east" | "south" | "west" | "up" | "down"; corners: [string, string, string, string]; shade: number }[] = [
  { name: "up", corners: ["010", "110", "111", "011"], shade: 1.0 },
  { name: "down", corners: ["000", "100", "101", "001"], shade: 0.55 },
  { name: "north", corners: ["000", "100", "110", "010"], shade: 0.85 },
  { name: "south", corners: ["001", "101", "111", "011"], shade: 0.85 },
  { name: "west", corners: ["000", "001", "011", "010"], shade: 0.7 },
  { name: "east", corners: ["100", "101", "111", "110"], shade: 0.7 },
];
/* rotation in degrees, applied as Rz, then Ry, then Rx around `origin` (same as three.js 'XYZ') */
function rotateModelPoint(p: [number, number, number], origin: [number, number, number], r: [number, number, number]): [number, number, number] {
  let x = p[0] - origin[0];
  let y = p[1] - origin[1];
  let z = p[2] - origin[2];
  const [ax, ay, az] = r.map((d) => (d * Math.PI) / 180);
  let c = Math.cos(az), s = Math.sin(az);
  [x, y] = [x * c - y * s, x * s + y * c];
  c = Math.cos(ay); s = Math.sin(ay);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(ax); s = Math.sin(ax);
  [y, z] = [y * c - z * s, y * s + z * c];
  return [x + origin[0], y + origin[1], z + origin[2]];
}

export class VoxelGame {
  private host: HTMLElement;
  private cb: GameCallbacks;
  private sfx: SoundEngine;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;

  private isTouch = false;
  private width = 1;
  private height = 1;
  private renderDistance = 7;

  /* world */
  private seed = 1337;
  private chunks = new Map<string, Chunk>();
  private meshQueue: string[] = [];
  private atlasTexture: THREE.CanvasTexture;
  private opaqueMaterial: THREE.MeshBasicMaterial;
  private cutoutMaterial: THREE.MeshBasicMaterial;
  private waterMaterial: THREE.MeshBasicMaterial;
  private worldGroup = new THREE.Group();
  private far = new FarTerrain();
  private farNearR = -1;
  private farTimer = 0;
  private oreBoost = false;

  /* liquids */
  private fluidLevels = new Map<string, number>();
  private fluidQueue = new Set<string>();
  private fluidTimer = 0;
  private fluidTick = 0;

  /* sky */
  private sky: THREE.Mesh;
  private skyMaterial: THREE.ShaderMaterial;
  private sun: THREE.Mesh;
  private moon: THREE.Mesh;
  private stars: THREE.Points;
  private clouds: THREE.InstancedMesh;
  private dayTime = 0.28;
  private daylight = 1;
  private wasNight = false;

  /* fx */
  private particles: Particle[] = [];
  private particleMesh: THREE.InstancedMesh;
  private particleDummy = new THREE.Object3D();
  private highlight: THREE.LineSegments;
  private breakOverlay: THREE.Mesh;
  private breakMaterial: THREE.MeshBasicMaterial;

  /* view model (hand + held item) */
  private viewScene = new THREE.Scene();
  private viewCamera: THREE.PerspectiveCamera;
  private handRig = new THREE.Group();
  private handPivot = new THREE.Group();
  private handContent: THREE.Object3D | null = null;
  private handArm: THREE.Mesh;
  private skinTexture: THREE.CanvasTexture | null = null;
  private handShownId = Number.NaN;
  private swordTextures = new Map<string, THREE.Texture>();
  private swing = 0;
  private swingActive = false;

  /* entities */
  private mobs: Mob[] = [];
  private mobRoot = new THREE.Group();
  private arrows: Arrow[] = [];
  private arrowRoot = new THREE.Group();
  /* items lying on the ground after a block breaks (survival / cold) */
  private itemDrops: ItemDrop[] = [];
  private dropRoot = new THREE.Group();
  private dropGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);

  /* state */
  private screen: GameScreen = "menu";
  private mode: GameMode = "sprint";
  private score = 0;
  private timeLeft = RUN_TIME;
  private combo = 0;
  private comboTimer = 0;
  private bestCombo = 0;
  private oresMined = 0;
  private blocksPlaced = 0;
  private blocksMined = 0;
  private kills = 0;
  private health = MAX_HEALTH;
  private hunger = MAX_HUNGER;
  private hungerTimer = 0;
  private temperature = MAX_TEMPERATURE;
  private temperatureTimer = 0;
  private backpack: HotbarSlot[] = new Array(27).fill(0).map(() => ({ id: 0, count: 0 }));
  private cursor: HotbarSlot = { id: 0, count: 0 };
  private craftGrid: HotbarSlot[] = new Array(9).fill(0).map(() => ({ id: 0, count: 0 }));
  private container: ContainerType | null = null;
  private furnaceKey: string | null = null;
  private furnaces = new Map<string, FurnaceState>();
  private chests = new Map<string, HotbarSlot[]>();
  /** every block the player (or fluids/TNT) changed, per chunk, so a world can be saved and rebuilt from its seed */
  private edits = new Map<string, Map<number, number>>();
  /** per-block orientation: logs 1 = lying along X, 2 = along Z; campfire 1 = turned 90 degrees */
  private orient = new Map<string, Map<number, number>>();
  private saveTimer = 0;
  private chestKey: string | null = null;
  private lightTint = new THREE.Color(1, 1, 1);
  private caveFactor = 0;
  private envTimer = 0;
  private regen = 0;
  private hurtCooldown = 0;
  private armorItem = 0;
  private minedCounts: Record<number, number> = {};
  private hotbar: HotbarSlot[] = [];
  private selected = 0;
  private elapsed = 0;
  private lastStats = 0;
  private popupId = 0;
  private runCounter = 0;
  private inputEnabled = true;
  private fps = 60;

  /* player */
  private player = {
    pos: new THREE.Vector3(0.5, 70, 0.5),
    vel: new THREE.Vector3(),
    yaw: 0,
    pitch: -0.1,
    onGround: false,
    coyote: 0,
    bob: 0,
    step: 0,
    flying: false,
    swimming: false,
    headUnderwater: false,
    fallStart: 0,
  };
  private spawnPos = new THREE.Vector3(0.5, 70, 0.5);
  private respawnPos: THREE.Vector3 | null = null; // set by sleeping in a bed
  private airTime = 0;
  private keys = new Set<string>();
  private touchMove = { x: 0, y: 0 };
  private verticalInput = 0;
  private mining = false;
  private placeHeld = false;
  private jumpBuffer = 0;
  private lastJumpTap = 0;
  private lastPlace = 0;
  private attackCd = 0;
  private target: VoxelHit | null = null;
  private targetId = 0;
  private progress = 0;
  private trauma = 0;
  private fovKick = 0;
  private lastMiningSpark = 0;
  private lookPointer: number | null = null;
  private lookLast = { x: 0, y: 0 };
  private lockIgnore = 0;
  private pendingExplosions: { x: number; y: number; z: number; t: number }[] = [];
  private tempDir = new THREE.Vector3();
  private tempVec = new THREE.Vector3();
  private menuAngle = 0;

  constructor(container: HTMLElement, cb: GameCallbacks, sfx: SoundEngine) {
    this.host = container;
    this.cb = cb;
    this.sfx = sfx;
    this.isTouch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    this.renderDistance = this.isTouch ? 4 : 7;

    const atlas = getAtlas();
    this.atlasTexture = new THREE.CanvasTexture(atlas.canvas);
    this.atlasTexture.magFilter = THREE.NearestFilter;
    this.atlasTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.atlasTexture.colorSpace = THREE.SRGBColorSpace;
    this.atlasTexture.anisotropy = 4;

    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isTouch, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x8fc7ff, 1);
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.style.display = "block";
    this.host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(70, 1, 0.08, 1500);
    this.camera.rotation.order = "YXZ";

    this.opaqueMaterial = new THREE.MeshBasicMaterial({ map: this.atlasTexture, vertexColors: true });
    this.cutoutMaterial = new THREE.MeshBasicMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
    });
    this.waterMaterial = new THREE.MeshBasicMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.scene.fog = new THREE.Fog(0x8fc7ff, this.renderDistance * CHUNK_SIZE * 0.55, FAR_VIEW * 0.97);
    this.far.setRadius(this.isTouch ? FAR_VIEW / 2 : FAR_VIEW);
    this.scene.add(this.far.group);
    this.scene.add(this.worldGroup, this.mobRoot, this.arrowRoot, this.dropRoot);

    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x4a90e0) },
        bottomColor: { value: new THREE.Color(0xbfe3ff) },
        horizon: { value: new THREE.Color(0xffd9a0) },
        mixAmount: { value: 0 },
      },
      vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 topColor; uniform vec3 bottomColor; uniform vec3 horizon; uniform float mixAmount;
        varying vec3 vPos;
        void main(){
          float h = normalize(vPos).y;
          vec3 col = mix(bottomColor, topColor, clamp(h * 1.2 + 0.1, 0.0, 1.0));
          float glow = pow(max(0.0, 1.0 - abs(h) * 3.2), 2.0) * mixAmount;
          col = mix(col, horizon, clamp(glow, 0.0, 1.0));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(480, 16, 12), this.skyMaterial);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10; // behind everything, including the distant terrain
    this.scene.add(this.sky);

    this.sun = new THREE.Mesh(new THREE.PlaneGeometry(52, 52), new THREE.MeshBasicMaterial({ color: 0xfff4c8, fog: false, transparent: true, depthWrite: false }));
    this.moon = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, fog: false, transparent: true, depthWrite: false }));
    this.sun.frustumCulled = false;
    this.moon.frustumCulled = false;
    this.scene.add(this.sun, this.moon);
    this.stars = this.createStars();
    this.scene.add(this.stars);
    this.clouds = this.createClouds();
    this.scene.add(this.clouds);

    this.particleMesh = this.createParticleMesh();
    this.scene.add(this.particleMesh);

    this.highlight = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
      new THREE.LineBasicMaterial({ color: 0x0c0c0c, transparent: true, opacity: 0.55, fog: false })
    );
    this.highlight.visible = false;
    this.scene.add(this.highlight);

    this.breakMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      fog: false,
    });
    this.breakOverlay = new THREE.Mesh(new THREE.BoxGeometry(1.004, 1.004, 1.004), this.breakMaterial);
    this.breakOverlay.visible = false;
    this.scene.add(this.breakOverlay);

    /* view model */
    this.viewCamera = new THREE.PerspectiveCamera(62, 1, 0.01, 12);
    this.handArm = this.makeBox(0.3, 0.3, 0.86, 0xf0b98a, 0xffd0a4);
    this.handArm.position.set(0, -0.06, -0.3);
    this.skinTexture = new THREE.CanvasTexture(document.createElement("canvas"));
    this.skinTexture.magFilter = THREE.NearestFilter;
    this.skinTexture.minFilter = THREE.NearestFilter;
    this.skinTexture.colorSpace = THREE.SRGBColorSpace;
    void loadSkinAsync().then((img) => this.setSkin(skinToCanvas(img)));
    this.handPivot.add(this.handArm);
    this.handRig.add(this.handPivot);
    this.handRig.position.set(0.46, -0.42, -0.75);
    this.handRig.rotation.set(0.08, -0.3, 0.1);
    this.viewScene.add(this.handRig);

    this.hotbar = CREATIVE_HOTBAR.map((id: number) => ({ id, count: -1 }));

    this.resize();
    this.prepareWorld(Math.floor(Math.random() * 1_000_000), false);
    this.placePlayerAtSpawn();
    this.refreshHandModel();

    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointercancel", this.onPointerUp);
    el.addEventListener("contextmenu", this.onContextMenu);
    el.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("pointerup", this.onWindowPointerUp);
    window.addEventListener("resize", this.resize);

    this.loop();
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                        */
  /* ------------------------------------------------------------------ */
  startRun(mode: GameMode) {
    this.sfx.ensure();
    this.sfx.start();
    this.mode = mode;
    this.oreBoost = mode === "sprint";
    this.sfx.setBlizzard(mode === "cold");
    if (this.container) this.closeContainer(true);
    this.edits.clear();
    this.orient.clear();
    this.prepareWorld(Math.floor(Math.random() * 1_000_000), mode === "sprint");
    this.furnaces.clear();
    this.chests.clear();
    this.cursor = this.emptySlot();
    this.resetRunValues();
    this.placePlayerAtSpawn();
    this.spawnMobs(true);
    this.refreshHandModel();
    this.screen = "playing";
    this.cb.onScreen("playing");
    this.cb.onFx("start");
    this.emitStats(true);
    this.tryLock();
  }

  /** Survival and cold worlds are saved to this browser/app (localStorage). */
  static hasSave(): boolean {
    try {
      return !!window.localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  }

  saveGame() {
    if (this.screen !== "playing" && this.screen !== "paused") return;
    if (this.mode !== "survival" && this.mode !== "cold") return;
    const slots = (list: HotbarSlot[]) => list.map((s) => [s.id, s.count]);
    const edits: Record<string, number[]> = {};
    this.edits.forEach((map, key) => {
      const flat: number[] = [];
      map.forEach((id, index) => flat.push(index, id));
      edits[key] = flat;
    });
    const data = {
      v: 1,
      mode: this.mode,
      seed: this.seed,
      edits,
      orient: Object.fromEntries([...this.orient.entries()].map(([key, map]) => [key, [...map.entries()].flat()])),
      hotbar: slots(this.hotbar),
      backpack: slots(this.backpack),
      health: this.health,
      hunger: this.hunger,
      temperature: this.temperature,
      dayTime: this.dayTime,
      armor: this.armorItem,
      selected: this.selected,
      pos: [this.player.pos.x, this.player.pos.y, this.player.pos.z, this.player.yaw, this.player.pitch],
      respawn: this.respawnPos ? [this.respawnPos.x, this.respawnPos.y, this.respawnPos.z] : null,
      chests: [...this.chests.entries()].map(([key, list]) => [key, slots(list)]),
      furnaces: [...this.furnaces.entries()].map(([key, f]) => [key, slots([f.input, f.fuel, f.output]), f.burn, f.burnMax, f.cook]),
    };
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable: the world just isn't saved */
    }
  }

  continueRun(): boolean {
    let data: any;
    try {
      data = JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? "null");
    } catch {
      data = null;
    }
    if (!data || data.v !== 1 || (data.mode !== "survival" && data.mode !== "cold")) return false;
    const toSlots = (list: number[][]): HotbarSlot[] => list.map(([id, count]) => ({ id, count }));

    this.sfx.ensure();
    this.sfx.start();
    this.mode = data.mode;
    this.oreBoost = false;
    this.sfx.setBlizzard(this.mode === "cold");
    if (this.container) this.closeContainer(true);

    this.edits.clear();
    Object.entries(data.edits as Record<string, number[]>).forEach(([key, flat]) => {
      const map = new Map<number, number>();
      for (let i = 0; i + 1 < flat.length; i += 2) map.set(flat[i], flat[i + 1]);
      this.edits.set(key, map);
    });
    this.orient.clear();
    Object.entries((data.orient ?? {}) as Record<string, number[]>).forEach(([key, flat]) => {
      const map = new Map<number, number>();
      for (let i = 0; i + 1 < flat.length; i += 2) map.set(flat[i], flat[i + 1]);
      this.orient.set(key, map);
    });
    this.prepareWorld(data.seed, false);
    this.cursor = this.emptySlot();
    this.resetRunValues();

    this.hotbar = toSlots(data.hotbar);
    this.backpack = toSlots(data.backpack);
    this.health = data.health;
    this.hunger = data.hunger;
    this.temperature = data.temperature;
    this.dayTime = data.dayTime;
    this.armorItem = data.armor ?? 0;
    this.selected = data.selected ?? 0;
    this.respawnPos = data.respawn ? new THREE.Vector3(data.respawn[0], data.respawn[1], data.respawn[2]) : null;
    this.chests = new Map((data.chests as [string, number[][]][]).map(([key, list]) => [key, toSlots(list)]));
    this.furnaces = new Map(
      (data.furnaces as [string, number[][], number, number, number][]).map(([key, list, burn, burnMax, cook]) => {
        const [input, fuel, output] = toSlots(list);
        return [key, { input, fuel, output, burn, burnMax, cook }];
      }),
    );

    // make sure the ground under the player exists before they appear
    const [px, py, pz, yaw, pitch] = data.pos as number[];
    const pcx = Math.floor(px / CHUNK_SIZE);
    const pcz = Math.floor(pz / CHUNK_SIZE);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) this.buildChunkMesh(this.ensureChunk(pcx + dx, pcz + dz));
    this.player.pos.set(px, py + 0.05, pz);
    this.player.vel.set(0, 0, 0);
    this.player.yaw = yaw;
    this.player.pitch = pitch;
    this.player.onGround = false;
    this.player.flying = false;
    this.player.fallStart = py;
    this.camera.position.set(px, py + 0.05 + EYE_HEIGHT, pz);
    this.camera.rotation.set(pitch, yaw, 0, "YXZ");

    this.spawnMobs(true);
    this.refreshHandModel();
    this.screen = "playing";
    this.cb.onScreen("playing");
    this.cb.onFx("start");
    this.emitStats(true);
    this.tryLock();
    return true;
  }

  pause() {
    if (this.screen !== "playing") return;
    if (this.container) this.closeContainer(true);
    this.saveGame();
    this.screen = "paused";
    this.stopInput();
    this.releaseLock();
    this.cb.onScreen("paused");
    this.emitStats(true);
    this.sfx.ui();
  }

  resume() {
    if (this.screen !== "paused") return;
    this.inputEnabled = true;
    this.screen = "playing";
    this.cb.onScreen("playing");
    this.sfx.ensure();
    this.sfx.ui();
    this.tryLock();
  }

  toMenu() {
    if (this.container) this.closeContainer(true);
    this.saveGame();
    this.screen = "menu";
    this.stopInput();
    this.releaseLock();
    this.highlight.visible = false;
    this.breakOverlay.visible = false;
    this.cb.onScreen("menu");
    this.emitStats(true);
  }

  setSoundEnabled(enabled: boolean) {
    this.sfx.setEnabled(enabled);
    if (enabled) this.sfx.ensure();
  }

  setSkin(canvas: HTMLCanvasElement) {
    if (!this.skinTexture) {
      this.skinTexture = new THREE.CanvasTexture(canvas);
      this.skinTexture.magFilter = THREE.NearestFilter;
      this.skinTexture.minFilter = THREE.NearestFilter;
      this.skinTexture.colorSpace = THREE.SRGBColorSpace;
    } else {
      this.skinTexture.image = canvas;
      this.skinTexture.needsUpdate = true;
    }
    const mat = this.handArm.material as THREE.MeshBasicMaterial;
    mat.map = this.skinTexture;
    mat.vertexColors = false;
    mat.needsUpdate = true;
    const uv = this.handArm.geometry.getAttribute("uv") as THREE.BufferAttribute;
    const mapFace = (face: number, x: number, y: number, w: number, h: number) => {
      const u0 = x / 64;
      const u1 = (x + w) / 64;
      const v1 = 1 - y / 64;
      const v0 = 1 - (y + h) / 64;
      uv.setXY(face * 4 + 0, u0, v1);
      uv.setXY(face * 4 + 1, u1, v1);
      uv.setXY(face * 4 + 2, u0, v0);
      uv.setXY(face * 4 + 3, u1, v0);
    };
    /* BoxGeometry faces: +x -x +y -y +z -z — right arm */
    mapFace(0, 48, 20, 4, 12);
    mapFace(1, 40, 20, 4, 12);
    mapFace(2, 44, 16, 4, 4);
    mapFace(3, 48, 16, 4, 4);
    mapFace(4, 44, 20, 4, 12);
    mapFace(5, 52, 20, 4, 12);
    uv.needsUpdate = true;
  }

  setInputEnabled(enabled: boolean) {
    this.inputEnabled = enabled;
    if (!enabled) this.stopInput();
    else if (this.screen === "playing") this.tryLock();
  }

  setRenderDistance(distance: number) {
    this.renderDistance = clamp(Math.round(distance), 3, 12);
    const fog = this.scene.fog as THREE.Fog;
    fog.far = FAR_VIEW * 0.97;
    fog.near = this.renderDistance * CHUNK_SIZE * 0.55;
  }

  setMoveInput(x: number, y: number) {
    this.touchMove.x = clamp(x, -1, 1);
    this.touchMove.y = clamp(y, -1, 1);
  }

  setVerticalInput(v: number) {
    this.verticalInput = clamp(v, -1, 1);
  }

  setMining(on: boolean) {
    if (this.screen !== "playing" || !this.inputEnabled) {
      this.mining = false;
      return;
    }
    this.mining = on;
    if (on) {
      this.sfx.ensure();
      this.primaryAction();
    }
  }

  setPlaceHeld(on: boolean) {
    this.placeHeld = on;
  }

  jump() {
    if (this.screen !== "playing" || !this.inputEnabled) return;
    const now = performance.now();
    if (this.mode === "creative" && now - this.lastJumpTap < 320) {
      this.toggleFly();
      this.lastJumpTap = 0;
      return;
    }
    this.lastJumpTap = now;
    this.jumpBuffer = 0.16;
  }

  toggleFly() {
    if (this.mode !== "creative") return;
    this.player.flying = !this.player.flying;
    if (this.player.flying) this.player.vel.y = 0;
    this.sfx.ui();
    this.emitStats(true);
  }

  selectSlot(index: number) {
    if (index < 0 || index >= this.hotbar.length) return;
    this.selected = index;
    this.sfx.select();
    this.refreshHandModel();
    this.emitStats(true);
  }

  cycleSlot(direction: number) {
    this.selected = (this.selected + direction + this.hotbar.length) % this.hotbar.length;
    this.sfx.select();
    this.refreshHandModel();
    this.emitStats(true);
  }

  setHotbarBlock(index: number, id: number) {
    if (index < 0 || index >= this.hotbar.length) return;
    this.hotbar[index] = { id, count: isItem(id) || this.mode === "creative" ? -1 : this.hotbar[index]?.count ?? 1 };
    this.selected = index;
    this.sfx.ui();
    this.refreshHandModel();
    this.emitStats(true);
  }

  /** main action: attack a mob, shoot the bow, or start mining */
  private primaryAction() {
    const slot = this.hotbar[this.selected];
    const heldId = slot?.id ?? 0;
    const item = isItem(heldId) ? ITEMS[heldId] : null;
    this.triggerSwing();
    if (item?.kind === "bow") {
      this.shootArrow(item.damage);
      return;
    }
    const mob = this.pickMob();
    if (mob) this.attackMob(mob, isItem(heldId) ? attackDamage(heldId) : 1);
  }

  place() {
    if (this.screen !== "playing" || !this.inputEnabled) return;
    const now = performance.now();
    if (now - this.lastPlace < 180) return;
    this.lastPlace = now;

    const slot = this.hotbar[this.selected];
    const emptyHand = !slot || slot.id === 0 || slot.count === 0;
    if (this.target && !this.keys.has("ShiftLeft") && emptyHand) {
      const { x: tx, y: ty, z: tz } = this.target;
      const used = this.getBlock(tx, ty, tz);
      if (used === B.CRAFTING) {
        this.triggerSwing();
        this.openContainer("table");
        return;
      }
      if (used === B.FURNACE) {
        this.triggerSwing();
        this.openContainer("furnace", `${tx},${ty},${tz}`);
        return;
      }
      if (used === B.CHEST) {
        this.triggerSwing();
        this.openContainer("chest", `${tx},${ty},${tz}`);
        return;
      }
      if (used === B.BED) {
        this.triggerSwing();
        this.respawnPos = new THREE.Vector3(tx + 0.5, ty + 1, tz + 0.5);
        this.popup(t("bedSet"), t("bedSetSub"), "info");
        return;
      }
    }
    if (emptyHand) return;
    if (isItem(slot.id)) {
      // 1. Campfire Cooking with raw meat
      if (this.target) {
        const hitId = this.getBlock(this.target.x, this.target.y, this.target.z);
        if (hitId === B.CAMPFIRE) {
          let cookedId = 0;
          if (slot.id === I.RAW_PORK) cookedId = I.COOKED_PORK;
          else if (slot.id === I.RAW_BEEF) cookedId = I.STEAK;
          else if (slot.id === I.RAW_CHICKEN) cookedId = I.COOKED_CHICKEN;
          if (cookedId) {
            slot.count -= 1;
            if (slot.count === 0) slot.id = 0;
            this.addItem(cookedId, 1);
            this.sfx.sizzle();
            this.triggerSwing();
            this.spawnSmoke(this.target.x + 0.5, this.target.y + 1, this.target.z + 0.5, 8);
            this.popup(t("cookedFood", { name: displayName(cookedId).toUpperCase() }), "", "info");
            this.refreshHandModel();
            this.emitStats(true);
            return;
          }
        }
      }

      // 2. Shears on Sheep
      if (slot.id === I.SHEARS) {
        const mob = this.pickMob();
        if (mob && mob.kind === MOB.SHEEP && (!mob.model.woolMesh || mob.model.woolMesh.visible)) {
          if (mob.model.setSheared) mob.model.setSheared(true);
          this.sfx.broke("wool");
          this.triggerSwing();
          this.addItem(B.WOOL_WHITE, 2 + Math.floor(Math.random() * 2));
          this.spawnBurst(mob.group.position.x, mob.group.position.y + 1, mob.group.position.z, 0xfbf7ee, 10, 1.8);
          this.popup(t("sheared"), "", "info");
          this.refreshHandModel();
          this.emitStats(true);
          return;
        }
      }

      // 3. Bucket scoops and places
      if (slot.id === I.BUCKET && this.target) {
        const hitId = this.getBlock(this.target.x, this.target.y, this.target.z);
        if (hitId === B.WATER) {
          this.setBlock(this.target.x, this.target.y, this.target.z, 0);
          slot.id = I.WATER_BUCKET;
          this.sfx.splash();
          this.triggerSwing();
          this.refreshHandModel();
          this.emitStats(true);
          return;
        } else if (hitId === B.LAVA) {
          this.setBlock(this.target.x, this.target.y, this.target.z, 0);
          slot.id = I.LAVA_BUCKET;
          this.sfx.sizzle();
          this.triggerSwing();
          this.refreshHandModel();
          this.emitStats(true);
          return;
        }
      }
      if (slot.id === I.WATER_BUCKET && this.target) {
        const x = this.target.x + this.target.nx;
        const y = this.target.y + this.target.ny;
        const z = this.target.z + this.target.nz;
        this.setBlock(x, y, z, B.WATER);
        slot.id = I.BUCKET;
        this.sfx.splash();
        this.triggerSwing();
        this.refreshHandModel();
        this.emitStats(true);
        return;
      }
      if (slot.id === I.LAVA_BUCKET && this.target) {
        const x = this.target.x + this.target.nx;
        const y = this.target.y + this.target.ny;
        const z = this.target.z + this.target.nz;
        this.setBlock(x, y, z, B.LAVA);
        slot.id = I.BUCKET;
        this.sfx.sizzle();
        this.triggerSwing();
        this.refreshHandModel();
        this.emitStats(true);
        return;
      }

      // 4. Flint and Steel
      if (slot.id === I.FLINT_AND_STEEL && this.target) {
        const hitId = this.getBlock(this.target.x, this.target.y, this.target.z);
        if (hitId === B.TNT) {
          this.destroyBlock(this.target.x, this.target.y, this.target.z);
          return;
        }
        const x = this.target.x + this.target.nx;
        const y = this.target.y + this.target.ny;
        const z = this.target.z + this.target.nz;
        if (this.getBlock(x, y, z) === 0) {
          this.setBlock(x, y, z, B.TORCH);
          this.sfx.place("fire");
          this.triggerSwing();
          this.spawnBurst(x + 0.5, y + 0.5, z + 0.5, 0xffa000, 6, 1.2);
          return;
        }
      }

      // 5. Snowball Throwing
      if (slot.id === I.SNOWBALL) {
        slot.count -= 1;
        if (slot.count <= 0) slot.id = 0;
        this.shootSnowball();
        this.refreshHandModel();
        this.emitStats(true);
        return;
      }

      // 5b. Put on armor
      if (ARMOR_POINTS[slot.id] !== undefined) {
        const worn = this.armorItem;
        this.armorItem = slot.id;
        slot.count -= 1;
        if (slot.count <= 0) slot.id = 0;
        if (worn) this.addItem(worn, 1);
        this.triggerSwing();
        this.sfx.slot();
        this.popup(displayName(this.armorItem).toUpperCase(), t("armorOn"), "info");
        this.refreshHandModel();
        this.emitStats(true);
        return;
      }

      // 6. Food eating
      if (this.eatHeld()) return;

      const item = ITEMS[slot.id];
      this.triggerSwing();
      if (item?.kind === "bow") this.shootArrow(item.damage);
      return;
    }
    const def = BLOCKS[slot.id];
    if (!def) return;
    if (slot.count === 0) {
      this.popup(t("outOf", { name: displayName(def.id).toUpperCase() }), t("mineMore"), "info");
      this.sfx.deny();
      return;
    }
    if (!this.target) {
      if (!this.placeHeld) this.sfx.deny();
      return;
    }

    // replace soft blocks (grass, flowers, water) instead of offsetting into them
    const hitId = this.getBlock(this.target.x, this.target.y, this.target.z);
    const replaceHit = isReplaceable(hitId) && hitId !== 0;
    const x = replaceHit ? this.target.x : this.target.x + this.target.nx;
    const y = replaceHit ? this.target.y : this.target.y + this.target.ny;
    const z = replaceHit ? this.target.z : this.target.z + this.target.nz;

    if (y < 0 || y >= WORLD_HEIGHT) return;
    const existing = this.getBlock(x, y, z);
    if (!isReplaceable(existing)) {
      if (!this.placeHeld) this.sfx.deny();
      return;
    }
    if (def.solid && this.intersectsPlayer(x, y, z)) {
      if (!this.placeHeld) {
        this.popup(t("noRoom"), t("noRoomSub"), "info");
        this.sfx.deny();
      }
      return;
    }
    if (def.solid && this.mobAt(x, y, z)) {
      return;
    }
    if (def.cross && !isSolid(this.getBlock(x, y - 1, z))) {
      if (!this.placeHeld) {
        this.popup(t("needsGround"), t("needsGroundSub", { name: displayName(def.id) }), "info");
        this.sfx.deny();
      }
      return;
    }

    this.setBlock(x, y, z, def.id);
    if (LOG_BLOCKS.has(def.id) && !replaceHit) {
      // a log set against a side wall lies along that wall's axis instead of standing up
      if (this.target.nx !== 0) this.setOrient(x, y, z, 1);
      else if (this.target.nz !== 0) this.setOrient(x, y, z, 2);
    } else if (def.id === B.CAMPFIRE) {
      this.camera.getWorldDirection(this.tempDir);
      if (Math.abs(this.tempDir.x) > Math.abs(this.tempDir.z)) this.setOrient(x, y, z, 1);
    }
    if (slot.count > 0) {
      slot.count -= 1;
      if (slot.count === 0 && this.mode !== "sprint") {
        slot.id = 0;
        this.refreshHandModel();
      }
    }
    this.blocksPlaced++;
    this.triggerSwing();
    this.spawnBurst(x + 0.5, y + 0.5, z + 0.5, def.color, 5, 1.2);
    this.sfx.place(materialOf(def.id) as Material);
    this.emitStats(true);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.releaseLock();
    const el = this.renderer.domElement;
    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerup", this.onPointerUp);
    el.removeEventListener("pointercancel", this.onPointerUp);
    el.removeEventListener("contextmenu", this.onContextMenu);
    el.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("pointerup", this.onWindowPointerUp);
    window.removeEventListener("resize", this.resize);
    this.chunks.forEach((chunk) => this.disposeChunkMeshes(chunk));
    this.chunks.clear();
    [this.scene, this.viewScene].forEach((scene) =>
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else if (material) material.dispose();
      })
    );
    this.far.dispose();
    this.atlasTexture.dispose();
    this.renderer.dispose();
    if (el.parentElement === this.host) this.host.removeChild(el);
  }

  /* ------------------------------------------------------------------ */
  /*  World access                                                      */
  /* ------------------------------------------------------------------ */
  private key(cx: number, cz: number) {
    return `${cx},${cz}`;
  }

  private ensureChunk(cx: number, cz: number): Chunk {
    const key = this.key(cx, cz);
    const existing = this.chunks.get(key);
    if (existing) return existing;
    const chunk: Chunk = {
      cx,
      cz,
      blocks: new Uint8Array(CHUNK_VOLUME),
      heights: new Uint16Array(CHUNK_SIZE * CHUNK_SIZE),
      biomes: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE),
      opaque: null,
      cutout: null,
      water: null,
      dirty: true,
      meshed: false,
    };
    generateChunk(cx, cz, chunk.blocks, chunk.heights, chunk.biomes, { seed: this.seed, oreBoost: this.oreBoost, coldMode: this.mode === "cold" });
    const saved = this.edits.get(key);
    if (saved) {
      saved.forEach((id, index) => {
        this.ensureCapacity(chunk, index);
        chunk.blocks[index] = id;
      });
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          let top = 0;
          for (let y = chunk.blocks.length / (CHUNK_SIZE * CHUNK_SIZE) - 1; y >= 0; y--) {
            if (chunk.blocks[blockIndex(lx, y, lz)] !== 0) {
              top = y;
              break;
            }
          }
          chunk.heights[lx + lz * CHUNK_SIZE] = top;
        }
      }
    }
    this.chunks.set(key, chunk);
    return chunk;
  }

  private getChunk(cx: number, cz: number) {
    return this.chunks.get(this.key(cx, cz));
  }

  getBlock(x: number, y: number, z: number): number {
    if (y < 0 || y >= WORLD_HEIGHT) return 0;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return 0;
    return chunk.blocks[blockIndex(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE)] ?? 0;
  }

  /** chunks are stored 256 tall; the array grows (in 64-block steps) only where something is built higher */
  private ensureCapacity(chunk: Chunk, index: number) {
    if (index < chunk.blocks.length) return;
    const layer = CHUNK_SIZE * CHUNK_SIZE;
    const needed = Math.min(WORLD_HEIGHT, (Math.floor(index / layer) + 1 + 63) & ~63);
    const bigger = new Uint8Array(needed * layer);
    bigger.set(chunk.blocks);
    chunk.blocks = bigger;
  }

  private setOrient(x: number, y: number, z: number, value: number) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const key = this.key(cx, cz);
    let map = this.orient.get(key);
    if (!map) this.orient.set(key, (map = new Map()));
    map.set(blockIndex(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE), value);
    this.markDirty(cx, cz);
  }

  private setBlock(x: number, y: number, z: number, id: number) {
    if (y < 0 || y >= WORLD_HEIGHT) return;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return;
    const lx = x - cx * CHUNK_SIZE;
    const lz = z - cz * CHUNK_SIZE;
    if (blockIndex(lx, y, lz) >= chunk.blocks.length) {
      if (id === 0) return;
      this.ensureCapacity(chunk, blockIndex(lx, y, lz));
    }
    chunk.blocks[blockIndex(lx, y, lz)] = id;
    const chunkKey = this.key(cx, cz);
    let chunkEdits = this.edits.get(chunkKey);
    if (!chunkEdits) this.edits.set(chunkKey, (chunkEdits = new Map()));
    chunkEdits.set(blockIndex(lx, y, lz), id);
    this.orient.get(chunkKey)?.delete(blockIndex(lx, y, lz));

    const colIdx = lx + lz * CHUNK_SIZE;
    if (id !== 0 && y > chunk.heights[colIdx]) chunk.heights[colIdx] = y;
    if (id === 0 && y === chunk.heights[colIdx]) {
      let top = 0;
      for (let yy = y; yy >= 0; yy--) {
        if (chunk.blocks[blockIndex(lx, yy, lz)] !== 0) {
          top = yy;
          break;
        }
      }
      chunk.heights[colIdx] = top;
    }

    this.markDirty(cx, cz);
    if (lx === 0) this.markDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz);
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1);

    if (id === 0) {
      this.fluidLevels.delete(`${x},${y},${z}`);
      this.wakeFluids(x, y, z);
      const above = this.getBlock(x, y + 1, z);
      if (isCross(above)) {
        this.setBlock(x, y + 1, z, 0);
        this.spawnBurst(x + 0.5, y + 1.4, z + 0.5, BLOCKS[above]?.color ?? 0x66aa44, 4, 1.2);
      }
    } else if (isLiquid(id)) {
      this.fluidQueue.add(`${x},${y},${z}`);
    }
  }

  private markDirty(cx: number, cz: number) {
    const chunk = this.getChunk(cx, cz);
    if (!chunk || chunk.dirty) return;
    chunk.dirty = true;
    this.meshQueue.unshift(this.key(cx, cz));
  }

  private wakeFluids(x: number, y: number, z: number) {
    const neighbours: [number, number, number][] = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y, z + 1],
      [x, y, z - 1],
      [x, y + 1, z],
    ];
    for (const [nx, ny, nz] of neighbours) {
      if (isLiquid(this.getBlock(nx, ny, nz))) this.fluidQueue.add(`${nx},${ny},${nz}`);
    }
  }

  private prepareWorld(seed: number, oreBoost: boolean) {
    this.seed = seed;
    this.far.reset(seed, this.mode === "cold");
    this.farNearR = -1;
    this.oreBoost = oreBoost;
    this.chunks.forEach((chunk) => this.disposeChunkMeshes(chunk));
    this.chunks.clear();
    this.meshQueue = [];
    this.fluidLevels.clear();
    this.fluidQueue.clear();
    this.mobs.slice().forEach((mob) => this.removeMob(mob));
    this.mobs = [];
    this.arrows.forEach((arrow) => this.arrowRoot.remove(arrow.mesh));
    this.arrows = [];
    this.clearItemDrops();
    this.respawnPos = null;

    const spawn = this.findSpawn();
    this.spawnPos.copy(spawn);
    const scx = Math.floor(spawn.x / CHUNK_SIZE);
    const scz = Math.floor(spawn.z / CHUNK_SIZE);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) this.ensureChunk(scx + dx, scz + dz);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) this.buildChunkMesh(this.ensureChunk(scx + dx, scz + dz));
  }

  private findSpawn(): THREE.Vector3 {
    for (let r = 0; r < 64; r++) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + r * 0.7;
        const x = Math.round(Math.cos(angle) * r * 8);
        const z = Math.round(Math.sin(angle) * r * 8);
        const col = sampleColumn(x, z, this.seed, this.mode === "cold");
        if (col.biome !== Biome.OCEAN && col.height > SEA_LEVEL + 1 && col.height < SEA_LEVEL + 24) {
          return new THREE.Vector3(x + 0.5, col.height + 1.2, z + 0.5);
        }
      }
    }
    return new THREE.Vector3(0.5, SEA_LEVEL + 6, 0.5);
  }

  private placePlayerAtSpawn() {
    const spawn = this.respawnPos ?? this.spawnPos;
    const bx = Math.floor(spawn.x);
    const bz = Math.floor(spawn.z);
    let y = Math.floor(spawn.y);
    while (y < WORLD_HEIGHT - 2 && (isSolid(this.getBlock(bx, y, bz)) || isSolid(this.getBlock(bx, y + 1, bz)))) y++;
    this.player.pos.set(spawn.x, y + 0.05, spawn.z);
    this.player.vel.set(0, 0, 0);
    this.player.yaw = Math.PI * 0.25;
    this.player.pitch = -0.12;
    this.player.onGround = true;
    this.player.flying = false;
    this.player.fallStart = this.player.pos.y;
    this.camera.position.set(this.player.pos.x, this.player.pos.y + EYE_HEIGHT, this.player.pos.z);
    this.camera.rotation.set(this.player.pitch, this.player.yaw, 0, "YXZ");
  }

  private resetRunValues() {
    this.score = 0;
    this.timeLeft = RUN_TIME;
    this.combo = 0;
    this.comboTimer = 0;
    this.bestCombo = 0;
    this.oresMined = 0;
    this.blocksPlaced = 0;
    this.blocksMined = 0;
    this.kills = 0;
    this.health = MAX_HEALTH;
    this.regen = 0;
    this.hurtCooldown = 0;
    this.armorItem = 0;
    this.minedCounts = {};
    this.selected = 0;
    this.mining = false;
    this.target = null;
    this.progress = 0;
    this.trauma = 0;
    this.fovKick = 0;
    this.particles = [];
    this.pendingExplosions = [];
    this.jumpBuffer = 0;
    this.dayTime = this.mode === "sprint" ? 0.3 : 0.24;
    this.hunger = MAX_HUNGER;
    this.hungerTimer = 0;
    this.backpack = new Array(27).fill(0).map(() => ({ id: 0, count: 0 }));
    if (this.mode === "creative") {
      this.hotbar = CREATIVE_HOTBAR.map((id: number) => ({ id, count: -1 }));
    } else if (this.mode === "sprint") {
      this.hotbar = SPRINT_HOTBAR.map((id: number, index: number) => ({
        id,
        count: isItem(id) ? -1 : index === 3 ? 32 : index === 4 ? 16 : 0,
      }));
    } else if (this.mode === "cold") {
      this.hotbar = COLD_HOTBAR.map((id: number) => ({
        id,
        count: isItem(id) ? (id === I.SNOWBALL ? 16 : 1) : id === B.TORCH ? 16 : 8,
      }));
    } else {
      // survival: you start with absolutely nothing
      this.hotbar = new Array(9).fill(0).map(() => ({ id: 0, count: 0 }));
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Inventory helpers                                                 */
  /* ------------------------------------------------------------------ */
  private allSlots(): HotbarSlot[] {
    return [...this.hotbar, ...this.backpack];
  }

  /** add items, returns how many could not fit */
  private addItem(id: number, count: number): number {
    if (id === 0 || count <= 0) return 0;
    if (this.mode === "creative") return 0;
    const max = stackSize(id);
    let left = count;
    const slots = this.allSlots();
    for (const slot of slots) {
      if (left <= 0) break;
      if (slot.id !== id || slot.count < 0) continue;
      const space = max - slot.count;
      if (space <= 0) continue;
      const take = Math.min(space, left);
      slot.count += take;
      left -= take;
    }
    for (const slot of slots) {
      if (left <= 0) break;
      if (slot.id !== 0 && slot.count > 0) continue;
      const take = Math.min(max, left);
      slot.id = id;
      slot.count = take;
      left -= take;
    }
    if (left < count) {
      if (!this.container) this.sfx.pickup();
      this.refreshHandModel();
      this.emitStats(true);
    }
    return left;
  }

  private countItem(id: number) {
    if (this.mode === "creative") return 999;
    return this.allSlots().reduce((sum, slot) => (slot.id === id && slot.count > 0 ? sum + slot.count : sum), 0);
  }

  private removeItem(id: number, count: number) {
    let left = count;
    for (const slot of this.allSlots()) {
      if (left <= 0) break;
      if (slot.id !== id || slot.count <= 0) continue;
      const take = Math.min(slot.count, left);
      slot.count -= take;
      left -= take;
      if (slot.count === 0) slot.id = 0;
    }
    return left === 0;
  }

  /** consume one of the held item (survival only) */
  private consumeHeld() {
    const slot = this.hotbar[this.selected];
    if (!slot || slot.count < 0) return;
    slot.count -= 1;
    if (slot.count <= 0) {
      slot.id = 0;
      slot.count = 0;
      this.refreshHandModel();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Containers: inventory 2×2, crafting table 3×3, furnace             */
  /* ------------------------------------------------------------------ */
  private emptySlot(): HotbarSlot {
    return { id: 0, count: 0 };
  }

  private craftSize() {
    return this.container === "table" ? 3 : 2;
  }

  private currentRecipe(): Recipe | null {
    if (!this.container || this.container === "furnace" || this.container === "chest") return null;
    const size = this.craftSize();
    const ids = this.craftGrid.slice(0, size * size).map((slot) => (slot.count > 0 ? slot.id : 0));
    return matchRecipe(ids, size);
  }

  private chestSlots() {
    return this.chestKey ? this.chests.get(this.chestKey) ?? null : null;
  }

  private furnaceState() {
    return this.furnaceKey ? this.furnaces.get(this.furnaceKey) ?? null : null;
  }

  openInventory() {
    if (this.screen !== "playing" || this.container) return;
    this.openContainer("inventory");
  }

  private openContainer(type: ContainerType, key: string | null = null) {
    this.container = type;
    this.furnaceKey = type === "furnace" ? key : null;
    this.chestKey = type === "chest" ? key : null;
    if (type === "chest" && key && !this.chests.has(key)) {
      this.chests.set(key, Array.from({ length: CHEST_SLOTS }, () => this.emptySlot()));
    }
    if (type === "furnace" && key && !this.furnaces.has(key)) {
      this.furnaces.set(key, { input: this.emptySlot(), fuel: this.emptySlot(), output: this.emptySlot(), burn: 0, burnMax: 0, cook: 0 });
    }
    this.stopInput();
    this.inputEnabled = false;
    this.cb.onContainer(type);
    this.releaseLock();
    this.sfx.open();
    this.emitStats(true);
  }

  closeContainer(silent = false) {
    if (!this.container) return;
    for (const slot of this.craftGrid) {
      if (slot.id !== 0 && slot.count > 0) this.addItem(slot.id, slot.count);
      slot.id = 0;
      slot.count = 0;
    }
    if (this.cursor.id !== 0 && this.cursor.count !== 0) {
      const left = this.cursor.count < 0 ? this.addItem(this.cursor.id, 1) : this.addItem(this.cursor.id, this.cursor.count);
      if (left > 0) this.popup(t("invFull"), t("invFullSub"), "info");
    }
    this.cursor = this.emptySlot();
    this.container = null;
    this.furnaceKey = null;
    this.chestKey = null;
    this.inputEnabled = true;
    if (!silent) this.sfx.close();
    this.cb.onContainer(null);
    this.refreshHandModel();
    this.emitStats(true);
    if (!silent) this.tryLock();
  }

  private slotRef(area: SlotArea, index: number): HotbarSlot | null {
    if (area === "inv") return this.allSlots()[index] ?? null;
    if (area === "craft") return index < this.craftSize() ** 2 ? this.craftGrid[index] : null;
    if (area === "chest") return this.chestSlots()?.[index] ?? null;
    const furnace = this.furnaceState();
    if (!furnace) return null;
    if (area === "fIn") return furnace.input;
    if (area === "fFuel") return furnace.fuel;
    if (area === "fOut") return furnace.output;
    return null;
  }

  private accepts(area: SlotArea, id: number) {
    if (area === "fFuel") return FUEL[id] !== undefined;
    if (area === "fIn") return SMELTING[id] !== undefined;
    if (area === "fOut" || area === "result") return false;
    return true;
  }

  private freeSpace(id: number) {
    const max = stackSize(id);
    return this.allSlots().reduce((sum, slot) => {
      if (slot.id === 0 || slot.count === 0) return sum + max;
      if (slot.id === id && slot.count > 0) return sum + Math.max(0, max - slot.count);
      return sum;
    }, 0);
  }

  /** merge a stack into a list of target slots; mutates `slot` */
  private moveInto(slot: HotbarSlot, targets: HotbarSlot[]) {
    if (slot.count <= 0) {
      const empty = targets.find((target) => target.id === 0 || target.count === 0);
      if (empty && slot.count < 0) {
        empty.id = slot.id;
        empty.count = slot.count;
        slot.id = 0;
        slot.count = 0;
      }
      return;
    }
    const max = stackSize(slot.id);
    for (const target of targets) {
      if (slot.count <= 0) break;
      if (target.id !== slot.id || target.count <= 0) continue;
      const move = Math.min(max - target.count, slot.count);
      target.count += move;
      slot.count -= move;
    }
    for (const target of targets) {
      if (slot.count <= 0) break;
      if (target.id !== 0 && target.count !== 0) continue;
      target.id = slot.id;
      target.count = slot.count;
      slot.count = 0;
    }
    if (slot.count <= 0) {
      slot.id = 0;
      slot.count = 0;
    }
  }

  clickSlot(area: SlotArea, index: number, button: "left" | "right" | "shift") {
    if (!this.container) return;
    if (area === "result") {
      this.takeResult(button === "shift");
      return;
    }
    const slot = this.slotRef(area, index);
    if (!slot) return;
    const cur = this.cursor;

    if (area === "fOut") {
      if (slot.count <= 0) return;
      if (button === "shift") this.moveInto(slot, this.allSlots());
      else if (cur.count === 0) {
        cur.id = slot.id;
        cur.count = slot.count;
        slot.id = 0;
        slot.count = 0;
      } else if (cur.id === slot.id && cur.count > 0) {
        const move = Math.min(stackSize(cur.id) - cur.count, slot.count);
        cur.count += move;
        slot.count -= move;
        if (slot.count === 0) slot.id = 0;
      }
      this.sfx.pickup();
      this.emitStats(true);
      return;
    }

    if (button === "shift") {
      if (slot.id === 0 || slot.count === 0) return;
      if (area !== "inv") this.moveInto(slot, this.allSlots());
      else {
        const chest = this.container === "chest" ? this.chestSlots() : null;
        if (chest) {
          this.moveInto(slot, chest);
          this.sfx.slot();
          this.refreshHandModel();
          this.emitStats(true);
          return;
        }
        const furnace = this.container === "furnace" ? this.furnaceState() : null;
        if (furnace && SMELTING[slot.id] !== undefined) this.moveInto(slot, [furnace.input]);
        else if (furnace && FUEL[slot.id] !== undefined) this.moveInto(slot, [furnace.fuel]);
        else this.moveInto(slot, index < 9 ? this.backpack : this.hotbar);
      }
      this.sfx.slot();
      this.refreshHandModel();
      this.emitStats(true);
      return;
    }

    const slotEmpty = slot.id === 0 || slot.count === 0;
    const curEmpty = cur.id === 0 || cur.count === 0;
    if (slotEmpty && curEmpty) return;
    const max = stackSize(slotEmpty ? cur.id : slot.id);
    const swap = () => {
      const tmp = { id: slot.id, count: slot.count };
      slot.id = cur.id;
      slot.count = cur.count;
      cur.id = tmp.id;
      cur.count = tmp.count;
    };

    if (button === "left") {
      if (curEmpty) {
        cur.id = slot.id;
        cur.count = slot.count;
        slot.id = 0;
        slot.count = 0;
      } else if (!this.accepts(area, cur.id)) {
        this.sfx.deny();
        return;
      } else if (slotEmpty) {
        slot.id = cur.id;
        slot.count = cur.count;
        cur.id = 0;
        cur.count = 0;
      } else if (slot.id === cur.id && slot.count > 0 && cur.count > 0) {
        const move = Math.min(max - slot.count, cur.count);
        slot.count += move;
        cur.count -= move;
        if (cur.count === 0) cur.id = 0;
      } else swap();
    } else {
      if (curEmpty) {
        if (slot.count < 0) {
          cur.id = slot.id;
          cur.count = slot.count;
          slot.id = 0;
          slot.count = 0;
        } else {
          const half = Math.ceil(slot.count / 2);
          cur.id = slot.id;
          cur.count = half;
          slot.count -= half;
          if (slot.count === 0) slot.id = 0;
        }
      } else if (!this.accepts(area, cur.id)) {
        this.sfx.deny();
        return;
      } else if (slotEmpty) {
        if (cur.count < 0) swap();
        else {
          slot.id = cur.id;
          slot.count = 1;
          cur.count -= 1;
          if (cur.count === 0) cur.id = 0;
        }
      } else if (slot.id === cur.id && slot.count > 0 && cur.count > 0 && slot.count < max) {
        slot.count += 1;
        cur.count -= 1;
        if (cur.count === 0) cur.id = 0;
      } else swap();
    }
    this.sfx.slot();
    this.refreshHandModel();
    this.emitStats(true);
  }

  private consumeGrid() {
    const size = this.craftSize();
    for (let i = 0; i < size * size; i++) {
      const slot = this.craftGrid[i];
      if (slot.count > 0) {
        slot.count -= 1;
        if (slot.count === 0) slot.id = 0;
      }
    }
  }

  private takeResult(all: boolean) {
    const recipe = this.currentRecipe();
    if (!recipe) return;
    if (all) {
      let crafted = 0;
      for (let guard = 0; guard < 64; guard++) {
        const next = this.currentRecipe();
        if (!next || next.id !== recipe.id) break;
        if (this.freeSpace(next.out.id) < next.out.count) break;
        this.consumeGrid();
        this.addItem(next.out.id, next.out.count);
        crafted++;
      }
      if (!crafted) {
        this.sfx.deny();
        return;
      }
    } else {
      const cur = this.cursor;
      if (cur.count !== 0 && (cur.id !== recipe.out.id || cur.count < 0 || cur.count + recipe.out.count > stackSize(cur.id))) {
        this.sfx.deny();
        return;
      }
      this.consumeGrid();
      cur.id = recipe.out.id;
      cur.count = (cur.count > 0 ? cur.count : 0) + recipe.out.count;
    }
    this.sfx.craft();
    this.emitStats(true);
  }

  private available(id: number) {
    const inGrid = this.craftGrid.reduce((sum, slot) => (slot.id === id && slot.count > 0 ? sum + slot.count : sum), 0);
    return this.countItem(id) + inGrid;
  }

  canCraft(recipe: Recipe) {
    if (!this.container || this.container === "furnace" || this.container === "chest") return false;
    if (recipe.size > this.craftSize()) return false;
    return recipeNeeds(recipe).every((need) => this.available(need.id) >= need.count);
  }

  /** recipe book: lay the ingredients out on the grid */
  fillRecipe(recipeId: string) {
    const recipe = RECIPES.find((entry) => entry.id === recipeId);
    if (!recipe || !this.canCraft(recipe)) {
      this.sfx.deny();
      return;
    }
    for (const slot of this.craftGrid) {
      if (slot.id !== 0 && slot.count > 0) this.addItem(slot.id, slot.count);
      slot.id = 0;
      slot.count = 0;
    }
    const size = this.craftSize();
    recipeLayout(recipe, size).forEach((id, i) => {
      if (!id) return;
      if (this.removeItem(id, 1)) this.craftGrid[i] = { id, count: 1 };
    });
    this.sfx.slot();
    this.refreshHandModel();
    this.emitStats(true);
  }

  private updateFurnaces(dt: number) {
    this.furnaces.forEach((furnace, key) => {
      const target = SMELTING[furnace.input.id];
      const canSmelt =
        furnace.input.count > 0 &&
        target !== undefined &&
        (furnace.output.count === 0 || (furnace.output.id === target && furnace.output.count < stackSize(target)));
      if (furnace.burn > 0) furnace.burn = Math.max(0, furnace.burn - dt);
      if (canSmelt) {
        if (furnace.burn <= 0) {
          const value = FUEL[furnace.fuel.id];
          if (furnace.fuel.count > 0 && value) {
            furnace.burnMax = value * SMELT_TIME;
            furnace.burn = furnace.burnMax;
            furnace.fuel.count -= 1;
            if (furnace.fuel.count === 0) furnace.fuel.id = 0;
          }
        }
        if (furnace.burn > 0) {
          furnace.cook += dt;
          if (furnace.cook >= SMELT_TIME) {
            furnace.cook = 0;
            furnace.input.count -= 1;
            if (furnace.input.count === 0) furnace.input.id = 0;
            furnace.output.id = target;
            furnace.output.count += 1;
            if (this.container === "furnace" && this.furnaceKey === key) this.sfx.pickup();
          }
        } else furnace.cook = Math.max(0, furnace.cook - dt * 2);
      } else furnace.cook = 0;

      if (furnace.burn > 0 && Math.random() < dt * 4) {
        const [x, y, z] = key.split(",").map(Number);
        if (Math.abs(x - this.player.pos.x) < 24 && Math.abs(z - this.player.pos.z) < 24) {
          this.spawnSmoke(x + 0.5, y + 1.05, z + 0.5, 1);
        }
      }
    });
  }

  private containerUI(): ContainerUI {
    const recipe = this.currentRecipe();
    const furnace = this.furnaceState();
    return {
      container: this.container,
      cursor: { ...this.cursor },
      craftSize: this.craftSize(),
      craft: this.craftGrid.map((slot) => ({ ...slot })),
      result: recipe ? { ...recipe.out } : null,
      furnace: furnace
        ? {
            input: { ...furnace.input },
            fuel: { ...furnace.fuel },
            output: { ...furnace.output },
            burn: furnace.burnMax ? furnace.burn / furnace.burnMax : 0,
            cook: furnace.cook / SMELT_TIME,
          }
        : null,
      chest: this.container === "chest" ? (this.chestSlots() ?? []).map((slot) => ({ ...slot })) : null,
    };
  }

  dropHeld() {
    const slot = this.hotbar[this.selected];
    if (!slot || slot.id === 0 || slot.count < 0) return;
    slot.id = 0;
    slot.count = 0;
    this.refreshHandModel();
    this.emitStats(true);
  }

  private eatHeld() {
    const slot = this.hotbar[this.selected];
    if (!slot || !isItem(slot.id)) return false;
    const item = ITEMS[slot.id];
    if (!item?.food) return false;
    if (this.hunger >= MAX_HUNGER && this.health >= MAX_HEALTH) {
      this.popup(t("notHungry"), t("notHungrySub"), "info");
      return true;
    }
    this.hunger = Math.min(MAX_HUNGER, this.hunger + item.food);
    if (slot.id === I.ROTTEN_FLESH && Math.random() < 0.5) this.health = Math.max(1, this.health - 1);
    this.consumeHeld();
    this.sfx.eat();
    this.triggerSwing();
    this.emitStats(true);
    return true;
  }

  /* ------------------------------------------------------------------ */
  /*  Meshing                                                           */
  /* ------------------------------------------------------------------ */
  private disposeChunkMeshes(chunk: Chunk) {
    (["opaque", "cutout", "water"] as const).forEach((keyName) => {
      const mesh = chunk[keyName];
      if (mesh) {
        this.worldGroup.remove(mesh);
        mesh.geometry.dispose();
        chunk[keyName] = null;
      }
    });
    chunk.meshed = false;
  }

  private blockAtForMesh(chunk: Chunk, lx: number, y: number, lz: number): number {
    if (y < 0 || y >= WORLD_HEIGHT) return 0;
    if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) return chunk.blocks[blockIndex(lx, y, lz)] ?? 0;
    return this.getBlock(chunk.cx * CHUNK_SIZE + lx, y, chunk.cz * CHUNK_SIZE + lz);
  }

  private skyLight(chunk: Chunk, lx: number, y: number, lz: number) {
    let height: number;
    if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) height = chunk.heights[lx + lz * CHUNK_SIZE];
    else {
      const wx = chunk.cx * CHUNK_SIZE + lx;
      const wz = chunk.cz * CHUNK_SIZE + lz;
      const ncx = Math.floor(wx / CHUNK_SIZE);
      const ncz = Math.floor(wz / CHUNK_SIZE);
      const neighbour = this.getChunk(ncx, ncz);
      height = neighbour ? neighbour.heights[wx - ncx * CHUNK_SIZE + (wz - ncz * CHUNK_SIZE) * CHUNK_SIZE] : y;
    }
    if (y >= height) return 1;
    return clamp(1 - (height - y) * 0.085, 0.32, 1);
  }

  private buildChunkMesh(chunk: Chunk) {
    this.disposeChunkMeshes(chunk);

    const buffers = {
      opaque: { pos: [] as number[], uv: [] as number[], col: [] as number[], idx: [] as number[], count: 0 },
      cutout: { pos: [] as number[], uv: [] as number[], col: [] as number[], idx: [] as number[], count: 0 },
      water: { pos: [] as number[], uv: [] as number[], col: [] as number[], idx: [] as number[], count: 0 },
    };

    const originX = chunk.cx * CHUNK_SIZE;
    const originZ = chunk.cz * CHUNK_SIZE;

    const orientMap = this.orient.get(this.key(chunk.cx, chunk.cz));

    let maxY = SEA_LEVEL + 1;
    for (let i = 0; i < chunk.heights.length; i++) if (chunk.heights[i] > maxY) maxY = chunk.heights[i];
    maxY = Math.min(WORLD_HEIGHT - 1, maxY + 8);

    for (let y = 0; y <= maxY; y++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const id = chunk.blocks[blockIndex(lx, y, lz)];
          if (!id) continue;
          const def = BLOCKS[id];
          if (!def) continue;
          const light = def.emissive ? 1.18 : this.skyLight(chunk, lx, y, lz);

          /* ---- small 3D models (campfire) ---- */
          if (def.model) {
            const target = buffers.cutout;
            const shade = Math.min(1.25, light);
            const bx = originX + lx;
            const bz = originZ + lz;
            const turned = orientMap?.get(blockIndex(lx, y, lz)) === 1;
            for (const el of CAMPFIRE_ELEMENTS) {
              const f = el.from;
              const t = el.to;
              const origin = el.origin;
              const rot = el.rotation;
              const corner = (key: string): [number, number, number] => {
                const p: [number, number, number] = [
                  key[0] === "1" ? t[0] : f[0],
                  key[1] === "1" ? t[1] : f[1],
                  key[2] === "1" ? t[2] : f[2],
                ];
                const q = rotateModelPoint(p, origin, rot);
                // campfire turned a quarter turn around the block centre
                return turned ? ([16 - q[2], q[1], q[0]] as [number, number, number]) : q;
              };
              for (const face of MODEL_FACE_LIST) {
                const uv = el.faces[face.name]?.uv;
                if (!uv) continue;
                const [u1, v1, u2, v2] = uv;
                const uvs: [number, number][] = [
                  [u1, v1],
                  [u2, v1],
                  [u2, v2],
                  [u1, v2],
                ];
                const base = target.count;
                face.corners.forEach((key, i) => {
                  const [px, py, pz] = corner(key);
                  target.pos.push(bx + px / 16, y + py / 16, bz + pz / 16);
                  const [tu, tv] = atlasUV(CAMPFIRE_ATLAS.x + uvs[i][0], CAMPFIRE_ATLAS.y + uvs[i][1]);
                  target.uv.push(tu, tv);
                  target.col.push(shade * face.shade, shade * face.shade, shade * face.shade);
                });
                target.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
                target.count += 4;
              }
            }
            continue;
          }

          /* ---- cross-shaped plants ---- */
          if (def.cross) {
            const target = buffers.cutout;
            const rect = tileUV(def.top);
            const wx = originX + lx;
            const wz = originZ + lz;
            const jitter = ((Math.sin((wx * 12.9898 + wz * 78.233) * 43758.5453) % 1) + 1) % 1;
            const off = (jitter - 0.5) * 0.18;
            const h = def.id === B.TORCH ? 0.62 : 0.94;
            const diag: [number, number][][] = [
              [
                [0.5 - 0.42, 0.5 - 0.42],
                [0.5 + 0.42, 0.5 + 0.42],
              ],
              [
                [0.5 - 0.42, 0.5 + 0.42],
                [0.5 + 0.42, 0.5 - 0.42],
              ],
            ];
            for (const [[ax, az], [bx, bz]] of diag) {
              const base = target.count;
              const shade = Math.min(1.2, light * 1.05);
              const corners: [number, number, number][] = [
                [ax + off, 0, az + off],
                [bx + off, 0, bz + off],
                [bx + off, h, bz + off],
                [ax + off, h, az + off],
              ];
              corners.forEach((corner, i) => {
                target.pos.push(originX + lx + corner[0], y + corner[1], originZ + lz + corner[2]);
                if (i === 0) target.uv.push(rect[0], rect[1]);
                else if (i === 1) target.uv.push(rect[2], rect[1]);
                else if (i === 2) target.uv.push(rect[2], rect[3]);
                else target.uv.push(rect[0], rect[3]);
                target.col.push(shade, shade, shade);
              });
              target.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
              target.count += 4;
            }
            continue;
          }

          const liquid = def.liquid;
          const foliage = !!def.cutout;
          const alphaPass = def.translucent || liquid;

          for (let f = 0; f < 6; f++) {
            const face = FACES[f];
            const nx = lx + face.n[0];
            const ny = y + face.n[1];
            const nz = lz + face.n[2];
            const neighbour = this.blockAtForMesh(chunk, nx, ny, nz);
            if (neighbour === id) continue;
            if (!isTransparent(neighbour)) continue;
            if (!liquid && isLiquid(neighbour) && face.kind === "bottom") continue;
            if (id === B.LILY_PAD && face.kind !== "top") continue;

            let tile = face.kind === "top" ? def.top : face.kind === "bottom" ? def.bottom : def.side;
            let rotUV = false;
            const o = LOG_BLOCKS.has(id) ? orientMap?.get(blockIndex(lx, y, lz)) ?? 0 : 0;
            if (o) {
              const logAxis = o === 1 ? 0 : 2;
              if (face.n[logAxis] !== 0) tile = def.top;
              else {
                tile = def.side;
                // bark lines run along c0->c3 on the texture; turn it when that is not the log's axis
                const vAxis = face.c[3][0] !== face.c[0][0] ? 0 : face.c[3][1] !== face.c[0][1] ? 1 : 2;
                rotUV = vAxis !== logAxis;
              }
            }
            const rect = tileUV(tile);
            const target = alphaPass ? buffers.water : foliage ? buffers.cutout : buffers.opaque;
            const base = target.count;
            const shade = face.shade * light;
            const aoVals: number[] = [];

            for (let c = 0; c < 4; c++) {
              const corner = face.c[c];
              const yOffset = liquid && face.kind === "top" ? -0.1 : id === B.LILY_PAD ? -0.92 : 0;
              target.pos.push(originX + lx + corner[0], y + corner[1] + yOffset, originZ + lz + corner[2]);
              if (rotUV) {
                if (c === 0) target.uv.push(rect[0], rect[1]);
                else if (c === 1) target.uv.push(rect[0], rect[3]);
                else if (c === 2) target.uv.push(rect[2], rect[3]);
                else target.uv.push(rect[2], rect[1]);
              } else if (c === 0) target.uv.push(rect[0], rect[1]);
              else if (c === 1) target.uv.push(rect[2], rect[1]);
              else if (c === 2) target.uv.push(rect[2], rect[3]);
              else target.uv.push(rect[0], rect[3]);

              let occlusion = 0;
              if (!alphaPass) {
                const [s1, s2, cr] = face.ao[c];
                const a = isTransparent(this.blockAtForMesh(chunk, lx + s1[0], y + s1[1], lz + s1[2])) ? 0 : 1;
                const b = isTransparent(this.blockAtForMesh(chunk, lx + s2[0], y + s2[1], lz + s2[2])) ? 0 : 1;
                const c2 = isTransparent(this.blockAtForMesh(chunk, lx + cr[0], y + cr[1], lz + cr[2])) ? 0 : 1;
                occlusion = a && b ? 3 : a + b + c2;
              }
              const ao = 1 - occlusion * 0.17;
              aoVals.push(ao);
              const v = Math.min(1.25, shade * ao);
              target.col.push(v, v, v);
            }

            if (aoVals[0] + aoVals[2] < aoVals[1] + aoVals[3]) target.idx.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
            else target.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
            target.count += 4;
          }
        }
      }
    }

    const build = (data: typeof buffers.opaque, material: THREE.Material, renderOrder: number) => {
      if (!data.pos.length) return null;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(data.pos, 3));
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(data.uv, 2));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(data.col, 3));
      geometry.setIndex(data.idx);
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.matrixAutoUpdate = false;
      mesh.renderOrder = renderOrder;
      this.worldGroup.add(mesh);
      return mesh;
    };

    chunk.opaque = build(buffers.opaque, this.opaqueMaterial, 0);
    chunk.cutout = build(buffers.cutout, this.cutoutMaterial, 1);
    chunk.water = build(buffers.water, this.waterMaterial, 2);
    chunk.dirty = false;
    chunk.meshed = true;
  }

  /* ------------------------------------------------------------------ */
  /*  Streaming                                                         */
  /* ------------------------------------------------------------------ */
  private updateStreaming(budgetMs: number) {
    const pcx = Math.floor(this.player.pos.x / CHUNK_SIZE);
    const pcz = Math.floor(this.player.pos.z / CHUNK_SIZE);
    const rd = this.renderDistance;

    if (this.chunks.size > (rd * 2 + 5) ** 2) {
      this.chunks.forEach((chunk, key) => {
        if (Math.abs(chunk.cx - pcx) > rd + 2 || Math.abs(chunk.cz - pcz) > rd + 2) {
          this.disposeChunkMeshes(chunk);
          this.chunks.delete(key);
        }
      });
    }

    const start = performance.now();
    for (let ring = 0; ring <= rd; ring++) {
      for (let dz = -ring; dz <= ring; dz++) {
        for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
          const cx = pcx + dx;
          const cz = pcz + dz;
          const chunk = this.chunks.get(this.key(cx, cz));
          if (chunk && chunk.meshed && !chunk.dirty) continue;
          if (performance.now() - start > budgetMs) return;
          const target = chunk ?? this.ensureChunk(cx, cz);
          const neighbours: [number, number][] = [
            [cx + 1, cz],
            [cx - 1, cz],
            [cx, cz + 1],
            [cx, cz - 1],
          ];
          for (const [nx, nz] of neighbours) {
            if (this.chunks.has(this.key(nx, nz))) continue;
            this.ensureChunk(nx, nz);
            if (performance.now() - start > budgetMs) return;
          }
          this.buildChunkMesh(target);
          if (performance.now() - start > budgetMs) return;
        }
      }
    }

    while (this.meshQueue.length && performance.now() - start < budgetMs + 4) {
      const key = this.meshQueue.shift()!;
      const chunk = this.chunks.get(key);
      if (chunk && chunk.dirty) this.buildChunkMesh(chunk);
    }
  }

  /** the horizon terrain is hidden only where real chunks are already meshed, so there are never gaps */
  private updateFar(dt: number) {
    const pcx = Math.floor(this.camera.position.x / CHUNK_SIZE);
    const pcz = Math.floor(this.camera.position.z / CHUNK_SIZE);
    this.farTimer -= dt;
    if (this.farTimer <= 0) {
      this.farTimer = 0.25;
      const squareReady = (r: number) => {
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            if (!this.chunks.get(this.key(pcx + dx, pcz + dz))?.meshed) return false;
          }
        }
        return true;
      };
      while (this.farNearR >= 0 && !squareReady(this.farNearR)) this.farNearR--;
      while (this.farNearR < this.renderDistance && squareReady(this.farNearR + 1)) this.farNearR++;
    }
    const half = this.farNearR >= 0 ? (this.farNearR + 0.5) * CHUNK_SIZE : -1;
    this.far.update(this.camera.position.x, this.camera.position.z, (pcx + 0.5) * CHUNK_SIZE, (pcz + 0.5) * CHUNK_SIZE, half, 3);
  }

  private loadedRatio() {
    const pcx = Math.floor(this.player.pos.x / CHUNK_SIZE);
    const pcz = Math.floor(this.player.pos.z / CHUNK_SIZE);
    const rd = Math.min(this.renderDistance, 4);
    let total = 0;
    let ready = 0;
    for (let dz = -rd; dz <= rd; dz++) {
      for (let dx = -rd; dx <= rd; dx++) {
        total++;
        if (this.chunks.get(this.key(pcx + dx, pcz + dz))?.meshed) ready++;
      }
    }
    return total ? ready / total : 1;
  }

  /* ------------------------------------------------------------------ */
  /*  Fluid simulation                                                  */
  /* ------------------------------------------------------------------ */
  private stillHasFlow(x: number, y: number, z: number, id: number) {
    if (y > 0) {
      const below = this.getBlock(x, y - 1, z);
      if (isReplaceable(below) && below !== id) return true;
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n = this.getBlock(x + dx, y, z + dz);
      if (isReplaceable(n) && n !== id) return true;
    }
    return false;
  }

  private seedNearbyFluids() {
    const px = Math.floor(this.player.pos.x);
    const py = Math.floor(this.player.pos.y);
    const pz = Math.floor(this.player.pos.z);
    for (let dy = -3; dy <= 4; dy++) {
      for (let dz = -5; dz <= 5; dz++) {
        for (let dx = -5; dx <= 5; dx++) {
          const x = px + dx;
          const y = py + dy;
          const z = pz + dz;
          const id = this.getBlock(x, y, z);
          if (!isLiquid(id)) continue;
          if (this.stillHasFlow(x, y, z, id)) this.fluidQueue.add(`${x},${y},${z}`);
        }
      }
    }
  }

  private updateFluids(dt: number) {
    this.fluidTimer += dt;
    if (this.fluidTimer < 0.12) return;
    this.fluidTimer = 0;
    this.fluidTick++;
    if (this.fluidTick % 4 === 0) this.seedNearbyFluids();
    if (!this.fluidQueue.size) return;

    if (this.fluidQueue.size > 5000) {
      const trimmed = Array.from(this.fluidQueue).slice(0, 5000);
      this.fluidQueue = new Set(trimmed);
    }
    const pending = Array.from(this.fluidQueue);
    this.fluidQueue.clear();
    let processed = 0;

    for (const key of pending) {
      if (processed > 320) {
        this.fluidQueue.add(key);
        continue;
      }
      const [x, y, z] = key.split(",").map(Number);
      const id = this.getBlock(x, y, z);
      if (!isLiquid(id)) {
        this.fluidLevels.delete(key);
        continue;
      }
      const lava = id === B.LAVA;
      if (lava && this.fluidTick % 2 !== 0) {
        this.fluidQueue.add(key);
        continue;
      }
      processed++;

      const isSource = !this.fluidLevels.has(key);
      const level = isSource ? 0 : (this.fluidLevels.get(key) ?? 1);
      const maxRange = lava ? 4 : 7;
      const dist = Math.hypot(x - this.player.pos.x, z - this.player.pos.z);
      if (dist > this.renderDistance * CHUNK_SIZE * 0.85) {
        this.fluidQueue.add(key);
        continue;
      }

      let solidified = false;
      for (const [nx, ny, nz] of [
        [x + 1, y, z],
        [x - 1, y, z],
        [x, y, z + 1],
        [x, y, z - 1],
        [x, y + 1, z],
        [x, y - 1, z],
      ] as [number, number, number][]) {
        const other = this.getBlock(nx, ny, nz);
        if (lava && other === B.WATER) {
          this.setBlock(x, y, z, isSource ? B.OBSIDIAN : B.COBBLE);
          this.sfx.sizzle();
          this.spawnSmoke(x + 0.5, y + 1, z + 0.5, 8);
          solidified = true;
          break;
        }
        if (!lava && other === B.LAVA) {
          this.setBlock(nx, ny, nz, B.COBBLE);
          this.sfx.sizzle();
          this.spawnSmoke(nx + 0.5, ny + 1, nz + 0.5, 8);
        }
      }
      if (solidified) continue;

      const below = this.getBlock(x, y - 1, z);
      if (y > 0 && isReplaceable(below) && below !== id) {
        this.setBlock(x, y - 1, z, id);
        this.fluidLevels.set(`${x},${y - 1},${z}`, 1);
        this.fluidQueue.add(`${x},${y - 1},${z}`);
        if (this.stillHasFlow(x, y, z, id)) this.fluidQueue.add(key);
        continue;
      }

      if (level >= maxRange) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx;
        const nz = z + dz;
        const target = this.getBlock(nx, y, nz);
        if (!isReplaceable(target) || target === id) continue;
        const nkey = `${nx},${y},${nz}`;
        const existingLevel = this.fluidLevels.get(nkey);
        const nextLevel = level + 1;
        if (existingLevel !== undefined && existingLevel <= nextLevel) continue;
        this.setBlock(nx, y, nz, id);
        this.fluidLevels.set(nkey, nextLevel);
        this.fluidQueue.add(nkey);
      }
      if (this.stillHasFlow(x, y, z, id)) this.fluidQueue.add(key);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Decorative scene pieces                                           */
  /* ------------------------------------------------------------------ */
  private createStars() {
    const positions: number[] = [];
    for (let i = 0; i < 420; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95 + 0.05);
      const r = 420;
      positions.push(Math.sin(phi) * Math.cos(theta) * r, Math.abs(Math.cos(phi)) * r, Math.sin(phi) * Math.sin(theta) * r);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return points;
  }

  private createClouds() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.88, depthWrite: false });
    const mesh = new THREE.InstancedMesh(geometry, material, 160);
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let c = 0; c < 44 && i < 160; c++) {
      const cx = (Math.random() - 0.5) * 520;
      const cz = (Math.random() - 0.5) * 520;
      const cy = 78 + Math.random() * 16;
      const parts = 2 + Math.floor(Math.random() * 3);
      for (let p = 0; p < parts && i < 160; p++) {
        dummy.position.set(cx + (Math.random() - 0.5) * 26, cy + (Math.random() - 0.5) * 3, cz + (Math.random() - 0.5) * 22);
        dummy.scale.set(14 + Math.random() * 22, 3 + Math.random() * 2, 10 + Math.random() * 16);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.count = i;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  private makeBox(w: number, h: number, d: number, color: number, top?: number) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const colors: number[] = [];
    const base = new THREE.Color(color);
    const topColor = new THREE.Color(top ?? color);
    const shades = [0.84, 0.76, 1.0, 0.55, 0.92, 0.68];
    for (let f = 0; f < 6; f++) {
      const c = f === 2 ? topColor : base;
      for (let v = 0; v < 4; v++) colors.push(c.r * shades[f], c.g * shades[f], c.b * shades[f]);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true }));
  }

  /* ------------------------------------------------------------------ */
  /*  Hand / held item view model                                       */
  /* ------------------------------------------------------------------ */
  private makeBlockCube(id: number, size: number) {
    const def = BLOCKS[id];
    const geometry = new THREE.BoxGeometry(size, size, size);
    const uvAttr = geometry.getAttribute("uv") as THREE.BufferAttribute;
    const tiles = [def.side, def.side, def.top, def.bottom, def.side, def.side];
    const colors: number[] = [];
    const shades = [0.84, 0.76, 1.0, 0.55, 0.92, 0.68];
    tiles.forEach((tile, f) => {
      const [u0, v0, u1, v1] = tileUV(tile);
      uvAttr.setXY(f * 4 + 0, u0, v1);
      uvAttr.setXY(f * 4 + 1, u1, v1);
      uvAttr.setXY(f * 4 + 2, u0, v0);
      uvAttr.setXY(f * 4 + 3, u1, v0);
      for (let v = 0; v < 4; v++) colors.push(shades[f], shades[f], shades[f]);
    });
    uvAttr.needsUpdate = true;
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ map: this.atlasTexture, vertexColors: true, transparent: def.cross || def.translucent, alphaTest: def.cross ? 0.4 : 0 })
    );
  }

  /** a sword drawn from its Blockbench model (elements + texture), fitted to the hand */
  private makeModelSword(modelKey: string) {
    const model = SWORD_MODELS[modelKey];
    let tex = this.swordTextures.get(modelKey);
    if (!tex) {
      tex = new THREE.TextureLoader().load(model.texture);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      this.swordTextures.set(modelKey, tex);
    }
    const [tw, th] = model.size;
    type Quad = { corners: [number, number, number][]; uvs: [number, number][]; shade: number };
    const quads: Quad[] = [];
    for (const el of model.elements) {
      for (const face of MODEL_FACE_LIST) {
        const fu = el.faces[face.name];
        if (!fu) continue;
        const [u1, v1, u2, v2] = fu.uv;
        const corners = face.corners.map((key) => {
          const p: [number, number, number] = [
            key[0] === "1" ? el.to[0] : el.from[0],
            key[1] === "1" ? el.to[1] : el.from[1],
            key[2] === "1" ? el.to[2] : el.from[2],
          ];
          return rotateModelPoint(p, el.origin, el.rotation);
        });
        quads.push({ corners, uvs: [[u1, v1], [u2, v1], [u2, v2], [u1, v2]], shade: face.shade });
      }
    }
    // bounds, then scale so the longest side is one hand-length
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const q of quads) for (const c of q.corners) for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], c[i]);
      max[i] = Math.max(max[i], c[i]);
    }
    const longest = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
    const scale = 0.96 / longest;
    const pos: number[] = [];
    const uv: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    for (const q of quads) {
      const base = pos.length / 3;
      q.corners.forEach((c, i) => {
        pos.push((c[0] - (min[0] + max[0]) / 2) * scale, (c[1] - min[1]) * scale - 0.34, (c[2] - (min[2] + max[2]) / 2) * scale);
        uv.push(q.uvs[i][0] / tw, 1 - q.uvs[i][1] / th);
        col.push(q.shade, q.shade, q.shade);
      });
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geometry.setIndex(idx);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide })
    );
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  /** the campfire as its 3D model (same elements and atlas texture as the placed block), sized for the hand */
  private makeCampfireHeld() {
    type Quad = { corners: [number, number, number][]; uvs: [number, number][]; shade: number };
    const quads: Quad[] = [];
    for (const el of CAMPFIRE_ELEMENTS) {
      for (const face of MODEL_FACE_LIST) {
        const fu = el.faces[face.name];
        if (!fu) continue;
        const [u1, v1, u2, v2] = fu.uv;
        const corners = face.corners.map((key) => {
          const p: [number, number, number] = [
            key[0] === "1" ? el.to[0] : el.from[0],
            key[1] === "1" ? el.to[1] : el.from[1],
            key[2] === "1" ? el.to[2] : el.from[2],
          ];
          return rotateModelPoint(p, el.origin, el.rotation);
        });
        quads.push({ corners, uvs: [[u1, v1], [u2, v1], [u2, v2], [u1, v2]], shade: face.shade });
      }
    }
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const q of quads) for (const c of q.corners) for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], c[i]);
      max[i] = Math.max(max[i], c[i]);
    }
    const longest = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
    const scale = 0.58 / longest;
    const pos: number[] = [];
    const uv: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    for (const q of quads) {
      const base = pos.length / 3;
      q.corners.forEach((c, i) => {
        pos.push((c[0] - (min[0] + max[0]) / 2) * scale, (c[1] - (min[1] + max[1]) / 2) * scale, (c[2] - (min[2] + max[2]) / 2) * scale);
        const [tu, tv] = atlasUV(CAMPFIRE_ATLAS.x + q.uvs[i][0], CAMPFIRE_ATLAS.y + q.uvs[i][1]);
        uv.push(tu, tv);
        col.push(q.shade, q.shade, q.shade);
      });
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geometry.setIndex(idx);
    return new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ map: this.atlasTexture, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide })
    );
  }

  private makeToolModel(itemId: number) {
    const item = ITEMS[itemId];
    if (item.model) return this.makeModelSword(item.model);
    const group = new THREE.Group();
    const handle = this.makeBox(0.06, 0.52, 0.06, 0x7d5a2f, 0x9a7340);
    handle.position.set(0, -0.08, 0);
    group.add(handle);

    if (item.kind === "sword") {
      const blade = this.makeBox(0.08, 0.52, 0.03, item.color, item.accent);
      blade.position.set(0, 0.36, 0);
      const guard = this.makeBox(0.26, 0.07, 0.07, item.accent);
      guard.position.set(0, 0.12, 0);
      group.add(blade, guard);
    } else if (item.kind === "pickaxe") {
      const head = this.makeBox(0.42, 0.09, 0.08, item.color, item.accent);
      head.position.set(0, 0.22, 0);
      const tipL = this.makeBox(0.1, 0.12, 0.08, item.accent);
      tipL.position.set(-0.2, 0.15, 0);
      const tipR = this.makeBox(0.1, 0.12, 0.08, item.accent);
      tipR.position.set(0.2, 0.15, 0);
      group.add(head, tipL, tipR);
    } else if (item.kind === "axe") {
      const head = this.makeBox(0.2, 0.26, 0.08, item.color, item.accent);
      head.position.set(0.13, 0.2, 0);
      group.add(head);
    } else if (item.kind === "shovel") {
      const head = this.makeBox(0.16, 0.2, 0.06, item.color, item.accent);
      head.position.set(0, 0.26, 0);
      group.add(head);
    } else if (item.kind === "bow") {
      const limbTop = this.makeBox(0.05, 0.3, 0.05, item.color);
      limbTop.position.set(0, 0.3, 0);
      limbTop.rotation.z = 0.25;
      const limbBottom = this.makeBox(0.05, 0.3, 0.05, item.color);
      limbBottom.position.set(0, -0.3, 0);
      limbBottom.rotation.z = -0.25;
      const grip = this.makeBox(0.07, 0.24, 0.07, 0x6b4a27);
      const string = this.makeBox(0.012, 0.86, 0.012, item.accent);
      string.position.set(-0.11, 0, 0);
      group.add(limbTop, limbBottom, grip, string);
    }
    group.scale.setScalar(0.8);
    return group;
  }

  private refreshHandModel() {
    const slot = this.hotbar[this.selected];
    const id = slot?.id ?? 0;
    if (id === this.handShownId) return;
    this.handShownId = id;
    if (this.handContent) {
      this.handPivot.remove(this.handContent);
      this.handContent.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      this.handContent = null;
    }
    if (!slot) return;

    if (isItem(slot.id)) {
      const tool = this.makeToolModel(slot.id);
      tool.position.set(0.02, 0.12, -0.42);
      tool.rotation.set(-0.5, 0.2, -0.35);
      this.handContent = tool;
      this.handPivot.add(tool);
      this.handArm.visible = true;
    } else if (BLOCKS[slot.id]) {
      const cube = BLOCKS[slot.id].model && slot.id === B.CAMPFIRE ? this.makeCampfireHeld() : this.makeBlockCube(slot.id, 0.42);
      cube.position.set(0.02, 0.1, -0.5);
      cube.rotation.set(0.25, 0.75, 0);
      this.handContent = cube;
      this.handPivot.add(cube);
      this.handArm.visible = true;
    }
  }

  private triggerSwing() {
    this.swing = 0;
    this.swingActive = true;
  }

  private updateHand(dt: number) {
    const visible = this.screen === "playing";
    this.handRig.visible = visible;
    if (!visible) return;

    if (this.swingActive) {
      this.swing += dt * 4.6;
      if (this.swing >= 1) {
        this.swing = 0;
        this.swingActive = this.mining;
      }
    }
    const s = this.swingActive ? Math.sin(this.swing * Math.PI) : 0;
    const bobX = Math.cos(this.player.bob) * 0.016 * (this.player.onGround ? 1 : 0.3);
    const bobY = Math.sin(this.player.bob * 2) * 0.014 * (this.player.onGround ? 1 : 0.3);
    this.handPivot.rotation.x = -s * 1.1;
    this.handPivot.rotation.z = s * 0.35;
    this.handPivot.position.set(bobX - s * 0.06, bobY - s * 0.1, -s * 0.12);
    this.handRig.position.y = -0.42 + bobY * 0.6 + (this.player.swimming ? -0.05 : 0);
  }

  /* ------------------------------------------------------------------ */
  /*  Mobs & combat                                                     */
  /* ------------------------------------------------------------------ */
  private createMob(kind: number, x: number, y: number, z: number): Mob {
    const model = createMobModel(kind);
    model.root.position.set(x, y, z);
    this.mobRoot.add(model.root);
    const dir = Math.random() * Math.PI * 2;
    return {
      model,
      group: model.root,
      legs: model.legs,
      vel: new THREE.Vector3(),
      dir,
      yaw: -dir + Math.PI / 2,
      timer: 0,
      walk: 0,
      kind,
      hp: kind === 3 || kind === 5 || kind === 6 ? 20 : kind === 7 ? 16 : kind === 4 ? 4 : 10,
      hostile: kind === 3 || kind === 5 || kind === 6 || kind === 7,
      hurt: 0,
      attackCd: 0,
      flee: 0,
      graze: 0,
      dying: 0,
      soundTimer: 3 + Math.random() * 12,
      onGround: false,
    };
  }

  private removeMob(mob: Mob) {
    this.mobRoot.remove(mob.group);
    mob.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
    mob.model.material.dispose();
    this.mobs = this.mobs.filter((m) => m !== mob);
  }

  private spawnMobs(reset: boolean) {
    if (reset) {
      this.mobs.slice().forEach((mob) => this.removeMob(mob));
      this.mobs = [];
    }
    const night = this.daylight < 0.4;
    let guard = 0;
    while (this.mobs.length < MAX_MOBS && guard++ < 40) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 26;
      const x = Math.floor(this.player.pos.x + Math.cos(angle) * dist);
      const z = Math.floor(this.player.pos.z + Math.sin(angle) * dist);
      if (!this.getChunk(Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE))) continue;
      const col = sampleColumn(x, z, this.seed);
      if (col.height <= SEA_LEVEL + 1 || col.biome === Biome.OCEAN) continue;
      const hostile = night && Math.random() < (this.mode === "survival" ? 0.7 : 0.55);
      const roll = Math.random();
      const passive = roll < 0.27 ? 0 : roll < 0.52 ? 1 : roll < 0.77 ? 2 : 4;
      const pick = Math.random();
      const hostileKind = pick < 0.4 ? MOB.ZOMBIE : pick < 0.62 ? MOB.SKELETON : pick < 0.82 ? MOB.CREEPER : MOB.SPIDER;
      this.mobs.push(this.createMob(hostile ? hostileKind : passive, x + 0.5, col.height + 1.02, z + 0.5));
    }
  }

  private mobAt(x: number, y: number, z: number) {
    return this.mobs.some((mob) => {
      if (mob.dying > 0) return false;
      const p = mob.group.position;
      return Math.floor(p.x) === x && Math.floor(p.z) === z && y >= Math.floor(p.y) && y <= Math.floor(p.y + 1.8);
    });
  }

  /** closest mob under the crosshair within reach */
  private pickMob(): Mob | null {
    this.tempDir.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const origin = this.camera.position;
    let best: Mob | null = null;
    let bestDist = REACH;
    for (const mob of this.mobs) {
      if (mob.dying > 0) continue;
      const p = mob.group.position;
      this.tempVec.set(p.x - origin.x, p.y + mob.model.height * 0.55 - origin.y, p.z - origin.z);
      const along = this.tempVec.dot(this.tempDir);
      if (along < 0 || along > bestDist) continue;
      const perp = Math.sqrt(Math.max(0, this.tempVec.lengthSq() - along * along));
      if (perp > Math.max(0.55, mob.model.width)) continue;
      best = mob;
      bestDist = along;
    }
    return best;
  }

  private attackMob(mob: Mob, damage: number) {
    if (this.attackCd > 0 || mob.dying > 0) return;
    this.attackCd = 0.34;
    mob.hp -= damage;
    mob.hurt = 0.3;
    mob.flee = 5;
    const dir = new THREE.Vector3(mob.group.position.x - this.player.pos.x, 0, mob.group.position.z - this.player.pos.z).normalize();
    mob.vel.x += dir.x * 7;
    mob.vel.z += dir.z * 7;
    mob.vel.y = Math.max(mob.vel.y, 4.5);
    this.sfx.hit(damage >= 6);
    this.sfx.mobHurt(mob.kind);
    this.spawnBurst(mob.group.position.x, mob.group.position.y + 1, mob.group.position.z, 0xc23a32, 8, 2.4);
    this.trauma = Math.min(1, this.trauma + 0.12);
    if (mob.hp <= 0) this.killMob(mob);
  }

  private killMob(mob: Mob) {
    const p = mob.group.position;
    this.spawnBurst(p.x, p.y + 0.8, p.z, 0xb8302a, 8, 2.2);
    mob.dying = 0.75;
    this.kills++;
    this.sfx.mobHurt(mob.kind);
    if (this.mode !== "creative") {
      (MOB_DROPS[mob.kind] ?? []).forEach((drop) => {
        if (drop.chance !== undefined && Math.random() > drop.chance) return;
        const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
        if (count > 0) this.addItem(drop.id, count);
      });
    }
    if (this.mode === "sprint") {
      const gain = mob.hostile ? 150 : 60;
      this.score += gain;
      this.timeLeft = Math.min(140, this.timeLeft + (mob.hostile ? 1.2 : 0.5));
      this.cb.onPopup({ id: ++this.popupId, text: `+${gain}`, sub: mob.hostile ? t("zombieSlain") : t("mobDefeated"), kind: "combat" });
    } else {
      this.cb.onPopup({ id: ++this.popupId, text: t("defeated"), sub: mob.hostile ? "zombie" : "", kind: "combat" });
    }
  }

  private shootSnowball() {
    this.tempDir.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const mesh = this.makeBox(0.18, 0.18, 0.18, 0xffffff, 0xe1f5fe);
    mesh.position.copy(this.camera.position).addScaledVector(this.tempDir, 0.5);
    this.arrowRoot.add(mesh);
    this.arrows.push({ mesh, vel: this.tempDir.clone().multiplyScalar(28), life: 0 });
    (mesh.userData as { damage: number; isSnowball?: boolean }).damage = 2;
    (mesh.userData as { isSnowball?: boolean }).isSnowball = true;
    this.sfx.swing();
    this.triggerSwing();
  }

  private shootMobArrow(mob: Mob) {
    const origin = mob.group.position.clone().add(new THREE.Vector3(0, 1.3, 0));
    const target = this.player.pos.clone().add(new THREE.Vector3(0, 0.9, 0));
    const dir = target.sub(origin).normalize();
    const mesh = this.makeBox(0.08, 0.08, 0.6, 0xd8cdb6, 0xf2ead4);
    mesh.position.copy(origin).addScaledVector(dir, 0.5);
    mesh.lookAt(mesh.position.clone().add(dir));
    this.arrowRoot.add(mesh);
    this.arrows.push({ mesh, vel: dir.multiplyScalar(24), life: 0 });
    (mesh.userData as { damage: number; fromMob?: boolean }).damage = 3;
    (mesh.userData as { fromMob?: boolean }).fromMob = true;
    this.sfx.bowShoot();
  }

  private shootArrow(damage: number) {
    if (this.attackCd > 0) return;
    this.attackCd = 0.45;
    this.tempDir.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const mesh = this.makeBox(0.08, 0.08, 0.6, 0xd8cdb6, 0xf2ead4);
    mesh.position.copy(this.camera.position).addScaledVector(this.tempDir, 0.6);
    mesh.lookAt(mesh.position.clone().add(this.tempDir));
    this.arrowRoot.add(mesh);
    this.arrows.push({ mesh, vel: this.tempDir.clone().multiplyScalar(34), life: 0 });
    this.sfx.bowShoot();
    this.fovKick = Math.max(this.fovKick, 1.2);
    (mesh.userData as { damage: number }).damage = damage;
  }

  private updateArrows(dt: number) {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arrow = this.arrows[i];
      arrow.life += dt;
      arrow.vel.y -= 12 * dt;
      const step = arrow.vel.clone().multiplyScalar(dt);
      arrow.mesh.position.add(step);
      arrow.mesh.lookAt(arrow.mesh.position.clone().add(arrow.vel));

      const p = arrow.mesh.position;
      const damage = (arrow.mesh.userData as { damage?: number }).damage ?? 5;
      let dead = arrow.life > 5;

      const isSnow = (arrow.mesh.userData as { isSnowball?: boolean }).isSnowball;
      const fromMob = (arrow.mesh.userData as { fromMob?: boolean }).fromMob;

      if (isSolid(this.getBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)))) {
        if (isSnow) {
          this.sfx.broke("snow");
          this.spawnBurst(p.x, p.y, p.z, 0xffffff, 8, 1.8);
        } else {
          this.sfx.arrowHit();
          this.spawnBurst(p.x, p.y, p.z, 0xcfc3a8, 4, 1.4);
        }
        dead = true;
      } else if (fromMob) {
        // Arrow hitting player
        const dist = Math.hypot(p.x - this.player.pos.x, p.z - this.player.pos.z);
        if (dist < 0.65 && p.y > this.player.pos.y && p.y < this.player.pos.y + PLAYER_HEIGHT) {
          this.damagePlayer(damage, "skeleton");
          this.sfx.arrowHit();
          dead = true;
        }
      } else {
        for (const mob of this.mobs) {
          if (mob.dying > 0) continue;
          const mp = mob.group.position;
          if (Math.abs(mp.x - p.x) < 0.75 && Math.abs(mp.z - p.z) < 0.75 && p.y > mp.y - 0.2 && p.y < mp.y + mob.model.height + 0.3) {
            this.attackCd = 0;
            this.attackMob(mob, damage);
            if (isSnow) {
              this.sfx.broke("snow");
              this.spawnBurst(p.x, p.y, p.z, 0xffffff, 10, 2.0);
            } else {
              this.sfx.arrowHit();
            }
            dead = true;
            break;
          }
        }
      }
      if (dead) {
        this.arrowRoot.remove(arrow.mesh);
        arrow.mesh.geometry.dispose();
        this.arrows.splice(i, 1);
      }
    }
  }

  private updateMobs(dt: number) {
    const night = this.daylight < 0.4;
    for (const mob of this.mobs.slice()) {
      const p = mob.group.position;
      const model = mob.model;

      /* death: tip over, flash red, then poof */
      if (mob.dying > 0) {
        mob.dying -= dt;
        model.body.rotation.z = Math.min(Math.PI / 2, model.body.rotation.z + dt * 5);
        model.material.color.setRGB(1, 0.3, 0.3);
        if (mob.dying <= 0) {
          this.spawnSmoke(p.x, p.y + 0.5, p.z, 12);
          this.removeMob(mob);
        }
        continue;
      }

      const dx = this.player.pos.x - p.x;
      const dz = this.player.pos.z - p.z;
      const distToPlayer = Math.hypot(dx, dz);
      if (distToPlayer > this.renderDistance * CHUNK_SIZE * 0.9) {
        this.removeMob(mob);
        continue;
      }

      mob.hurt = Math.max(0, mob.hurt - dt);
      mob.flee = Math.max(0, mob.flee - dt);
      mob.attackCd = Math.max(0, mob.attackCd - dt);
      mob.timer -= dt;
      mob.graze = Math.max(0, mob.graze - dt);

      if (mob.hostile && !night && Math.random() < dt * 0.4) {
        this.spawnSmoke(p.x, p.y + 1, p.z, 10);
        this.removeMob(mob);
        continue;
      }

      /* behaviour */
      let speed = 0;
      if (mob.kind === MOB.CREEPER && distToPlayer < 16) {
        // Creeper stalk & hiss
        mob.dir = Math.atan2(dz, dx);
        if (distToPlayer > 2.8) {
          speed = 2.8;
        } else {
          speed = 0;
          if (mob.attackCd <= 0) {
            this.sfx.creeperHiss();
            mob.attackCd = 1.5;
          }
          // Swelling animation
          mob.group.scale.setScalar(1 + (1.5 - mob.attackCd) * 0.4);
          if (mob.attackCd < 0.1) {
            this.explode(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
            this.removeMob(mob);
            continue;
          }
        }
      } else if (mob.kind === MOB.SKELETON && distToPlayer < 18) {
        // Skeleton ranged aim & shoot
        mob.dir = Math.atan2(dz, dx);
        speed = distToPlayer < 6 ? -1.5 : distToPlayer > 12 ? 2.2 : 0;
        if (mob.attackCd <= 0 && distToPlayer < 15) {
          mob.attackCd = 2.2 + Math.random() * 0.8;
          this.shootMobArrow(mob);
        }
      } else if (mob.hostile && distToPlayer < 18) {
        mob.dir = Math.atan2(dz, dx);
        const spider = mob.kind === MOB.SPIDER;
        speed = spider ? 3.5 : 2.5;
        if (distToPlayer < (spider ? 1.8 : 1.6) && Math.abs(this.player.pos.y - p.y) < 2 && mob.attackCd <= 0) {
          mob.attackCd = spider ? 0.9 : 1.1;
          this.damagePlayer(spider ? 2 : 3, spider ? "spider" : "zombie");
        }
      } else if (mob.flee > 0) {
        if (mob.timer <= 0) {
          mob.timer = 0.6;
          mob.dir = Math.atan2(-dz, -dx) + (Math.random() - 0.5) * 1.2;
        }
        speed = mob.kind === 4 ? 3.6 : 4.2;
      } else if (mob.graze > 0) {
        speed = 0;
        if (mob.graze < 0.1 && mob.kind === 1) {
          const bx = Math.floor(p.x);
          const by = Math.floor(p.y - 0.5);
          const bz = Math.floor(p.z);
          if (this.getBlock(bx, by, bz) === B.GRASS) this.setBlock(bx, by, bz, B.DIRT);
          else if (isCross(this.getBlock(bx, by + 1, bz))) this.setBlock(bx, by + 1, bz, 0);
        }
      } else {
        if (mob.timer <= 0) {
          mob.timer = 1.6 + Math.random() * 4;
          if ((mob.kind === 1 || mob.kind === 2) && Math.random() < 0.3) {
            mob.graze = 2.2 + Math.random() * 1.5;
          } else {
            mob.dir = Math.random() * Math.PI * 2;
          }
        }
        speed = mob.timer > 1 && mob.graze <= 0 ? (mob.kind === 4 ? 1.2 : 1.3) : 0;
      }

      /* physics */
      mob.vel.x = lerp(mob.vel.x, Math.cos(mob.dir) * speed, Math.min(1, dt * 6));
      mob.vel.z = lerp(mob.vel.z, Math.sin(mob.dir) * speed, Math.min(1, dt * 6));
      mob.vel.y -= GRAVITY * dt;
      if (mob.kind === 4 && mob.vel.y < -2.4) mob.vel.y = -2.4;
      const feet = this.getBlock(Math.floor(p.x), Math.floor(p.y + 0.3), Math.floor(p.z));
      const inWater = isLiquid(feet);
      if (inWater) {
        mob.vel.y = Math.min(mob.vel.y, -0.6);
        speed *= 0.25;
        mob.dir += 0.04;
      }

      const footY = Math.floor(p.y + 0.1);
      const nextX = p.x + mob.vel.x * dt;
      const nextZ = p.z + mob.vel.z * dt;
      const waterAhead = (x: number, z: number) => {
        const a = this.getBlock(Math.floor(x), footY, Math.floor(z));
        const b = this.getBlock(Math.floor(x), footY - 1, Math.floor(z));
        return isLiquid(a) || isLiquid(b);
      };
      const blockedX = isSolid(this.getBlock(Math.floor(nextX), footY, Math.floor(p.z))) || (!inWater && waterAhead(nextX, p.z));
      if (!blockedX) p.x = nextX;
      else if (mob.onGround && !inWater && !isSolid(this.getBlock(Math.floor(nextX), footY + 1, Math.floor(p.z))) && !isSolid(this.getBlock(Math.floor(nextX), footY + 2, Math.floor(p.z))) && !waterAhead(nextX, p.z)) {
        mob.vel.y = 7.2;
      } else mob.dir += 2.1;
      const blockedZ = isSolid(this.getBlock(Math.floor(p.x), footY, Math.floor(nextZ))) || (!inWater && waterAhead(p.x, nextZ));
      if (!blockedZ) p.z = nextZ;
      else if (mob.onGround && !inWater && !isSolid(this.getBlock(Math.floor(p.x), footY + 1, Math.floor(nextZ))) && !waterAhead(p.x, nextZ)) mob.vel.y = 7.2;
      else mob.dir += 1.7;

      p.y += mob.vel.y * dt;
      mob.onGround = false;
      const groundY = Math.floor(p.y - 0.02);
      if (mob.vel.y <= 0 && isSolid(this.getBlock(Math.floor(p.x), groundY, Math.floor(p.z)))) {
        p.y = groundY + 1.0;
        mob.vel.y = 0;
        mob.onGround = true;
      }
      if (p.y < -5) {
        this.removeMob(mob);
        continue;
      }

      /* facing: smooth turn */
      const targetYaw = -mob.dir + Math.PI / 2;
      let diff = targetYaw - mob.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      mob.yaw += diff * Math.min(1, dt * 7);
      mob.group.rotation.y = mob.yaw;

      /* animation */
      const horizontal = Math.hypot(mob.vel.x, mob.vel.z);
      const moving = horizontal > 0.25;
      if (moving) mob.walk += dt * horizontal * 3.6;
      const amp = Math.min(0.75, horizontal * 0.4);
      model.legs.forEach((leg, index) => {
        const sign = model.legs.length === 4 ? (index === 0 || index === 3 ? 1 : -1) : index % 2 ? -1 : 1;
        const targetRot = moving ? Math.sin(mob.walk) * amp * sign : 0;
        leg.rotation.x = lerp(leg.rotation.x, targetRot, Math.min(1, dt * 12));
      });
      model.body.position.y = moving ? Math.abs(Math.sin(mob.walk)) * 0.035 : 0;
      model.arms.forEach((arm, index) => {
        arm.rotation.x = -Math.PI / 2 + Math.sin(this.elapsed * 2.2 + index) * 0.08;
      });
      model.wings.forEach((wing, index) => {
        const flapping = !mob.onGround || mob.flee > 0;
        const target = flapping ? (Math.sin(this.elapsed * 34) * 0.5 + 0.6) * (index ? -1 : 1) : 0;
        wing.rotation.z = lerp(wing.rotation.z, target, Math.min(1, dt * 18));
      });

      /* head: graze, look at the player, or idle */
      let headPitch = 0;
      let headYaw = 0;
      if (mob.graze > 0) headPitch = 0.95;
      else if (!mob.hostile && distToPlayer < 7) {
        const local = Math.atan2(dx, dz) - mob.yaw;
        headYaw = clamp(Math.atan2(Math.sin(local), Math.cos(local)), -0.9, 0.9);
        const dy = this.player.pos.y + EYE_HEIGHT - (p.y + model.height);
        headPitch = clamp(-Math.atan2(dy, Math.max(0.5, distToPlayer)), -0.5, 0.5);
      } else if (mob.kind === 4 && !moving) {
        headPitch = Math.sin(this.elapsed * 3 + mob.dir * 7) > 0.85 ? 0.7 : 0;
      }
      model.head.rotation.x = lerp(model.head.rotation.x, headPitch, Math.min(1, dt * 6));
      model.head.rotation.y = lerp(model.head.rotation.y, headYaw, Math.min(1, dt * 6));

      /* tint: daylight, red when hurt */
      if (mob.hurt > 0) model.material.color.setRGB(1, 0.42, 0.42);
      else model.material.color.copy(this.lightTint);

      /* voices */
      mob.soundTimer -= dt;
      if (mob.soundTimer <= 0) {
        mob.soundTimer = 4 + Math.random() * 9;
        // animal voices carry 9 blocks, no further
        if (distToPlayer < MOB_HEARING_RANGE) this.sfx.mob(mob.kind);
      }
    }
    if (this.mobs.length < MAX_MOBS && Math.random() < dt * 0.35) this.spawnMobs(false);
  }

  /* ------------------------------------------------------------------ */
  /*  Player damage                                                     */
  /* ------------------------------------------------------------------ */
  private damagePlayer(amount: number, _source: string) {
    if (this.mode === "creative") return;
    if (this.hurtCooldown > 0) return;
    this.hurtCooldown = 0.45;
    const reduced = amount * (1 - Math.min(0.8, (ARMOR_POINTS[this.armorItem] ?? 0) * 0.05));
    this.health = Math.max(0, this.health - reduced);
    this.regen = 0;
    this.trauma = Math.min(1, this.trauma + 0.3);
    this.sfx.hurt();
    this.cb.onFx("hurt");
    this.emitStats(true);
    if (this.health <= 0) this.playerDied();
  }

  private playerDied() {
    this.sfx.die();
    this.cb.onPopup({ id: ++this.popupId, text: t("youDied"), sub: this.mode === "sprint" ? t("minus10") : t("respawning"), kind: "info" });
    if (this.mode === "sprint") {
      this.timeLeft = Math.max(0, this.timeLeft - 10);
      this.combo = 0;
    }
    if (this.mode === "survival") this.dropInventoryOnDeath();
    this.health = MAX_HEALTH;
    this.placePlayerAtSpawn();
    if (this.mode === "sprint" && this.timeLeft <= 0) this.endRun();
  }

  /** Minecraft-style: everything in the hotbar and backpack lies on the ground where you died */
  private dropInventoryOnDeath() {
    const x = Math.floor(this.player.pos.x);
    const y = Math.floor(this.player.pos.y);
    const z = Math.floor(this.player.pos.z);
    for (const slot of this.allSlots()) {
      if (slot.id === 0 || slot.count <= 0) continue;
      this.spawnItemDrop(slot.id, slot.count, x, y, z);
      slot.id = 0;
      slot.count = 0;
    }
    this.refreshHandModel();
    this.emitStats(true);
  }

  /* ------------------------------------------------------------------ */
  /*  Sky                                                               */
  /* ------------------------------------------------------------------ */
  private updateSky(dt: number) {
    if (this.screen === "playing" || this.screen === "menu") this.dayTime = (this.dayTime + dt / DAY_LENGTH) % 1;
    const angle = this.dayTime * Math.PI * 2;
    const sunHeight = Math.sin(angle);
    const sunX = Math.cos(angle);
    this.daylight = clamp(0.18 + 0.82 * clamp((sunHeight + 0.18) / 0.5, 0, 1), 0.18, 1);

    const isNight = this.daylight < 0.4;
    if (isNight !== this.wasNight && this.screen === "playing") {
      this.wasNight = isNight;
      this.sfx.ambient(isNight);
      this.cb.onPopup({ id: ++this.popupId, text: isNight ? t("nightfall") : t("sunrise"), sub: isNight ? t("nightfallSub") : t("sunriseSub"), kind: "info" });
    }

    const night = new THREE.Color(0x0a1026);
    const day = new THREE.Color(0x58a8f0);
    const dusk = new THREE.Color(0xe98a4a);
    const horizonFactor = clamp(1 - Math.abs(sunHeight) * 2.6, 0, 1);

    const top = night.clone().lerp(day, clamp(this.daylight * 1.1, 0, 1));
    const bottom = new THREE.Color(0x121a33).lerp(new THREE.Color(0xc9e6ff), clamp(this.daylight * 1.15, 0, 1));
    this.skyMaterial.uniforms.topColor.value.copy(top);
    this.skyMaterial.uniforms.bottomColor.value.copy(bottom);
    this.skyMaterial.uniforms.horizon.value.copy(dusk);
    this.skyMaterial.uniforms.mixAmount.value = horizonFactor * 0.85;

    const fogColor = bottom.clone().lerp(dusk, horizonFactor * 0.5);
    (this.scene.fog as THREE.Fog).color.copy(fogColor);
    this.renderer.setClearColor(fogColor, 1);

    const tint = new THREE.Color(0.42, 0.48, 0.72).lerp(new THREE.Color(1, 1, 1), this.daylight);
    if (horizonFactor > 0.2 && sunHeight > -0.2) tint.lerp(new THREE.Color(1, 0.82, 0.68), horizonFactor * 0.35);
    this.lightTint.copy(tint);
    this.opaqueMaterial.color.copy(tint);
    this.far.setTint(tint);
    this.cutoutMaterial.color.copy(tint);
    this.waterMaterial.color.copy(tint).multiplyScalar(0.95);
    (this.clouds.material as THREE.MeshBasicMaterial).color.copy(tint).multiplyScalar(1.05);
    (this.stars.material as THREE.PointsMaterial).opacity = clamp(1 - this.daylight * 1.6, 0, 1);

    const camPos = this.camera.position;
    const orbit = 320;
    this.sun.position.set(camPos.x + sunX * orbit, camPos.y + sunHeight * orbit, camPos.z - 90);
    this.sun.lookAt(camPos);
    this.moon.position.set(camPos.x - sunX * orbit, camPos.y - sunHeight * orbit, camPos.z + 90);
    this.moon.lookAt(camPos);
    this.stars.position.copy(camPos);
    this.sky.position.copy(camPos);
    this.clouds.position.x = camPos.x + (((this.elapsed * 0.7) % 120) - 60);
    this.clouds.position.z = camPos.z;
  }

  /* ------------------------------------------------------------------ */
  /*  Raycast & physics                                                 */
  /* ------------------------------------------------------------------ */
  private raycast(origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number): VoxelHit | null {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);
    const stepX = dir.x > 0 ? 1 : dir.x < 0 ? -1 : 0;
    const stepY = dir.y > 0 ? 1 : dir.y < 0 ? -1 : 0;
    const stepZ = dir.z > 0 ? 1 : dir.z < 0 ? -1 : 0;
    const tDeltaX = stepX === 0 ? Infinity : Math.abs(1 / dir.x);
    const tDeltaY = stepY === 0 ? Infinity : Math.abs(1 / dir.y);
    const tDeltaZ = stepZ === 0 ? Infinity : Math.abs(1 / dir.z);
    let tMaxX = stepX === 0 ? Infinity : stepX > 0 ? (x + 1 - origin.x) * tDeltaX : (origin.x - x) * tDeltaX;
    let tMaxY = stepY === 0 ? Infinity : stepY > 0 ? (y + 1 - origin.y) * tDeltaY : (origin.y - y) * tDeltaY;
    let tMaxZ = stepZ === 0 ? Infinity : stepZ > 0 ? (z + 1 - origin.z) * tDeltaZ : (origin.z - z) * tDeltaZ;
    let nx = 0;
    let ny = 0;
    let nz = 0;
    let t = 0;
    for (let i = 0; i < 180 && t <= maxDist; i++) {
      const id = this.getBlock(x, y, z);
      if (id !== 0 && !isLiquid(id)) return { x, y, z, nx, ny, nz };
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX;
        t = tMaxX;
        tMaxX += tDeltaX;
        nx = -stepX;
        ny = 0;
        nz = 0;
      } else if (tMaxY < tMaxZ) {
        y += stepY;
        t = tMaxY;
        tMaxY += tDeltaY;
        nx = 0;
        ny = -stepY;
        nz = 0;
      } else {
        z += stepZ;
        t = tMaxZ;
        tMaxZ += tDeltaZ;
        nx = 0;
        ny = 0;
        nz = -stepZ;
      }
    }
    return null;
  }

  private intersectsPlayer(x: number, y: number, z: number) {
    const p = this.player.pos;
    return (
      p.x + PLAYER_RADIUS > x && p.x - PLAYER_RADIUS < x + 1 && p.y + PLAYER_HEIGHT > y && p.y < y + 1 && p.z + PLAYER_RADIUS > z && p.z - PLAYER_RADIUS < z + 1
    );
  }

  private moveAxis(axis: "x" | "y" | "z", amount: number) {
    if (amount === 0) return;
    const p = this.player.pos;
    p[axis] += amount;
    const minX = Math.floor(p.x - PLAYER_RADIUS);
    const maxX = Math.floor(p.x + PLAYER_RADIUS);
    const minY = Math.floor(p.y + 0.001);
    const maxY = Math.floor(p.y + PLAYER_HEIGHT - 0.001);
    const minZ = Math.floor(p.z - PLAYER_RADIUS);
    const maxZ = Math.floor(p.z + PLAYER_RADIUS);
    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (!isSolid(this.getBlock(bx, by, bz))) continue;
          if (axis === "x") {
            p.x = amount > 0 ? bx - PLAYER_RADIUS - 0.0001 : bx + 1 + PLAYER_RADIUS + 0.0001;
            this.player.vel.x = 0;
          } else if (axis === "z") {
            p.z = amount > 0 ? bz - PLAYER_RADIUS - 0.0001 : bz + 1 + PLAYER_RADIUS + 0.0001;
            this.player.vel.z = 0;
          } else {
            if (amount > 0) p.y = by - PLAYER_HEIGHT - 0.0001;
            else {
              p.y = by + 1 + 0.0001;
              this.player.onGround = true;
            }
            this.player.vel.y = 0;
          }
          return;
        }
      }
    }
  }

  /** called once, on the frame the player actually touches down */
  private handleLanding(impactVel: number) {
    const fall = Math.max(0, this.player.fallStart - this.player.pos.y);
    const hard = impactVel < -12 || fall > 4;
    const ground = this.getBlock(Math.floor(this.player.pos.x), Math.floor(this.player.pos.y - 0.2), Math.floor(this.player.pos.z));
    this.sfx.land(hard);
    if (hard) {
      this.trauma = Math.min(1, this.trauma + 0.18);
      this.spawnBurst(this.player.pos.x, this.player.pos.y, this.player.pos.z, BLOCKS[ground]?.color ?? 0x888888, 8, 2);
    }
    if (fall > 4 && !this.player.swimming && !this.player.flying) this.damagePlayer(Math.floor(fall - 3), "fall");
    this.player.fallStart = this.player.pos.y;
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    const standingChunk = this.getChunk(Math.floor(p.pos.x / CHUNK_SIZE), Math.floor(p.pos.z / CHUNK_SIZE));
    if (!standingChunk) {
      p.vel.set(0, 0, 0);
      this.ensureChunk(Math.floor(p.pos.x / CHUNK_SIZE), Math.floor(p.pos.z / CHUNK_SIZE));
      return;
    }

    const feetBlock = this.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y + 0.4), Math.floor(p.pos.z));
    const headBlock = this.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y + EYE_HEIGHT), Math.floor(p.pos.z));
    const wasSwimming = p.swimming;
    const feetLiquid = isLiquid(feetBlock);
    const headLiquid = isLiquid(headBlock);
    // Wyjście z wody: gdy stopy są na lądzie (blok nieciekły) lub głowa nad wodą i stopy na poziomie wody
    p.swimming = feetLiquid && (!p.onGround || headLiquid);
    p.headUnderwater = headBlock === B.WATER;
    if (p.swimming && !wasSwimming && p.vel.y < -6) {
      this.sfx.splash();
      this.cb.onFx("splash");
      this.spawnBurst(p.pos.x, p.pos.y + 0.3, p.pos.z, 0x9fd0ff, 14, 3);
      p.fallStart = p.pos.y;
    }
    if (feetBlock === B.LAVA || headBlock === B.LAVA) {
      this.damagePlayer(4, "lava");
      this.spawnSmoke(p.pos.x, p.pos.y + 1, p.pos.z, 2);
      if (this.mode === "sprint") this.timeLeft = Math.max(0, this.timeLeft - dt * 4);
    }

    this.hurtCooldown = Math.max(0, this.hurtCooldown - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);

    if (this.mode === "survival" || this.mode === "cold") {
      const effort = Math.hypot(p.vel.x, p.vel.z) * 0.02 + (this.mining ? 0.05 : 0) + 0.012;
      this.hungerTimer += dt * effort;
      if (this.hungerTimer > 1) {
        this.hungerTimer = 0;
        this.hunger = Math.max(0, this.hunger - 1);
        this.emitStats(true);
      }
      if (this.hunger <= 0) {
        this.regen += dt;
        if (this.regen > 3) {
          this.regen = 0;
          this.health = Math.max(1, this.health - 1);
          this.sfx.hurt();
          this.emitStats(true);
        }
      }
    }

    // Cold Apocalypse Temperature & Warmth system
    if (this.mode === "cold") {
      const night = this.daylight < 0.45;
      const px = Math.floor(p.pos.x);
      const py = Math.floor(p.pos.y);
      const pz = Math.floor(p.pos.z);
      let warmthRate = -0.4; // Base freezing rate

      if (night) warmthRate -= 0.45; // Colder at night
      if (p.swimming) warmthRate -= 2.0; // Freezing in icy water!

      // Check nearby warmth blocks (Campfire, Lava, Torch, Glowstone, Furnace)
      let nearCampfire = false;
      for (let dy = -2; dy <= 3; dy++) {
        for (let dz = -5; dz <= 5; dz++) {
          for (let dx = -5; dx <= 5; dx++) {
            const bid = this.getBlock(px + dx, py + dy, pz + dz);
            if (bid === B.CAMPFIRE) {
              warmthRate += 5.0;
              nearCampfire = true;
            } else if (bid === B.LAVA) {
              warmthRate += 3.2;
            } else if (bid === B.TORCH) {
              warmthRate += 1.4;
            } else if (bid === B.GLOWSTONE) {
              warmthRate += 1.6;
            }
          }
        }
      }

      if (nearCampfire) {
        this.sfx.campfireCrackle();
      }

      // Held item warmth / insulation
      const held = this.hotbar[this.selected]?.id ?? 0;
      if (held === B.TORCH || held === I.LAVA_BUCKET || held === I.FLINT_AND_STEEL) {
        warmthRate += 1.2;
      }
      if (this.armorItem === I.LEATHER_COAT || this.hotbar.some((s) => s.id === I.LEATHER_COAT)) {
        warmthRate += 0.8;
      }

      this.temperatureTimer += dt;
      if (this.temperatureTimer > 0.2) {
        this.temperatureTimer = 0;
        this.temperature = Math.max(0, Math.min(MAX_TEMPERATURE, this.temperature + warmthRate * 0.2));
        this.emitStats();
      }

      // Shivering & hypothermia frost damage
      if (this.temperature <= 4) {
        this.trauma = Math.max(this.trauma, 0.22);
      }
      if (this.temperature <= 0) {
        this.regen += dt;
        if (this.regen > 3.0) {
          this.regen = 0;
          this.damagePlayer(2, "freeze");
        }
      }

      // Ambient blizzard snow flurries
      if (Math.random() < dt * 14) {
        const sx = p.pos.x + (Math.random() - 0.5) * 16;
        const sz = p.pos.z + (Math.random() - 0.5) * 16;
        const sy = p.pos.y + 4 + Math.random() * 4;
        this.particles.push({
          pos: new THREE.Vector3(sx, sy, sz),
          vel: new THREE.Vector3(-4 - Math.random() * 3, -2 - Math.random() * 2, -2 + Math.random() * 4),
          life: 0,
          ttl: 1.8,
          size: 0.08,
          color: new THREE.Color(0xffffff),
          gravity: 0,
        });
      }
    }

    if (this.health < MAX_HEALTH && this.hurtCooldown <= 0 && (this.mode !== "survival" || this.hunger > 6)) {
      this.regen += dt;
      if (this.regen > (this.mode === "survival" ? 3.5 : 4)) {
        this.regen = 0;
        this.health = Math.min(MAX_HEALTH, this.health + 1);
        this.emitStats(true);
      }
    }

    let forward = 0;
    let strafe = 0;
    if (this.inputEnabled) {
      if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) forward += 1;
      if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) forward -= 1;
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) strafe += 1;
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) strafe -= 1;
      forward += this.touchMove.y;
      strafe += this.touchMove.x;
    }
    const magnitude = Math.hypot(forward, strafe);
    if (magnitude > 1) {
      forward /= magnitude;
      strafe /= magnitude;
    }
    const moving = magnitude > 0.05;
    const sprinting =
      (this.inputEnabled && (this.keys.has("ControlLeft") || this.keys.has("ControlRight"))) || Math.hypot(this.touchMove.x, this.touchMove.y) > 0.93;

    let speed = p.flying ? 11 : p.swimming ? 3.6 : 4.6;
    if (sprinting && !p.swimming) speed *= 1.42;

    const sin = Math.sin(p.yaw);
    const cos = Math.cos(p.yaw);
    const targetX = (cos * strafe - sin * forward) * speed;
    const targetZ = (-sin * strafe - cos * forward) * speed;
    const accel = p.flying ? 9 : p.onGround ? 15 : p.swimming ? 6 : 6.5;
    const blend = Math.min(1, accel * dt);
    p.vel.x += (targetX - p.vel.x) * blend;
    p.vel.z += (targetZ - p.vel.z) * blend;

    const upHeld = this.inputEnabled && (this.keys.has("Space") || this.verticalInput > 0.3);
    const downHeld = this.inputEnabled && (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.verticalInput < -0.3);

    if (p.flying) {
      const target = (upHeld ? 7.5 : 0) + (downHeld ? -7.5 : 0);
      p.vel.y += (target - p.vel.y) * Math.min(1, 10 * dt);
      p.onGround = false;
      p.fallStart = p.pos.y;
    } else if (p.swimming) {
      p.vel.y += (upHeld ? 3.4 : -3.1 - p.vel.y * 0.4) * Math.min(1, 6 * dt) * 2;
      p.vel.y = clamp(p.vel.y, -5, 4.2);
      p.fallStart = p.pos.y;
      if (moving) this.sfx.swim();
    } else {
      p.coyote = p.onGround ? 0.11 : Math.max(0, p.coyote - dt);
      if (this.jumpBuffer > 0 && (p.onGround || p.coyote > 0)) {
        p.vel.y = 8.9;
        p.onGround = false;
        p.coyote = 0;
        this.jumpBuffer = 0;
        p.fallStart = p.pos.y;
        this.sfx.jump();
      }
      p.vel.y = Math.max(p.vel.y - GRAVITY * dt, -46);
    }
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    const impactVel = p.vel.y;
    p.onGround = false;
    this.moveAxis("x", p.vel.x * dt);
    this.moveAxis("z", p.vel.z * dt);
    this.moveAxis("y", p.vel.y * dt);

    if (p.onGround) {
      if (this.airTime > 0.18) this.handleLanding(impactVel);
      this.airTime = 0;
      p.fallStart = p.pos.y;
    } else {
      this.airTime += dt;
      p.fallStart = Math.max(p.fallStart, p.pos.y);
    }

    if (p.flying && p.onGround && !upHeld) p.flying = false;

    if (moving && p.onGround) {
      p.step -= dt * (sprinting ? 1.9 : 1.35);
      if (p.step <= 0) {
        p.step = 0.38;
        const ground = this.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y - 0.2), Math.floor(p.pos.z));
        this.sfx.step(materialOf(ground) as Material);
      }
    }
    if (p.pos.y < -8) {
      this.playerDied();
      return;
    }
    const horizontal = Math.hypot(p.vel.x, p.vel.z);
    if (p.onGround && horizontal > 0.6 && moving) p.bob += dt * horizontal * 2;
  }

  private updateCamera(dt: number, playing: boolean) {
    const p = this.player;
    if (playing) {
      const bobStrength = p.onGround ? Math.min(1, Math.hypot(p.vel.x, p.vel.z) / 6) : 0;
      const bobY = Math.sin(p.bob * 2) * 0.05 * bobStrength;
      const bobX = Math.cos(p.bob) * 0.035 * bobStrength;
      const shake = this.trauma * this.trauma;
      const shakeX = (Math.sin(this.elapsed * 71) + Math.sin(this.elapsed * 37.3)) * 0.14 * shake;
      const shakeY = (Math.cos(this.elapsed * 63) + Math.sin(this.elapsed * 41.7)) * 0.12 * shake;
      this.camera.position.set(p.pos.x + bobX, p.pos.y + EYE_HEIGHT + bobY + shakeY * 0.4, p.pos.z);
      this.camera.rotation.set(p.pitch + shakeY * 0.5, p.yaw + shakeX * 0.45, Math.sin(p.bob) * 0.006 * bobStrength + shakeX * 0.18, "YXZ");
      const sprinting = this.keys.has("ControlLeft") || Math.hypot(this.touchMove.x, this.touchMove.y) > 0.93;
      const baseFov = this.isTouch ? 76 : 72;
      const desired = baseFov + (sprinting ? 4 : 0) + (p.flying ? 3 : 0) + this.fovKick;
      this.camera.fov += (desired - this.camera.fov) * Math.min(1, dt * 9);
      this.camera.updateProjectionMatrix();
    } else {
      this.menuAngle += dt * 0.06;
      const radius = 26;
      const cx = this.spawnPos.x + Math.sin(this.menuAngle) * radius;
      const cz = this.spawnPos.z + Math.cos(this.menuAngle) * radius;
      const cy = this.spawnPos.y + 10 + Math.sin(this.elapsed * 0.3) * 1.5;
      const ease = Math.min(1, dt * 1.6);
      this.camera.position.x += (cx - this.camera.position.x) * ease;
      this.camera.position.y += (cy - this.camera.position.y) * ease;
      this.camera.position.z += (cz - this.camera.position.z) * ease;
      this.camera.lookAt(this.spawnPos.x, this.spawnPos.y + 2, this.spawnPos.z);
      this.camera.fov += (62 - this.camera.fov) * Math.min(1, dt * 2);
      this.camera.updateProjectionMatrix();
      this.player.pos.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Mining                                                            */
  /* ------------------------------------------------------------------ */
  private updateTargetAndMining(dt: number) {
    this.tempDir.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const hit = this.raycast(this.camera.position, this.tempDir, REACH);
    if (!hit) {
      this.target = null;
      this.progress = 0;
      this.highlight.visible = false;
      this.breakOverlay.visible = false;
      return;
    }
    const id = this.getBlock(hit.x, hit.y, hit.z);
    if (!this.target || this.target.x !== hit.x || this.target.y !== hit.y || this.target.z !== hit.z || this.targetId !== id) {
      this.target = hit;
      this.targetId = id;
      this.progress = 0;
    }
    this.highlight.visible = true;
    this.highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    this.highlight.scale.setScalar(isCross(id) ? 0.9 : 1);

    const def = BLOCKS[this.targetId];
    if (!this.mining || !def || def.hardness > 20) {
      this.breakOverlay.visible = false;
      return;
    }
    if (this.pickMob()) {
      // swinging at a mob instead of the block behind it
      this.breakOverlay.visible = false;
      if (this.attackCd <= 0) this.primaryAction();
      return;
    }

    const held = this.hotbar[this.selected]?.id ?? 0;
    const multiplier = this.mode === "creative" ? 12 : toolMultiplier(held, this.targetId);
    const hardness = Math.max(0.04, def.hardness / multiplier);
    this.progress += dt / hardness;
    this.swingActive = true;
    this.sfx.mine(materialOf(this.targetId) as Material);
    this.breakOverlay.visible = !def.cross;
    this.breakOverlay.position.copy(this.highlight.position);
    this.breakMaterial.opacity = this.progress * 0.55;
    if (this.elapsed - this.lastMiningSpark > 0.085) {
      this.lastMiningSpark = this.elapsed;
      this.spawnBurst(hit.x + 0.5 - this.tempDir.x * 0.4, hit.y + 0.6, hit.z + 0.5 - this.tempDir.z * 0.4, def.color, 1, 1);
    }
    if (this.progress >= 1) {
      this.destroyBlock(hit.x, hit.y, hit.z);
      this.progress = 0;
      this.target = null;
      this.breakOverlay.visible = false;
    }
  }

  private addToKit(id: number, x: number, y: number, z: number) {
    if (this.mode === "creative") return;
    const held = this.hotbar[this.selected]?.id ?? 0;
    const drops = rollDrops(id, held);
    if (!drops.length) {
      if (this.mode === "survival") this.popup(t("wrongTool"), t("wrongToolSub"), "info");
      return;
    }
    // sprint is a timed rush: keep it instant. Survival and cold drop items on the ground like Minecraft.
    if (this.mode === "sprint") {
      drops.forEach((drop) => this.addItem(drop.id, drop.count));
      return;
    }
    drops.forEach((drop) => this.spawnItemDrop(drop.id, drop.count, x, y, z));
  }

  private spawnItemDrop(id: number, count: number, x: number, y: number, z: number) {
    // walk down from the broken cell until we hit something solid, so the item rests on the ground
    let fy = y;
    while (fy > 0 && !isSolid(this.getBlock(x, fy - 1, z))) fy--;
    const jitterX = (Math.random() - 0.5) * 0.3;
    const jitterZ = (Math.random() - 0.5) * 0.3;
    const color = isItem(id) ? 0xd9c79a : BLOCKS[id]?.color ?? 0xdddddd;
    const mesh = new THREE.Mesh(this.dropGeo, new THREE.MeshLambertMaterial({ color }));
    const baseY = fy + 0.3;
    mesh.position.set(x + 0.5 + jitterX, baseY, z + 0.5 + jitterZ);
    this.dropRoot.add(mesh);
    this.itemDrops.push({ mesh, id, count, age: 0, baseY });
  }

  private removeItemDrop(index: number) {
    const drop = this.itemDrops[index];
    this.dropRoot.remove(drop.mesh);
    (drop.mesh.material as THREE.Material).dispose();
    this.itemDrops.splice(index, 1);
  }

  private clearItemDrops() {
    for (let i = this.itemDrops.length - 1; i >= 0; i--) this.removeItemDrop(i);
  }

  /** bob, spin, and vacuum items into the inventory once the player is close enough */
  private updateItemDrops(dt: number) {
    const px = this.player.pos.x;
    const py = this.player.pos.y;
    const pz = this.player.pos.z;
    for (let i = this.itemDrops.length - 1; i >= 0; i--) {
      const drop = this.itemDrops[i];
      drop.age += dt;
      drop.mesh.rotation.y += dt * 2;
      drop.mesh.position.y = drop.baseY + Math.sin(drop.age * 3) * 0.06;
      if (drop.age > 300) {
        this.removeItemDrop(i);
        continue;
      }
      if (drop.age < 0.6) continue; // short pickup delay, as in Minecraft
      const dx = drop.mesh.position.x - px;
      const dz = drop.mesh.position.z - pz;
      const dy = drop.mesh.position.y - (py + 0.9);
      if (dx * dx + dz * dz > 1.3 * 1.3 || Math.abs(dy) > 1.6) continue;
      const left = this.addItem(drop.id, drop.count);
      if (left <= 0) this.removeItemDrop(i);
      else drop.count = left;
    }
  }

  /** a broken or blown-up chest drops everything it held */
  private spillChest(x: number, y: number, z: number) {
    const key = `${x},${y},${z}`;
    const chest = this.chests.get(key);
    if (!chest) return;
    chest.forEach((slot) => {
      if (slot.id !== 0 && slot.count !== 0) this.spawnItemDrop(slot.id, slot.count < 0 ? 1 : slot.count, x, y, z);
    });
    this.chests.delete(key);
  }

  private destroyBlock(x: number, y: number, z: number) {
    const id = this.getBlock(x, y, z);
    if (!id) return;
    const def = BLOCKS[id];
    if (!def || def.hardness > 20) return;
    if (id === B.FURNACE) {
      const key = `${x},${y},${z}`;
      const furnace = this.furnaces.get(key);
      if (furnace) {
        [furnace.input, furnace.fuel, furnace.output].forEach((slot) => slot.count > 0 && this.addItem(slot.id, slot.count));
        this.furnaces.delete(key);
      }
    }
    if (id === B.CHEST) this.spillChest(x, y, z);
    this.setBlock(x, y, z, 0);
    this.minedCounts[id] = (this.minedCounts[id] ?? 0) + 1;
    this.blocksMined++;
    this.spawnBurst(x + 0.5, y + 0.5, z + 0.5, def.color, def.isOre ? 14 : def.cross ? 5 : 8, def.isOre ? 2.6 : 2);

    if (id === B.TNT) {
      this.sfx.broke("stone", true);
      this.explode(x, y, z);
      return;
    }

    this.sfx.broke(materialOf(id) as Material, def.isOre);
    this.trauma = Math.min(1, this.trauma + (def.isOre ? 0.16 : 0.05));
    this.fovKick = Math.max(this.fovKick, def.isOre ? 1.6 : 0.4);
    this.addToKit(id, x, y, z);

    if (this.mode === "sprint") {
      if (def.isOre) this.collectOre(id, false);
      else this.score += def.score;
    }
    this.emitStats(true);
  }

  private collectOre(id: number, fromBlast: boolean) {
    const def = BLOCKS[id];
    if (!def) return;
    this.combo++;
    this.comboTimer = COMBO_WINDOW;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const multiplier = Math.min(this.combo, 8);
    const gain = def.score * multiplier;
    this.score += gain;
    this.oresMined++;
    this.timeLeft = Math.min(140, this.timeLeft + (def.timeBonus ?? 0.2));
    const kind: PopupKind = id === B.GOLD ? "gold" : id === B.DIAMOND ? "diamond" : id === B.EMERALD ? "emerald" : id === B.TNT ? "tnt" : "coal";
    this.cb.onPopup({
      id: ++this.popupId,
      text: `+${gain}`,
      sub: `${displayName(def.id)}${multiplier > 1 ? ` · x${multiplier}` : ""}${fromBlast ? ` · ${t("blast")}` : ""}`,
      kind,
    });
    this.sfx.ore(this.combo);
    if (this.combo > 1 && this.combo % 4 === 0) {
      this.sfx.combo(this.combo);
      this.cb.onFx("levelup");
    }
    this.trauma = Math.min(1, this.trauma + 0.16);
    this.fovKick = Math.max(this.fovKick, 2);
  }

  private explode(x: number, y: number, z: number) {
    this.sfx.explode();
    this.trauma = 1;
    this.fovKick = 5;
    this.cb.onFx("explosion");
    this.cb.onPopup({ id: ++this.popupId, text: t("boom"), sub: "TNT", kind: "tnt" });
    if (this.mode === "sprint") {
      this.score += 75 * Math.max(1, Math.min(this.combo + 1, 8));
      this.combo++;
      this.comboTimer = COMBO_WINDOW;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.oresMined++;
    }
    const radius = 3.4;
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dz = -4; dz <= 4; dz++) {
          if (dx * dx + dy * dy + dz * dz > radius * radius) continue;
          const bx = x + dx;
          const by = y + dy;
          const bz = z + dz;
          const id = this.getBlock(bx, by, bz);
          if (!id) continue;
          const def = BLOCKS[id];
          if (!def || def.hardness > 20) continue;
          if (id === B.CHEST) this.spillChest(bx, by, bz);
          this.setBlock(bx, by, bz, 0);
          this.minedCounts[id] = (this.minedCounts[id] ?? 0) + 1;
          this.blocksMined++;
          if (Math.random() > 0.6) this.spawnBurst(bx + 0.5, by + 0.5, bz + 0.5, def.color, 3, 5);
          if (id === B.TNT) this.pendingExplosions.push({ x: bx, y: by, z: bz, t: 0.12 + Math.random() * 0.12 });
          else if (def.isOre && this.mode === "sprint") this.collectOre(id, true);
        }
      }
    }
    // mobs caught in the blast
    this.mobs.slice().forEach((mob) => {
      const d = mob.group.position.distanceTo(new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
      if (d < 6) this.attackMob(mob, 25 - d * 3);
    });

    const px = this.player.pos.x - (x + 0.5);
    const pz = this.player.pos.z - (z + 0.5);
    const dist = Math.hypot(px, pz);
    if (dist < 8) {
      const power = (8 - dist) * 1.3;
      this.player.vel.x += (px / (dist || 1)) * power;
      this.player.vel.z += (pz / (dist || 1)) * power;
      this.player.vel.y = Math.max(this.player.vel.y, 4 + (8 - dist) * 0.4);
      this.player.onGround = false;
      this.player.fallStart = this.player.pos.y + 4;
      if (dist < 4) this.damagePlayer(Math.round((4 - dist) * 2), "tnt");
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Particles                                                         */
  /* ------------------------------------------------------------------ */
  private createParticleMesh() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ toneMapped: false });
    const mesh = new THREE.InstancedMesh(geometry, material, MAX_PARTICLES);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const white = new THREE.Color(0xffffff);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      mesh.setColorAt(i, white);
      this.particleDummy.scale.setScalar(0);
      this.particleDummy.updateMatrix();
      mesh.setMatrixAt(i, this.particleDummy.matrix);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }

  private spawnBurst(x: number, y: number, z: number, color: number, count: number, power: number) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
      const c = new THREE.Color(color);
      c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.18);
      this.particles.push({
        pos: new THREE.Vector3(x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.5, z + (Math.random() - 0.5) * 0.5),
        vel: new THREE.Vector3((Math.random() - 0.5) * power, Math.random() * power * 0.9 + 0.9, (Math.random() - 0.5) * power),
        life: 0,
        ttl: 0.45 + Math.random() * 0.7,
        size: 0.07 + Math.random() * 0.15,
        color: c,
        gravity: 20,
      });
    }
  }

  private spawnSmoke(x: number, y: number, z: number, count: number) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
      this.particles.push({
        pos: new THREE.Vector3(x + (Math.random() - 0.5) * 0.6, y + Math.random() * 0.4, z + (Math.random() - 0.5) * 0.6),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.4 + Math.random() * 1.2, (Math.random() - 0.5) * 0.6),
        life: 0,
        ttl: 0.9 + Math.random() * 0.6,
        size: 0.12 + Math.random() * 0.14,
        color: new THREE.Color(0.75, 0.75, 0.78),
        gravity: -1.2,
      });
    }
  }

  private updateParticles(dt: number) {
    const dummy = this.particleDummy;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const particle = this.particles[i];
      if (!particle) {
        dummy.position.set(0, -9999, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        this.particleMesh.setMatrixAt(i, dummy.matrix);
        continue;
      }
      particle.life += dt;
      particle.vel.y -= particle.gravity * dt;
      particle.pos.addScaledVector(particle.vel, dt);
      const shrink = 1 - Math.pow(particle.life / particle.ttl, 2);
      dummy.position.copy(particle.pos);
      dummy.rotation.set(particle.life * 5 + i, particle.life * 7, 0);
      dummy.scale.setScalar(Math.max(0.001, particle.size * shrink));
      dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, dummy.matrix);
      this.particleMesh.setColorAt(i, particle.color);
    }
    this.particles = this.particles.filter((p) => p.life < p.ttl);
    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
  }

  /** ambient sparks above lava close to the player */
  private updateLavaAmbience(dt: number) {
    if (Math.random() > dt * 6) return;
    const px = Math.floor(this.player.pos.x);
    const py = Math.floor(this.player.pos.y);
    const pz = Math.floor(this.player.pos.z);
    for (let attempt = 0; attempt < 6; attempt++) {
      const x = px + Math.floor((Math.random() - 0.5) * 18);
      const y = py + Math.floor((Math.random() - 0.5) * 12);
      const z = pz + Math.floor((Math.random() - 0.5) * 18);
      if (this.getBlock(x, y, z) !== B.LAVA) continue;
      if (this.getBlock(x, y + 1, z) !== 0) continue;
      this.particles.push({
        pos: new THREE.Vector3(x + Math.random(), y + 1, z + Math.random()),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.4, 1 + Math.random(), (Math.random() - 0.5) * 0.4),
        life: 0,
        ttl: 1.1,
        size: 0.08,
        color: new THREE.Color(0xff9a3c),
        gravity: -1,
      });
      return;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Input                                                             */
  /* ------------------------------------------------------------------ */
  private stopInput() {
    this.keys.clear();
    this.touchMove.x = 0;
    this.touchMove.y = 0;
    this.verticalInput = 0;
    this.mining = false;
    this.placeHeld = false;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.screen !== "playing" || !this.inputEnabled) return;
    if (e.target instanceof HTMLInputElement) return;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.code === "Space" && !e.repeat) this.jump();
    if (e.code === "KeyF" && !e.repeat) this.toggleFly();
    if (e.code === "KeyQ" && !e.repeat) this.place();
    if (e.code.startsWith("Digit")) {
      const index = Number(e.code.slice(5)) - 1;
      if (index >= 0 && index < this.hotbar.length) this.selectSlot(index);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  private onBlur = () => this.stopInput();

  private onWheel = (e: WheelEvent) => {
    if (this.screen !== "playing" || !this.inputEnabled) return;
    e.preventDefault();
    this.cycleSlot(e.deltaY > 0 ? 1 : -1);
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.screen !== "playing" || !this.inputEnabled) return;
    this.sfx.ensure();
    if (e.pointerType === "touch") {
      if (this.lookPointer === null) {
        this.lookPointer = e.pointerId;
        this.lookLast.x = e.clientX;
        this.lookLast.y = e.clientY;
        try {
          this.renderer.domElement.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      return;
    }
    if (e.button === 0) {
      this.setMining(true);
      this.tryLock();
    } else if (e.button === 2) {
      this.tryLock();
      this.placeHeld = true;
        this.place();
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.screen !== "playing" || !this.inputEnabled) return;
    if (e.pointerType === "touch") {
      if (e.pointerId !== this.lookPointer) return;
      const dx = e.clientX - this.lookLast.x;
      const dy = e.clientY - this.lookLast.y;
      this.lookLast.x = e.clientX;
      this.lookLast.y = e.clientY;
      this.player.yaw -= dx * 0.005;
      this.player.pitch = clamp(this.player.pitch - dy * 0.005, -1.5, 1.5);
      return;
    }
    if (document.pointerLockElement !== this.renderer.domElement) return;
    if (this.lockIgnore > 0) {
      this.lockIgnore -= 1;
      return;
    }
    const dx = e.movementX ?? 0;
    const dy = e.movementY ?? 0;
    if (Math.abs(dx) > 80 || Math.abs(dy) > 80) return;
    this.player.yaw -= dx * 0.0025;
    this.player.pitch = clamp(this.player.pitch - dy * 0.0025, -1.5, 1.5);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      if (e.pointerId === this.lookPointer) this.lookPointer = null;
      return;
    }
    if (e.button === 0) this.setMining(false);
    if (e.button === 2) this.placeHeld = false;
  };

  private onWindowPointerUp = (e: PointerEvent) => {
    if (e.pointerType !== "touch") {
      if (e.button === 0) this.mining = false;
      if (e.button === 2) this.placeHeld = false;
    }
  };

  private onContextMenu = (e: Event) => e.preventDefault();

  private tryLock() {
    if (this.isTouch || this.screen !== "playing" || !this.inputEnabled) return;
    if (document.pointerLockElement === this.renderer.domElement) return;
    this.lockIgnore = 8;
    try {
      const result = this.renderer.domElement.requestPointerLock() as unknown;
      if (result && typeof (result as Promise<void>).catch === "function") (result as Promise<void>).catch(() => undefined);
    } catch {
      /* optional */
    }
  }

  private releaseLock() {
    if (document.pointerLockElement === this.renderer.domElement) document.exitPointerLock();
  }

  /* ------------------------------------------------------------------ */
  /*  Stats                                                             */
  /* ------------------------------------------------------------------ */
  private popup(text: string, sub: string, kind: PopupKind) {
    this.cb.onPopup({ id: ++this.popupId, text, sub, kind });
  }

  private endRun() {
    if (this.screen === "over") return;
    if (this.container) this.closeContainer(true);
    this.screen = "over";
    this.timeLeft = 0;
    this.stopInput();
    this.highlight.visible = false;
    this.breakOverlay.visible = false;
    this.releaseLock();
    this.sfx.over();
    this.runCounter++;
    this.cb.onRunEnd({
      id: `${Date.now()}-${this.runCounter}`,
      mode: this.mode,
      score: this.score,
      ores: this.oresMined,
      bestCombo: this.bestCombo,
      blocksPlaced: this.blocksPlaced,
      blocksMined: this.blocksMined,
      kills: this.kills,
      mined: { ...this.minedCounts },
      finishedAt: Date.now(),
    });
    this.cb.onScreen("over");
    this.emitStats(true);
  }

  private currentBiome() {
    const cx = Math.floor(this.player.pos.x / CHUNK_SIZE);
    const cz = Math.floor(this.player.pos.z / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return localName("Overworld");
    const lx = Math.floor(this.player.pos.x) - cx * CHUNK_SIZE;
    const lz = Math.floor(this.player.pos.z) - cz * CHUNK_SIZE;
    return localName(BIOME_NAMES[chunk.biomes[clamp(lx, 0, 15) + clamp(lz, 0, 15) * CHUNK_SIZE]] ?? "Overworld");
  }

  private clockLabel() {
    const hours = Math.floor(((this.dayTime + 0.25) % 1) * 24);
    const minutes = Math.floor((((this.dayTime + 0.25) % 1) * 24 - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  private heldInfo(): HeldInfo {
    const slot = this.hotbar[this.selected];
    if (!slot || slot.id === 0 || slot.count === 0) return { id: 0, name: t("bareHands"), kind: "empty" };
    if (isItem(slot.id)) {
      const item = ITEMS[slot.id];
      return { id: slot.id, name: displayName(slot.id), kind: item?.kind ?? "none" };
    }
    return { id: slot.id, name: displayName(slot.id), kind: "block" };
  }

  private emitStats(force = false) {
    if (!force && this.elapsed - this.lastStats < 0.1) return;
    this.lastStats = this.elapsed;
    const def = this.target ? BLOCKS[this.targetId] : null;
    this.cb.onStats({
      mode: this.mode,
      score: this.score,
      timeLeft: this.timeLeft,
      combo: this.combo,
      comboPct: this.comboTimer / COMBO_WINDOW,
      ores: this.oresMined,
      bestCombo: this.bestCombo,
      blocksPlaced: this.blocksPlaced,
      blocksMined: this.blocksMined,
      kills: this.kills,
      health: this.health,
      maxHealth: MAX_HEALTH,
      hunger: this.hunger,
      maxHunger: MAX_HUNGER,
      armor: ARMOR_POINTS[this.armorItem] ?? 0,
      temperature: this.temperature,
      maxTemperature: MAX_TEMPERATURE,
      backpack: this.backpack.map((slot) => ({ ...slot })),
      ui: this.containerUI(),
      hotbar: this.hotbar.map((slot) => ({ ...slot })),
      selected: this.selected,
      held: this.heldInfo(),
      target: def && this.target ? { id: def.id, name: displayName(def.id), score: def.score, progress: this.progress, color: hexColor(def.color) } : null,
      biome: this.currentBiome(),
      clock: this.clockLabel(),
      night: this.daylight < 0.45,
      position: { x: Math.round(this.player.pos.x), y: Math.round(this.player.pos.y), z: Math.round(this.player.pos.z) },
      flying: this.player.flying,
      swimming: this.player.swimming,
      onGround: this.player.onGround,
      fps: Math.round(this.fps),
      chunks: this.chunks.size,
      loading: this.loadedRatio(),
    });
  }

  private resize = () => {
    this.width = this.host.clientWidth || window.innerWidth;
    this.height = this.host.clientHeight || window.innerHeight;
    const rawDpr = window.devicePixelRatio || 1;
    const budget = this.isTouch ? 2_200_000 : 4_000_000;
    const budgetDpr = Math.sqrt(budget / Math.max(1, this.width * this.height));
    const dpr = Math.max(0.7, Math.min(rawDpr, this.isTouch ? 1.4 : 1.8, budgetDpr));
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, true);
    const aspect = this.width / Math.max(1, this.height);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.viewCamera.aspect = aspect;
    this.viewCamera.updateProjectionMatrix();
  };

  /* ------------------------------------------------------------------ */
  /*  Loop                                                              */
  /* ------------------------------------------------------------------ */
  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += dt;
    this.fps = lerp(this.fps, 1 / Math.max(dt, 0.0001), 0.08);
    const playing = this.screen === "playing";

    if (playing) {
      this.updatePlayer(dt);
      this.updateCamera(dt, true);
      this.updateTargetAndMining(dt);
      if (this.placeHeld) this.place();
      this.updateMobs(dt);
      this.updateArrows(dt);
      this.updateItemDrops(dt);
      this.updateFluids(dt);
      this.updateLavaAmbience(dt);
      this.updateFurnaces(dt);
      this.saveTimer += dt;
      if (this.saveTimer > 20) {
        this.saveTimer = 0;
        this.saveGame();
      }
      this.envTimer -= dt;
      if (this.envTimer <= 0) {
        this.envTimer = 0.5;
        const cx = Math.floor(this.player.pos.x / CHUNK_SIZE);
        const cz = Math.floor(this.player.pos.z / CHUNK_SIZE);
        const chunk = this.getChunk(cx, cz);
        if (chunk) {
          const lx = clamp(Math.floor(this.player.pos.x) - cx * CHUNK_SIZE, 0, 15);
          const lz = clamp(Math.floor(this.player.pos.z) - cz * CHUNK_SIZE, 0, 15);
          const depth = chunk.heights[lx + lz * CHUNK_SIZE] - (this.player.pos.y + EYE_HEIGHT);
          const cave = clamp((depth - 2) / 10, 0, 1);
          if (Math.abs(cave - this.caveFactor) > 0.08) {
            this.caveFactor = cave;
            this.sfx.setEnvironment(cave);
          }
        }
      }
      if (this.mode === "sprint") {
        this.timeLeft -= dt;
        if (this.combo > 0) {
          this.comboTimer -= dt;
          if (this.comboTimer <= 0) {
            this.combo = 0;
            this.comboTimer = 0;
          }
        }
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.endRun();
        }
      }
      for (let i = this.pendingExplosions.length - 1; i >= 0; i--) {
        const boom = this.pendingExplosions[i];
        boom.t -= dt;
        if (boom.t <= 0) {
          this.pendingExplosions.splice(i, 1);
          this.explode(boom.x, boom.y, boom.z);
        }
      }
    } else if (this.screen !== "paused") {
      this.updateCamera(dt, false);
    }

    if (this.screen !== "paused") {
      this.updateParticles(dt);
      this.updateSky(dt);
    }
    this.updateHand(dt);
    this.trauma = Math.max(0, this.trauma - dt * 1.5);
    this.fovKick = Math.max(0, this.fovKick - dt * 9);

    this.updateStreaming(this.screen === "playing" ? (this.isTouch ? 5 : 7) : 9);
    this.updateFar(dt);
    if (playing || this.screen === "menu") this.emitStats();

    this.renderer.render(this.scene, this.camera);
    if (this.handRig.visible) {
      this.renderer.autoClear = false;
      this.renderer.clearDepth();
      this.renderer.render(this.viewScene, this.viewCamera);
      this.renderer.autoClear = true;
    }
  };
}
