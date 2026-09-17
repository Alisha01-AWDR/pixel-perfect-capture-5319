import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoSessionToken, loginRequest, registerRequest } from "./darukaa";

type AuthContextValue = {
  token: string | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("darukaa_token");
    setToken(stored);
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    isReady,
    async login(email, password) {
      const nextToken = await loginRequest(email, password);
      window.localStorage.setItem("darukaa_token", nextToken || demoSessionToken());
      setToken(nextToken || demoSessionToken());
    },
    async register(email, password) {
      const nextToken = await registerRequest(email, password);
      window.localStorage.setItem("darukaa_token", nextToken || demoSessionToken());
      setToken(nextToken || demoSessionToken());
    },
    logout() {
      window.localStorage.removeItem("darukaa_token");
      setToken(null);
    },
  }), [isReady, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}