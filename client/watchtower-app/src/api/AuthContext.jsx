



import React, { createContext, useContext, useState } from "react";
import { login as apiLogin, register as apiRegister } from "./auth";

const AuthContext = createContext({
  token: null,
  setToken: () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

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

  return (
    <AuthContext.Provider value={{ token, setToken, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
