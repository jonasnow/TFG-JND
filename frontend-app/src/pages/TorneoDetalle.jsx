import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TorneoDetalle() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [torneo, setTorneo] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [inscrito, setInscrito] = useState(false);
    const [cargandoInscripcion, setCargandoInscripcion] = useState(true); //para manejar el estado de los botones de inscripcion
    const [error, setError] = useState(null);
    const id = slug ? Number(slug.split("-").pop()) : null;

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

    const checkInscripcion = async (idUsuario, idTorneo) => {
        try {
            const res = await fetch(
                `http://localhost:8000/usuario_inscrito/${idUsuario}/${idTorneo}`,
                { credentials: "include" }
            );
            const data = await res.json();

            if (!data.error) {
                setInscrito(data.inscrito);
            }
        } finally {
            setCargandoInscripcion(false);
        }
    };



    useEffect(() => {
        if (usuario && id) {
            setCargandoInscripcion(true);
            checkInscripcion(usuario.idUsuario, id);
        }
    }, [usuario, id]);

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
        return <p className="text-center mt-6 text-red-500 font-semibold">{error}</p>;
    if (!torneo)
        return <p className="text-center mt-6 text-[var(--color-text)]">Cargando torneo...</p>;

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play flex flex-col items-center p-8">
            <div className="bg-[var(--color-bg-secondary)] shadow-md rounded-2xl p-8 max-w-2xl w-full">
                <h1 className="text-3xl font-bold mb-4">{torneo.nombre}</h1>

                <p className="mb-2"><strong>Lugar:</strong> {torneo.lugarCelebracion}</p>
                <p className="mb-2"><strong>Hora inicio:</strong> {new Date(torneo.fechaHoraInicio).toLocaleString()}</p>
                <p className="mb-2"><strong>Juego:</strong> {torneo.idJuego}</p>
                <p className="mb-2"><strong>Plazas máximas:</strong> {torneo.plazasMax}</p>
                <p className="mb-2"><strong>Liga:</strong> {torneo.nombreLiga}</p>
                <p className="mt-4">{torneo.descripcion}</p>

                {mensaje && (
                    <p className="mt-4 text-center font-medium text-[var(--color-primary)]">
                        {mensaje}
                    </p>
                )}

                <div className="mt-6 flex justify-center">
                    {usuario ? (

                        cargandoInscripcion ? (
                            <p className="text-center text-gray-400">Comprobando inscripción...</p>
                        ) : !inscrito ? (
                            <>
                                <button
                                    onClick={() => setMostrarConfirmacion(true)}
                                    className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-secondary)] transition"
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
                            <p className="text-center text-green-400 font-semibold">
                                Estás inscrito en este torneo
                            </p>
                        )

                    ) : (
                        <button
                            onClick={() => navigate("/login")}
                            className="bg-[var(--color-secondary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary)] transition"
                        >
                            Iniciar sesión para registro
                        </button>
                    )}
                </div>

                {mostrarConfirmacion && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg p-6 w-96">
                            <h2 className="text-xl font-semibold mb-4 text-center">{`Confirmar inscripción`}</h2>
                            <p className="text-center mb-4">{`Vas a confirmar inscripción para el torneo ${torneo.nombre}`}</p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={handleInscripcion}
                                    className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-secondary)] transition"
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
