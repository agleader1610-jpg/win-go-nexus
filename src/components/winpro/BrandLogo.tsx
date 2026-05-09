/**
 * SignalWin — refined premium wordmark.
 * Clean monogram + elegant wordmark, designed to look like a real fintech brand.
 */
export function BrandLogo({
  size = "md",
  showWord = true,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  showWord?: boolean;
  className?: string;
}) {
  const dims = {
    sm: { mark: 28, font: 15, gap: 8, sub: 8 },
    md: { mark: 36, font: 18, gap: 10, sub: 9 },
    lg: { mark: 48, font: 24, gap: 12, sub: 10 },
  }[size];

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap: dims.gap }}
      aria-label="SignalWin"
    >
      <svg
        width={dims.mark}
        height={dims.mark}
        viewBox="0 0 48 48"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="bl-fill" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--neon-cyan)" />
            <stop offset="100%" stopColor="var(--neon-magenta)" />
          </linearGradient>
        </defs>
        {/* Solid rounded square — clean, app-icon style */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#bl-fill)" />
        {/* Subtle inner highlight */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill="none"
          stroke="white"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
        {/* Stylized "S" wave — represents signal */}
        <path
          d="M16 18 Q16 14 20 14 L28 14 Q32 14 32 17 Q32 20 28 20 L20 20 Q16 20 16 23 Q16 26 20 26 L28 26 Q32 26 32 29 Q32 34 28 34 L20 34 Q16 34 16 30"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Signal dots */}
        <circle cx="34" cy="14" r="2.5" fill="white" />
      </svg>

      {showWord && (
        <div className="flex flex-col leading-none">
          <span
            className="brand-wordmark"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: dims.font,
              fontWeight: 800,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            <span className="brand-word-signal">Signal</span>
            <span className="brand-word-win">Win</span>
          </span>
          <span
            className="t-eyebrow text-muted-foreground"
            style={{ fontSize: dims.sub, marginTop: 4, letterSpacing: "0.24em" }}
          >
            AI · SIGNAL · DESK
          </span>
        </div>
      )}
    </div>
  );
}
