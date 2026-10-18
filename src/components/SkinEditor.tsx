import { useEffect, useRef, useState } from "react";
import {
  PALETTE,
  PARTS,
  PRESETS,
  SKIN_SIZE,
  cloneImage,
  defaultSkin,
  floodFill,
  loadSkinAsync,
  paintPixel,
  saveSkin,
  skinToCanvas,
  type SkinPart,
} from "../game/skin";
import { t } from "../game/i18n";
import { PixelButton, cx } from "./ui";

type Props = {
  onApply: (canvas: HTMLCanvasElement) => void;
  onClose: () => void;
};

export default function SkinEditor({ onApply, onClose }: Props) {
  const [image, setImage] = useState<ImageData>(() => defaultSkin());
  const [part, setPart] = useState<SkinPart>("head");
  const [color, setColor] = useState("#f0b98a");
  const [tool, setTool] = useState<"pencil" | "fill" | "eraser">("pencil");
  const [activePreset, setActivePreset] = useState<string>("steve");
  const scale = 18;
  const drawing = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadSkinAsync().then(setImage);
  }, []);

  const rect = PARTS[part].front;

  const redraw = (img: ImageData) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const tmp = skinToCanvas(img);

    // Draw zoomed-in body part
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(tmp, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2] * scale, rect[3] * scale);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= rect[2]; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scale + 0.5, 0);
      ctx.lineTo(x * scale + 0.5, rect[3] * scale);
      ctx.stroke();
    }
    for (let y = 0; y <= rect[3]; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale + 0.5);
      ctx.lineTo(rect[2] * scale, y * scale + 0.5);
      ctx.stroke();
    }

    // 3D paperdoll preview
    const p = previewRef.current;
    if (p) {
      const pctx = p.getContext("2d")!;
      pctx.imageSmoothingEnabled = false;
      pctx.fillStyle = "#1e293b";
      pctx.fillRect(0, 0, p.width, p.height);

      // Subtle shadow under character
      pctx.fillStyle = "rgba(0,0,0,0.35)";
      pctx.beginPath();
      pctx.ellipse(p.width / 2, 195, 32, 8, 0, 0, Math.PI * 2);
      pctx.fill();

      const s = 4.8;
      const ox = (p.width - 16 * s) / 2 + 4 * s;
      const oy = 16;

      // Head
      pctx.drawImage(tmp, 8, 8, 8, 8, ox, oy, 8 * s, 8 * s);
      // Body
      pctx.drawImage(tmp, 20, 20, 8, 12, ox, oy + 8 * s, 8 * s, 12 * s);
      // Arm R
      pctx.drawImage(tmp, 44, 20, 4, 12, ox - 4 * s, oy + 8 * s, 4 * s, 12 * s);
      // Arm L
      pctx.drawImage(tmp, 36, 52, 4, 12, ox + 8 * s, oy + 8 * s, 4 * s, 12 * s);
      // Leg R
      pctx.drawImage(tmp, 4, 20, 4, 12, ox, oy + 20 * s, 4 * s, 12 * s);
      // Leg L
      pctx.drawImage(tmp, 20, 52, 4, 12, ox + 4 * s, oy + 20 * s, 4 * s, 12 * s);
    }
  };

  useEffect(() => redraw(image), [image, part]);

  const paintAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const rct = c.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rct.left) / rct.width) * rect[2]);
    const y = Math.floor(((e.clientY - rct.top) / rct.height) * rect[3]);
    if (x < 0 || y < 0 || x >= rect[2] || y >= rect[3]) return;

    const next = cloneImage(image);
    const drawColor = tool === "eraser" ? "#000000" : color;

    if (tool === "fill") {
      floodFill(next, rect[0] + x, rect[1] + y, drawColor);
    } else {
      paintPixel(next, rect[0] + x, rect[1] + y, drawColor);
    }
    setImage(next);
  };

  const apply = () => {
    const canvas = saveSkin(image);
    onApply(canvas);
  };

  const onFile = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = SKIN_SIZE;
      c.height = SKIN_SIZE;
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, SKIN_SIZE, SKIN_SIZE);
      const loaded = ctx.getImageData(0, 0, SKIN_SIZE, SKIN_SIZE);
      setImage(loaded);
      setActivePreset("custom");
    };
    img.src = URL.createObjectURL(file);
  };

  const gridW = rect[2] * scale;
  const gridH = rect[3] * scale;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0d1a13]/80 p-3 backdrop-blur-md">
      <div className="panel modal-in my-auto w-full max-w-4xl overflow-hidden p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b-2 border-ink/15 pb-3">
          <div>
            <span className="inline-block rounded-[3px] bg-grass/20 px-2 py-0.5 font-pixel text-[8px] uppercase tracking-wider text-grass-deep">
              {t("skin.tag")}
            </span>
            <h2 className="mt-1 font-pixel text-2xl uppercase leading-none text-ink sm:text-3xl">
              {t("skin.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mc-close"
            aria-label={t("backToWorld")}
          >
            ×
          </button>
        </div>

        {/* Character Skin Presets Bar */}
        <div className="mb-4">
          <p className="mb-1.5 font-pixel text-[10px] uppercase tracking-wider text-ink/60">
            Presets / Gotowe postacie:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setImage(preset.creator());
                  setActivePreset(preset.id);
                }}
                className={cx(
                  "flex items-center gap-1.5 rounded-[5px] border-2 px-2.5 py-1.5 font-pixel text-[11px] transition-all",
                  activePreset === preset.id
                    ? "border-ink bg-gold text-ink shadow-[0_2px_0_#16281c]"
                    : "border-ink/20 bg-paper/90 text-ink/75 hover:bg-white"
                )}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[auto_1fr]">
          {/* Drawing Canvas Box */}
          <div className="flex flex-col items-center gap-2.5 rounded-[8px] border-2 border-ink/20 bg-ink/5 p-3">
            <div className="flex flex-wrap justify-center gap-1">
              {(Object.keys(PARTS) as SkinPart[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPart(key)}
                  className={cx(
                    "rounded-[4px] border-2 px-2 py-1 font-pixel text-[10px] uppercase transition-colors",
                    part === key ? "border-ink bg-grass text-ink" : "border-ink/20 bg-paper text-ink/60"
                  )}
                >
                  {t(`skin.${key}`)}
                </button>
              ))}
            </div>

            <canvas
              ref={canvasRef}
              width={gridW}
              height={gridH}
              className="cursor-crosshair rounded-[6px] border-[3px] border-ink bg-[#1a1a1a] shadow-inner touch-none"
              style={{ width: gridW, height: gridH, imageRendering: "pixelated" }}
              onPointerDown={(e) => {
                drawing.current = true;
                (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
                paintAt(e);
              }}
              onPointerMove={(e) => {
                if (drawing.current && tool === "pencil") paintAt(e);
              }}
              onPointerUp={() => {
                drawing.current = false;
              }}
            />

            {/* Tool Selection */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTool("pencil")}
                className={cx("mc-toggle flex items-center gap-1", tool === "pencil" && "mc-toggle-on")}
              >
                <span>✏️</span> Pencil
              </button>
              <button
                type="button"
                onClick={() => setTool("fill")}
                className={cx("mc-toggle flex items-center gap-1", tool === "fill" && "mc-toggle-on")}
              >
                <span>🪣</span> Fill
              </button>
              <button
                type="button"
                onClick={() => setTool("eraser")}
                className={cx("mc-toggle flex items-center gap-1", tool === "eraser" && "mc-toggle-on")}
              >
                <span>🧹</span> Eraser
              </button>
            </div>
          </div>

          {/* Preview & Palette Box */}
          <div className="flex flex-col justify-between gap-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center">
                <p className="mb-1 font-pixel text-[9px] uppercase tracking-wider text-ink/50">3D Preview</p>
                <canvas
                  ref={previewRef}
                  width={150}
                  height={220}
                  className="rounded-[8px] border-[3px] border-ink shadow-md"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              {/* Color Swatches */}
              <div className="flex-1">
                <p className="mb-1.5 font-pixel text-[9px] uppercase tracking-wider text-ink/50">Palette / Kolory</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => {
                        setColor(hex);
                        if (tool === "eraser") setTool("pencil");
                      }}
                      className={cx(
                        "h-7 w-7 rounded-[4px] border-2 shadow-sm transition-transform",
                        color === hex ? "scale-110 border-ink ring-2 ring-gold" : "border-black/30 hover:scale-105"
                      )}
                      style={{ background: hex }}
                      aria-label={hex}
                    />
                  ))}
                  <label className="grid h-7 w-7 cursor-pointer place-items-center rounded-[4px] border-2 border-ink/40 bg-paper text-xs shadow-sm hover:bg-white">
                    <span>🎨</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        setColor(e.target.value);
                        if (tool === "eraser") setTool("pencil");
                      }}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink/10 pt-3">
              <div className="flex items-center gap-2">
                <PixelButton size="sm" variant="cream" onClick={() => setImage(defaultSkin())}>
                  {t("skin.reset")}
                </PixelButton>
                <PixelButton size="sm" variant="cream" onClick={() => fileRef.current?.click()}>
                  {t("skin.upload")}
                </PixelButton>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                />
              </div>

              <PixelButton size="md" onClick={apply}>
                ✨ {t("skin.apply")}
              </PixelButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
