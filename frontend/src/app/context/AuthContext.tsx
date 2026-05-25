"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_dean?: boolean;
  is_supervisor?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, fullName?: string) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token & user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("veritas_token");
    const savedUser = localStorage.getItem("veritas_user");
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem("veritas_token");
        localStorage.removeItem("veritas_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Standard login using dynamic mock tokens linked to database autoprovisioning
  const login = (email: string, fullName: string = "Graduate Scholar") => {
    // Generate secure mock JWT for development fallback (which triggers backend autoprovisioning)
    const secureToken = `mock_user_${email.split("@")[0]}`;
    const is_dean = email.includes("dean") || secureToken.startsWith("mock_user_dean");
    const is_supervisor = email.includes("advisor") || email.includes("supervisor") || secureToken.startsWith("mock_user_advisor") || secureToken === "mock_user_system";
    
    const newUser: User = {
      id: Date.now(), // Local client ID
      email: email,
      full_name: fullName,
      is_dean,
      is_supervisor
    };

    setToken(secureToken);
    setUser(newUser);
    
    localStorage.setItem("veritas_token", secureToken);
    localStorage.setItem("veritas_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("veritas_token");
    localStorage.removeItem("veritas_user");
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (!token) return {};
    return {
      "Authorization": `Bearer ${token}`
    };
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
      getAuthHeaders
    }}>
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
