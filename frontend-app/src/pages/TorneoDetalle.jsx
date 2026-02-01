import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/auth";

export default function TorneoDetalle() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [torneo, setTorneo] = useState(null);
    const [estadoInscripcion, setEstadoInscripcion] = useState(null);
    const [cargandoInscripcion, setCargandoInscripcion] = useState(true);
    const [error, setError] = useState(null);

    const [modoEdicion, setModoEdicion] = useState(false);
    const [datosEditables, setDatosEditables] = useState(null);
    const [procesandoEdicion, setProcesandoEdicion] = useState(false);
    const [mensajeEdicion, setMensajeEdicion] = useState("");

    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [procesandoInscripcion, setProcesandoInscripcion] = useState(false);
    const [mostrarResultado, setMostrarResultado] = useState(false);
    const [mensajeResultado, setMensajeResultado] = useState("");
    const [tipoResultado, setTipoResultado] = useState("success");

    const id = slug ? Number(slug.split("-").pop()) : null;

    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Ajuste a local para el input
        return now.toISOString().slice(0, 16);
    };

    useEffect(() => {
        const fetchTorneo = async () => {
            try {
                const response = await fetch(`${API_URL}/torneo/${id}`);
                if (response.ok) {
                    setTorneo(await response.json());
                } else {
                    setError("No se pudo cargar el torneo.");
                }
            } catch {
                setError("Error de conexión.");
            }
        };
        if (id) fetchTorneo();
    }, [id]);

    //2. Comprobar Inscripción
    useEffect(() => {
        if (!user || !id) {
            setCargandoInscripcion(false);
            return;
        }
        const checkInscripcion = async () => {
            try {
                const res = await fetch(`${API_URL}/estoy_inscrito/${id}`, { credentials: "include" });
                const data = await res.json();

                if (!data.error) {
                    setEstadoInscripcion({
                        confirmacionInscripcion: data.confirmacionInscripcion,
                        confirmacionAsistencia: data.confirmacionAsistencia
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setCargandoInscripcion(false);
            }
        };
        checkInscripcion();
    }, [user, id]);


    useEffect(() => {
        if (!user || !torneo || cargandoInscripcion) return;

        if (torneo.estado === "FINALIZADO") {
            const esOrganizador = user.idUsuario === torneo.idOrganizador;
            const esParticipante = estadoInscripcion?.confirmacionInscripcion === "CONFIRMADA";

            // Si es parte del torneo y ya acabó, ver los resultados/historial
            if (esOrganizador || esParticipante) {
                navigate(`/torneo/${slug}/en-curso/detalle`, { replace: true });
            }
        }
    }, [torneo, user, estadoInscripcion, cargandoInscripcion, navigate, slug]);


    const esOrganizador = user && torneo && user.idUsuario === torneo.idOrganizador;
    const ocupadas = torneo?.inscripciones || 0;
    const plazasDisponibles = torneo ? torneo.plazasMax - ocupadas : 0;
    const inscripcionStatus = estadoInscripcion?.confirmacionInscripcion;

    const iniciarEdicion = () => {
        setDatosEditables({ ...torneo });
        setModoEdicion(true);
        setMensajeEdicion("");
    };

    const cancelarEdicion = () => {
        setModoEdicion(false);
        setDatosEditables(null);
        setMensajeEdicion("");
    };

    const guardarEdicion = async () => {
        setProcesandoEdicion(true);
        setMensajeEdicion("");
        const payload = { ...datosEditables };

        if (payload.fechaHoraInicio) {
            const fechaObj = new Date(payload.fechaHoraInicio); //Conversion UTC
            if (fechaObj < new Date()) {
                setMensajeEdicion("La fecha no puede estar en el pasado.");
                setProcesandoEdicion(false);
                return;
            }
            payload.fechaHoraInicio = fechaObj.toISOString();
        }

        try {
            const response = await fetch(`${API_URL}/editar_torneo/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(datosEditables),
            });

            const result = await response.json();

            if (!response.ok) {
                setMensajeEdicion(result.detail || "Error al guardar cambios.");
            } else {
                setTorneo({ ...datosEditables });
                setModoEdicion(false);
                setMensajeResultado("Torneo actualizado correctamente");
                setTipoResultado("success");
                setMostrarResultado(true);
            }
        } catch (error) {
            setMensajeEdicion("Error de conexión al guardar.");
        } finally {
            setProcesandoEdicion(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setDatosEditables(prev => ({ ...prev, [name]: value }));
    };

    const handleInscripcion = async () => {
        setProcesandoInscripcion(true);
        setMostrarConfirmacion(false);
        try {
            const response = await fetch(`${API_URL}/inscribir_usuario`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: user.email, idTorneo: id }),
            });
            const result = await response.json();
            await new Promise(resolve => setTimeout(resolve, 800));

            if (result.error) {
                setMensajeResultado(result.error);
                setTipoResultado("error");
            } else {
                setMensajeResultado("Solicitud enviada con éxito.");
                setTipoResultado("success");
                setEstadoInscripcion({ confirmacionInscripcion: "PENDIENTE", confirmacionAsistencia: "PENDIENTE" });
            }
            setMostrarResultado(true);
        } catch (err) {
            setMensajeResultado("Error de conexión.");
            setTipoResultado("error");
            setMostrarResultado(true);
        } finally {
            setProcesandoInscripcion(false);
        }
    };

    const renderAcciones = () => {
        if (modoEdicion) return null;

        //Organizador
        const botonOrganizador = (esOrganizador && (torneo.estado === "PLANIFICADO" || torneo.estado === "EN_CURSO")) ? (
            <button
                onClick={() => navigate(torneo.estado === "EN_CURSO" ? `/torneo/${slug}/en-curso` : `/torneo/gestion/${slug}`)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg w-full md:w-auto mb-6"
            >
                ⚙️ Gestionar Torneo
            </button>
        ) : null;

        //Jugador
        let contenidoJugador = null;

        if (cargandoInscripcion) {
            contenidoJugador = <p className="text-gray-400 font-medium">Verificando estado...</p>;
        }
        else if (inscripcionStatus === "CONFIRMADA") {
            contenidoJugador = (
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="bg-green-500/20 text-green-400 p-4 rounded-xl border border-green-500/50 font-bold w-full text-center">✅ Estás inscrito en este torneo</div>
                    
                    {(torneo.estado === "EN_CURSO" || torneo.estado === "FINALIZADO") && (
                        <button onClick={() => navigate(`/torneo/${slug}/en-curso/detalle`)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg">
                            📊 Panel del Torneo
                        </button>
                    )}
                </div>
            );
        }
        else if (inscripcionStatus === "PENDIENTE") {
            contenidoJugador = <div className="bg-yellow-500/20 text-yellow-400 p-4 rounded-xl border border-yellow-500/50 font-bold w-full text-center">⏳ Tu inscripción está pendiente de aprobación</div>;
        }
        else if (inscripcionStatus === "RECHAZADA") {
            contenidoJugador = <div className="bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/50 font-bold w-full text-center">❌ Tu inscripción fue rechazada</div>;
        }
        else {
            //No inscrito
            contenidoJugador = (
                <>
                    {torneo.estado === "PLANIFICADO" ? (
                        <>
                            <div className="mb-6 text-center">
                                <p className="text-gray-400 text-sm uppercase tracking-wide mb-1">Estado de plazas</p>
                                <p className={`text-2xl font-bold ${plazasDisponibles > 0 ? "text-green-400" : "text-red-400"}`}>
                                    {plazasDisponibles > 0 ? `${plazasDisponibles} plazas libres` : "🚫 COMPLETO"}
                                </p>
                            </div>

                            {user ? (
                                plazasDisponibles > 0 ? (
                                    <button
                                        onClick={() => setMostrarConfirmacion(true)}
                                        className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-8 py-3 rounded-xl font-bold transition shadow-lg w-full md:w-auto transform hover:scale-105"
                                    >
                                        Inscribirse al Torneo
                                    </button>
                                ) : (
                                    <div className="font-bold text-orange-400 text-lg px-6 py-3 border border-orange-500/30 rounded-xl bg-orange-500/10">
                                        🚫 Sin plazas disponibles
                                    </div>
                                )
                            ) : (
                                <button onClick={() => navigate("/login", { state: { from: location.pathname } })} className="bg-[var(--color-secondary)] hover:bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-bold transition shadow-lg w-full md:w-auto">
                                    🔒 Iniciar sesión para inscribirte
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="mt-2 p-4 bg-gray-700/30 border border-gray-600 rounded-xl text-gray-300 text-center w-full">
                            <p className="font-bold text-lg mb-1">Inscripciones Cerradas</p>
                            <p className="text-sm opacity-80">El torneo está actualmente {torneo.estado.replace("_", " ").toLowerCase()}.</p>
                        </div>
                    )}
                </>
            );
        }

        return (
            <div className="w-full flex flex-col items-center">
                {botonOrganizador}
                {contenidoJugador}
            </div>
        );
    };

    if (error) return <div className="text-center mt-10 text-red-500 font-bold">{error}</div>;
    if (!torneo) return <div className="text-center mt-10 text-[var(--color-text)]">Cargando...</div>;

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play p-4 md:p-8 flex justify-center">
            <div className="bg-[var(--color-bg-secondary)] shadow-xl rounded-2xl p-6 md:p-10 max-w-3xl w-full">

                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1 text-center">
                        {modoEdicion ? (
                            <input
                                type="text" name="nombre"
                                value={datosEditables.nombre}
                                onChange={handleEditChange}
                                maxLength={100}
                                className="text-3xl font-bold text-center bg-[var(--color-bg)] p-2 rounded border border-gray-600 w-full text-[var(--color-primary)] outline-none focus:border-[var(--color-primary)]"
                            />
                        ) : (
                            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">{torneo.nombre}</h1>
                        )}
                    </div>

                    {esOrganizador && !modoEdicion && torneo.estado === "PLANIFICADO" && (
                        <button
                            onClick={iniciarEdicion}
                            className="ml-4 text-gray-400 hover:text-[var(--color-primary)] transition"
                            title="Editar detalles del torneo"
                        >
                            Editar
                        </button>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8 text-lg">
                    <div>
                        <p className="text-gray-400 text-sm">Organizador</p>
                        <p className="font-semibold">{torneo.nombreOrganizador}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Juego</p>
                        <p className="font-semibold">{torneo.nombreJuego}</p>
                    </div>

                    <div>
                        <p className="text-gray-400 text-sm">Fecha y Hora</p>
                        {modoEdicion ? (
                            <input
                                type="datetime-local" name="fechaHoraInicio"
                                value={(() => {
                                    if (!datosEditables.fechaHoraInicio) return "";
                                    const fechaStr = datosEditables.fechaHoraInicio.endsWith("Z")
                                        ? datosEditables.fechaHoraInicio
                                        : datosEditables.fechaHoraInicio + "Z";

                                    const date = new Date(fechaStr);
                                    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                                    return localDate.toISOString().slice(0, 16);
                                })()} onChange={handleEditChange}
                                min={getMinDateTime()}
                                className="bg-[var(--color-bg)] p-1 rounded w-full border border-gray-600"
                            />
                        ) : (
                            <p className="font-semibold">
                                {new Date(torneo.fechaHoraInicio.endsWith("Z") ? torneo.fechaHoraInicio : torneo.fechaHoraInicio + "Z").toLocaleString()}
                            </p>)}
                    </div>

                    <div>
                        <p className="text-gray-400 text-sm">Lugar</p>
                        {modoEdicion ? (
                            <input
                                type="text" name="lugarCelebracion"
                                value={datosEditables.lugarCelebracion}
                                onChange={handleEditChange}
                                maxLength={150}
                                className="bg-[var(--color-bg)] p-1 rounded w-full border border-gray-600"
                            />
                        ) : (
                            <p className="font-semibold">{torneo.lugarCelebracion}</p>
                        )}
                    </div>

                    <div>
                        <p className="text-gray-400 text-sm">Plazas Totales</p>
                        {modoEdicion ? (
                            <input type="number" name="plazasMax" inputMode="numeric" min="2" value={datosEditables.plazasMax} onChange={handleEditChange} className="bg-[var(--color-bg)] p-1 rounded w-full border border-gray-600" />
                        ) : (
                            <p className="font-semibold">{torneo.plazasMax}</p>
                        )}
                    </div>

                    <div>
                        <p className="text-gray-400 text-sm">Precio Inscripción</p>
                        {modoEdicion ? (
                            <input type="number" name="precioInscripcion" inputMode="decimal" min="0" value={datosEditables.precioInscripcion} onChange={handleEditChange} className="bg-[var(--color-bg)] p-1 rounded w-full border border-gray-600" />
                        ) : (
                            <p className="font-semibold">{torneo.precioInscripcion} €</p>
                        )}
                    </div>
                </div>

                <div className="bg-[var(--color-bg)] p-6 rounded-xl mb-8">
                    <h3 className="text-xl font-bold mb-2">Descripción</h3>
                    {modoEdicion ? (
                        <>
                            <textarea
                                name="descripcion"
                                value={datosEditables.descripcion || ""}
                                onChange={handleEditChange}
                                rows={4}
                                maxLength={2000}
                                className="w-full bg-[var(--color-bg-secondary)] p-2 rounded border border-gray-600"
                            />
                            <p className="text-xs text-right text-gray-500">
                                {(datosEditables.descripcion || "").length}/2000
                            </p>
                        </>
                    ) : (
                        <p className="opacity-90 whitespace-pre-wrap">{torneo.descripcion || "Sin descripción."}</p>
                    )}
                </div>
                <div className="bg-[var(--color-bg)] p-6 rounded-xl mb-8">
                    <h3 className="text-xl font-bold mb-2">Premios</h3>
                    {modoEdicion ? (
                        <>
                            <textarea
                                name="premios"
                                value={datosEditables.premios || ""}
                                onChange={handleEditChange}
                                rows={3}
                                maxLength={2000}
                                className="w-full bg-[var(--color-bg-secondary)] p-2 rounded border border-gray-600"
                            />
                            <p className={`text-xs text-right mt-1 ${(datosEditables.premios || "").length > 1800 ? "text-orange-400" : "text-gray-500"}`}>
                                {(datosEditables.premios || "").length}/2000
                            </p>
                        </>
                    ) : (
                        <p className="opacity-90 whitespace-pre-wrap">{torneo.premios || "Sin premios especificados."}</p>
                    )}
                </div>

                {modoEdicion && (
                    <div className="flex flex-col items-center gap-2 mb-8">
                        {mensajeEdicion && <p className="text-red-400 text-sm">{mensajeEdicion}</p>}
                        <div className="flex gap-4">
                            <button
                                onClick={cancelarEdicion}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-bold transition"
                                disabled={procesandoEdicion}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarEdicion}
                                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold transition flex items-center gap-2"
                                disabled={procesandoEdicion}
                            >
                                {procesandoEdicion ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </div>
                )}

                {!modoEdicion && (
                    <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-gray-700">
                        {renderAcciones()}
                    </div>
                )}

                {mostrarConfirmacion && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                            <h3 className="text-xl font-bold mb-4">Confirmar Inscripción</h3>
                            <p className="mb-6 opacity-80">¿Confirmas tu inscripción en <strong>{torneo.nombre}</strong>?</p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => setMostrarConfirmacion(false)} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 text-white">Cancelar</button>
                                <button onClick={handleInscripcion} className="px-4 py-2 bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-secondary)] text-white font-bold">Confirmar</button>
                            </div>
                        </div>
                    </div>
                )}

                {mostrarResultado && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                            <div className={`text-5xl mb-4 ${tipoResultado === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                {tipoResultado === 'success' ? '✔️' : '⚠️'}
                            </div>
                            <p className="font-bold text-lg mb-6">{mensajeResultado}</p>
                            <button onClick={() => setMostrarResultado(false)} className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg font-bold">Cerrar</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}