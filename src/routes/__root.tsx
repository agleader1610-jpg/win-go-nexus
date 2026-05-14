import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/components/ThemeProvider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SignalWin — AI Lottery Signal Engine" },
      {
        name: "description",
        content: "Live AI predictions for WinGo, K3, and TrxWinGo across all timeframes.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "SignalWin" },
      { property: "og:title", content: "SignalWin — AI Lottery Signal Engine" },
      {
        property: "og:description",
        content: "Live AI predictions for WinGo, K3, and TrxWinGo across all timeframes.",
      },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "SignalWin — AI Lottery Signal Engine" },
      {
        name: "twitter:description",
        content: "Live AI predictions for WinGo, K3, and TrxWinGo across all timeframes.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SignalWin",
          url: "https://bdwin.eip.lat",
          description:
            "Live AI prediction signal engine for WinGo, K3 Dice, and TrxWinGo lottery games.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "SignalWin",
          url: "https://bdwin.eip.lat",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [mounted, setMounted] = useState(false);
  const isRouterLoading = useRouterState({
    select: (state) => state.isLoading,
  });

  useEffect(() => setMounted(true), []);
  const isLoading = mounted && isRouterLoading;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Global top progress bar */}
        <div
          aria-hidden
          className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 transition-opacity duration-200 ${
            isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="h-full w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 animate-pulse" />
        </div>
        {/* Global navigation loading overlay */}
        <div
          aria-hidden={!isLoading}
          className={`pointer-events-none fixed inset-0 z-[99] flex items-center justify-center transition-opacity duration-200 ${
            isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
          <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-card/85 px-5 py-3 shadow-[var(--shadow-glass)] backdrop-blur-xl">
            <span className="relative grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/10">
              <span className="absolute inset-0 animate-ping rounded-xl bg-primary/20" />
              <svg className="relative size-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <div className="leading-tight">
              <div className="text-[12px] font-black uppercase tracking-wider text-foreground">
                Loading Signals
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground">
                Syncing live AI engine…
              </div>
            </div>
          </div>
        </div>
        <Outlet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
