import type { ButtonHTMLAttributes, ReactNode } from "react";
import { BLOCKS, blockIconStyle } from "../game/blocks";
import { ITEMS, isItem } from "../game/items";
import { t, type Lang } from "../game/i18n";
import type { ScoreEntry } from "../types";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
export function VoxelCube({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 34" className={className} aria-hidden="true" shapeRendering="crispEdges">
      <polygon points="16,1 30,8 16,15 2,8" fill="#86d05a" stroke="#152418" strokeWidth="2" />
      <polygon points="2,8 16,15 16,32 2,24" fill="#8a5a38" stroke="#152418" strokeWidth="2" />
      <polygon points="16,15 30,8 30,24 16,32" fill="#6b4427" stroke="#152418" strokeWidth="2" />
      <polygon points="5,7 16,3 16,9 5,13" fill="#a2e275" opacity=".85" />
      <rect x="7" y="17" width="3" height="3" fill="#5a3820" />
      <rect x="8" y="21" width="3" height="3" fill="#5a3820" />
      <rect x="20" y="16" width="3" height="3" fill="#4e301b" />
      <rect x="21" y="22" width="6" height="3" fill="#4e301b" />
    </svg>
  );
}

export function ToolIcon({ id, size = 30, className = "" }: { id: number; size?: number; className?: string }) {
  const item = ITEMS[id];
  if (!item) return null;
  const color = `#${item.color.toString(16).padStart(6, "0")}`;
  const accent = `#${item.accent.toString(16).padStart(6, "0")}`;
  const handle = "#7d5a2f";
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={cx("shrink-0", className)}
      style={{ imageRendering: "pixelated" }}
      role="img"
      aria-label={item.name}
      shapeRendering="crispEdges"
    >
      {item.kind === "sword" && (
        <>
          <rect x="6" y="10" width="4" height="2" fill={accent} />
          <rect x="7" y="11" width="2" height="4" fill={handle} />
          <rect x="7" y="2" width="3" height="9" fill={color} />
          <rect x="7" y="2" width="1" height="9" fill={accent} />
        </>
      )}
      {item.kind === "pickaxe" && (
        <>
          <rect x="3" y="3" width="10" height="2" fill={color} />
          <rect x="2" y="4" width="2" height="2" fill={accent} />
          <rect x="12" y="4" width="2" height="2" fill={accent} />
          <rect x="7" y="5" width="2" height="9" fill={handle} />
        </>
      )}
      {item.kind === "axe" && (
        <>
          <rect x="5" y="2" width="6" height="5" fill={color} />
          <rect x="10" y="3" width="2" height="3" fill={accent} />
          <rect x="6" y="6" width="2" height="8" fill={handle} />
        </>
      )}
      {item.kind === "shovel" && (
        <>
          <rect x="6" y="2" width="4" height="4" fill={color} />
          <rect x="6" y="2" width="4" height="1" fill={accent} />
          <rect x="7" y="6" width="2" height="8" fill={handle} />
        </>
      )}
      {item.icon === "bow" && (
        <>
          <rect x="9" y="2" width="2" height="2" fill={color} />
          <rect x="11" y="4" width="2" height="8" fill={color} />
          <rect x="9" y="12" width="2" height="2" fill={color} />
          <rect x="8" y="3" width="1" height="10" fill={accent} />
          <rect x="4" y="7" width="6" height="1" fill={accent} />
          <rect x="3" y="7" width="2" height="2" fill="#d8cdb6" />
        </>
      )}
      {item.icon === "stick" && (
        <>
          <rect x="9" y="3" width="2" height="4" fill={color} />
          <rect x="7" y="6" width="2" height="4" fill={accent} />
          <rect x="5" y="9" width="2" height="4" fill={color} />
        </>
      )}
      {item.icon === "ingot" && (
        <>
          <rect x="3" y="7" width="10" height="4" fill={color} />
          <rect x="4" y="6" width="8" height="1" fill={accent} />
          <rect x="4" y="11" width="8" height="1" fill={accent} opacity="0.45" />
        </>
      )}
      {item.icon === "nugget" && (
        <>
          <rect x="5" y="5" width="6" height="6" fill={color} />
          <rect x="6" y="4" width="4" height="1" fill={color} />
          <rect x="5" y="11" width="6" height="1" fill={color} />
          <rect x="6" y="6" width="2" height="2" fill={accent} />
        </>
      )}
      {item.icon === "gem" && (
        <>
          <rect x="6" y="3" width="4" height="1" fill={accent} />
          <rect x="4" y="4" width="8" height="3" fill={color} />
          <rect x="5" y="7" width="6" height="3" fill={color} />
          <rect x="6" y="10" width="4" height="2" fill={color} />
          <rect x="6" y="5" width="2" height="2" fill={accent} />
        </>
      )}
      {item.icon === "dust" && (
        <>
          {[[4, 5], [8, 4], [6, 8], [10, 9], [5, 11], [9, 12]].map(([x, y], idx) => (
            <rect key={idx} x={x} y={y} width="2" height="2" fill={idx % 2 ? accent : color} />
          ))}
        </>
      )}
      {item.icon === "food" && (
        <>
          <rect x="4" y="5" width="8" height="7" fill={color} />
          <rect x="5" y="4" width="6" height="1" fill={color} />
          <rect x="5" y="12" width="6" height="1" fill={color} />
          <rect x="5" y="6" width="2" height="2" fill="#ffffff" opacity="0.55" />
          <rect x="8" y="2" width="2" height="2" fill={accent} />
        </>
      )}
      {item.icon === "meat" && (
        <>
          <rect x="3" y="6" width="9" height="5" fill={color} />
          <rect x="4" y="5" width="7" height="1" fill={accent} />
          <rect x="4" y="11" width="7" height="1" fill={accent} />
          <rect x="11" y="7" width="3" height="3" fill="#efe4d0" />
        </>
      )}
      {item.icon === "arrow" && (
        <>
          <rect x="7" y="2" width="2" height="10" fill={color} />
          <rect x="6" y="1" width="4" height="2" fill={accent} />
          <rect x="5" y="11" width="2" height="3" fill="#e8e8e8" />
          <rect x="9" y="11" width="2" height="3" fill="#e8e8e8" />
        </>
      )}
      {item.icon === "bucket" && (
        <>
          <rect x="4" y="4" width="8" height="2" fill={accent} />
          <rect x="3" y="6" width="10" height="6" fill={color} />
          <rect x="5" y="12" width="6" height="2" fill={accent} />
          <rect x="5" y="5" width="6" height="3" fill={color === "#dadada" ? "#8c8c8c" : color} />
        </>
      )}
      {item.icon === "flint_steel" && (
        <>
          <rect x="4" y="6" width="4" height="6" fill={color} />
          <rect x="8" y="4" width="4" height="8" fill={accent} />
          <rect x="9" y="3" width="2" height="2" fill="#ffd740" />
        </>
      )}
      {item.icon === "shears" && (
        <>
          <rect x="3" y="3" width="5" height="5" fill={color} />
          <rect x="8" y="8" width="5" height="5" fill={accent} />
          <rect x="7" y="7" width="2" height="2" fill="#333333" />
        </>
      )}
      {item.icon === "snowball" && (
        <>
          <circle cx="8" cy="8" r="5" fill={color} />
          <circle cx="6" cy="6" r="2" fill="#ffffff" />
        </>
      )}
      {item.icon === "armor" && (
        <>
          <rect x="3" y="2" width="10" height="11" fill={color} />
          <rect x="6" y="2" width="4" height="4" fill="#111111" opacity="0.4" />
          <rect x="4" y="10" width="8" height="3" fill={accent} />
        </>
      )}
      {item.icon === "misc" && (
        <>
          <rect x="4" y="4" width="8" height="8" fill={color} />
          <rect x="5" y="5" width="3" height="3" fill={accent} />
          <rect x="8" y="8" width="3" height="3" fill={accent} opacity="0.6" />
        </>
      )}
    </svg>
  );
}

