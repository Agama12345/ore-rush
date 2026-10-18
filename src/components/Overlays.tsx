import type { ReactNode } from "react";
import type { FlashData, PopupData, ScoreEntry } from "../types";
import type { PublicStats, RunSummary } from "../game/VoxelGame";
import { B } from "../game/blocks";
import { I, displayName } from "../game/items";
import { getLang, t, type Lang } from "../game/i18n";
import {
  BlockIcon,
  HelpIcon,
  KeyCap,
  LangSwitch,
  Leaderboard,
  PauseIcon,
  PickaxeIcon,
  PixelButton,
  PlayIcon,
  RestartIcon,
  SoundIcon,
  Sparkle,
  TrophyIcon,
  cx,
} from "./ui";

const fmt = (n: number) => n.toLocaleString(getLang() === "pl" ? "pl-PL" : "en-US");

function Backdrop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#0d1a13]/65 p-3 backdrop-blur-[3px] sm:p-6", className)}>
      <div className="modal-in my-auto w-full max-w-lg">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export function PauseMenu({
  stats,
  muted,
  touch,
  renderDistance,
  onRenderDistance,
  onResume,
  onRestart,
  onHelp,
  onMenu,
  onToggleSound,
  lang,
  onLang,
  onSkin,
}: {
  stats: PublicStats;
  muted: boolean;
  touch: boolean;
  renderDistance: number;
  onRenderDistance: (value: number) => void;
  onResume: () => void;
  onRestart: () => void;
  onHelp: () => void;
  onMenu: () => void;
  onToggleSound: () => void;
  lang: Lang;
  onLang: (lang: Lang) => void;
  onSkin: () => void;
}) {
  const sprint = stats.mode === "sprint";
  const cards = sprint
    ? [
        { label: t("score"), value: fmt(stats.score) },
        { label: t("oreMined"), value: String(stats.ores) },
        { label: t("timeLeft"), value: `${Math.max(0, Math.ceil(stats.timeLeft))}s` },
      ]
    : [
        { label: t("placed"), value: String(stats.blocksPlaced) },
        { label: t("mined"), value: String(stats.blocksMined) },
        { label: t("altitude"), value: String(stats.position.y) },
      ];
  return (
    <Backdrop>
      <div className="panel relative overflow-hidden p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border-2 border-ink/30 bg-[#e9dec1] px-2 py-1 font-pixel text-[8px] uppercase tracking-[0.16em] text-ink/60">
              <PauseIcon className="h-2.5 w-2.5" /> {t("runPaused")} · {t(stats.mode)}
            </span>
            <h2 className="mt-2 font-pixel text-3xl uppercase leading-none text-ink sm:text-4xl">{t("paused")}</h2>
            <p className="mt-1 text-xs font-medium text-ink/50">
              {stats.biome} · {stats.clock} · {stats.chunks} {t("chunksLoaded")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LangSwitch lang={lang} onLang={onLang} />
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={muted ? t("unmute") : t("mute")}
              className="grid h-9 w-9 place-items-center rounded-[6px] border-2 border-ink/25 bg-white/50 text-ink/70 transition hover:bg-white"
            >
              <SoundIcon muted={muted} className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {cards.map((item) => (
            <div key={item.label} className="rounded-[6px] border-2 border-ink/15 bg-[#efe5c9] px-2 py-2 text-center">
              <p className="font-pixel text-[7px] uppercase tracking-[0.14em] text-ink/40">{item.label}</p>
              <p className="font-pixel text-base leading-tight text-ink">{item.value}</p>
            </div>
          ))}
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-[6px] border-2 border-ink/15 bg-[#efe5c9] px-2.5 py-2">
          <span className="font-pixel text-[9px] uppercase tracking-[0.12em] text-ink/50">{t("renderDistance")}</span>
          <input
            type="range"
            min={3}
            max={11}
            value={renderDistance}
            onChange={(e) => onRenderDistance(Number(e.target.value))}
            aria-label={t("renderDistance")}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink/20 accent-[#4aa83b]"
          />
          <span className="w-6 text-right font-pixel text-xs text-ink">{renderDistance}</span>
        </label>

        <div className="mt-4 flex flex-col gap-2.5">
          <PixelButton size="md" onClick={onResume} icon={<PlayIcon className="h-3.5 w-3.5" />} className="w-full">
            {t("resume")}
          </PixelButton>
          <div className="grid grid-cols-2 gap-2.5">
            <PixelButton size="sm" variant="cream" onClick={onRestart} icon={<RestartIcon className="h-3.5 w-3.5" />}>
              {t("newWorld")}
            </PixelButton>
            <PixelButton size="sm" variant="cream" onClick={onHelp} icon={<HelpIcon className="h-3.5 w-3.5" />}>
              {t("howToPlay")}
            </PixelButton>
            <PixelButton size="sm" variant="cream" onClick={onSkin}>
              {t("skin.open")}
            </PixelButton>
          </div>
          <button
            type="button"
            onClick={onMenu}
            className="mt-1 font-pixel text-[9px] uppercase tracking-[0.16em] text-ink/40 underline decoration-ink/20 underline-offset-4 transition hover:text-ink/70"
          >
            {t("quit")}
          </button>
        </div>

        <p className="mt-3 text-center font-pixel text-[8px] uppercase tracking-[0.12em] text-ink/35">{touch ? t("resumeTouch") : t("resumeKeys")}</p>
      </div>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ */
export function GameOver({
  run,
  scores,
  highlightId,
  isRecord,
  best,
  onRestart,
  onMenu,
  onHelp,
}: {
  run: RunSummary;
  scores: ScoreEntry[];
  highlightId: string | null;
  isRecord: boolean;
  best: number;
  onRestart: () => void;
  onMenu: () => void;
  onHelp: () => void;
}) {
  const topOre = Object.entries(run.mined).sort((a, b) => b[1] - a[1])[0];
  const oreId = topOre ? Number(topOre[0]) : B.GOLD;
  return (
    <Backdrop className="bg-[#0d1a13]/70">
      <div className="panel relative w-full max-w-3xl overflow-hidden">
        <div className="h-[10px] w-full bg-[linear-gradient(90deg,#5fae45,#8cd167_35%,#f4c544_70%,#e5a83d)]" />
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <span className="font-pixel text-[8px] uppercase tracking-[0.18em] text-ink/40">{t("sprintComplete")}</span>
              <h2 className="mt-1 font-pixel text-3xl uppercase leading-none text-ink sm:text-4xl">{t("timesUp")}</h2>
            </div>
            {isRecord ? (
              <span className="record-tag inline-flex items-center gap-1.5 rounded-[5px] border-2 border-ink bg-gold px-2.5 py-1.5 font-pixel text-[9px] uppercase tracking-[0.1em] text-ink shadow-[0_3px_0_rgba(22,40,28,0.3)]">
                <Sparkle className="h-3 w-3" /> {t("newRecord")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-[5px] border-2 border-ink/20 bg-[#eee4c8] px-2.5 py-1.5 font-pixel text-[9px] uppercase tracking-[0.08em] text-ink/50">
                <TrophyIcon className="h-3 w-3" /> {t("best")} {fmt(best)}
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_270px]">
            <div>
              <div className="rounded-[8px] border-[3px] border-ink/80 bg-[linear-gradient(160deg,#20382a,#13261b)] p-3.5 shadow-[0_4px_0_rgba(22,40,28,0.35)]">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="font-pixel text-[8px] uppercase tracking-[0.18em] text-paper/50">{t("finalScore")}</p>
                    <p className="font-pixel text-4xl leading-none text-gold sm:text-5xl">{fmt(run.score)}</p>
                  </div>
                  <BlockIcon id={oreId} size={38} className="mb-0.5 rotate-3 opacity-90" />
                </div>
                <p className="mt-2 text-[11px] font-medium text-paper/45">
                  {run.score >= 6000 ? t("verdict.high") : run.score >= 2500 ? t("verdict.mid") : t("verdict.low")}
                </p>
              </div>

              <div className="mt-2.5 grid grid-cols-4 gap-2">
                {[
                  { label: t("colOre"), value: String(run.ores) },
                  { label: t("combo"), value: `×${run.bestCombo}` },
                  { label: t("mined"), value: String(run.blocksMined) },
                  { label: t("kills"), value: String(run.kills) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[6px] border-2 border-ink/15 bg-[#efe5c9] p-2 text-center">
                    <p className="font-pixel text-[7px] uppercase tracking-[0.1em] text-ink/40">{stat.label}</p>
                    <p className="mt-0.5 font-pixel text-base leading-none text-ink">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <PixelButton size="md" onClick={onRestart} icon={<RestartIcon className="h-4 w-4" />} className="w-full">
                  {t("mineAgain")}
                  <span className="ml-1 hidden rounded-[3px] border border-ink/25 bg-white/25 px-1.5 py-0.5 font-pixel text-[8px] sm:inline">R / ENTER</span>
                </PixelButton>
                <div className="grid grid-cols-2 gap-2">
                  <PixelButton size="sm" variant="cream" onClick={onMenu}>
                    {t("mainMenu")}
                  </PixelButton>
                  <PixelButton size="sm" variant="cream" onClick={onHelp} icon={<HelpIcon className="h-3.5 w-3.5" />}>
                    {t("tips")}
                  </PixelButton>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <Leaderboard scores={scores} limit={5} highlightId={highlightId} compact title={t("localScores")} />
              <div className="mt-2 flex items-center gap-1.5 rounded-[5px] border-2 border-ink/15 bg-[#efe5c9] px-2 py-1.5">
                <PickaxeIcon className="h-3 w-3 shrink-0 text-ink/40" />
                <p className="font-pixel text-[7px] uppercase leading-relaxed tracking-[0.06em] text-ink/45">{t("savedHint")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ */
const ores = [B.COAL, B.IRON, B.GOLD, B.REDSTONE, B.LAPIS, B.DIAMOND, B.EMERALD, B.TNT];
const craftPath = [B.LOG, B.PLANKS, I.STICK, B.CRAFTING, I.WOOD_PICK, I.STONE_PICK, B.FURNACE, I.IRON_INGOT, I.IRON_PICK, I.DIAMOND_PICK];

export function HelpModal({ onClose, touch }: { onClose: () => void; touch: boolean }) {
  const keys = [
    { keys: ["W", "A", "S", "D"], label: "ctl.move" },
    { keys: ["MOUSE"], label: "ctl.look" },
    { keys: ["LMB"], label: "ctl.mine" },
    { keys: ["RMB"], label: "ctl.place" },
    { keys: ["SPACE"], label: "ctl.jump" },
    { keys: ["1–9"], label: "ctl.hotbar" },
    { keys: ["E"], label: "ctl.inv" },
    { keys: ["F"], label: "ctl.fly" },
    { keys: ["ESC"], label: "ctl.pause" },
  ];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0d1a13]/75 p-3 backdrop-blur-md sm:p-6">
      <div className="panel modal-in my-auto w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between border-b-[3px] border-ink/15 bg-[#efe5c9] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-[5px] border-2 border-ink/60 bg-[#f9f2df]">
              <PickaxeIcon className="h-4 w-4 text-ink" />
            </span>
            <div>
              <p className="font-pixel text-[8px] uppercase tracking-[0.18em] text-ink/45">{t("fieldManual")}</p>
              <h2 className="font-pixel text-xl uppercase leading-none text-ink">{t("howToPlay")}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("backToWorld")}
            className="grid h-8 w-8 place-items-center rounded-[5px] border-2 border-ink/25 bg-white/50 font-pixel text-lg leading-none text-ink/70 transition hover:bg-white"
          >
            ×
          </button>
        </div>

        <div className="max-h-[74vh] overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-2.5 sm:grid-cols-3">
            {(["survival", "sprint", "creative"] as const).map((mode) => (
              <div key={mode} className="rounded-[7px] border-2 border-ink/15 bg-[#f7efdc] p-3">
                <p className="font-pixel text-[10px] uppercase tracking-[0.1em] text-grass-deep">{t(`mode.${mode}.title`)}</p>
                <p className="mt-1 text-[12px] font-medium leading-relaxed text-ink/75">{t(`help.${mode}`)}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-[7px] border-2 border-ink/15 bg-[#f7efdc] p-3">
            <p className="font-pixel text-[9px] uppercase tracking-[0.14em] text-ink/45">{t("help.crafting")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {craftPath.map((id, index) => (
                <span key={id} className="flex items-center gap-1">
                  <span title={displayName(id)} className="grid h-8 w-8 place-items-center rounded-[4px] border-2 border-ink/15 bg-white/50">
                    <BlockIcon id={id} size={22} />
                  </span>
                  {index < craftPath.length - 1 && <span className="font-pixel text-[10px] text-ink/40">›</span>}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink/60">{t("help.craftingText")}</p>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-[7px] border-2 border-ink/15 bg-[#f7efdc] p-3">
              <p className="font-pixel text-[9px] uppercase tracking-[0.14em] text-ink/45">{t("help.keyboard")}</p>
              <div className="mt-2 space-y-1.5">
                {keys.map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <div className="flex shrink-0 gap-1">
                      {row.keys.map((k) => (
                        <KeyCap key={k} wide={k.length > 2}>
                          {k}
                        </KeyCap>
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-ink/70">
                      {t(row.label)}
                      {row.label !== "ctl.pause" && <span className="text-ink/40"> — {t(`${row.label}.note`)}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[7px] border-2 border-ink/15 bg-[#f7efdc] p-3">
              <p className="font-pixel text-[9px] uppercase tracking-[0.14em] text-ink/45">{t("help.touch")}</p>
              <div className="mt-2 space-y-2 text-[11px] font-medium leading-snug text-ink/70">
                {[1, 2, 3, 4, 5].map((n) => (
                  <p key={n}>{t(`help.touch.${n}`)}</p>
                ))}
              </div>
              {!touch && <p className="mt-2 rounded-[4px] bg-[#e9dfc4] p-2 text-[10px] leading-snug text-ink/50">{t("help.touchAuto")}</p>}
            </div>
          </div>

          <div className="mt-3 rounded-[7px] border-2 border-ink/15 bg-[#f7efdc] p-3">
            <p className="font-pixel text-[9px] uppercase tracking-[0.14em] text-ink/45">{t("help.ground")}</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
              {ores.map((id) => (
                <div key={id} title={displayName(id)} className="flex flex-col items-center gap-1 rounded-[4px] border-2 border-ink/10 bg-white/40 p-1.5">
                  <BlockIcon id={id} size={22} />
                  <span className="w-full truncate text-center font-pixel text-[7px] uppercase text-ink/60">{displayName(id)}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink/55">{t("help.groundText")}</p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-[6px] border-2 border-[#c9a13e]/40 bg-[#f6e6b9] p-2.5">
            <p className="font-pixel text-[8px] uppercase leading-relaxed tracking-[0.08em] text-ink/60">{t("help.tip")}</p>
            <PixelButton size="sm" onClick={onClose} icon={<PlayIcon className="h-3 w-3" />}>
              {t("gotIt")}
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export function FeedbackLayer({ popups, flash }: { popups: PopupData[]; flash: FlashData | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {flash && <div key={`flash-${flash.id}`} className={cx("flash-layer", `flash-${flash.kind}`)} />}
      {flash?.kind === "start" && (
        <div key={`start-${flash.id}`} className="start-burst">
          <p className="start-burst-title">{t("dig")}</p>
          <p className="start-burst-sub">{t("newWorldSub")}</p>
        </div>
      )}
      <div className="absolute left-1/2 top-[31%] flex -translate-x-1/2 flex-col items-center gap-1">
        {popups.map((popup) => (
          <div key={popup.id} className={cx("score-popup", `popup-${popup.kind}`)}>
            <span className="popup-main">{popup.text}</span>
            {popup.sub && <span className="popup-sub">{popup.sub}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
