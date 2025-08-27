



import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, register as apiRegister } from "./auth";

const AuthContext = createContext({
  token: null,
  setToken: () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const username = localStorage.getItem("username");
    const id = localStorage.getItem("userId");
    return username ? { id: id ? Number(id) : undefined, username } : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user?.username) {
      localStorage.setItem("username", user.username);
      if (user.id != null) localStorage.setItem("userId", String(user.id));
    } else {
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
    }
  }, [user]);

  const login = async (usernameOrEmail, password) => {
    try {
      const res = await apiLogin(usernameOrEmail, password);
      setToken(res.token);
      setUser({ id: res.id, username: res.username });
      return res;
    } catch (err) {
      throw err;
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await apiRegister(username, email, password);
      setToken(res.token);
      setUser({ id: res.id, username: res.username });
      return res;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, setToken, user, login, register, logout }), [token, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
