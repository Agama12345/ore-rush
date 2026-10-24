import type { GameMode } from "../game/VoxelGame";
import type { ScoreEntry } from "../types";
import { t, type Lang } from "../game/i18n";
import { HelpIcon, IconButton, KeyCap, LangSwitch, Leaderboard, PickaxeIcon, PixelButton, PlayIcon, SoundIcon, Sparkle, TrophyIcon, VoxelCube } from "./ui";

type Props = {
  scores: ScoreEntry[];
  name: string;
  onNameChange: (value: string) => void;
  muted: boolean;
  onToggleSound: () => void;
  onPlay: (mode: GameMode) => void;
  onContinue?: () => void;
  onHelp: () => void;
  isTouch: boolean;
  renderDistance: number;
  onRenderDistance: (value: number) => void;
  lang: Lang;
  onLang: (lang: Lang) => void;
  onSkin: () => void;
};

export default function StartScreen({
  scores,
  name,
  onNameChange,
  muted,
  onToggleSound,
  onPlay,
  onContinue,
  onHelp,
  isTouch,
  renderDistance,
  onRenderDistance,
  lang,
  onLang,
  onSkin,
}: Props) {
  const best = scores[0]?.score ?? 0;
  const modes: { mode: GameMode; cls: string; icon: React.ReactNode }[] = [
    { mode: "survival", cls: "mode-card-survival", icon: <PlayIcon className="h-3.5 w-3.5" /> },
    { mode: "cold", cls: "mode-card-cold", icon: <span>❄️</span> },
    { mode: "sprint", cls: "mode-card-sprint", icon: <PlayIcon className="h-3.5 w-3.5" /> },
    { mode: "creative", cls: "mode-card-creative", icon: <Sparkle className="h-3.5 w-3.5" /> },
  ];
  const controls = [
    { keys: ["W", "A", "S", "D"], label: "ctl.move" },
    { keys: ["MOUSE"], label: "ctl.look" },
    { keys: ["LMB"], label: "ctl.mine" },
    { keys: ["RMB"], label: "ctl.place" },
    { keys: ["SPACE"], label: "ctl.jump" },
    { keys: ["E"], label: "ctl.inv" },
    { keys: ["1–9"], label: "ctl.hotbar" },
    { keys: ["F"], label: "ctl.fly" },
  ];

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto overflow-x-hidden">
      <div className="hero-grade pointer-events-none absolute inset-0" />

      <div className="relative flex min-h-full flex-col">
        <header className="safe-header flex items-start justify-between gap-3 px-4 sm:px-7">
          <div className="brand-chip pointer-events-auto flex items-center gap-2.5 rounded-[9px] border-[3px] border-ink bg-[#f9f2df]/92 py-1.5 pl-1.5 pr-3 shadow-[0_4px_0_rgba(22,40,28,0.35)] backdrop-blur-sm">
            <VoxelCube className="h-9 w-9 drop-shadow-[0_2px_0_rgba(22,40,28,0.25)]" />
            <div className="leading-none">
              <p className="font-pixel text-lg tracking-[0.06em] text-ink">ORE RUSH</p>
              <p className="mt-1 font-pixel text-[8px] uppercase tracking-[0.22em] text-ink/50">{t("tagline")}</p>
            </div>
          </div>
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
            <LangSwitch lang={lang} onLang={onLang} />
            <PixelButton size="sm" variant="cream" onClick={onSkin}>
              {t("skin.open")}
            </PixelButton>
            <IconButton label={muted ? t("unmute") : t("mute")} onClick={onToggleSound}>
              <SoundIcon muted={muted} className="h-5 w-5" />
            </IconButton>
            <IconButton label={t("howToPlay")} onClick={onHelp}>
              <HelpIcon className="h-5 w-5" />
            </IconButton>
          </div>
        </header>

        <main className="flex flex-1 items-center px-4 py-5 sm:px-7">
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-[820px]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-paper/25 bg-ink/65 px-3 py-1.5 backdrop-blur-sm">
                <span className="status-dot h-2 w-2 rounded-full bg-grass" />
                <span className="font-pixel text-[9px] uppercase tracking-[0.18em] text-paper/90">{t("badge")}</span>
              </div>

              <h1 className="hero-title font-pixel font-bold uppercase">
                <span className="block text-paper">ORE</span>
                <span className="block text-gold">RUSH</span>
              </h1>

              <p className="mt-3 max-w-[520px] text-[15px] font-medium leading-relaxed text-[#22382a] sm:text-base">{t("heroText")}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-3.5">
                {modes.map(({ mode, cls, icon }) => (
                  <button key={mode} type="button" onClick={() => onPlay(mode)} className={`mode-card ${cls}`}>
                    <span className="mode-badge">{t(`mode.${mode}.badge`)}</span>
                    <span className="mode-title">{t(`mode.${mode}.title`)}</span>
                    <span className="mode-desc">{t(`mode.${mode}.desc`)}</span>
                    <span className="mode-cta">
                      {icon} {t(`mode.${mode}.cta`)}
                    </span>
                  </button>
                ))}
              </div>

              {onContinue && (
                <div className="mt-3">
                  <PixelButton onClick={onContinue}>▶ {t("continueWorld")}</PixelButton>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <div className="info-pill">
                  <TrophyIcon className="h-3.5 w-3.5 text-[#a06b13]" />
                  <span className="text-ink/55">{t("best")}</span>
                  <span className="text-ink">{best.toLocaleString(lang === "pl" ? "pl-PL" : "en-US")}</span>
                </div>
                <div className="info-pill">
                  <PickaxeIcon className="h-3.5 w-3.5 text-ink/60" />
                  <span className="text-ink/55">{isTouch ? t("touchReady") : t("keysHint")}</span>
                </div>
                <label className="info-pill gap-2">
                  <span className="text-ink/55">{t("view")}</span>
                  <input
                    type="range"
                    min={3}
                    max={isTouch ? 7 : 11}
                    value={renderDistance}
                    onChange={(e) => onRenderDistance(Number(e.target.value))}
                    aria-label={t("renderDistance")}
                    className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-ink/20 accent-[#4aa83b]"
                  />
                  <span className="text-ink">{renderDistance}</span>
                </label>
              </div>

              {!isTouch && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <KeyCap wide>ent</KeyCap>
                  <span className="font-pixel text-[9px] uppercase tracking-[0.15em] text-ink/55">{t("key.survival")}</span>
                  <KeyCap wide>S</KeyCap>
                  <span className="font-pixel text-[9px] uppercase tracking-[0.15em] text-ink/55">{t("key.sprint")}</span>
                  <KeyCap wide>C</KeyCap>
                  <span className="font-pixel text-[9px] uppercase tracking-[0.15em] text-ink/55">{t("key.creative")}</span>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="relative px-4 pb-4 sm:px-7 sm:pb-6">
          <div className="mx-auto grid w-full max-w-7xl gap-3 lg:grid-cols-[minmax(0,1fr)_370px]">
            <div className="panel hidden p-4 lg:block">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-[4px] border-2 border-ink/60 bg-[#e7dcbd] text-ink">
                  <PickaxeIcon className="h-3.5 w-3.5" />
                </span>
                <h3 className="font-pixel text-[11px] uppercase tracking-[0.14em] text-ink">{t("fieldManual")}</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                {controls.map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <div className="flex shrink-0 gap-1">
                      {row.keys.map((key) => (
                        <KeyCap key={key} wide={key.length > 2}>
                          {key}
                        </KeyCap>
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-pixel text-[10px] uppercase tracking-wide text-ink/80">{t(row.label)}</p>
                      <p className="truncate text-[10px] text-ink/40">{t(`${row.label}.note`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Leaderboard scores={scores} name={name} onNameChange={onNameChange} limit={isTouch ? 3 : 5} compact />
          </div>
        </footer>
      </div>
    </div>
  );
}
