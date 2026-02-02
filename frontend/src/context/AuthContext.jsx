import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

const API_BASE = "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });

      if (!res.ok) {
        // Refresh token invalid or expired, logout
        logout();
        return null;
      }

      const data = await res.json();
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

  // Restore auth on refresh
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

  // Auto-refresh token every 10 minutes (before 15min expiry)
  useEffect(() => {
    if (!refreshToken) return;

    const interval = setInterval(() => {
      refreshAccessToken();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [refreshToken, refreshAccessToken]);

  // Login - now accepts both tokens
  const login = (userData, accessToken, newRefreshToken) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    setUser(userData);
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
  };

  // Logout - invalidate refresh token on server
  const logout = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (storedRefreshToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefreshToken })
        });
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
        refreshAccessToken
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
