import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshAccessToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) return null;

    try {
      const res = await api.post("/auth/refresh", { refreshToken: storedRefreshToken });
      const data = res.data;
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      return data.accessToken;
    } catch (err) {
      console.error("Token refresh error:", err);
      logout();
      return null;
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!refreshToken) return;

    const interval = setInterval(() => {
      refreshAccessToken();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshToken, refreshAccessToken]);

  const login = (userData, accessToken, newRefreshToken) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    setUser(userData);
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
    if (userData.role !== "BUSINESS_ADMIN") {
      setPendingCount(0);
    }
  };

  const logout = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (storedRefreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken: storedRefreshToken });
      } catch (err) {
        console.error("Logout error:", err);
      }
    }

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setPendingCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        loading,
        refreshAccessToken,
        pendingCount,
        setPendingCount,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
