import { useCallback, useEffect, useRef, useState } from "react";
import Hud from "./components/Hud";
import Inventory from "./components/Inventory";
import SkinEditor from "./components/SkinEditor";
import StartScreen from "./components/StartScreen";
import { FeedbackLayer, GameOver, HelpModal, PauseMenu } from "./components/Overlays";
import {
  VoxelGame,
  type ContainerType,
  type GameMode,
  type GameScreen,
  type PublicStats,
  type RunSummary,
  type SlotArea,
} from "./game/VoxelGame";
import { CREATIVE_HOTBAR, type Recipe } from "./game/items";
import { getLang, setLang, t, type Lang } from "./game/i18n";
import { sound } from "./game/audio";
import type { FlashData, PopupData, ScoreEntry } from "./types";

const KEY_SCORES = "orerush.scores.v2";
const KEY_NAME = "orerush.name.v1";
const KEY_MUTED = "orerush.muted.v1";
const KEY_VIEW = "orerush.view.v1";

const emptySlots = (n: number) => new Array(n).fill(0).map(() => ({ id: 0, count: 0 }));

const EMPTY_STATS: PublicStats = {
  mode: "survival",
  score: 0,
  timeLeft: 90,
  combo: 0,
  comboPct: 0,
  ores: 0,
  bestCombo: 0,
  blocksPlaced: 0,
  blocksMined: 0,
  kills: 0,
  health: 20,
  maxHealth: 20,
  hunger: 20,
  maxHunger: 20,
  armor: 0,
  temperature: 20,
  maxTemperature: 20,
  backpack: emptySlots(27),
  ui: { container: null, cursor: { id: 0, count: 0 }, craftSize: 2, craft: emptySlots(9), result: null, furnace: null, chest: null },
  hotbar: CREATIVE_HOTBAR.map((id: number) => ({ id, count: -1 })),
  selected: 0,
  held: { id: 0, name: "", kind: "empty" },
  target: null,
  biome: "",
  clock: "06:00",
  night: false,
  position: { x: 0, y: 0, z: 0 },
  flying: false,
  swimming: false,
  onGround: true,
  fps: 60,
  chunks: 0,
  loading: 1,
};

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function loadScores(): ScoreEntry[] {
  const raw = read(KEY_SCORES);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is ScoreEntry => !!item && typeof item === "object" && typeof (item as ScoreEntry).score === "number")
      .map((item, index) => ({
        id: String(item.id ?? `saved-${index}`),
        name: String(item.name ?? "MINER").slice(0, 10),
        score: Math.max(0, Math.round(item.score)),
        ores: Math.max(0, Math.round(item.ores ?? 0)),
        bestCombo: Math.max(0, Math.round(item.bestCombo ?? 0)),
        blocksPlaced: Math.max(0, Math.round(item.blocksPlaced ?? 0)),
        kills: Math.max(0, Math.round(item.kills ?? 0)),
        date: Number(item.date ?? 0),
      }))
      .sort((a, b) => b.score - a.score || b.date - a.date)
      .slice(0, 8);
  } catch {
    return [];
  }
}

