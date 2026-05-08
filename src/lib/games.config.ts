// Central registry of all supported lottery games.
// Used by both client UI (cards, labels) and server (ingest, signals).

import wingoIcon from "@/assets/games/wingo.svg";
import k3Icon from "@/assets/games/k3.svg";
import trxWingoIcon from "@/assets/games/trxwingo.svg";

export type GameKind = "wingo" | "k3" | "trx_wingo";

export const GAME_ICONS: Record<GameKind, string> = {
  wingo: wingoIcon,
  k3: k3Icon,
  trx_wingo: trxWingoIcon,
};

export interface GameConfig {
  id: string;            // db game_type
  label: string;         // human label
  shortLabel: string;    // card title
  kind: GameKind;
  periodSec: number;     // period duration
  upstream: string;      // upstream history URL
  accent: string;        // CSS color token (oklch literal)
  emoji: string;
}

export const GAMES: GameConfig[] = [
  {
    id: "wingo_30s",
    label: "WinGo 30 Second",
    shortLabel: "WinGo 30s",
    kind: "wingo",
    periodSec: 30,
    upstream: "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json",
    accent: "oklch(0.78 0.22 25)",
    emoji: "⚡",
  },
  {
    id: "wingo_1m",
    label: "WinGo 1 Minute",
    shortLabel: "WinGo 1M",
    kind: "wingo",
    periodSec: 60,
    upstream: "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json",
    accent: "oklch(0.78 0.22 145)",
    emoji: "🎯",
  },
  {
    id: "wingo_3m",
    label: "WinGo 3 Minute",
    shortLabel: "WinGo 3M",
    kind: "wingo",
    periodSec: 180,
    upstream: "https://draw.ar-lottery01.com/WinGo/WinGo_3M/GetHistoryIssuePage.json",
    accent: "oklch(0.78 0.22 195)",
    emoji: "🌊",
  },
  {
    id: "wingo_5m",
    label: "WinGo 5 Minute",
    shortLabel: "WinGo 5M",
    kind: "wingo",
    periodSec: 300,
    upstream: "https://draw.ar-lottery01.com/WinGo/WinGo_5M/GetHistoryIssuePage.json",
    accent: "oklch(0.78 0.22 280)",
    emoji: "💎",
  },
  {
    id: "k3_1m",
    label: "K3 Dice 1 Minute",
    shortLabel: "K3 1M",
    kind: "k3",
    periodSec: 60,
    upstream: "https://draw.ar-lottery01.com/K3/K3_1M/GetHistoryIssuePage.json",
    accent: "oklch(0.75 0.2 60)",
    emoji: "🎲",
  },
  {
    id: "k3_3m",
    label: "K3 Dice 3 Minute",
    shortLabel: "K3 3M",
    kind: "k3",
    periodSec: 180,
    upstream: "https://draw.ar-lottery01.com/K3/K3_3M/GetHistoryIssuePage.json",
    accent: "oklch(0.75 0.2 100)",
    emoji: "🎲",
  },
  {
    id: "k3_5m",
    label: "K3 Dice 5 Minute",
    shortLabel: "K3 5M",
    kind: "k3",
    periodSec: 300,
    upstream: "https://draw.ar-lottery01.com/K3/K3_5M/GetHistoryIssuePage.json",
    accent: "oklch(0.75 0.2 220)",
    emoji: "🎲",
  },
  {
    id: "k3_10m",
    label: "K3 Dice 10 Minute",
    shortLabel: "K3 10M",
    kind: "k3",
    periodSec: 600,
    upstream: "https://draw.ar-lottery01.com/K3/K3_10M/GetHistoryIssuePage.json",
    accent: "oklch(0.7 0.18 320)",
    emoji: "🎲",
  },
  {
    id: "trx_wingo_1m",
    label: "TrxWinGo 1 Minute",
    shortLabel: "Trx WinGo 1M",
    kind: "trx_wingo",
    periodSec: 60,
    upstream: "https://draw.ar-lottery01.com/TrxWinGo/TrxWinGo_1M/GetHistoryIssuePage.json",
    accent: "oklch(0.78 0.22 350)",
    emoji: "⛓️",
  },
];

export function getGame(id: string): GameConfig | undefined {
  return GAMES.find((g) => g.id === id);
}
