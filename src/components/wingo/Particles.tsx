import { useMemo } from "react";

export function Particles({ count = 28 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 3,
        delay: Math.random() * 6,
        color: ["var(--neon-cyan)", "var(--neon-magenta)", "var(--neon-violet)"][i % 3],
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 cyber-grid opacity-60" />
      {dots.map((d) => (
        <span
          key={d.id}
          className="particle absolute rounded-full blur-[1px]"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: d.color,
            boxShadow: `0 0 ${d.size * 4}px ${d.color}`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
