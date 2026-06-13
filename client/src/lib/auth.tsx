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
  login: (token: string, user: SessionUser) => void;
  logout: () => void;
  setUser: (u: SessionUser | null) => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(getToken());
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const t = getToken();
    if (t) setTok(t);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      token,
      login: (t, u) => {
        setToken(t);
        setTok(t);
        setUser(u);
      },
      logout: () => {
        setToken(null);
        setTok(null);
        setUser(null);
      },
      setUser,
    }),
    [user, token],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
