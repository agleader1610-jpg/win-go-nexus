export interface WingoIssue {
  issueNumber: string;
  number: string;
  color: string;
  premium: string;
  sum: number;
}

export interface WingoApiResponse {
  data: {
    list: WingoIssue[];
    pageNo: number;
    totalPage: number;
    totalCount: number;
  };
  code: number;
  msg: string;
  serviceTime: number;
}

export interface Signal {
  period: string;
  type: "BIG" | "SMALL";
  confidence: number;
  trendPower: number;
  volatility: number;
  marketHeat: number;
  generatedAt: number;
}

export interface HistoryRow extends WingoIssue {
  signal?: Signal;
  isWin?: boolean;
}
