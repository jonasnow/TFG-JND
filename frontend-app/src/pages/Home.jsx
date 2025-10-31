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
                        class="relative h-12 overflow-hidden rounded bg-neutral-950 px-5 py-2.5 text-white transition-all duration-300 hover:bg-neutral-800 hover:ring-2 hover:ring-neutral-800 hover:ring-offset-2">
                        <span class="relative">
                            Iniciar sesión</span>
                    </button>
                    <button
                        onClick={() => navigate("/register")}
                        class="relative h-12 overflow-hidden rounded bg-neutral-950 px-5 py-2.5 text-white transition-all duration-300 hover:bg-neutral-800 hover:ring-2 hover:ring-neutral-800 hover:ring-offset-2">
                        <span class="relative">
                            Crear cuenta</span>
                    </button>
                </div>
            )}
        </div>
    );
}
