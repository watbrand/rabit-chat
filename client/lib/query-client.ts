import { QueryClient, QueryFunction } from "@tanstack/react-query";

// PRODUCTION API URL - Hardcoded for maximum reliability
// This ensures all API calls go to production, regardless of how the app is loaded
export const PRODUCTION_API_URL = "https://rabit-chat--watbrandafrica.replit.app";

/**
 * Gets the base URL for the Express API server
 * For published apps, always returns production URL
 * For development (web), allows local development
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // For web development on localhost, use window.location
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return window.location.origin;
  }
  
  // For all published/native builds, use production URL
  // This eliminates complex manifest parsing that was causing issues
  return PRODUCTION_API_URL;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const path = queryKey[0] as string;
    const url = new URL(path, baseUrl);
    
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const params = queryKey[1] as Record<string, unknown>;
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    console.log("[QueryClient] Fetching:", url.toString());
    
    const res = await fetch(url, {
      credentials: "include",
    });

    console.log("[QueryClient] Response status:", res.status, "for", path);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      retry: false,
    },
  },
});
