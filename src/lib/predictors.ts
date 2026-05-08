// Pro Trader Signal system — 10 expert traders, shift-N copy logic for B/S & Color.
// 5 Nums / 7 Nums fall back to deterministic random plans (no shift-N possible).

import type { GameKind } from "@/lib/games.config";

import quantumX from "@/assets/logos/quantum-x.png";
import apexTitan from "@/assets/logos/apex-titan.png";
import cipherNova from "@/assets/logos/cipher-nova.png";
import vortexPrime from "@/assets/logos/vortex-prime.png";
import specter from "@/assets/logos/specter.png";
import onyxPulse from "@/assets/logos/onyx-pulse.png";
import haloSigma from "@/assets/logos/halo-sigma.png";
import zenithAce from "@/assets/logos/zenith-ace.png";
import nyxOracle from "@/assets/logos/nyx-oracle.png";
import phantomDrift from "@/assets/logos/phantom-drift.png";

export type CategoryId = "bs" | "color" | "num5" | "num7";

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  shortLabel: string;
  accent: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { id: "bs",    label: "Big / Small", shortLabel: "B/S",    accent: "var(--neon-cyan)" },
  { id: "color", label: "Color",       shortLabel: "Color",  accent: "var(--neon-magenta)" },
  { id: "num5",  label: "5 Numbers",   shortLabel: "5 Nums", accent: "var(--neon-violet)" },
  { id: "num7",  label: "7 Numbers",   shortLabel: "7 Nums", accent: "var(--neon-amber)" },
];

export function getCategory(id: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export interface Predictor {
  id: string;
  /** 0-based index — Trader N = index N (Trader 1 → idx 0 → copies history[0]). */
  index: number;
  name: string;
  tagline: string;
  logo: string;
  /** Brand accent colour for this trader, used in headers/glows. */
  brand: string;
}

export const PREDICTORS: Predictor[] = [
  { id: "quantum-x",     index: 0, name: "Quantum X",     tagline: "Quantum trend hunter",   logo: quantumX,     brand: "#22d3ee" },
  { id: "apex-titan",    index: 1, name: "Apex Titan",    tagline: "Pattern dominator",      logo: apexTitan,    brand: "#f59e0b" },
  { id: "cipher-nova",   index: 2, name: "Cipher Nova",   tagline: "Code breaker",           logo: cipherNova,   brand: "#60a5fa" },
  { id: "vortex-prime",  index: 3, name: "Vortex Prime",  tagline: "Volatility surgeon",     logo: vortexPrime,  brand: "#a855f7" },
  { id: "specter",       index: 4, name: "Specter",       tagline: "Shadow analyst",         logo: specter,      brand: "#c084fc" },
  { id: "onyx-pulse",    index: 5, name: "Onyx Pulse",    tagline: "Momentum reader",        logo: onyxPulse,    brand: "#10b981" },
  { id: "halo-sigma",    index: 6, name: "Halo Sigma",    tagline: "Probability scout",      logo: haloSigma,    brand: "#fbbf24" },
  { id: "zenith-ace",    index: 7, name: "Zenith Ace",    tagline: "Peak strategist",        logo: zenithAce,    brand: "#ef4444" },
  { id: "nyx-oracle",    index: 8, name: "Nyx Oracle",    tagline: "Cycle whisperer",        logo: nyxOracle,    brand: "#818cf8" },
  { id: "phantom-drift", index: 9, name: "Phantom Drift", tagline: "Risk-adjusted seer",     logo: phantomDrift, brand: "#fb923c" },
];

export function getPredictor(id: string): Predictor | undefined {
  return PREDICTORS.find((p) => p.id === id);
}

// ───────────────────────── deterministic PRNG (for num5/num7 fallback) ─────────────────────────
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────────────────────── side / colour helpers ─────────────────────────
export function sideOfNumber(n: number, kind: GameKind, sum?: number): "Big" | "Small" {
  if (kind === "k3") return (sum ?? 0) >= 11 ? "Big" : "Small";
  return n >= 5 ? "Big" : "Small";
}

/** Standard WinGo digit→primary colour. We never predict violet — only Red / Green. */
export function colorOfNumber(n: number): "red" | "green" {
  return n % 2 === 0 ? "red" : "green";
}

/** Pull the actual primary colour from API string ("red,violet" → red). */
export function actualPrimaryColor(raw: string | undefined | null): "red" | "green" | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes("red")) return "red";
  if (s.includes("green")) return "green";
  return null;
}

