export type ScoreEntry = {
  id: string;
  name: string;
  score: number;
  ores: number;
  bestCombo: number;
  blocksPlaced: number;
  kills: number;
  date: number;
};

export type PopupData = {
  id: number;
  text: string;
  sub?: string;
  kind: string;
};

export type FlashData = { id: number; kind: "explosion" | "fall" | "levelup" | "start" | "splash" | "hurt" };
