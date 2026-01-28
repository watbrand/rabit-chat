import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiRequest, getApiUrl, queryClient } from "@/lib/query-client";

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  linkUrl: string | null;
  location: string | null;
  pronouns: string | null;
  category: "PERSONAL" | "CREATOR" | "BUSINESS";
  netWorth: number;
  influenceScore: number;
  isVerified: boolean;
  verifiedAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUserDirectly: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL("/api/auth/me", baseUrl), {
        credentials: "include",
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const userData = await res.json();
    setUser(userData);
    queryClient.clear();
  };

  const signup = async (username: string, email: string, password: string, displayName: string) => {
    const res = await apiRequest("POST", "/api/auth/signup", { 
      username, 
      email, 
      password, 
      displayName 
    });
    const userData = await res.json();
    setUser(userData);
    queryClient.clear();
  };

  const logout = () => {
    console.log("[useAuth] logout() called - clearing user immediately");
    
    // Make logout API call first to destroy server session
    const baseUrl = getApiUrl();
    fetch(new URL("/api/auth/logout", baseUrl), {
      method: "POST",
      credentials: "include",
    }).then(() => {
      console.log("[useAuth] logout API call successful");
    }).catch((err) => {
      console.log("[useAuth] logout API call failed:", err);
    });
    
    // Clear user state immediately - this triggers navigation to auth screens
    setUser(null);
    console.log("[useAuth] setUser(null) called");
    
    // Cancel any pending queries
    queryClient.cancelQueries();
    
    // Clear the entire query cache
    queryClient.clear();
    console.log("[useAuth] queryClient cleared");
  };

  const setUserDirectly = useCallback((userData: User) => {
    setUser(userData);
    queryClient.clear();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggingOut,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
        setUserDirectly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
