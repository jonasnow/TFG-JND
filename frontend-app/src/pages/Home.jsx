import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            {user ? (
                <h1 className="text-3xl font-bold mb-8">Bienvenido {user.nombre}</h1>
            ) : (
                <h1 className="text-3xl font-bold mb-8">Bienvenido</h1>
            )}

            {!user && (
                <div className="space-x-4">
                    <button
                        onClick={() => navigate("/login")}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Inicia sesión
                    </button>
                    <button
                        onClick={() => navigate("/register")}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Crear cuenta
                    </button>
                </div>
            )}
        </div>
    );
}
