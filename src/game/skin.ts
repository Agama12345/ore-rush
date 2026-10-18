/** 64×64 Minecraft-style skin. Stored as RGBA ImageData in localStorage. */

export const SKIN_SIZE = 64;
const KEY = "orerush.skin.v2";

export type SkinPart = "head" | "body" | "armR" | "armL" | "legR" | "legL";

/** UV rectangles on the 64×64 sheet: [x, y, w, h] */
export const PARTS: Record<SkinPart, { label: string; front: [number, number, number, number] }> = {
  head: { label: "Head", front: [8, 8, 8, 8] },
  body: { label: "Body", front: [20, 20, 8, 12] },
  armR: { label: "Arm R", front: [44, 20, 4, 12] },
  armL: { label: "Arm L", front: [36, 52, 4, 12] },
  legR: { label: "Leg R", front: [4, 20, 4, 12] },
  legL: { label: "Leg L", front: [20, 52, 4, 12] },
};

export const PALETTE = [
  "#000000", "#2a2a2a", "#555555", "#8b8b8b", "#cccccc", "#ffffff",
  "#3f2a1a", "#6b3f2a", "#8d5b3a", "#c68642", "#e0a368", "#f0b98a", "#ffd0a4",
  "#224a1e", "#3d7a37", "#5d9b4a", "#82cb5a", "#97a51d",
  "#1a2b5e", "#2c488f", "#3c44aa", "#169b9c", "#4db8c4", "#5de3e3",
  "#4d1d6a", "#7b2fbe", "#a24fd8", "#d14b8c", "#b02e26", "#e23a3a",
  "#e86a10", "#f07613", "#f9c62c", "#ffeb3b", "#49dd8c",
];

export type SkinPreset = {
  id: string;
  name: string;
  icon: string;
  creator: () => ImageData;
};

function px(data: Uint8ClampedArray, x: number, y: number, hex: string) {
  if (x < 0 || y < 0 || x >= SKIN_SIZE || y >= SKIN_SIZE) return;
  const n = parseInt(hex.slice(1), 16);
  const i = (y * SKIN_SIZE + x) * 4;
  data[i] = (n >> 16) & 255;
  data[i + 1] = (n >> 8) & 255;
  data[i + 2] = n & 255;
  data[i + 3] = 255;
}

function fillRect(data: Uint8ClampedArray, x: number, y: number, w: number, h: number, hex: string) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) px(data, x + dx, y + dy, hex);
  }
}

function buildSkin(
  skin: string,
  hair: string,
  shirt: string,
  pants: string,
  shoes: string,
  eyeColor = "#2c488f",
  accent?: string
): ImageData {
  const data = new Uint8ClampedArray(SKIN_SIZE * SKIN_SIZE * 4);

  /* Head */
  fillRect(data, 8, 0, 8, 8, hair); // top
  fillRect(data, 16, 0, 8, 8, hair); // bottom-ish
  fillRect(data, 0, 8, 8, 8, hair); // right
  fillRect(data, 16, 8, 8, 8, hair); // left
  fillRect(data, 24, 8, 8, 8, hair); // back
  fillRect(data, 8, 8, 8, 8, skin); // front
  fillRect(data, 8, 8, 8, 2, hair); // bangs

  // Face eyes & mouth
  px(data, 10, 12, eyeColor);
  px(data, 13, 12, eyeColor);
  px(data, 9, 12, "#ffffff");
  px(data, 14, 12, "#ffffff");
  px(data, 11, 14, "#c68642");
  px(data, 12, 14, "#c68642");

  /* Body */
  fillRect(data, 20, 20, 8, 12, shirt);
  fillRect(data, 28, 20, 8, 12, shirt);
  fillRect(data, 16, 20, 4, 12, shirt);
  fillRect(data, 32, 20, 4, 12, shirt);
  fillRect(data, 20, 16, 8, 4, shirt);
  if (accent) {
    fillRect(data, 22, 22, 4, 6, accent);
  }

  /* Arms */
  fillRect(data, 44, 20, 4, 12, shirt);
  fillRect(data, 44, 16, 4, 4, skin);
  fillRect(data, 48, 20, 4, 12, shirt);
  fillRect(data, 40, 20, 4, 12, shirt);
  fillRect(data, 52, 20, 4, 12, shirt);
  fillRect(data, 36, 52, 4, 12, shirt);
  fillRect(data, 36, 48, 4, 4, skin);
  fillRect(data, 32, 52, 4, 12, shirt);
  fillRect(data, 40, 52, 4, 12, shirt);
  fillRect(data, 44, 52, 4, 12, shirt);

  // Hands (skin exposed)
  fillRect(data, 44, 28, 4, 4, skin);
  fillRect(data, 36, 60, 4, 4, skin);

  /* Legs */
  fillRect(data, 4, 20, 4, 12, pants);
  fillRect(data, 8, 20, 4, 12, pants);
  fillRect(data, 0, 20, 4, 12, pants);
  fillRect(data, 12, 20, 4, 12, pants);
  fillRect(data, 4, 16, 4, 4, pants);
  fillRect(data, 20, 52, 4, 12, pants);
  fillRect(data, 16, 52, 4, 12, pants);
  fillRect(data, 24, 52, 4, 12, pants);
  fillRect(data, 28, 52, 4, 12, pants);

  // Shoes
  fillRect(data, 4, 28, 4, 4, shoes);
  fillRect(data, 20, 60, 4, 4, shoes);

  return new ImageData(data, SKIN_SIZE, SKIN_SIZE);
}

