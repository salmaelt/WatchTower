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
const USER_KEY = "authUser"; // store { id, username } from AuthResponse

type RedirectTo = { tab?: "MapTab" | "ReportsTab" | "ProfileTab"; screen: string; params?: any };
type UserInfo = { id: number; username: string } | null;

type AuthCtx = {
  token: string | null;
  user: UserInfo;
  isReady: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** If unauth’d, sends user to Login (optionally with redirect back). Returns true if authed. */
  requireAuth: (nav: NavigationProp<any>, redirect?: RedirectTo, mode?: "login" | "register") => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo>(null);
  const [isReady, setReady] = useState(false);

  // Base URL once
  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
  }, []);

  // Bootstrap saved credentials
  useEffect(() => {
    (async () => {
      const [t, u] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      setToken(t);
      setUser(u ? (JSON.parse(u) as UserInfo) : null);
      setReady(true);
    })();
  }, []);

  // Keep Authorization header in sync
  useEffect(() => {
    if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete axios.defaults.headers.common.Authorization;
  }, [token]);

  // POST /auth/login expects { usernameOrEmail, password } and returns { id, username, token, ... }  
  const login = async (usernameOrEmail: string, password: string) => {
    const { data } = await axios.post("/auth/login", { usernameOrEmail, password });
    const t: string | undefined = data?.token;
    const id: number | undefined = data?.id;
    const uname: string | undefined = data?.username;
    if (!t || !id || !uname) throw new Error("Invalid login response");

    await SecureStore.setItemAsync(TOKEN_KEY, t);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify({ id, username: uname }));
    setToken(t);
    setUser({ id, username: uname });
  };

  // POST /auth/register expects { username, email, password } and returns same AuthResponse  
  const register = async (username: string, email: string, password: string) => {
    const { data } = await axios.post("/auth/register", { username, email, password });
    const t: string | undefined = data?.token;
    const id: number | undefined = data?.id;
    const uname: string | undefined = data?.username;
    if (!t || !id || !uname) throw new Error("Invalid register response");

    await SecureStore.setItemAsync(TOKEN_KEY, t);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify({ id, username: uname }));
    setToken(t);
    setUser({ id, username: uname });
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const requireAuth: AuthCtx["requireAuth"] = (navigation, redirect, mode = "login") => {
    if (token) return true;
    (navigation as any).navigate("ProfileTab", {
      screen: "Login",
      params: { mode, redirectTo: redirect },
    });
    return false;
  };

  const value = useMemo(
    () => ({ token, user, isReady, login, register, logout, requireAuth }),
    [token, user, isReady]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
};
