import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TorneoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [torneo, setTorneo] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTorneo = async () => {
            try {
                const response = await fetch(`http://localhost:8000/torneo/${id}`);
                const data = await response.json();
                setTorneo(data);
            } catch {
                setError("Error al cargar el torneo");
            }
        };
        fetchTorneo();

        const checkUser = async () => {
            try {
                const res = await fetch("http://localhost:8000/me", {
                    credentials: "include",
                });
                const data = await res.json();
                if (!data.error) setUsuario(data);
            } catch {
                setUsuario(null);
            }
        };
        checkUser();
    }, [id]);

    const handleInscripcion = async () => {
        try {
            const response = await fetch("http://localhost:8000/inscribir_usuario", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: usuario.email, idTorneo: id }),
            });
            const result = await response.json();
            if (result.error) setMensaje(result.error);
            else setMensaje(result.mensaje);
            setMostrarConfirmacion(false);
        } catch (err) {
            setMensaje("Error al inscribirse en el torneo");
        }
    };

    if (error)
        return <p className="text-center text-red-500 mt-6">{error}</p>;
    if (!torneo)
        return <p className="text-center mt-6">Cargando torneo...</p>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
            <div className="bg-white shadow-md rounded-2xl p-8 max-w-2xl w-full">
                <h1 className="text-3xl font-bold mb-4 text-gray-800">
                    {torneo.nombre}
                </h1>
                <p className="text-gray-600 mb-2">
                    <strong>Lugar:</strong> {torneo.lugarCelebracion}
                </p>
                <p className="text-gray-600 mb-2">
                    <strong>Hora inicio:</strong>{" "}
                    {new Date(torneo.fechaHoraInicio).toLocaleString()}
                </p>
                <p className="text-gray-600 mb-2">
                    <strong>Juego:</strong> {torneo.idJuego}
                </p>
                <p className="text-gray-600 mb-2">
                    <strong>Liga:</strong> {torneo.nombreLiga}
                </p>
                <p className="text-gray-700 mt-4">{torneo.descripcion}</p>

                {mensaje && (
                    <p className="mt-4 text-center font-medium text-green-600">
                        {mensaje}
                    </p>
                )}

                <div className="mt-6 flex justify-center space-x-4">
                    {usuario ? (
                        <>
                            <button
                                onClick={() => setMostrarConfirmacion(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Inscribirse
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
                            >
                                Volver
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate("/login")}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            Iniciar sesión para registro
                        </button>
                    )}
                </div>

                {mostrarConfirmacion && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-lg p-6 w-96">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
                                Confirmar inscripción
                            </h2>
                            <p className="text-center text-gray-600 mb-4">
                                Vas a confirmar inscripción para el torneo{" "}
                                <strong>{torneo.nombre}</strong>
                            </p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={handleInscripcion}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Confirmar
                                </button>
                                <button
                                    onClick={() => setMostrarConfirmacion(false)}
                                    className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
                                >
                                    Atrás
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
