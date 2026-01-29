import { QueryClient, QueryFunction } from "@tanstack/react-query";
import Constants from "expo-constants";

/**
 * Gets the base URL for the Express API server (e.g., "https://domain.replit.dev")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // Try multiple sources for the domain
  let host = process.env.EXPO_PUBLIC_DOMAIN;
  
  // Fallback to Expo Constants if available
  if (!host && Constants.expoConfig?.extra?.apiDomain) {
    host = Constants.expoConfig.extra.apiDomain;
  }
  
  // Fallback to hostUri for development
  if (!host && Constants.expoConfig?.hostUri) {
    // Extract domain from hostUri (e.g., "domain.replit.dev:8081")
    const hostUri = Constants.expoConfig.hostUri;
    host = hostUri.split(':')[0];
  }
  
  // Ultimate fallback - use the Replit dev domain directly
  // This ensures the app works even if env vars aren't passed correctly
  if (!host) {
    host = "e42123f6-2a05-4c86-a608-763b544187e9-00-bdvy7k1ckg5u.kirk.replit.dev";
    console.log("[getApiUrl] Using hardcoded fallback domain");
  }

  console.log("[getApiUrl] EXPO_PUBLIC_DOMAIN:", process.env.EXPO_PUBLIC_DOMAIN);
  console.log("[getApiUrl] Constants.expoConfig.hostUri:", Constants.expoConfig?.hostUri);
  console.log("[getApiUrl] Resolved host:", host);

  // Remove port suffix if present - Replit's HTTPS proxy handles routing
  // e.g., "domain.replit.dev:5000" -> "domain.replit.dev"
  host = host.replace(/:5000$/, "").replace(/:8081$/, "");

  let url = new URL(`https://${host}`);

  console.log("[getApiUrl] Final URL:", url.href);

  return url.href;
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
