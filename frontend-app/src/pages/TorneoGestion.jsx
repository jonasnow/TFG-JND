import { useEffect, useState, Children } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { TickIcon, CruzIcon, UndoIcon } from "../components/icons/Icons";
import { useAuth } from "../context/AuthContext";

export default function TorneoGestion() {
    const { slug } = useParams();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const id = slug ? Number(slug.split("-").pop()) : null;

    const [torneo, setTorneo] = useState(null);
    const [inscritos, setInscritos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [procesandoInicio, setProcesandoInicio] = useState(false);
    const [errorInicio, setErrorInicio] = useState(null);

    const [abierto, setAbierto] = useState({
        inscripcion: true,
        asistencia: true,
        rechazados: false,
        participantes: true,
    });

    //FILTROS
    const solicitudesInscripcion = inscritos.filter(
        (i) => i.confirmacionInscripcion === "PENDIENTE"
    );

    const gestionAsistencia = inscritos.filter(
        (i) =>
            i.confirmacionInscripcion === "CONFIRMADA" &&
            i.confirmacionAsistencia === "PENDIENTE"
    );

    const participantes = inscritos.filter(
        (i) =>
            i.confirmacionInscripcion === "CONFIRMADA" &&
            i.confirmacionAsistencia === "CONFIRMADA"
    );

    const rechazados = inscritos.filter(
        (i) =>
            i.confirmacionInscripcion === "RECHAZADA" ||
            i.confirmacionAsistencia === "RECHAZADA"
    );

    //COMPONENTES UI
    const IconButton = ({ onClick, icon: IconComponent, title }) => (
        <button
            onClick={onClick}
            title={title}
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
        >
            <IconComponent />
        </button>
    );


    const HelpIcon = ({ text }) => (
        <span
            title={text}
            className="ml-2 cursor-help text-gray-400 hover:text-gray-600"
        >
            ℹ️
        </span>
    );

    const Seccion = ({ titulo, ayuda, abierta, onToggle, children }) => (
        <div className="border rounded-xl mb-4">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center px-4 py-3 font-bold bg-[var(--color-bg-secondary)]"
            >
                <span>{titulo}</span>
                {ayuda && <HelpIcon text={ayuda} />}
            </button>

            {abierta && (
                <div className="p-4 max-h-72 overflow-y-auto">
                    {children || (
                        <p className="text-sm text-gray-500">
                            No hay elementos
                        </p>
                    )}
                </div>
            )}
        </div>
    );
    //Validar gestor
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login", { replace: true, state: { from: location.pathname } });
        }
    }, [user, authLoading, navigate]);


    const toggle = (key) =>
        setAbierto((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));

    //CARGA INICIAL
    useEffect(() => {
        if (!id) {
            return (
                <p className="text-center mt-6 text-red-500">
                    ID de torneo inválido
                </p>
            );
        }
        const fetchData = async () => {
            try {
                const resTorneo = await fetch(
                    `http://localhost:8000/torneo/${id}`
                );
                const torneoData = await resTorneo.json();
                setTorneo(torneoData);

                const resInscritos = await fetch(
                    `http://localhost:8000/inscritos_torneo/${id}`
                );
                const inscritosData = await resInscritos.json();
                setInscritos(inscritosData);
            } catch {
                setError("Error cargando los datos del torneo");
            } finally {
                setCargando(false);
            }
        };

        fetchData();
    }, [id]);

    const esOrganizador =
        user && torneo && user.idUsuario === torneo.idOrganizador;
    useEffect(() => {
        if (!cargando && user && torneo && !esOrganizador) {
            navigate(`/torneo/${slug}`);
        }
    }, [cargando, user, torneo, esOrganizador, navigate, slug]);

    if (cargando) {
        return <p className="text-center mt-6">Cargando gestión del torneo...</p>;
    }

    if (error) {
        return (
            <p className="text-center mt-6 text-red-500">
                {error}
            </p>
        );
    }

    if (!esOrganizador) return null;

    //ACCIONES
    const postAccion = async (url, idEquipo) => {
        const resAccion = await fetch(`http://localhost:8000/${url}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                idEquipo,
                idTorneo: id,
            }),
        });

        if (!resAccion.ok) {
            alert("Error realizando la acción");
            return;
        }

        const res = await fetch(
            `http://localhost:8000/inscritos_torneo/${id}`
        );
        const data = await res.json();
        setInscritos(data);
    };

    const confirmarInscripcion = (idEquipo) =>
        postAccion("confirmar_inscripcion", idEquipo);
    const rechazarInscripcion = (idEquipo) =>
        postAccion("rechazar_inscripcion", idEquipo);
    const confirmarAsistencia = (idEquipo) =>
        postAccion("confirmar_asistencia", idEquipo);
    const rechazarAsistencia = (idEquipo) =>
        postAccion("rechazar_asistencia", idEquipo);
    const aceptarInscripcion = (idEquipo) =>
        postAccion("aceptar_inscripcion", idEquipo);
    const deshacerAsistencia = (idEquipo) =>
        postAccion("deshacer_asistencia", idEquipo);

    //COMENZAR TORNEO


    const inicioValido = participantes.length > 0;


    const iniciarTorneo = async () => {
        setProcesandoInicio(true);
        setErrorInicio(null);

        try {
            const resValidacion = await fetch(
                `http://localhost:8000/validacion_inicial_torneo/${id}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            const validacion = await resValidacion.json();

            if (!validacion.ok) {
                setErrorInicio(
                    validacion.motivo || "Error al validar el torneo"
                );
                setProcesandoInicio(false);
                return;
            }

            const resComenzar = await fetch(
                `http://localhost:8000/comenzar_torneo/${id}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            const comenzarData = await resComenzar.json();

            if (!resComenzar.ok || comenzarData.error) {
                setErrorInicio(
                    comenzarData.error || "Error al iniciar el torneo"
                );
                setProcesandoInicio(false);
                return;
            }

            navigate(`/torneo/${slug}/en-curso`);
        } catch (e) {
            setErrorInicio("Error de conexión con el servidor");
        } finally {
            setProcesandoInicio(false);
            setMostrarConfirmacion(false);
        }
    };


    //RENDERS
    const renderGestionInscripcion = (eq) => (
        <div className="border rounded-lg p-3 mb-3 flex justify-between items-center">
            <p className="font-semibold">{eq.nombreEquipo}</p>

            <div className="flex gap-4">
                <IconButton onClick={() => confirmarInscripcion(eq.idEquipo)} icon={TickIcon} title="Confirmar inscripción" />
                <IconButton onClick={() => rechazarInscripcion(eq.idEquipo)} icon={CruzIcon} title="Rechazar inscripción" />
            </div>
        </div>

    );

    const renderGestionAsistencia = (eq) => (
        <div className="border rounded-lg p-3 mb-3 flex justify-between items-center">
            <p className="font-semibold">{eq.nombreEquipo}</p>
            <div className="flex gap-4">
                <IconButton onClick={() => confirmarAsistencia(eq.idEquipo)} icon={TickIcon} title="Confirmar asistencia" />
                <IconButton onClick={() => rechazarAsistencia(eq.idEquipo)} icon={CruzIcon} title="Rechazar asistencia" />
            </div>
        </div>

    );

    const renderRechazado = (eq) => (

        <div className="border rounded-lg p-3 mb-3 flex justify-between items-center">
            <div>
                <p className="font-semibold">{eq.nombreEquipo}</p>
                <div className="flex gap-4">
                    <p className="text-red-600 font-bold">✖ Rechazado</p>
                    <IconButton onClick={() => aceptarInscripcion(eq.idEquipo)} icon={TickIcon} title="Aceptar inscripción" />
                </div>
            </div>
        </div>
    );

    const renderParticipante = (eq) => (
        <div key={eq.idEquipo} className="border rounded-lg p-3 mb-3 flex justify-between items-center">
            <p className="font-semibold">{eq.nombreEquipo}</p>
            <div className="flex items-center gap-4">
                <span className="text-green-600 font-bold">✔ Inscrito</span>
                <IconButton
                    onClick={() => deshacerAsistencia(eq.idEquipo)}
                    icon={UndoIcon}
                    title="Deshacer asistencia"
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] p-8 flex justify-center">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg p-8 max-w-3xl w-full">
                <h1 className="text-3xl font-bold mb-4">{torneo.nombre}</h1>

                <p><strong>Lugar:</strong> {torneo.lugarCelebracion}</p>
                <p><strong>Inicio:</strong> {new Date(torneo.fechaHoraInicio).toLocaleString()}</p>
                <p><strong>Juego:</strong> {torneo.nombreJuego}</p>
                <p><strong>Inscritos:</strong> {inscritos.length}</p>

                <h2 className="text-2xl font-semibold mt-6 mb-4">
                    Gestión de participantes
                </h2>

                <Seccion
                    titulo={`Solicitudes de inscripción (${solicitudesInscripcion.length})`}
                    ayuda="Equipos pendientes de aprobar o rechazar su inscripción."
                    abierta={abierto.inscripcion}
                    onToggle={() => toggle("inscripcion")}
                >
                    {solicitudesInscripcion.map(renderGestionInscripcion)}
                </Seccion>

                <Seccion
                    titulo={`Gestión de asistencia (${gestionAsistencia.length})`}
                    ayuda="Equipos aceptados que deben confirmar su asistencia."
                    abierta={abierto.asistencia}
                    onToggle={() => toggle("asistencia")}
                >
                    {gestionAsistencia.map(renderGestionAsistencia)}
                </Seccion>

                <Seccion
                    titulo={`Rechazadas (${rechazados.length})`}
                    ayuda="Equipos rechazados que pueden volver a aceptarse."
                    abierta={abierto.rechazados}
                    onToggle={() => toggle("rechazados")}
                >
                    {rechazados.map(renderRechazado)}
                </Seccion>

                <Seccion
                    titulo={`Participantes (${participantes.length})`}
                    ayuda="Equipos que participarán en el torneo."
                    abierta={abierto.participantes}
                    onToggle={() => toggle("participantes")}
                >
                    {participantes.map(renderParticipante)}

                    {participantes.length > 0 &&
                        inicioValido && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => setMostrarConfirmacion(true)}
                                    className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl"
                                >
                                    Comenzar torneo
                                </button>
                            </div>
                        )}
                    {mostrarConfirmacion && (
                        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                            <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg p-6 w-96">
                                <h2 className="text-xl font-semibold mb-4 text-center">
                                    Iniciar torneo
                                </h2>
                                <p className="text-center mb-4">
                                    Se va a poner en marcha el torneo <strong>{torneo.nombre}</strong>.
                                    <br />
                                    ¿Estás seguro?
                                </p>

                                {errorInicio && (
                                    <p className="text-red-500 text-sm text-center mb-3">
                                        {errorInicio}
                                    </p>
                                )}

                                <div className="flex justify-center space-x-4">
                                    <button
                                        onClick={iniciarTorneo}
                                        className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg"
                                    >
                                        Confirmar
                                    </button>
                                    <button
                                        onClick={() => setMostrarConfirmacion(false)}
                                        className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                                    >
                                        Atrás
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {procesandoInicio && (
                        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                            <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg p-6 w-72 text-center">
                                <div className="animate-pulse text-4xl mb-3">⏳</div>
                                <p>Validando y comenzando el torneo…</p>
                            </div>
                        </div>
                    )}


                </Seccion>
            </div>
        </div>
    );
}
