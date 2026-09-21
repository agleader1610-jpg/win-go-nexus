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
import { AnnouncementModal } from "@/components/winpro/AnnouncementModal";

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
      {
        name: "google-site-verification",
        content: "-t7xLhmsGuuruZZ3UU7SPZ4w0kE5bni_MNgX9uW26fQ",
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
        <AnnouncementModal />
        <Outlet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
