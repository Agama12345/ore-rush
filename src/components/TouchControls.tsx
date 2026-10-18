import { useEffect, useRef } from "react";
import { PickaxeIcon, cx } from "./ui";
import { t } from "../game/i18n";

type Props = {
  onMove: (x: number, y: number) => void;
  onMining: (active: boolean) => void;
  onJump: () => void;
  onPlace: () => void;
  onVertical: (v: number) => void;
  onToggleFly: () => void;
  onPlaceHold: (held: boolean) => void;
  creative: boolean;
  flying: boolean;
  weapon: boolean;
};

function Joystick({ onMove }: { onMove: Props["onMove"] }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<number | null>(null);

  useEffect(() => () => onMove(0, 0), [onMove]);

  const setKnob = (dx: number, dy: number) => {
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width * 0.32;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > max) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }
    setKnob(dx, dy);
    knobRef.current?.classList.toggle("joystick-hot", dist > max * 0.86);
    onMove(Math.max(-1, Math.min(1, dx / max)), Math.max(-1, Math.min(1, -dy / max)));
  };

  const end = () => {
    activeRef.current = null;
    setKnob(0, 0);
    knobRef.current?.classList.remove("joystick-hot");
    onMove(0, 0);
  };

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Movement joystick"
      className="joystick pointer-events-auto touch-none select-none"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        activeRef.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (activeRef.current !== e.pointerId) return;
        e.preventDefault();
        handlePointer(e);
      }}
      onPointerUp={(e) => {
        if (activeRef.current !== e.pointerId) return;
        end();
      }}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      <div className="joystick-arrows" aria-hidden="true">
        <span className="up">▲</span>
        <span className="right">▲</span>
        <span className="down">▲</span>
        <span className="left">▲</span>
      </div>
      <div ref={knobRef} className="joystick-knob">
        <span />
      </div>
    </div>
  );
}

function HoldButton({
  label,
  className,
  onDown,
  onUp,
  children,
}: {
  label: string;
  className: string;
  onDown: () => void;
  onUp?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cx("touch-action-btn pointer-events-auto", className)}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDown();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        if (onUp) window.addEventListener("pointerup", onUp, { once: true });
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onUp?.();
      }}
      onPointerCancel={() => onUp?.()}
      onLostPointerCapture={() => onUp?.()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export default function TouchControls({ onMove, onMining, onJump, onPlace, onPlaceHold, onVertical, onToggleFly, creative, flying, weapon }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div className="absolute left-3 touch-bottom sm:left-5">
        <Joystick onMove={onMove} />
      </div>

      {creative && (
        <div className="absolute left-[126px] touch-bottom flex flex-col gap-2 sm:left-[142px]">
          <HoldButton label="Fly up" className="vert" onDown={() => onVertical(1)} onUp={() => onVertical(0)}>
            <span className="text-base leading-none">▲</span>
          </HoldButton>
          <button
            type="button"
            aria-label="Toggle flight"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFly();
            }}
            className={cx("touch-action-btn vert pointer-events-auto", flying && "fly-on")}
          >
            <span className="font-pixel text-[8px]">{t("touch.fly")}</span>
          </button>
          <HoldButton label="Fly down" className="vert" onDown={() => onVertical(-1)} onUp={() => onVertical(0)}>
            <span className="text-base leading-none">▼</span>
          </HoldButton>
        </div>
      )}

      <div className="absolute right-3 touch-bottom flex flex-col items-end gap-2 sm:right-5">
        <div className="flex items-end gap-2">
          <button
            type="button"
            aria-label="Place block"
            className="touch-action-btn place pointer-events-auto"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlace();
              onPlaceHold(true);
              window.addEventListener("pointerup", () => onPlaceHold(false), { once: true });
            }}
            onPointerUp={() => onPlaceHold(false)}
            onPointerCancel={() => onPlaceHold(false)}
            onLostPointerCapture={() => onPlaceHold(false)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
              <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
              <path d="M4 7.5v9L12 21l8-4.5v-9" />
            </svg>
            <span>{t("touch.place")}</span>
          </button>
          <button
            type="button"
            aria-label="Jump"
            className="touch-action-btn jump pointer-events-auto"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJump();
            }}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <span>{t("touch.jump")}</span>
          </button>
        </div>
        <HoldButton label={weapon ? "Attack" : "Hold to mine"} className={cx("mine", weapon && "attack")} onDown={() => onMining(true)} onUp={() => onMining(false)}>
          {weapon ? (
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20l5-5M14.5 3.5L20 9l-8.5 8.5L6 12z" />
              <path d="M3 21l3-1-2-2z" fill="currentColor" />
            </svg>
          ) : (
            <PickaxeIcon className="h-7 w-7" />
          )}
          <span>{weapon ? t("touch.attack") : t("touch.mine")}</span>
        </HoldButton>
      </div>
    </div>
  );
}
