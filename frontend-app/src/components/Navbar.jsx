import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
      <div className="text-xl font-bold">Mi App</div>
      <div className="flex gap-4">
        <Link to="/" className="hover:bg-blue-700 px-3 py-1 rounded">Inicio</Link>
        <Link to="/torneos" className="hover:bg-blue-700 px-3 py-1 rounded">Torneos</Link>
        <Link to="/perfil" className="hover:bg-blue-700 px-3 py-1 rounded">Perfil</Link>
      </div>
    </nav>
  );
}
