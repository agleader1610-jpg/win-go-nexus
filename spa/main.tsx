// Entry point for the static SPA build used on cPanel (Apache + PHP).
// No SSR: the router mounts client-side and all data comes from the PHP API.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "../src/routeTree.gen";

const queryClient = new QueryClient();

// Matches the build-time base (VITE_BASE), e.g. "/bdwineiplat/" or "/".
const basepath = import.meta.env.BASE_URL || "/";

const router = createRouter({
  basepath,
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultPendingMs: 300,
  defaultPendingMinMs: 250,
});

const el = document.getElementById("root")!;
createRoot(el).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
