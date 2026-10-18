import { ITEMS, displayName, isItem } from "../game/items";
import type { PublicStats } from "../game/VoxelGame";
import { BlockIcon, Hearts, Hunger, PauseIcon, PickaxeIcon, SoundIcon, Thermometer, TrophyIcon, VoxelCube, cx } from "./ui";
import TouchControls from "./TouchControls";
import { t } from "../game/i18n";

type Props = {
  stats: PublicStats;
  best: number;
  muted: boolean;
  touch: boolean;
  onPause: () => void;
  onToggleSound: () => void;
  onSelectSlot: (index: number) => void;
  onOpenInventory: () => void;
  onMove: (x: number, y: number) => void;
  onVertical: (v: number) => void;
  onMining: (active: boolean) => void;
  onJump: () => void;
  onPlace: () => void;
  onToggleFly: () => void;
  onPlaceHold: (held: boolean) => void;
};

function formatClock(timeLeft: number) {
  const total = Math.max(0, Math.ceil(timeLeft));
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
}

export default function Hud({
  stats,
  best,
  muted,
  touch,
  onPause,
  onToggleSound,
  onSelectSlot,
  onOpenInventory,
  onMove,
  onVertical,
  onMining,
  onJump,
  onPlace,
  onToggleFly,
  onPlaceHold,
}: Props) {
  const sprint = stats.mode === "sprint";
  const survival = stats.mode === "survival";
  const cold = stats.mode === "cold";
  const critical = sprint && stats.timeLeft <= 10;
  const timePct = Math.max(0, Math.min(1, stats.timeLeft / 90));
  const comboVisible = sprint && stats.combo >= 2;
  const hintVisible = sprint ? stats.timeLeft > 82 : stats.blocksMined + stats.blocksPlaced < 3;
  const target = stats.target;
  const loading = stats.loading < 0.92;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      {/* top left cluster */}
      <div className="hud-top-offset absolute left-2.5 flex items-start gap-1.5 sm:left-4 sm:gap-2">
        <button type="button" onClick={onPause} aria-label={t("pause")} className="hud-btn pointer-events-auto">
          <PauseIcon className="h-4 w-4" />
          <span className="hidden font-pixel text-[9px] uppercase tracking-[0.12em] lg:inline">{t("pause")}</span>
        </button>
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={muted ? t("unmute") : t("mute")}
          className="hud-btn pointer-events-auto hidden h-9 w-9 min-[380px]:grid"
        >
          <SoundIcon muted={muted} className="h-4 w-4" />
        </button>
        <div className="hidden flex-col gap-1 xl:flex">
          <div className="flex items-center gap-2 rounded-[7px] border-2 border-ink/70 bg-ink/80 px-2.5 py-1.5 shadow-[0_3px_0_rgba(10,20,14,0.35)] backdrop-blur-sm">
            <VoxelCube className="h-5 w-5" />
            <span className="font-pixel text-[10px] tracking-[0.1em] text-paper">ORE RUSH</span>
            <span className="rounded-[3px] bg-paper/15 px-1.5 py-0.5 font-pixel text-[8px] uppercase tracking-wide text-paper/70">
              {t(stats.mode)}
            </span>
          </div>
        </div>
      </div>

      {/* world info strip */}
      <div className="hud-info absolute left-2.5 flex flex-wrap items-center gap-1.5 sm:left-4">
        <span className="hud-chip">
          <span className="text-paper/45">XYZ</span>
          {stats.position.x} {stats.position.y} {stats.position.z}
        </span>
        <span className="hud-chip">{stats.biome}</span>
        <span className="hud-chip">
          {stats.night ? "🌙" : "☀"} {stats.clock}
        </span>
        <span className="hud-chip hidden sm:inline-flex">{stats.fps} FPS</span>
        {stats.flying && <span className="hud-chip hud-chip-accent">{t("fly")}</span>}
        {stats.swimming && <span className="hud-chip hud-chip-accent">{t("swim")}</span>}
      </div>

      {/* timer (sprint only) */}
      {sprint && (
        <div
          className={cx(
            "timer-panel hud-top-offset absolute left-1/2 -translate-x-1/2 rounded-[9px] border-[3px] border-ink bg-[#142a1e]/92 px-2.5 py-1.5 text-center shadow-[0_4px_0_rgba(10,20,14,0.4)] backdrop-blur-sm sm:px-4 sm:py-2",
            critical && "timer-critical"
          )}
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-paper/60" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 1.5M9 2h6" />
            </svg>
            <span className="font-pixel text-[7px] uppercase tracking-[0.16em] text-paper/60 sm:text-[8px]">{t("timeLeft")}</span>
          </div>
          <p className={cx("font-pixel text-xl leading-none tabular-nums sm:text-2xl", critical ? "text-[#ff8f6c]" : "text-paper")}>
            {formatClock(stats.timeLeft)}
          </p>
          <div className="mx-auto mt-1 h-[5px] w-[86px] overflow-hidden rounded-[2px] border border-black/30 bg-black/30 sm:w-[112px]">
            <div
              className={cx("h-full transition-[width] duration-150 ease-out", critical ? "bg-[#ff7b58]" : "bg-grass")}
              style={{ width: `${timePct * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* score / creative badge */}
      <div className="hud-top-offset absolute right-2.5 text-right sm:right-4">
        {sprint ? (
          <>
            <div className="rounded-[9px] border-[3px] border-ink/80 bg-paper/92 px-2.5 py-1.5 shadow-[0_4px_0_rgba(10,20,14,0.3)] backdrop-blur-sm sm:px-3.5 sm:py-2">
              <p className="font-pixel text-[7px] uppercase tracking-[0.18em] text-ink/45 sm:text-[8px]">{t("score")}</p>
              <p key={stats.score} className="score-pop font-pixel text-lg leading-none tabular-nums text-ink sm:text-2xl">
                {stats.score.toLocaleString("en-US")}
              </p>
              <div className="mt-1 hidden items-center justify-end gap-1 sm:flex">
                <TrophyIcon className="h-2.5 w-2.5 text-[#a06b13]" />
                <span className="font-pixel text-[8px] uppercase tracking-wide text-ink/45">
                  {t("best")} {Math.max(best, stats.score).toLocaleString()}
                </span>
              </div>
            </div>
            {stats.score > best && stats.score > 0 && (
              <span className="record-tag mt-1 inline-block rounded-[3px] border-2 border-ink bg-gold px-1.5 py-0.5 font-pixel text-[7px] uppercase tracking-[0.1em] text-ink shadow">
                {t("newBest")}
              </span>
            )}
          </>
        ) : (
          <div className="rounded-[9px] border-[3px] border-ink/80 bg-paper/92 px-2.5 py-1.5 text-right shadow-[0_4px_0_rgba(10,20,14,0.3)] backdrop-blur-sm">
            <p className="font-pixel text-[7px] uppercase tracking-[0.18em] text-ink/45">{t(stats.mode)}</p>
            <p className="font-pixel text-sm leading-none text-ink">{stats.blocksPlaced} {t("placed")}</p>
            <p className="font-pixel text-[8px] uppercase tracking-wide text-ink/45">{stats.blocksMined} {t("mined")} · {stats.kills} {t("kills")}</p>
          </div>
        )}
      </div>

      {/* combo */}
      {comboVisible && (
        <div className="absolute left-2.5 top-[112px] sm:left-4 sm:top-[124px]">
          <div key={stats.combo} className="combo-pop w-[112px] rounded-[8px] border-[3px] border-ink bg-[linear-gradient(160deg,#2d4a34,#162b1f)] px-2 py-1.5 shadow-[0_4px_0_rgba(10,20,14,0.35)]">
            <div className="flex items-end justify-between">
              <span className="font-pixel text-[8px] uppercase tracking-[0.12em] text-gold/80">{t("combo")}</span>
              <span className="font-pixel text-xl leading-none text-gold">×{Math.min(stats.combo, 8)}</span>
            </div>
            <div className="mt-1 h-[5px] overflow-hidden rounded-[2px] border border-black/40 bg-black/40">
              <div
                className="h-full bg-[linear-gradient(90deg,#f1c445,#ff9c4b)] transition-[width] duration-100 ease-linear"
                style={{ width: `${Math.max(0, stats.comboPct) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* crosshair + target */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <div className={cx("crosshair", target && "crosshair-active")} style={target ? { color: target.color } : undefined}>
          <span className="ch-line ch-h" />
          <span className="ch-line ch-v" />
          <span className="ch-dot" />
        </div>
        {target && (
          <div
            className="mt-2 flex items-center gap-1.5 rounded-[5px] border-2 bg-ink/85 px-2 py-1 shadow-[0_2px_0_rgba(10,20,14,0.4)] backdrop-blur-sm"
            style={{ borderColor: target.color }}
          >
            <span className="h-1.5 w-1.5 rounded-[1px]" style={{ background: target.color }} />
            <span className="font-pixel text-[9px] uppercase tracking-[0.08em] text-paper sm:text-[10px]">{target.name}</span>
            {sprint && <span className="font-pixel text-[9px] tabular-nums text-gold sm:text-[10px]">+{target.score}</span>}
          </div>
        )}
        {target && target.progress > 0.002 && (
          <div className="mt-1 h-[6px] w-[92px] overflow-hidden rounded-[2px] border-2 border-ink/70 bg-black/40">
            <div className="h-full" style={{ width: `${Math.min(1, target.progress) * 100}%`, background: target.color }} />
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 rounded-[6px] border-2 border-paper/25 bg-ink/75 px-3 py-1.5 backdrop-blur-sm">
          <p className="font-pixel text-[8px] uppercase tracking-[0.12em] text-paper/80">
            {t("buildingChunks")} {Math.round(stats.loading * 100)}%
          </p>
        </div>
      )}

      {hintVisible && !loading && (
        <div
          className={cx(
            "hint-in absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-[7px] border-2 border-paper/25 bg-ink/78 px-3 py-2 shadow-[0_3px_0_rgba(10,20,14,0.3)] backdrop-blur-sm",
            touch ? "top-[140px] max-w-[300px]" : "bottom-[108px]"
          )}
        >
          <BlockIcon id={stats.hotbar[stats.selected]?.id ?? 1} size={18} />
          <p className="font-pixel text-[8px] uppercase leading-tight tracking-[0.08em] text-paper/90 sm:text-[9px]">
            {touch ? t("hint.touch") : t("hint.mouse")}
            <span className="block text-paper/45">
              {sprint ? t("hint.sprint") : cold ? t("mode.cold.desc") : survival ? t("hint.survival") : t("hint.creative")}
            </span>
          </p>
        </div>
      )}

      {/* desktop control strip */}
      <div className="absolute bottom-3 left-4 hidden items-center gap-2 rounded-[6px] border-2 border-paper/20 bg-ink/65 px-2.5 py-1.5 backdrop-blur-sm lg:flex">
        <PickaxeIcon className="h-3.5 w-3.5 text-paper/70" />
        <span className="font-pixel text-[8px] uppercase tracking-[0.08em] text-paper/65">
          {t("strip")}
          {stats.mode === "creative" ? t("stripFly") : ""}
        </span>
      </div>

      {/* hotbar */}
      <div className={cx("absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5", touch ? "hotbar-touch" : "bottom-4 sm:bottom-5")}>
        {stats.mode !== "creative" && (
          <div className="flex items-center gap-3 rounded-[6px] border-2 border-ink/60 bg-ink/70 px-2 py-1 backdrop-blur-sm">
            <Hearts health={stats.health} max={stats.maxHealth} />
            {(survival || cold) && <Hunger hunger={stats.hunger} max={stats.maxHunger} />}
            {cold && <Thermometer temp={stats.temperature} max={stats.maxTemperature} />}
          </div>
        )}
        <div className="rounded-[5px] border-2 border-ink/50 bg-ink/65 px-2 py-0.5 backdrop-blur-sm">
          <span className="font-pixel text-[9px] uppercase tracking-[0.08em] text-paper/90">{stats.held.name}</span>
          {isItem(stats.held.id) && (
            <span className="ml-1.5 font-pixel text-[8px] uppercase text-gold">{ITEMS[stats.held.id]?.tag}</span>
          )}
        </div>
        <div className="pointer-events-auto flex items-end gap-1 rounded-[10px] border-[3px] border-ink bg-[#12251b]/92 p-1.5 shadow-[0_5px_0_rgba(10,20,14,0.4)] backdrop-blur-sm">
          {stats.hotbar.map((slot, index) => {
            const isSelected = stats.selected === index;
            const empty = slot.id === 0 || slot.count === 0;
            return (
              <button
                key={index}
                type="button"
                onClick={() => onSelectSlot(index)}
                aria-label={`${displayName(slot.id)} slot ${index + 1}`}
                className={cx(
                  "hotbar-slot relative grid place-items-center rounded-[5px] border-2 transition-transform",
                  isSelected ? "-translate-y-1 border-gold bg-[#3a5138] shadow-[0_2px_0_#0b1710]" : "border-black/30 bg-black/25 hover:bg-black/10"
                )}
                style={{ width: touch ? 34 : 42, height: touch ? 34 : 42 }}
              >
                {!empty && <BlockIcon id={slot.id} size={touch ? 22 : 26} />}
                {!empty && slot.count !== 1 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-[3px] border border-ink bg-[#2a4131] px-0.5 font-pixel text-[8px] leading-none text-paper">
                    {slot.count < 0 ? "∞" : slot.count}
                  </span>
                )}
                {!touch && <span className="absolute -bottom-[2px] left-1 font-pixel text-[7px] leading-none text-paper/40">{index + 1}</span>}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onOpenInventory}
            aria-label={t("openInventory")}
            className="ml-1 grid place-items-center rounded-[5px] border-2 border-paper/30 bg-black/30 text-paper/80 transition hover:bg-black/10"
            style={{ width: touch ? 34 : 42, height: touch ? 34 : 42 }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {touch && (
        <TouchControls
          onMove={onMove}
          onMining={onMining}
          onJump={onJump}
          onPlace={onPlace}
          onPlaceHold={onPlaceHold}
          onVertical={onVertical}
          onToggleFly={onToggleFly}
          creative={stats.mode === "creative"}
          flying={stats.flying}
          weapon={stats.held.kind === "sword" || stats.held.kind === "bow"}
        />
      )}
    </div>
  );
}
