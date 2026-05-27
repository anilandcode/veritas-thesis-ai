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
  login: (email: string, password?: string, fullName?: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  loginMock: (email: string, fullName?: string) => void;
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

  // Secure asynchronous login utilizing either standard JWT or mock fallback
  const login = async (email: string, password?: string, fullName?: string) => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    // 1. Fallback to offline/mock mode if password is not provided
    if (!password) {
      loginMock(email, fullName || "Graduate Scholar");
      return;
    }

    // 2. Perform production JWT login request
    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Invalid email or password.");
      }

      const data = await response.json();
      const secureToken = data.access_token;
      
      const verifiedUser: User = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        is_dean: data.user.is_dean,
        is_supervisor: data.user.is_supervisor
      };

      setToken(secureToken);
      setUser(verifiedUser);
      
      localStorage.setItem("veritas_token", secureToken);
      localStorage.setItem("veritas_user", JSON.stringify(verifiedUser));
    } catch (e: any) {
      console.error("[Auth Context] Production login failed:", e);
      throw e;
    }
  };

  // Secure asynchronous registration
  const register = async (email: string, password: string, fullName: string) => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    try {
      const response = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Signup failed. Please try again.");
      }

      const data = await response.json();
      const secureToken = data.access_token;
      
      const verifiedUser: User = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        is_dean: data.user.is_dean,
        is_supervisor: data.user.is_supervisor
      };

      setToken(secureToken);
      setUser(verifiedUser);
      
      localStorage.setItem("veritas_token", secureToken);
      localStorage.setItem("veritas_user", JSON.stringify(verifiedUser));
    } catch (e: any) {
      console.error("[Auth Context] Production signup failed:", e);
      throw e;
    }
  };

  // Legacy dynamic mock token generation for offline/gated rapid testing
  const loginMock = (email: string, fullName: string = "Graduate Scholar") => {
    const secureToken = `mock_user_${email.split("@")[0]}`;
    const is_dean = email.includes("dean") || secureToken.startsWith("mock_user_dean");
    const is_supervisor = email.includes("advisor") || email.includes("supervisor") || secureToken.startsWith("mock_user_advisor") || secureToken === "mock_user_system";
    
    const newUser: User = {
      id: Date.now(),
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
      register,
      loginMock,
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
