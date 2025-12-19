import { useEffect, useState, Children } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TickIcon, CruzIcon, UndoIcon } from "../components/icons/Icons";

export default function TorneoGestion() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const id = slug ? Number(slug.split("-").pop()) : null;

    const [torneo, setTorneo] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [inscritos, setInscritos] = useState([]);
    const [numInscritos, setNumInscritos] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
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
                    {Children.count(children) > 0 ? (
                        children
                    ) : (
                        <p className="text-sm text-gray-500">
                            No hay elementos
                        </p>
                    )}
                </div>
            )}
        </div>
    );
    
    //VALIDACIÓN ID
    useEffect(() => {
        if (!id) {
            setError("ID de torneo inválido");
            setCargando(false);
        }
    }, [id]);

    const toggle = (key) =>
        setAbierto((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));

    //CARGA INICIAL
    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const resUser = await fetch("http://localhost:8000/me", {
                    credentials: "include",
                });
                const userData = await resUser.json();
                setUsuario(userData);

                const resTorneo = await fetch(
                    `http://localhost:8000/torneo/${id}`
                );
                const torneoData = await resTorneo.json();
                setTorneo(torneoData);

                const resNum = await fetch(
                    `http://localhost:8000/numero_inscritos/${id}`
                );
                const numData = await resNum.json();
                setNumInscritos(numData.total);

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
        usuario && torneo && usuario.idUsuario === torneo.idOrganizador;

    useEffect(() => {
        if (!cargando && usuario && torneo && !esOrganizador) {
            navigate(`/torneo/${slug}`);
        }
    }, [cargando, usuario, torneo, esOrganizador, navigate, slug]);

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
    const todasAsistenciasConfirmadas =
        participantes.length > 0 &&
        participantes.every(
            (i) => i.confirmacionAsistencia === "CONFIRMADA"
        );

    const comenzarTorneo = async () => {
        await fetch("http://localhost:8000/comenzar_torneo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ idTorneo: id }),
        });

        navigate(`/torneo/${slug}/en-curso`);
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
                <p><strong>Inscritos:</strong> {numInscritos}</p>

                <h2 className="text-2xl font-semibold mt-6 mb-4">
                    Gestión de participantes
                </h2>

                <Seccion
                    titulo={`📥 Solicitudes de inscripción (${solicitudesInscripcion.length})`}
                    ayuda="Equipos pendientes de aprobar o rechazar su inscripción."
                    abierta={abierto.inscripcion}
                    onToggle={() => toggle("inscripcion")}
                >
                    {solicitudesInscripcion.map(renderGestionInscripcion)}
                </Seccion>

                <Seccion
                    titulo={`📝 Gestión de asistencia (${gestionAsistencia.length})`}
                    ayuda="Equipos aceptados que deben confirmar su asistencia."
                    abierta={abierto.asistencia}
                    onToggle={() => toggle("asistencia")}
                >
                    {gestionAsistencia.map(renderGestionAsistencia)}
                </Seccion>

                <Seccion
                    titulo={`❌ Rechazadas (${rechazados.length})`}
                    ayuda="Equipos rechazados que pueden volver a aceptarse."
                    abierta={abierto.rechazados}
                    onToggle={() => toggle("rechazados")}
                >
                    {rechazados.map(renderRechazado)}
                </Seccion>

                <Seccion
                    titulo={`🏆 Participantes (${participantes.length})`}
                    ayuda="Equipos que participarán en el torneo."
                    abierta={abierto.participantes}
                    onToggle={() => toggle("participantes")}
                >
                    {participantes.map(renderParticipante)}

                    {participantes.length > 0 &&
                        todasAsistenciasConfirmadas && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={comenzarTorneo}
                                    className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl"
                                >
                                    🚀 Comenzar torneo
                                </button>
                            </div>
                        )}
                </Seccion>
            </div>
        </div>
    );
}
