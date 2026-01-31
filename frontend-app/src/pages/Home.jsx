import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    return (
        <div
            className="
                min-h-screen flex flex-col items-center justify-center
                bg-[var(--color-bg)] text-[var(--color-text)]
                font-play
            "
        >
            <h1 className="text-3xl font-bold mb-8">
                {loading
                    ? "Bienvenido a Gestorneos"
                    : user
                        ? `Bienvenido a Gestorneos, ${user.usuario}`
                        : "Bienvenido a Gestorneos"}
            </h1>


            {!user && (
                <div className="space-x-4">
                    <button
                        onClick={() => navigate("/login")}
                        className="
                            relative h-12 overflow-hidden rounded px-5 py-2.5 
                            transition-all duration-300 hover:opacity-80
                            bg-[var(--color-primary)] text-white
                        "
                    >
                        <span className="relative">Iniciar sesión</span>
                    </button>

                    <button
                        onClick={() => navigate("/register")}
                        className="
                            relative h-12 overflow-hidden rounded px-5 py-2.5 
                            transition-all duration-300 hover:opacity-80
                            bg-[var(--color-secondary)] text-white
                        "
                    >
                        <span className="relative">Crear cuenta</span>
                    </button>
                </div>
            )}
        </div>
    );
}
