/**
 * SignalWin — premium stylized wordmark logo.
 * Pure SVG so it scales crisp at any size and stays consistent across pages.
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
    sm: { mark: 32, font: 16, gap: 8 },
    md: { mark: 40, font: 20, gap: 10 },
    lg: { mark: 56, font: 28, gap: 14 },
  }[size];

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap: dims.gap }}
      aria-label="SignalWin"
    >
      {/* Mark */}
      <svg
        width={dims.mark}
        height={dims.mark}
        viewBox="0 0 64 64"
        className="shrink-0 drop-shadow-[0_0_14px_color-mix(in_oklab,var(--neon-cyan)_55%,transparent)]"
      >
        <defs>
          <linearGradient id="bl-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--neon-cyan)" />
            <stop offset="55%" stopColor="var(--neon-violet)" />
            <stop offset="100%" stopColor="var(--neon-magenta)" />
          </linearGradient>
          <linearGradient id="bl-stroke" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--neon-cyan)" />
            <stop offset="100%" stopColor="var(--neon-magenta)" />
          </linearGradient>
        </defs>
        {/* hex frame */}
        <path
          d="M32 3 L57 17.5 V46.5 L32 61 L7 46.5 V17.5 Z"
          fill="url(#bl-grad)"
          fillOpacity="0.16"
          stroke="url(#bl-stroke)"
          strokeWidth="1.5"
        />
        {/* inner hex outline */}
        <path
          d="M32 11 L50 21.5 V42.5 L32 53 L14 42.5 V21.5 Z"
          fill="none"
          stroke="url(#bl-stroke)"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
        {/* signal arrow / W mark */}
        <path
          d="M16 38 L24 26 L30 33 L36 22 L42 32 L48 26"
          fill="none"
          stroke="url(#bl-stroke)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* dots */}
        <circle cx="16" cy="38" r="2" fill="var(--neon-cyan)" />
        <circle cx="48" cy="26" r="2" fill="var(--neon-magenta)" />
      </svg>

      {showWord && (
        <span
          className="brand-wordmark leading-none"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: dims.font,
            fontWeight: 800,
            letterSpacing: "0.08em",
          }}
        >
          <span className="brand-word-signal">SIGNAL</span>
          <span className="brand-word-win">WIN</span>
        </span>
      )}
    </div>
  );
}
