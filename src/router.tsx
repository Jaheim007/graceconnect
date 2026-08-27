import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Ported from the pre-migration src/App.tsx QueryClient defaultOptions.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 2, retry: 1 },
      mutations: {
        onError: (error: unknown) => {
          // I14: Global mutation error handler — prevents silent failures
          const message = error instanceof Error ? error.message : "Une erreur est survenue.";
          console.error("[Mutation Error]", message);
        },
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};