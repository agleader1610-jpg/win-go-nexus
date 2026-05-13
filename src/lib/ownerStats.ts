// Pure compute helpers for the Owner analytics page.
// Backtests every predictor across the full history (up to 1000 rows).

import {
  actualPrimaryColor,
  buildRandomNumbersPlan,
  colorOfNumber,
  sideOfNumber,
  type CategoryId,
  type DrawItem,
} from "./predictors";
import type { GameKind } from "./games.config";

export interface FullStats {
  total: number;
  wins: number;
  losses: number;
  winRate: number; // 0-100
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: { kind: "W" | "L" | "—"; length: number };
}

const EMPTY: FullStats = {
  total: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  maxWinStreak: 0,
  maxLossStreak: 0,
  currentStreak: { kind: "—", length: 0 },
};

/**
 * Iterate ALL applicable rows in `history` (newest first) and tally W/L for one trader.
 * - bs/color: predict history[i] using history[i + N] (Trader N+1 copy logic)
 * - num5/num7: deterministic plan per period; hit if actual digit ∈ plan
 */
export function computeFullStats(
  history: DrawItem[],
  category: CategoryId,
  traderIdx: number,
  gameId: string,
  kind: GameKind,
  predictorId: string,
): FullStats {
  if (!history || history.length === 0) return EMPTY;
  const N = traderIdx + 1;

  // results[0] = newest, results[len-1] = oldest
  const results: ("W" | "L")[] = [];

  if (category === "bs" || category === "color") {
    const maxI = history.length - N - 1;
    for (let i = 0; i <= maxI; i++) {
      const actual = history[i];
      const src = history[i + N];
      if (!actual || !src) continue;
      const actualNum = parseInt(actual.number || "0", 10);
      const srcNum = parseInt(src.number || "0", 10);
      if (category === "bs") {
        const predicted = sideOfNumber(srcNum, kind, src.sum);
        const actualSide = sideOfNumber(actualNum, kind, actual.sum);
        results.push(predicted === actualSide ? "W" : "L");
      } else {
        const predicted = colorOfNumber(srcNum);
        const actualColor = actualPrimaryColor(actual.color);
        results.push(actualColor && predicted === actualColor ? "W" : "L");
      }
    }
  } else {
    for (let i = 0; i < history.length; i++) {
      const actual = history[i];
      const actualNum = parseInt(actual.number || "0", 10);
      const plan = buildRandomNumbersPlan(gameId, category, predictorId, actual.issueNumber);
      results.push(plan.numbers?.includes(actualNum) ? "W" : "L");
    }
  }

  if (results.length === 0) return EMPTY;

  let wins = 0;
  let losses = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let runW = 0;
  let runL = 0;
  // walk oldest → newest for natural streak accumulation
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === "W") {
      wins++;
      runW++;
      runL = 0;
      if (runW > maxWinStreak) maxWinStreak = runW;
    } else {
      losses++;
      runL++;
      runW = 0;
      if (runL > maxLossStreak) maxLossStreak = runL;
    }
  }

  // current streak from newest (results[0])
  const head = results[0];
  let len = 0;
  for (const r of results) {
    if (r === head) len++;
    else break;
  }

  const total = results.length;
  return {
    total,
    wins,
    losses,
    winRate: Math.round((wins / total) * 1000) / 10,
    maxWinStreak,
    maxLossStreak,
    currentStreak: { kind: head, length: len },
  };
}
