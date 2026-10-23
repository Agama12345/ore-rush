import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { CREATIVE_GROUPS, RECIPES, displayName, recipeNeeds, type Recipe } from "../game/items";
import type { ContainerUI, GameMode, HotbarSlot, SlotArea } from "../game/VoxelGame";
import { t } from "../game/i18n";
import { BlockIcon, PixelButton, cx } from "./ui";

type Click = "left" | "right" | "shift";

type Props = {
  ui: ContainerUI;
  hotbar: HotbarSlot[];
  backpack: HotbarSlot[];
  selected: number;
  mode: GameMode;
  touch: boolean;
  canCraft: (recipe: Recipe) => boolean;
  onClick: (area: SlotArea, index: number, button: Click) => void;
  onFill: (recipeId: string) => void;
  onPick: (blockId: number) => void;
  onSelectSlot: (index: number) => void;
  onClose: () => void;
};

function Slot({
  slot,
  size,
  highlight,
  big,
  label,
  onAction,
}: {
  slot: HotbarSlot | { id: number; count: number } | null;
  size: number;
  highlight?: boolean;
  big?: boolean;
  label?: string;
  onAction: (button: Click) => void;
}) {
  const empty = !slot || slot.id === 0 || slot.count === 0;
  const handle = (e: ReactMouseEvent, button: Click) => {
    e.preventDefault();
    onAction(button);
  };
  return (
    <button
      type="button"
      title={empty ? label : displayName(slot!.id)}
      aria-label={empty ? label ?? "empty slot" : displayName(slot!.id)}
      onClick={(e) => handle(e, e.shiftKey ? "shift" : "left")}
      onContextMenu={(e) => handle(e, "right")}
      className={cx("mc-slot", highlight && "mc-slot-active", big && "mc-slot-big")}
      style={{ width: size, height: size }}
    >
      {!empty && <BlockIcon id={slot!.id} size={Math.round(size * 0.66)} />}
      {!empty && slot!.count > 1 && <span className="mc-count">{slot!.count}</span>}
      {!empty && slot!.count < 0 && <span className="mc-count">∞</span>}
      {empty && label && <span className="mc-slot-label">{label}</span>}
    </button>
  );
}

