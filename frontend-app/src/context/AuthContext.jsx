import { createContext, useState, useEffect, useContext } from "react";
import { API_URL } from "../api/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); //{usuario, email, idUsuario}
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();

      if (!data || !data.usuario) {
        setUser(null);
        return;
      }

      setUser(data); 

    } catch (error) {
      console.error("Error verificando sesión:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}