import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Signal, WingoIssue } from "@/types/wingo";

export function Analytics({ issues, signals }: { issues: WingoIssue[]; signals: Record<string, Signal> }) {
  const recent = issues.slice(0, 30).reverse();
  const trend = recent.map((it) => ({
    p: it.issueNumber.slice(-4),
    n: parseInt(it.number, 10),
  }));

  const wave = recent.map((it, i) => {
    const sig = signals[it.issueNumber];
    return { p: it.issueNumber.slice(-4), conf: sig?.confidence ?? 50 + Math.sin(i / 2) * 10 };
  });

  let wins = 0, losses = 0;
  recent.forEach((it) => {
    const sig = signals[it.issueNumber];
    if (!sig) return;
    const n = parseInt(it.number, 10);
    const r = n >= 5 ? "BIG" : "SMALL";
    if (sig.type === r) wins++; else losses++;
  });

  const dist = [
    { name: "BIG", value: Object.values(signals).filter((s) => s.type === "BIG").length || 1, color: "var(--neon-magenta)" },
    { name: "SMALL", value: Object.values(signals).filter((s) => s.type === "SMALL").length || 1, color: "var(--neon-cyan)" },
  ];

  const heat = recent.map((it) => ({
    p: it.issueNumber.slice(-4),
    h: parseInt(it.number, 10) * 10 + 10,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Trend Graph" subtitle="Number history">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trend}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.05)" />
            <XAxis dataKey="p" hide />
            <YAxis hide domain={[0, 9]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="n" stroke="var(--neon-cyan)" strokeWidth={2} dot={false}
              style={{ filter: "drop-shadow(0 0 6px var(--neon-cyan))" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Probability Wave" subtitle="Confidence flow">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={wave}>
            <defs>
              <linearGradient id="wave" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--neon-magenta)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="var(--neon-magenta)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(1 0 0 / 0.05)" />
            <XAxis dataKey="p" hide />
            <YAxis hide domain={[40, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="conf" stroke="var(--neon-magenta)" fill="url(#wave)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Heatmap" subtitle="Volatility intensity">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={heat}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.05)" />
            <XAxis dataKey="p" hide />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="h" radius={[4, 4, 0, 0]}>
              {heat.map((d, i) => (
                <Cell key={i} fill={`oklch(0.7 0.27 ${(d.h * 4) % 360})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Win Ratio + Distribution" subtitle={`${wins}W / ${losses}L`}>
        <div className="flex items-center justify-around">
          <ResponsiveContainer width="60%" height={180}>
            <PieChart>
              <Pie data={dist} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={4}>
                {dist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 text-xs font-mono">
            <Legend color="var(--neon-magenta)" label="BIG" v={dist[0].value} />
            <Legend color="var(--neon-cyan)" label="SMALL" v={dist[1].value} />
            <div className="mt-3 rounded-lg border border-neon-green/30 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Accuracy</div>
              <div className="font-display text-xl font-bold neon-text-green">
                {wins + losses ? Math.round((wins / (wins + losses)) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

const tooltipStyle = {
  background: "oklch(0.18 0.05 275)",
  border: "1px solid oklch(0.4 0.1 270 / 0.6)",
  borderRadius: 8,
  fontFamily: "JetBrains Mono",
  fontSize: 11,
};

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-display text-sm uppercase tracking-[0.3em] text-foreground">{title}</h4>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}

function Legend({ color, label, v }: { color: string; label: string; v: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ color }}>{label}</span>
      <span className="text-muted-foreground">{v}</span>
    </div>
  );
}