export function Thermometer({ temp, max }: { temp: number; max: number }) {
  const pct = Math.max(0, Math.min(1, temp / max));
  const freezing = pct < 0.3;
  return (
    <div className="flex items-center gap-1.5" aria-label={`Temperature ${temp} of ${max}`}>
      <span className={cx("text-[13px] leading-none", freezing ? "animate-pulse" : "")}>
        {freezing ? "❄️" : "🌡️"}
      </span>
      <div className="h-[9px] w-20 overflow-hidden rounded-[3px] border border-black/50 bg-black/60 p-[1px]">
        <div
          className={cx(
            "h-full transition-all duration-300",
            freezing
              ? "bg-[linear-gradient(90deg,#00d2ff,#3a7bd5)]"
              : pct < 0.6
              ? "bg-[linear-gradient(90deg,#4facfe,#00f2fe)]"
              : "bg-[linear-gradient(90deg,#ff9900,#ff5500)]"
          )}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

export function BlockIcon({ id, size = 30, className = "" }: { id: number; size?: number; className?: string }) {
  if (isItem(id)) {
    return (
      <span className={cx("inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
        <ToolIcon id={id} size={size} />
      </span>
    );
  }
  const def = BLOCKS[id];
  return (
    <span
      aria-label={def?.name}
      className={cx("inline-block shrink-0 rounded-[2px] ring-1 ring-ink/40", className)}
      style={{ width: size, height: size, ...blockIconStyle(id) }}
    />
  );
}

export function Hearts({ health, max }: { health: number; max: number }) {
  const hearts = Math.ceil(max / 2);
  return (
    <div className="flex items-center gap-[3px]" aria-label={`Health ${health} of ${max}`}>
      {Array.from({ length: hearts }).map((_, i) => {
        const value = clampHeart(health - i * 2);
        return (
          <svg key={i} viewBox="0 0 10 9" className="h-[14px] w-[14px] drop-shadow-[0_1px_0_rgba(0,0,0,.6)]" shapeRendering="crispEdges">
            <path d="M1 1h2v1h1V1h2v1h1v3H6v1H5v1H4V6H3V5H1z" fill="#2b0d0d" opacity="0.65" transform="translate(0,1)" />
            <path
              d="M1 1h2v1h1V1h2v1h1v3H6v1H5v1H4V6H3V5H1z"
              fill={value === 2 ? "#e23a3a" : value === 1 ? "#e23a3a" : "#3c3c3c"}
              opacity={value === 0 ? 0.55 : 1}
            />
            {value === 1 && <rect x="4" y="1" width="4" height="6" fill="#3c3c3c" opacity="0.75" />}
          </svg>
        );
      })}
    </div>
  );
}

export function Hunger({ hunger, max }: { hunger: number; max: number }) {
  const icons = Math.ceil(max / 2);
  return (
    <div className="flex items-center gap-[3px]" aria-label={`Hunger ${hunger} of ${max}`}>
      {Array.from({ length: icons }).map((_, i) => {
        const value = clampHeart(hunger - i * 2);
        return (
          <svg key={i} viewBox="0 0 10 9" className="h-[14px] w-[14px] drop-shadow-[0_1px_0_rgba(0,0,0,.6)]" shapeRendering="crispEdges">
            <path
              d="M2 2h6v1h1v3H8v2H2V6H1V3h1z"
              fill={value > 0 ? "#b4813a" : "#3c3c3c"}
              opacity={value === 0 ? 0.55 : 1}
            />
            <path d="M3 3h4v1H3z" fill={value > 0 ? "#e0b060" : "#555"} />
            {value === 1 && <rect x="5" y="1" width="5" height="8" fill="#3c3c3c" opacity="0.72" />}
          </svg>
        );
      })}
    </div>
  );
}

function clampHeart(v: number) {
  if (v >= 2) return 2;
  if (v === 1) return 1;
  return 0;
}

/* ------------------------------------------------------------------ */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "grass" | "cream" | "dark" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
};

export function PixelButton({ variant = "grass", size = "md", className, children, icon, ...props }: ButtonProps) {
  const sizes = {
    sm: "px-3 py-2 text-[10px] gap-1.5",
    md: "px-5 py-3 text-xs gap-2",
    lg: "px-7 py-4 text-sm sm:text-base gap-3",
  }[size];
  const variants = {
    grass: "bg-[linear-gradient(180deg,#8ade67_0%,#62c04a_48%,#4aa83b_100%)] text-ink",
    cream: "bg-[linear-gradient(180deg,#fffaf0_0%,#f3e9cf_100%)] text-ink",
    dark: "bg-[linear-gradient(180deg,#334b3a_0%,#1b2f22_100%)] text-paper",
    danger: "bg-[linear-gradient(180deg,#ef7b5f_0%,#d9553f_100%)] text-white",
    ghost: "bg-transparent text-paper border-ink/40 shadow-none hover:bg-white/10",
  }[variant];
  return (
    <button
      {...props}
      className={cx(
        "btn-pixel inline-flex select-none items-center justify-center whitespace-nowrap font-pixel uppercase tracking-[0.08em]",
        variant === "ghost" ? "" : "",
        sizes,
        variants,
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({
  className,
  children,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={cx(
        "btn-pixel grid h-10 w-10 place-items-center rounded-[7px] border-[3px] border-ink bg-[linear-gradient(180deg,#fffaf0,#eadfc3)] text-ink",
        className
      )}
    >
      {children}
    </button>
  );
}

export function KeyCap({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <kbd
      className={cx(
        "inline-flex h-[26px] items-center justify-center rounded-[5px] border-2 border-ink bg-[#fffaf0] px-1.5 font-pixel text-[10px] font-bold uppercase leading-none text-ink shadow-[0_2px_0_#16281c]",
        wide ? "min-w-[44px]" : "min-w-[26px]"
      )}
    >
      {children}
    </kbd>
  );
}

export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6L12 1z" fill="currentColor" />
    </svg>
  );
}

export function PickaxeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20L15 9" />
      <path d="M8 4c4-1.6 8.5-.4 11 2.5-2.9 1.5-5.4 1.7-8 .9" fill="currentColor" stroke="none" />
      <path d="M14 3.5C18 4 21 7 21.5 11c-1.8-1.5-3.2-2.2-5-2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v5a5 5 0 01-10 0V4z" />
      <path d="M7 6H3v2a4 4 0 004 4M17 6h4v2a4 4 0 01-4 4" />
      <path d="M12 14v4M8 21h8M9 21v-3h6v3" />
    </svg>
  );
}

export function SoundIcon({ muted, className = "" }: { muted: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 010 7" />
          <path d="M18 6a8.5 8.5 0 010 12" />
        </>
      )}
    </svg>
  );
}

export function HelpIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a2.9 2.9 0 115 2c-.9.8-2.2 1.4-2.2 2.8" />
      <path d="M12 17.4h.01" />
    </svg>
  );
}