function Arrow({ progress = 0 }: { progress?: number }) {
  return (
    <div className="relative h-6 w-10 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 22 14" className="absolute inset-0 h-full w-full" shapeRendering="crispEdges">
        <path d="M0 5h14V1l8 6-8 6V9H0z" fill="#8b8b8b" />
      </svg>
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${Math.min(1, progress) * 100}%` }}>
        <svg viewBox="0 0 22 14" className="h-6 w-10" shapeRendering="crispEdges">
          <path d="M0 5h14V1l8 6-8 6V9H0z" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
}

function Flame({ level }: { level: number }) {
  return (
    <div className="relative h-7 w-7" aria-hidden="true">
      <svg viewBox="0 0 14 14" className="absolute inset-0" shapeRendering="crispEdges">
        <path d="M6 1h2v2h1v2h1v2h1v4l-1 1H4l-1-1V7h1V5h1V3h1z" fill="#8b8b8b" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: `${Math.min(1, level) * 100}%` }}>
        <svg viewBox="0 0 14 14" className="absolute bottom-0 h-7 w-7" shapeRendering="crispEdges">
          <path d="M6 1h2v2h1v2h1v2h1v4l-1 1H4l-1-1V7h1V5h1V3h1z" fill="#ff8a1e" />
          <path d="M6 6h2v2h1v3H5V8h1z" fill="#ffe36b" />
        </svg>
      </div>
    </div>
  );
}

export default function Inventory({ ui, hotbar, backpack, selected, mode, touch, canCraft, onClick, onFill, onPick, onSelectSlot, onClose }: Props) {
  const creative = mode === "creative";
  const [group, setGroup] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [single, setSingle] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const slotSize = touch ? 36 : 42;

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse") setPointer({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const click = (area: SlotArea, index: number) => (button: Click) => onClick(area, index, single && button === "left" ? "right" : button);

  const recipes = useMemo(() => {
    const list = RECIPES.filter((recipe) => showAll || canCraft(recipe));
    return list.sort((a, b) => Number(canCraft(b)) - Number(canCraft(a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll, canCraft, ui, hotbar, backpack]);

  const title =
    ui.container === "table" ? t("craftingTable") : ui.container === "furnace" ? t("furnace") : ui.container === "chest" ? t("chest") : creative ? t("palette") : t("inventory");
  const cursorFilled = ui.cursor.id !== 0 && ui.cursor.count !== 0;

  const inventoryGrid = (
    <div>
      <p className="mc-label">{t("backpack")}</p>
      <div className="grid grid-cols-9 gap-[3px]">
        {backpack.map((slot, index) => (
          <Slot key={`bp-${index}`} slot={slot} size={slotSize} onAction={click("inv", index + 9)} />
        ))}
      </div>
      <p className="mc-label mt-2">{t("hotbar")}</p>
      <div className="grid grid-cols-9 gap-[3px]">
        {hotbar.map((slot, index) => (
          <Slot key={`hb-${index}`} slot={slot} size={slotSize} highlight={index === selected} onAction={click("inv", index)} />
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/55 p-2 sm:p-6"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="mc-panel modal-in my-auto w-full max-w-[720px]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-pixel text-base text-[#3f3f3f] sm:text-lg">{title}</h2>
          <div className="flex items-center gap-1.5">
            {!creative && touch && (
              <button type="button" onClick={() => setSingle((v) => !v)} className={cx("mc-toggle", single && "mc-toggle-on")}>
                {t("singleMode")}
              </button>
            )}
            <button type="button" onClick={onClose} aria-label={t("backToWorld")} className="mc-close">
              ×
            </button>
          </div>
        </div>

        {creative ? (
          <>
            <div className="mb-2 flex flex-wrap gap-1">
              {CREATIVE_GROUPS.map((entry, index) => (
                <button key={entry.name} type="button" onClick={() => setGroup(index)} className={cx("mc-tab", index === group && "mc-tab-on")}>
                  <BlockIcon id={entry.items[0]} size={18} />
                </button>
              ))}
            </div>
            <div className="mc-inset grid max-h-[40vh] grid-cols-9 gap-[3px] overflow-y-auto p-1.5">
              {CREATIVE_GROUPS[group].items.map((id) => (
                <Slot key={id} slot={{ id, count: 1 }} size={slotSize} onAction={() => onPick(id)} />
              ))}
            </div>
            <p className="mc-label mt-2">{t("hotbar")} · {t("creativeTip")}</p>
            <div className="grid grid-cols-9 gap-[3px]">
              {hotbar.map((slot, index) => (
                <Slot key={`hb-${index}`} slot={slot} size={slotSize} highlight={index === selected} onAction={() => onSelectSlot(index)} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:flex-row">
              {/* crafting / smelting / storage area */}
              <div className="mc-inset flex min-h-[150px] flex-1 items-center justify-center gap-3 p-3">
                {ui.container === "chest" && ui.chest ? (
                  <div className="grid grid-cols-9 gap-[3px]">
                    {ui.chest.map((slot, index) => (
                      <Slot key={`ch-${index}`} slot={slot} size={slotSize} onAction={click("chest", index)} />
                    ))}
                  </div>
                ) : ui.container === "furnace" && ui.furnace ? (
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <Slot slot={ui.furnace.input} size={slotSize} label="⛏" onAction={click("fIn", 0)} />
                      <Flame level={ui.furnace.burn} />
                      <Slot slot={ui.furnace.fuel} size={slotSize} label="🔥" onAction={click("fFuel", 0)} />
                    </div>
                    <Arrow progress={ui.furnace.cook} />
                    <Slot slot={ui.furnace.output} size={slotSize + 12} big onAction={click("fOut", 0)} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${ui.craftSize}, ${slotSize}px)` }}>
                      {ui.craft.slice(0, ui.craftSize * ui.craftSize).map((slot, index) => (
                        <Slot key={`c-${index}`} slot={slot} size={slotSize} onAction={click("craft", index)} />
                      ))}
                    </div>
                    <Arrow progress={ui.result ? 1 : 0} />
                    <Slot slot={ui.result} size={slotSize + 12} big onAction={click("result", 0)} />
                  </div>
                )}
              </div>

              {/* recipe book */}
              {ui.container !== "furnace" && ui.container !== "chest" && (
                <div className="mc-inset flex w-full flex-col p-2 md:w-[250px]">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-pixel text-[11px] text-[#3f3f3f]">{t("recipeBook")}</span>
                    <button type="button" onClick={() => setShowAll((v) => !v)} className="mc-toggle">
                      {showAll ? t("showAll") : t("showCraftable")}
                    </button>
                  </div>
                  <div className="grid max-h-[150px] grid-cols-6 gap-[3px] overflow-y-auto md:max-h-[170px]">
                    {recipes.map((recipe) => {
                      const ok = canCraft(recipe);
                      const locked = recipe.size > ui.craftSize;
                      return (
                        <button
                          key={recipe.id}
                          type="button"
                          onClick={() => onFill(recipe.id)}
                          title={`${displayName(recipe.out.id)} — ${recipeNeeds(recipe)
                            .map((need) => `${need.count}× ${displayName(need.id)}`)
                            .join(", ")}${locked ? ` (${t("needsTable")})` : ""}`}
                          className={cx("mc-recipe", ok ? "mc-recipe-ok" : "mc-recipe-no")}
                        >
                          <BlockIcon id={recipe.out.id} size={22} />
                          {locked && <span className="mc-lock">3×3</span>}
                        </button>
                      );
                    })}
                    {!recipes.length && <p className="col-span-6 py-3 text-center text-[11px] text-[#555]">—</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3">{inventoryGrid}</div>
          </>
        )}

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="font-pixel text-[9px] leading-relaxed text-[#555]">
            {creative ? t("closeHint") : ui.container === "furnace" ? t("furnaceTip") : ui.container === "chest" ? t("chestTip") : touch ? t("touchTip") : t("invTip")}
          </p>
          <PixelButton size="sm" onClick={onClose}>
            {t("backToWorld")}
          </PixelButton>
        </div>
      </div>

      {/* item stuck to the cursor */}
      {cursorFilled && pointer && !touch && (
        <div className="pointer-events-none fixed z-50" style={{ left: pointer.x - 16, top: pointer.y - 16 }}>
          <BlockIcon id={ui.cursor.id} size={32} />
          {ui.cursor.count > 1 && <span className="mc-count mc-count-float">{ui.cursor.count}</span>}
        </div>
      )}
      {cursorFilled && (touch || !pointer) && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-[4px] border-2 border-black/60 bg-[#c6c6c6] px-2 py-1">
          <span className="font-pixel text-[9px] text-[#3f3f3f]">{t("holding")}</span>
          <BlockIcon id={ui.cursor.id} size={20} />
          <span className="font-pixel text-[10px] text-[#3f3f3f]">×{ui.cursor.count < 0 ? 1 : ui.cursor.count}</span>
        </div>
      )}
    </div>
  );
}
