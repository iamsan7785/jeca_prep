import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../services/api";
import type { Session } from "../types";

interface AuthValue {
  session: Session | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  explore: () => void;
  logout: () => void;
}

const SESSION_KEY = "jeca-prep-session";
const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Session | null; } catch { return null; }
  });

  useEffect(() => { if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session)); else localStorage.removeItem(SESSION_KEY); }, [session]);
  const save = (next: Session) => setSession({ ...next, mode: "api" });
  const value = useMemo<AuthValue>(() => ({
    session,
    isAuthenticated: Boolean(session),
    login: async (email, password) => save(await api.login(email, password)),
    register: async (name, email, password) => save(await api.register(name, email, password)),
    explore: () => setSession({ user: { id: "local-learner", name: "Demo learner", email: "demo@local", role: "STUDENT" }, token: "", mode: "local" }),
    logout: () => setSession(null),
  }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