export function defaultSkin(): ImageData {
  return buildSkin("#f0b98a", "#3f2a1a", "#00aaaa", "#3c44aa", "#4a3a28", "#1a2b5e");
}

export const PRESETS: SkinPreset[] = [
  {
    id: "steve",
    name: "Steve",
    icon: "⛏️",
    creator: () => defaultSkin(),
  },
  {
    id: "alex",
    name: "Alex",
    icon: "🏹",
    creator: () => buildSkin("#ffd0a4", "#e86a10", "#5d9b4a", "#6b3f2a", "#3a3a3a", "#2f5e34"),
  },
  {
    id: "miner",
    name: "Miner / Górnik",
    icon: "👷",
    creator: () => {
      const img = buildSkin("#f0b98a", "#f9c62c", "#424242", "#2c488f", "#111111", "#111111", "#ff9800");
      // Helmet lamp on head
      px(img.data, 11, 7, "#ffeb3b");
      px(img.data, 12, 7, "#ffeb3b");
      return img;
    },
  },
  {
    id: "winter",
    name: "Snow Explorer / Polarnik",
    icon: "❄️",
    creator: () => {
      const img = buildSkin("#f0b98a", "#4a3a28", "#3a5f8a", "#22384a", "#e8e8e8", "#5de3e3", "#e0e8f0");
      // Goggles on forehead
      fillRect(img.data, 9, 10, 6, 2, "#169b9c");
      px(img.data, 10, 10, "#ffffff");
      px(img.data, 13, 10, "#ffffff");
      return img;
    },
  },
  {
    id: "knight",
    name: "Knight / Rycerz",
    icon: "🛡️",
    creator: () => buildSkin("#f0b98a", "#8b8b8b", "#cccccc", "#555555", "#2a2a2a", "#000000", "#b02e26"),
  },
  {
    id: "creeper",
    name: "Creeper Hoodie",
    icon: "💥",
    creator: () => {
      const img = buildSkin("#f0b98a", "#3d7a37", "#3d7a37", "#224a1e", "#111111", "#224a1e");
      // Creeper face printed on hoodie chest
      px(img.data, 22, 23, "#111111"); px(img.data, 25, 23, "#111111");
      px(img.data, 23, 24, "#111111"); px(img.data, 24, 24, "#111111");
      px(img.data, 22, 25, "#111111"); px(img.data, 25, 25, "#111111");
      return img;
    },
  },
  {
    id: "wizard",
    name: "Wizard / Mag",
    icon: "🔮",
    creator: () => buildSkin("#f0b98a", "#cccccc", "#4d1d6a", "#301242", "#2a1a3a", "#7b2fbe", "#f9c62c"),
  },
  {
    id: "cyber",
    name: "Cyber Hunter",
    icon: "⚡",
    creator: () => {
      const img = buildSkin("#f0b98a", "#111111", "#222222", "#111111", "#000000", "#5de3e3", "#5de3e3");
      // Neon visor
      fillRect(img.data, 9, 11, 6, 2, "#5de3e3");
      return img;
    },
  },
];

export function loadSkin(): ImageData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSkin();
    const canvas = document.createElement("canvas");
    canvas.width = SKIN_SIZE;
    canvas.height = SKIN_SIZE;
    const ctx = canvas.getContext("2d")!;
    const tmp = document.createElement("img");
    tmp.src = raw;
    if (!tmp.complete || tmp.naturalWidth === 0) return defaultSkin();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, SKIN_SIZE, SKIN_SIZE);
    return ctx.getImageData(0, 0, SKIN_SIZE, SKIN_SIZE);
  } catch {
    return defaultSkin();
  }
}

export function saveSkin(image: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SKIN_SIZE;
  canvas.height = SKIN_SIZE;
  canvas.getContext("2d")!.putImageData(image, 0, 0);
  try {
    window.localStorage.setItem(KEY, canvas.toDataURL("image/png"));
  } catch {
    /* ignore */
  }
  return canvas;
}

export function skinToCanvas(image: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SKIN_SIZE;
  canvas.height = SKIN_SIZE;
  canvas.getContext("2d")!.putImageData(image, 0, 0);
  return canvas;
}

export function loadSkinAsync(): Promise<ImageData> {
  return new Promise((resolve) => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) {
        resolve(defaultSkin());
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = SKIN_SIZE;
        canvas.height = SKIN_SIZE;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, SKIN_SIZE, SKIN_SIZE);
        resolve(ctx.getImageData(0, 0, SKIN_SIZE, SKIN_SIZE));
      };
      img.onerror = () => resolve(defaultSkin());
      img.src = raw;
    } catch {
      resolve(defaultSkin());
    }
  });
}

export function cloneImage(image: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(image.data), image.width, image.height);
}

export function paintPixel(image: ImageData, x: number, y: number, hex: string) {
  px(image.data, x, y, hex);
}

export function floodFill(image: ImageData, x: number, y: number, hex: string) {
  const data = image.data;
  const i0 = (y * SKIN_SIZE + x) * 4;
  const tr = data[i0];
  const tg = data[i0 + 1];
  const tb = data[i0 + 2];
  const n = parseInt(hex.slice(1), 16);
  const nr = (n >> 16) & 255;
  const ng = (n >> 8) & 255;
  const nb = n & 255;
  if (tr === nr && tg === ng && tb === nb) return;

  const stack = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= SKIN_SIZE || cy >= SKIN_SIZE) continue;
    const i = (cy * SKIN_SIZE + cx) * 4;
    if (data[i] !== tr || data[i + 1] !== tg || data[i + 2] !== tb) continue;
    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
    data[i + 3] = 255;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}
