import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [dropdownUsuarioAbierto, setDropdownUsuarioAbierto] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setDropdownUsuarioAbierto(false);
    setMenuMovilAbierto(false);
    navigate("/login");
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownUsuarioAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 shadow-md font-play"
      style={{ background: "var(--color-bg-secondary)", color: "var(--color-text)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                to="/" 
                className="text-xl font-bold px-3 py-1 rounded hover:text-[var(--color-primary)] transition-colors"
                onClick={() => setMenuMovilAbierto(false)}
              >
                👑Gestorneos👑
              </Link>
            </div>

            <div className="hidden md:flex space-x-4">
              <Link to="/torneos" className="hover:text-[var(--color-primary)] transition-colors font-semibold">Torneos</Link>
              
              {user && (
                  <>
                      <Link to="/perfil" className="hover:text-[var(--color-primary)] transition-colors font-semibold">Perfil</Link>
                      <Link to="/nuevotorneo" className="hover:text-[var(--color-primary)] transition-colors font-semibold">Crear Torneo</Link>
                  </>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            
            <ThemeToggle />

            {loading ? (
              <div className="animate-pulse w-20 h-8 bg-gray-600 rounded"></div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownUsuarioAbierto(!dropdownUsuarioAbierto)}
                  className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-secondary)] transition shadow-sm"
                >
                  <span className="font-medium">{user.usuario}</span>
                  <span className="text-xs">▼</span>
                </button>

                {dropdownUsuarioAbierto && (
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5"
                    style={{ background: "var(--color-bg)" }}
                  >
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[var(--color-bg-secondary)]"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <Link to="/login" className="text-[var(--color-primary)] font-semibold hover:underline">Iniciar sesión</Link>
                <Link to="/register" className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-secondary)] transition">Crear cuenta</Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden gap-4">
            <ThemeToggle />
            <button
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              className="text-[var(--color-text)] p-2 rounded-md hover:bg-gray-700 focus:outline-none"
            >
              {menuMovilAbierto ? (
                 <span className="text-2xl font-bold">✕</span>
              ) : (
                 <span className="text-2xl font-bold">☰</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {menuMovilAbierto && (
        <div className="md:hidden border-t border-gray-700 bg-[var(--color-bg-secondary)] shadow-inner">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
                to="/torneos" 
                onClick={() => setMenuMovilAbierto(false)}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[var(--color-primary)] hover:text-white"
            >
                Torneos
            </Link>
            
            {user && (
                <>
                    <Link 
                        to="/nuevotorneo" 
                        onClick={() => setMenuMovilAbierto(false)}
                        className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[var(--color-primary)] hover:text-white"
                    >
                        Crear Torneo
                    </Link>
                </>
            )}
          </div>

          <div className="pt-4 pb-4 border-t border-gray-700">
            {user ? (
              <div className="px-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-xl">
                        {user.usuario.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-base font-medium leading-none text-[var(--color-text)]">{user.usuario}</div>
                        <div className="text-sm font-medium leading-none text-gray-400 mt-1">{user.email}</div>
                    </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-3 block w-full text-center px-3 py-2 rounded-lg text-base font-medium text-white bg-red-600 hover:bg-red-700 transition"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="px-5 space-y-3 pb-2">
                <Link 
                    to="/login" 
                    onClick={() => setMenuMovilAbierto(false)}
                    className="block w-full text-center px-3 py-2 rounded-lg text-base font-medium border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition"
                >
                    Iniciar sesión
                </Link>
                <Link 
                    to="/register" 
                    onClick={() => setMenuMovilAbierto(false)}
                    className="block w-full text-center px-3 py-2 rounded-lg text-base font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)] transition"
                >
                    Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}