export function PauseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M7 4l13 8-13 8V4z" />
    </svg>
  );
}

export function RestartIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11a9 9 0 1115.5 6.2" />
      <path d="M3 4v7h7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
export function ScoreRows({
  scores,
  limit = 5,
  highlightId,
  compact = false,
}: {
  scores: ScoreEntry[];
  limit?: number;
  highlightId?: string | null;
  compact?: boolean;
}) {
  const rows = scores.slice(0, limit);
  const placeholders = Math.max(0, Math.min(3, limit) - rows.length);
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((entry, index) => {
        const isNew = entry.id === highlightId;
        return (
          <div
            key={entry.id}
            className={cx(
              "flex items-center gap-2 rounded-[6px] border-2 px-2.5 font-pixel text-[11px] sm:text-xs",
              compact ? "py-1.5" : "py-2",
              isNew
                ? "border-gold bg-[#ffeab0] text-ink shadow-[0_2px_0_rgba(22,40,28,0.25)]"
                : "border-ink/15 bg-[#f5edd9] text-ink/80"
            )}
          >
            <span
              className={cx(
                "grid h-5 w-5 shrink-0 place-items-center rounded-[3px] text-[10px]",
                index === 0 ? "bg-gold text-ink" : index === 1 ? "bg-[#c9d3d6] text-ink" : index === 2 ? "bg-[#d8a072] text-ink" : "bg-ink/10 text-ink/70"
              )}
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate uppercase tracking-wide">{entry.name || "MINER"}</span>
            <span className="hidden items-center gap-1 text-[10px] text-ink/50 xs:flex sm:flex">
              <BlockIcon id={4} size={12} />
              {entry.ores}
            </span>
            <span className="w-[70px] text-right tabular-nums sm:w-[84px]">{entry.score.toLocaleString("en-US")}</span>
            {isNew && <span className="rounded-[3px] bg-ink px-1 py-0.5 text-[8px] uppercase text-paper">{t("newTag")}</span>}
          </div>
        );
      })}
      {Array.from({ length: placeholders }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="flex items-center gap-2 rounded-[6px] border-2 border-dashed border-ink/15 px-2.5 py-2 font-pixel text-[11px] text-ink/30"
        >
          <span className="grid h-5 w-5 place-items-center rounded-[3px] bg-ink/5 text-[10px]">{rows.length + i + 1}</span>
          <span className="flex-1 uppercase">{t("vacant")}</span>
          <span className="w-[70px] text-right">000</span>
        </div>
      ))}
    </div>
  );
}

