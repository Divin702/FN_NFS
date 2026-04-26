import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,        // 30s before refetch
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors — they won't change
          if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
