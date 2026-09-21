// Shared signal shape (client-safe, no server imports).
export interface ServerSignal {
  period: string;
  type: "BIG" | "SMALL";
  prediction: string;
  confidence: number;
  trendPower: number;
  volatility: number;
  marketHeat: number;
  generatedAt: number;
  diceGuess?: [number, number, number];
}
