import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="p-4 shadow-md flex justify-between items-center font-play"
      style={{ background: "var(--color-bg-secondary)", color: "var(--color-text)" }}
    >
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold text-[var(--color-text)]">
          <Link
            to="/"
            className="px-3 py-1 rounded hover:bg-[var(--color-primary)] hover:text-white transition-colors"
          >
            👑Gestorneos👑
          </Link>
        </div>

        <Link
          to="/torneos"
          className="px-3 py-1 rounded hover:bg-[var(--color-primary)] hover:text-white transition-colors"
        >
          Torneos
        </Link>
        <Link
          to="/perfil"
          className="px-3 py-1 rounded hover:bg-[var(--color-primary)] hover:text-white transition-colors"
        >
          Perfil
        </Link>
        <Link
          to="/nuevotorneo"
          className="px-3 py-1 rounded hover:bg-[var(--color-primary)] hover:text-white transition-colors"
        >
          Crear Torneo
        </Link>
      </div>

      <div className="flex gap-4 items-center">
        {loading ? null : user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="bg-[var(--color-primary)] text-white px-3 py-1 rounded hover:bg-[var(--color-secondary)] transition-colors"
            >
              {user.nombre}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-[var(--color-bg)] text-[var(--color-text)] rounded shadow-lg w-36">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <Link to="/register" className="px-3 py-1 rounded text-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors">
              Crear una cuenta
            </Link>
            <Link to="/login" className="px-3 py-1 rounded text-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors">
              Iniciar sesión
            </Link>
          </div>
        )}

        <ThemeToggle />
      </div>
    </nav>

  );
}
