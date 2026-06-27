import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const TOKEN_KEY = "mkapms_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
  accountType: string;
  avatarUrl?: string | null;
  companyName?: string | null;
  country?: string | null;
  currency?: string | null;
}

interface AuthCtx {
  user: SessionUser | null;
  token: string | null;
  isSessionLoading: boolean;
  login: (token: string, user: SessionUser) => void;
  logout: () => void;
  setUser: (u: SessionUser | null) => void;
  setSessionLoaded: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  token: null,
  isSessionLoading: true,
  login: () => {},
  logout: () => {},
  setUser: () => {},
  setSessionLoaded: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(getToken());
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(!!getToken());

  useEffect(() => {
    const t = getToken();
    if (t) setTok(t);
    else setIsSessionLoading(false);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      token,
      isSessionLoading,
      login: (t, u) => {
        setToken(t);
        setTok(t);
        setUser(u);
        setIsSessionLoading(false);
      },
      logout: () => {
        // Partie 7 — journalise la déconnexion (best-effort, ne bloque pas).
        const t = getToken();
        if (t) {
          fetch("/api/trpc/auth.logout", {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${t}` },
            body: JSON.stringify({}),
          }).catch(() => {});
        }
        setToken(null);
        setTok(null);
        setUser(null);
        setIsSessionLoading(false);
      },
      setUser,
      setSessionLoaded: () => setIsSessionLoading(false),
    }),
    [user, token, isSessionLoading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