export function Leaderboard({
  scores,
  limit = 5,
  highlightId,
  compact = false,
  name,
  onNameChange,
  title,
  className = "",
}: {
  scores: ScoreEntry[];
  limit?: number;
  highlightId?: string | null;
  compact?: boolean;
  name?: string;
  onNameChange?: (value: string) => void;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cx("rounded-[10px] border-[3px] border-ink/80 bg-[#fff9e9]/85 p-3 shadow-[0_4px_0_rgba(22,40,28,0.25)] backdrop-blur-sm", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TrophyIcon className="h-4 w-4 text-[#b47b19]" />
          <h3 className="font-pixel text-[11px] uppercase tracking-[0.14em] text-ink sm:text-xs">{title ?? t("highScores")}</h3>
        </div>
        <span className="rounded-[3px] border border-ink/25 bg-[#e8dcbd] px-1.5 py-0.5 font-pixel text-[8px] uppercase tracking-wider text-ink/60">
          {t("local")}
        </span>
      </div>
      <div className="mb-1 flex items-center gap-2 px-2.5 font-pixel text-[7px] uppercase tracking-[0.12em] text-ink/35">
        <span className="w-5" />
        <span className="flex-1">{t("colMiner")}</span>
        <span className="hidden w-8 text-right xs:block">{t("colOre")}</span>
        <span className="w-[70px] text-right sm:w-[84px]">{t("colScore")}</span>
      </div>
      <ScoreRows scores={scores} limit={limit} highlightId={highlightId} compact={compact} />
      {scores.length === 0 && (
        <p className="mt-1.5 text-center font-pixel text-[8px] uppercase leading-relaxed tracking-[0.08em] text-ink/35">
          {t("noRuns")}
        </p>
      )}
      {onNameChange && (
        <label className="mt-2.5 flex items-center gap-2 border-t-2 border-ink/10 pt-2">
          <span className="font-pixel text-[9px] uppercase tracking-[0.14em] text-ink/50">{t("minerTag")}</span>
          <input
            value={name ?? ""}
            onChange={(e) => onNameChange(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 10))}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="STEVE"
            aria-label={t("minerTag")}
            spellCheck={false}
            className="min-w-0 flex-1 rounded-[4px] border-2 border-ink/25 bg-white/70 px-2 py-1 font-pixel text-[11px] uppercase tracking-wide text-ink outline-none transition-colors focus:border-grass-deep"
          />
        </label>
      )}
    </div>
  );
}

export function LangSwitch({ lang, onLang, className = "" }: { lang: Lang; onLang: (lang: Lang) => void; className?: string }) {
  return (
    <div role="group" aria-label={t("language")} className={cx("inline-flex overflow-hidden rounded-[7px] border-[3px] border-ink bg-[#f3ead5] shadow-[0_3px_0_rgba(22,40,28,0.35)]", className)}>
      {(["pl", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onLang(code)}
          aria-pressed={lang === code}
          className={cx(
            "flex items-center gap-1 px-2 py-1 font-pixel text-[11px] uppercase transition-colors",
            lang === code ? "bg-[#7bd45b] text-ink" : "text-ink/55 hover:bg-white/60"
          )}
        >
          <span aria-hidden="true">{code === "pl" ? "🇵🇱" : "🇬🇧"}</span>
          {code}
        </button>
      ))}
    </div>
  );
}