export const COLOR_TOKENS: Record<"red" | "green" | "violet", string> = {
  red:    "#ef4444",
  green:  "#10b981",
  violet: "#8b5cf6",
};

// ───────────────────────── plan shape ─────────────────────────
export interface PredictorPlan {
  display: string;
  bs?: "Big" | "Small";
  color?: "red" | "green";
  numbers?: number[];
}

// ───────────────────────── input row from API ─────────────────────────
export interface DrawItem {
  issueNumber: string;
  number: string;     // single digit "0"-"9" for wingo; for k3 may be sum digit
  color: string;      // e.g. "red", "green", "red,violet"
  sum?: number;       // for k3
}

// ───────────────────────── Trader-N plan from history (shift-N) ─────────────────────────
/**
 * Trader N (0-based: traderIdx 0 = Trader 1) predicts the upcoming period
 * by copying the side / colour of `history[traderIdx]`.
 * Returns null if history is too short or category is num5/num7.
 */
export function planFromHistory(
  history: DrawItem[],
  category: CategoryId,
  traderIdx: number,
  kind: GameKind,
): { plan: PredictorPlan; predictedNumber: number; confidence: number } | null {
  if (category !== "bs" && category !== "color") return null;
  const src = history[traderIdx];
  if (!src) return null;
  const num = parseInt(src.number || "0", 10);
  const confidence = 80 + (Math.abs(num) % 15);
  if (category === "bs") {
    const v = sideOfNumber(num, kind, src.sum);
    return { plan: { display: v, bs: v }, predictedNumber: num, confidence };
  }
  // color — derive from the digit of the source draw, never violet
  const c = colorOfNumber(num);
  return { plan: { display: c, color: c }, predictedNumber: num, confidence };
}

// ───────────────────────── num5 / num7 deterministic fallback ─────────────────────────
export function buildRandomNumbersPlan(
  gameId: string,
  category: "num5" | "num7",
  predictorId: string,
  period: string,
): PredictorPlan {
  const target = category === "num5" ? 5 : 7;
  const rand = mulberry32(hashStr(`numplan|${gameId}|${category}|${predictorId}|${period}`));
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const nums = pool.slice(0, target).sort((a, b) => a - b);
  return { display: nums.join(","), numbers: nums };
}

// ───────────────────────── history table & state ─────────────────────────
export interface TraderHistoryRow {
  period: string;
  /** "Big" | "Small" | "red" | "green" | "5,2,8…" */
  prediction: string;
  predictedNumber?: number;
  actualNumber: number;
  actualSide: "Big" | "Small";
  actualColor: "red" | "green" | null;
  confidence: number;
  result: "WIN" | "LOSS";
}

export interface TraderState {
  pending: {
    period: string;
    plan: PredictorPlan;
    confidence: number;
    predictedNumber?: number;
  } | null;
  history: TraderHistoryRow[];     // newest first, up to 10
  wins: number;
  losses: number;
  consecutiveLosses: number;       // counted from newest
  isRestricted: boolean;
}

const EMPTY_STATE: TraderState = {
  pending: null,
  history: [],
  wins: 0,
  losses: 0,
  consecutiveLosses: 0,
  isRestricted: false,
};

/**
 * Build the full trader state for a given category.
 * For B/S & Color: shift-N copy logic from history.
 * For num5 / num7: deterministic random plan + match-by-includes history.
 */
