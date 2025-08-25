// Dependencies
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Constants from "expo-constants";
import type { NavigationProp } from "@react-navigation/native";

// Constants
const API_BASE_URL: string =
  (Constants as any)?.expoConfig?.extra?.API_BASE_URL ??
  (Constants as any)?.manifest2?.extra?.API_BASE_URL ??
  "http://10.0.2.2:5000";
const TOKEN_KEY = "authToken";

type RedirectTo = { tab?: "MapTab" | "ReportsTab" | "ProfileTab"; screen: string; params?: any };
type UserInfo = { id: number; username: string}

type AuthCtx = {
  token: string | null;
  isReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** If unauth’d, sends user to Login (optionally with redirect back). Returns true if authed. */
  requireAuth: (nav: NavigationProp<any>, redirect?: RedirectTo, mode?: "login" | "register") => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
  }, []);

  useEffect(() => {
    (async () => {
      const t = await SecureStore.getItemAsync(TOKEN_KEY);
      setToken(t);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete axios.defaults.headers.common.Authorization;
  }, [token]);

  const login = async (username: string, password: string) => {
    const { data } = await axios.post("/auth/login", { username, password });
    const t = data?.token;
    if (!t) throw new Error("No token in response");
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    setToken(t);
  };

  const register = async (username: string, email: string, password: string) => {
    const { data } = await axios.post("/auth/register", { username, email, password });
    const t = data?.token;
    if (!t) throw new Error("No token in response");
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    setToken(t);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
  };

  const requireAuth: AuthCtx["requireAuth"] = (navigation, redirect, mode = "login") => {
    if (token) return true;
    (navigation as any).navigate("ProfileTab", {
      screen: "Login",           // or "Auth" if you use a combined auth screen
      params: { mode, redirectTo: redirect },
    });
    return false;
  };

  const value = useMemo(() => ({ token, isReady, login, register, logout, requireAuth }), [token, isReady]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
};