// Predictor system: 10 analysts, deterministic per-period signals across 4 categories.

export type CategoryId = "bs" | "color" | "num5" | "num7";

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  shortLabel: string;
  accent: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { id: "bs",    label: "Big / Small", shortLabel: "B/S",     accent: "var(--neon-cyan)" },
  { id: "color", label: "Color",       shortLabel: "Color",   accent: "var(--neon-magenta)" },
  { id: "num5",  label: "5 Numbers",   shortLabel: "5 Nums",  accent: "var(--neon-violet)" },
  { id: "num7",  label: "7 Numbers",   shortLabel: "7 Nums",  accent: "var(--neon-amber)" },
];

export function getCategory(id: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export interface Predictor {
  id: string;
  name: string;
  baseRate: number; // approximate hit rate
  tagline: string;
  avatarSeed: string;
}

// 10 fixed predictors — names, base hit rates, taglines.
export const PREDICTORS: Predictor[] = [
  { id: "kyle",  name: "Kyle",  baseRate: 90, tagline: "Quantum trend hunter",   avatarSeed: "Kyle-Quantum" },
  { id: "liam",  name: "Liam",  baseRate: 88, tagline: "Pattern oracle",         avatarSeed: "Liam-Oracle" },
  { id: "ryan",  name: "Ryan",  baseRate: 85, tagline: "Volatility surgeon",     avatarSeed: "Ryan-Surge" },
  { id: "alan",  name: "Alan",  baseRate: 82, tagline: "Neural strategist",      avatarSeed: "Alan-Neural" },
  { id: "eila",  name: "Eila",  baseRate: 78, tagline: "Cycle whisperer",        avatarSeed: "Eila-Cycle" },
  { id: "evan",  name: "Evan",  baseRate: 75, tagline: "Momentum tracker",       avatarSeed: "Evan-Momentum" },
  { id: "owen",  name: "Owen",  baseRate: 72, tagline: "Probability scout",      avatarSeed: "Owen-Prob" },
  { id: "falak", name: "Falak", baseRate: 68, tagline: "Stochastic analyst",     avatarSeed: "Falak-Sto" },
  { id: "leo",   name: "Leo",   baseRate: 65, tagline: "Heat-map reader",        avatarSeed: "Leo-Heat" },
  { id: "adam",  name: "Adam",  baseRate: 60, tagline: "Risk-adjusted seer",     avatarSeed: "Adam-Risk" },
];

export function getPredictor(id: string): Predictor | undefined {
  return PREDICTORS.find((p) => p.id === id);
}

// DiceBear avatar (no asset bundling, deterministic per seed).
export function avatarUrl(seed: string): string {
  const url = new URL("https://api.dicebear.com/9.x/personas/svg");
  url.searchParams.set("seed", seed);
  url.searchParams.set("backgroundType", "gradientLinear");
  url.searchParams.set("backgroundColor", "1e293b,0f172a,312e81");
  return url.toString();
}

// ---------- deterministic PRNG (mirrors games.server) ----------
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

export interface PredictorPlan {
  /** Display label rendered as the plan output. */
  display: string;
  /** Big/Small string for `bs`. */
  bs?: "Big" | "Small";
  /** Color slug for `color`. */
  color?: "red" | "green" | "violet";
  /** Numbers list for `num5` / `num7`. */
  numbers?: number[];
}

export function buildPredictorPlan(
  gameId: string,
  category: CategoryId,
  predictorId: string,
  period: string,
): PredictorPlan {
  const rand = mulberry32(hashStr(`plan|${gameId}|${category}|${predictorId}|${period}`));

  if (category === "bs") {
    const v: "Big" | "Small" = rand() > 0.5 ? "Big" : "Small";
    return { display: v, bs: v };
  }
  if (category === "color") {
    const r = rand();
    const c: "red" | "green" | "violet" = r < 0.42 ? "red" : r < 0.84 ? "green" : "violet";
    return { display: c, color: c };
  }
  const target = category === "num5" ? 5 : 7;
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // Fisher-Yates with deterministic rand
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const nums = pool.slice(0, target).sort((a, b) => a - b);
  return { display: nums.join(","), numbers: nums };
}

/**
 * Generate a deterministic 10-step trend (true = hit, false = miss)
 * for a predictor in a category, biased toward their base hit rate.
 */
export function buildTrend(
  gameId: string,
  category: CategoryId,
  predictorId: string,
  basisPeriod: string,
  length = 10,
): boolean[] {
  const p = getPredictor(predictorId);
  const targetRate = (p?.baseRate ?? 70) / 100;
  const out: boolean[] = [];
  for (let i = 0; i < length; i++) {
    const rand = mulberry32(hashStr(`trend|${gameId}|${category}|${predictorId}|${basisPeriod}|${i}`));
    out.push(rand() < targetRate);
  }
  return out;
}

/** Effective hit rate (slight per-game/category drift around base rate). */
export function getHitRate(
  gameId: string,
  category: CategoryId,
  predictorId: string,
): number {
  const p = getPredictor(predictorId);
  const base = p?.baseRate ?? 70;
  const rand = mulberry32(hashStr(`rate|${gameId}|${category}|${predictorId}`));
  const drift = Math.round((rand() - 0.5) * 10); // ±5
  return Math.max(45, Math.min(95, base + drift));
}

/** Color CSS for color-category badges. */
export const COLOR_TOKENS: Record<"red" | "green" | "violet", string> = {
  red: "#ef4444",
  green: "#10b981",
  violet: "#8b5cf6",
};
