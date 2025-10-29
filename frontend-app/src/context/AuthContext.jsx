import { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); //nombre, email
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/me", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setUser({ nombre: data.usuario, email: data.email });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch("http://localhost:8000/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