export function buildTraderState(
  history: DrawItem[],
  category: CategoryId,
  traderIdx: number,
  nextPeriod: string,
  gameId: string,
  kind: GameKind,
  predictorId: string,
): TraderState {
  if (!history || history.length === 0) return EMPTY_STATE;
  const N = traderIdx + 1; // Trader N (1-based)

  // ── Pending ─────────────────────────
  let pending: TraderState["pending"] = null;
  if (category === "bs" || category === "color") {
    const built = planFromHistory(history, category, traderIdx, kind);
    if (built && nextPeriod) {
      pending = {
        period: nextPeriod,
        plan: built.plan,
        confidence: built.confidence,
        predictedNumber: built.predictedNumber,
      };
    }
  } else {
    pending = {
      period: nextPeriod || predictorId,
      plan: buildRandomNumbersPlan(gameId, category, predictorId, nextPeriod || predictorId),
      confidence: 80 + ((traderIdx * 7) % 15),
    };
  }

  // ── Past rows ────────────────────────
  const rows: TraderHistoryRow[] = [];
  const maxI = history.length - N - 1;
  for (let i = 0; i <= maxI && rows.length < 10; i++) {
    const actual = history[i];
    const actualNum = parseInt(actual.number || "0", 10);
    const actualSide = sideOfNumber(actualNum, kind, actual.sum);
    const actualColor = actualPrimaryColor(actual.color);

    if (category === "bs" || category === "color") {
      const src = history[i + N];
      if (!src) continue;
      const srcNum = parseInt(src.number || "0", 10);
      const confidence = 80 + (Math.abs(srcNum) % 15);
      if (category === "bs") {
        const predicted = sideOfNumber(srcNum, kind, src.sum);
        rows.push({
          period: actual.issueNumber,
          prediction: predicted,
          predictedNumber: srcNum,
          actualNumber: actualNum,
          actualSide,
          actualColor,
          confidence,
          result: predicted === actualSide ? "WIN" : "LOSS",
        });
      } else {
        const predicted = colorOfNumber(srcNum);
        rows.push({
          period: actual.issueNumber,
          prediction: predicted,
          predictedNumber: srcNum,
          actualNumber: actualNum,
          actualSide,
          actualColor,
          confidence,
          result: actualColor && predicted === actualColor ? "WIN" : "LOSS",
        });
      }
    } else {
      // num5 / num7 — deterministic plan, hit if actual digit included
      const plan = buildRandomNumbersPlan(gameId, category, predictorId, actual.issueNumber);
      const hit = !!plan.numbers?.includes(actualNum);
      rows.push({
        period: actual.issueNumber,
        prediction: plan.display,
        actualNumber: actualNum,
        actualSide,
        actualColor,
        confidence: 80 + ((traderIdx * 7 + i) % 15),
        result: hit ? "WIN" : "LOSS",
      });
    }
  }

  let wins = 0;
  let losses = 0;
  let consecutiveLosses = 0;
  let stillStreak = true;
  for (const r of rows) {
    if (r.result === "WIN") {
      wins++;
      stillStreak = false;
    } else {
      losses++;
      if (stillStreak) consecutiveLosses++;
    }
  }
  const isRestricted = consecutiveLosses >= 7 || (rows.length >= 5 && wins <= 2);

  return { pending, history: rows, wins, losses, consecutiveLosses, isRestricted };
}

/** Hit rate from observed history; falls back to a stable per-trader number. */
export function hitRateFromState(state: TraderState, traderIdx: number): number {
  const total = state.wins + state.losses;
  if (total === 0) return 75 + ((traderIdx * 3) % 20); // 75–94 stable seed
  return Math.round((state.wins / total) * 100);
}

/** True hit (newest first) flags for the trend strip. */
export function trendFromState(state: TraderState, length = 10): boolean[] {
  const out = state.history.slice(0, length).map((r) => r.result === "WIN");
  while (out.length < length) out.push(false);
  return out;
}