function detectTouch() {
  if (typeof window === "undefined") return false;
  return (window.matchMedia?.("(pointer: coarse)")?.matches ?? false) || window.innerWidth <= 820;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<VoxelGame | null>(null);
  const [lang, setLangState] = useState<Lang>(getLang);
  const [screen, setScreen] = useState<GameScreen>("menu");
  const screenRef = useRef<GameScreen>("menu");
  const [stats, setStats] = useState<PublicStats>(EMPTY_STATS);
  const [scores, setScores] = useState<ScoreEntry[]>(loadScores);
  const scoresRef = useRef<ScoreEntry[]>(scores);
  const [name, setName] = useState(() => read(KEY_NAME) || "STEVE");
  const nameRef = useRef(name);
  const [muted, setMuted] = useState(() => read(KEY_MUTED) === "1");
  const mutedRef = useRef(muted);
  const [touch, setTouch] = useState(detectTouch);
  const [renderDistance, setRenderDistance] = useState(() => {
    const saved = Number(read(KEY_VIEW));
    if (Number.isFinite(saved) && saved >= 3) return Math.min(11, saved);
    return detectTouch() ? 4 : 7;
  });
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [flash, setFlash] = useState<FlashData | null>(null);
  const [runResult, setRunResult] = useState<RunSummary | null>(null);
  const [lastEntryId, setLastEntryId] = useState<string | null>(null);
  const [isRecord, setIsRecord] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSkin, setShowSkin] = useState(false);
  const [container, setContainer] = useState<ContainerType | null>(null);
  const containerOpenRef = useRef(false);
  const flashTimer = useRef<number | null>(null);
  const popupTimers = useRef<number[]>([]);
  const savedRunRef = useRef<string | null>(null);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  useEffect(() => {
    nameRef.current = name;
  }, [name]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === "pl" ? "Ore Rush — klockowy świat 3D" : "Ore Rush — 3D Voxel World";
  }, [lang]);

  useEffect(() => {
    const onResize = () => setTouch(detectTouch());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* boot the engine */
  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    const game = new VoxelGame(
      host,
      {
        onStats: setStats,
        onScreen: setScreen,
        onPopup: (popup) => {
          setPopups((prev) => [...prev.slice(-4), popup]);
          const timer = window.setTimeout(() => setPopups((prev) => prev.filter((item) => item.id !== popup.id)), 1300);
          popupTimers.current.push(timer);
        },
        onFx: (kind) => {
          setFlash({ id: Date.now() + Math.random(), kind });
          if (flashTimer.current) window.clearTimeout(flashTimer.current);
          flashTimer.current = window.setTimeout(() => setFlash(null), kind === "start" ? 1250 : 700);
        },
        onRunEnd: setRunResult,
        onContainer: (type) => {
          containerOpenRef.current = type !== null;
          setContainer(type);
        },
      },
      sound
    );
    game.setSoundEnabled(!mutedRef.current);
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      popupTimers.current.forEach((timer) => window.clearTimeout(timer));
      popupTimers.current = [];
    };
  }, []);

  useEffect(() => {
    gameRef.current?.setRenderDistance(renderDistance);
    write(KEY_VIEW, String(renderDistance));
  }, [renderDistance]);

  /* persist finished sprint runs */
  useEffect(() => {
    if (screen !== "over" || !runResult || savedRunRef.current === runResult.id) return;
    savedRunRef.current = runResult.id;
    if (runResult.mode !== "sprint") return;
    const previous = scoresRef.current;
    const previousBest = previous[0]?.score ?? 0;
    const entry: ScoreEntry = {
      id: runResult.id,
      name: nameRef.current.trim().slice(0, 10) || "STEVE",
      score: runResult.score,
      ores: runResult.ores,
      bestCombo: runResult.bestCombo,
      blocksPlaced: runResult.blocksPlaced,
      kills: runResult.kills,
      date: runResult.finishedAt,
    };
    const next = [...previous, entry].sort((a, b) => b.score - a.score || b.date - a.date).slice(0, 8);
    scoresRef.current = next;
    setScores(next);
    setLastEntryId(entry.id);
    setIsRecord(runResult.score > previousBest);
    write(KEY_SCORES, JSON.stringify(next));
  }, [screen, runResult]);

  /* losing pointer lock or the tab pauses the game (not while a container is open) */
  useEffect(() => {
    const onLockChange = () => {
      if (!document.pointerLockElement && screenRef.current === "playing" && !containerOpenRef.current) gameRef.current?.pause();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && screenRef.current === "playing") gameRef.current?.pause();
    };
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const changeLang = useCallback((next: Lang) => {
    setLang(next);
    setLangState(next);
    sound.ui();
  }, []);

  const startGame = useCallback((mode: GameMode) => {
    const game = gameRef.current;
    if (!game) return;
    setShowHelp(false);
    setPopups([]);
    setFlash(null);
    setRunResult(null);
    setLastEntryId(null);
    setIsRecord(false);
    savedRunRef.current = null;
    game.setInputEnabled(true);
    game.startRun(mode);
  }, []);

  const continueGame = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    setShowHelp(false);
    setPopups([]);
    setFlash(null);
    setRunResult(null);
    savedRunRef.current = null;
    game.setInputEnabled(true);
    game.continueRun();
  }, []);

  const restart = useCallback(() => startGame(stats.mode), [startGame, stats.mode]);

  const toggleSound = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      gameRef.current?.setSoundEnabled(!next);
      write(KEY_MUTED, next ? "1" : "0");
      if (!next) sound.ui();
      return next;
    });
  }, []);

  const goMenu = useCallback(() => {
    gameRef.current?.toMenu();
    setShowHelp(false);
  }, []);

  const resumeGame = useCallback(() => {
    setShowHelp(false);
    gameRef.current?.setInputEnabled(true);
    gameRef.current?.resume();
  }, []);

  const openInventory = useCallback(() => gameRef.current?.openInventory(), []);
  const closeInventory = useCallback(() => gameRef.current?.closeContainer(), []);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    nameRef.current = value;
    write(KEY_NAME, value);
  }, []);

  const onMove = useCallback((x: number, y: number) => gameRef.current?.setMoveInput(x, y), []);
  const onVertical = useCallback((v: number) => gameRef.current?.setVerticalInput(v), []);
  const onMining = useCallback((active: boolean) => gameRef.current?.setMining(active), []);
  const onJump = useCallback(() => gameRef.current?.jump(), []);
  const onPlace = useCallback(() => gameRef.current?.place(), []);
  const onPlaceHold = useCallback((held: boolean) => gameRef.current?.setPlaceHeld(held), []);
  const onSelectSlot = useCallback((index: number) => gameRef.current?.selectSlot(index), []);
  const onPause = useCallback(() => gameRef.current?.pause(), []);
  const onToggleFly = useCallback(() => gameRef.current?.toggleFly(), []);
  const onSlotClick = useCallback((area: SlotArea, index: number, button: "left" | "right" | "shift") => gameRef.current?.clickSlot(area, index, button), []);
  const onFill = useCallback((recipeId: string) => gameRef.current?.fillRecipe(recipeId), []);
  // re-evaluated whenever the inventory snapshot changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const canCraft = useCallback((recipe: Recipe) => gameRef.current?.canCraft(recipe) ?? false, [stats.ui, stats.hotbar, stats.backpack]);
  const onPickBlock = useCallback((blockId: number) => gameRef.current?.setHotbarBlock(stats.selected, blockId), [stats.selected]);

  /* global shortcuts */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (container) {
        if (event.code === "Escape" || event.code === "KeyE") {
          event.preventDefault();
          closeInventory();
        }
        return;
      }
      if (showHelp) {
        if (event.code === "Escape") {
          event.preventDefault();
          setShowHelp(false);
        }
        return;
      }
      if (screen === "menu") {
        if (event.code === "Enter" || event.code === "Space") {
          event.preventDefault();
          startGame("survival");
        } else if (event.code === "KeyS") {
          event.preventDefault();
          startGame("sprint");
        } else if (event.code === "KeyC") {
          event.preventDefault();
          startGame("creative");
        }
        return;
      }
      if (screen === "playing") {
        if (event.code === "Escape" || event.code === "KeyP") {
          event.preventDefault();
          gameRef.current?.pause();
        } else if (event.code === "KeyE") {
          event.preventDefault();
          openInventory();
        } else if (event.code === "KeyM") toggleSound();
        return;
      }
      if (screen === "paused") {
        if (event.code === "Escape" || event.code === "KeyP") {
          event.preventDefault();
          resumeGame();
        }
        return;
      }
      if (screen === "over") {
        if (event.code === "KeyR" || event.code === "Enter" || event.code === "Space") {
          event.preventDefault();
          restart();
        } else if (event.code === "Escape") {
          event.preventDefault();
          goMenu();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, showHelp, container, startGame, restart, toggleSound, resumeGame, goMenu, openInventory, closeInventory]);

  const best = scores[0]?.score ?? 0;

  return (
    <div className="app-shell relative w-screen overflow-hidden bg-[#8fc7ff]" data-lang={lang}>
      <div ref={containerRef} className="absolute inset-0 z-0" aria-hidden="true" />
      <div className="vignette pointer-events-none absolute inset-0 z-10" />
      {stats.swimming && screen === "playing" && <div className="water-overlay pointer-events-none absolute inset-0 z-10" />}
      {stats.mode === "cold" && screen === "playing" && stats.temperature < 12 && (
        <div
          className="frost-overlay pointer-events-none absolute inset-0 z-10"
          style={{ opacity: Math.min(1, Math.max(0, (12 - stats.temperature) / 10)) }}
        />
      )}

      {screen === "playing" && !container && (
        <Hud
          stats={stats}
          best={best}
          muted={muted}
          touch={touch}
          onPause={onPause}
          onToggleSound={toggleSound}
          onSelectSlot={onSelectSlot}
          onOpenInventory={openInventory}
          onMove={onMove}
          onVertical={onVertical}
          onMining={onMining}
          onJump={onJump}
          onPlace={onPlace}
          onPlaceHold={onPlaceHold}
          onToggleFly={onToggleFly}
        />
      )}

      {(screen === "playing" || screen === "paused") && <FeedbackLayer popups={popups} flash={flash} />}

      {screen === "menu" && (
        <StartScreen
          scores={scores}
          name={name}
          onNameChange={handleNameChange}
          muted={muted}
          onToggleSound={toggleSound}
          onPlay={startGame}
          onContinue={VoxelGame.hasSave() ? continueGame : undefined}
          onHelp={() => setShowHelp(true)}
          isTouch={touch}
          renderDistance={renderDistance}
          onRenderDistance={setRenderDistance}
          lang={lang}
          onLang={changeLang}
          onSkin={() => setShowSkin(true)}
        />
      )}

      {screen === "paused" && (
        <PauseMenu
          stats={stats}
          muted={muted}
          touch={touch}
          renderDistance={renderDistance}
          onRenderDistance={setRenderDistance}
          onResume={resumeGame}
          onRestart={restart}
          onHelp={() => setShowHelp(true)}
          onMenu={goMenu}
          onToggleSound={toggleSound}
          lang={lang}
          onLang={changeLang}
          onSkin={() => setShowSkin(true)}
        />
      )}

      {screen === "over" && runResult && (
        <GameOver
          run={runResult}
          scores={scores}
          highlightId={lastEntryId}
          isRecord={isRecord}
          best={best}
          onRestart={restart}
          onMenu={goMenu}
          onHelp={() => setShowHelp(true)}
        />
      )}

      {container && screen === "playing" && (
        <Inventory
          ui={stats.ui}
          hotbar={stats.hotbar}
          backpack={stats.backpack}
          selected={stats.selected}
          mode={stats.mode}
          touch={touch}
          canCraft={canCraft}
          onClick={onSlotClick}
          onFill={onFill}
          onPick={onPickBlock}
          onSelectSlot={onSelectSlot}
          onClose={closeInventory}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} touch={touch} />}
      {showSkin && (
        <SkinEditor
          onApply={(canvas) => {
            gameRef.current?.setSkin(canvas);
            setShowSkin(false);
          }}
          onClose={() => setShowSkin(false)}
        />
      )}
      <span className="sr-only">{t("tagline")}</span>
    </div>
  );
}
