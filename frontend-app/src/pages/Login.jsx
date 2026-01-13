import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from || "/";

    const { setUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await loginUser(email, password);
        if (result.ok) {
            const meRes = await fetch("http://localhost:8000/me", {
                credentials: "include",
            });
            const meData = await meRes.json();
            if (!meData.error) {
                setUser({
                    nombre: meData.usuario,
                    email: meData.email,
                    idUsuario: meData.idUsuario
                });
            }
            navigate(from, { replace: true });
        } else {
            setError(result.error || "Error al iniciar sesión");
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play">
            <Navbar />
            <div className="flex flex-col items-center justify-center pt-10">
                <form
                    onSubmit={handleSubmit}
                    className="
                        w-96 p-8 rounded-xl shadow-md 
                        bg-[var(--color-bg-secondary)] text-[var(--color-text)]
                        transition
                    "
                >
                    <h2 className="text-2xl font-bold mb-6 text-center">
                        Iniciar sesión
                    </h2>

                    {error && (
                        <div
                            className="
                                p-2 mb-4 rounded 
                                bg-red-500/20 text-red-600 dark:text-red-400
                            "
                        >
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block mb-2 opacity-80">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="
                                w-full px-3 py-2 rounded-lg border 
                                bg-[var(--color-bg-secondary)] 
                                text-[var(--color-text)]
                                border-gray-300 dark:border-gray-700
                                focus:outline-none focus:ring-2 
                                focus:ring-[var(--color-primary)]
                            "
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block mb-2 opacity-80">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="
                                w-full px-3 py-2 rounded-lg border 
                                bg-[var(--color-bg-secondary)] 
                                text-[var(--color-text)]
                                border-gray-300 dark:border-gray-700
                                focus:outline-none focus:ring-2 
                                focus:ring-[var(--color-primary)]
                            "
                        />
                    </div>

                    <button
                        type="submit"
                        className="
                            w-full py-2 rounded-lg font-bold 
                            bg-[var(--color-primary)] text-white
                            hover:bg-[var(--color-secondary)]
                            transition
                        "
                    >
                        Iniciar sesión
                    </button>
                </form>
            </div>
        </div>
    );
}
