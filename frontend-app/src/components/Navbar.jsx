import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
      <div className="text-xl font-bold">Mi App</div>
      <div className="flex gap-4 items-center">
        <Link to="/" className="hover:bg-blue-700 px-3 py-1 rounded">
          Inicio
        </Link>
        <Link to="/torneos" className="hover:bg-blue-700 px-3 py-1 rounded">
          Torneos
        </Link>
        <Link to="/perfil" className="hover:bg-blue-700 px-3 py-1 rounded">
          Perfil
        </Link>
        <Link to="/nuevotorneo" className="hover:bg-blue-700 px-3 py-1 rounded">
          Crear Torneo
        </Link>
        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-800"
            >
              {user.nombre}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-white text-black rounded shadow-lg w-32">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-200"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="hover:bg-blue-700 px-3 py-1 rounded">
            Iniciar sesión
          </Link>
        )}
      </div>
    </nav>
  );
}
