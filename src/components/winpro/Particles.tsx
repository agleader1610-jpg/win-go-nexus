import { useMemo } from "react";

// Deterministic PRNG so SSR and client render identical particles (no hydration mismatch).
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

export function Particles({ count = 28, seed = 1337 }: { count?: number; seed?: number }) {
  const dots = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }).map((_, i) => {
      const left = rand() * 100;
      const top = rand() * 100;
      const size = 1 + rand() * 3;
      const delay = rand() * 6;
      return {
        id: i,
        left: left.toFixed(3),
        top: top.toFixed(3),
        size: size.toFixed(3),
        delay: delay.toFixed(3),
        color: ["var(--neon-cyan)", "var(--neon-magenta)", "var(--neon-violet)"][i % 3],
      };
    });
  }, [count, seed]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {dots.map((d) => (
        <span
          key={d.id}
          className="particle absolute rounded-full blur-[1px]"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            background: d.color,
            boxShadow: `0 0 ${(parseFloat(d.size) * 4).toFixed(3)}px ${d.color}`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
