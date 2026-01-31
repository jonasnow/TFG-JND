import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { TickIcon, CruzIcon, UndoIcon } from "../components/icons/Icons"; 
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/auth";

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
  
  const [notificacion, setNotificacion] = useState(null);

  //Control de menú lateral
  const [abierto, setAbierto] = useState({
    inscripcion: true,
    asistencia: true,
    rechazados: false,
    participantes: true,
  });

  const solicitudesInscripcion = inscritos.filter(i => i.confirmacionInscripcion === "PENDIENTE");
  const gestionAsistencia = inscritos.filter(i => i.confirmacionInscripcion === "CONFIRMADA" && i.confirmacionAsistencia === "PENDIENTE");
  const participantes = inscritos.filter(i => i.confirmacionInscripcion === "CONFIRMADA" && i.confirmacionAsistencia === "CONFIRMADA");
  const rechazados = inscritos.filter(i => i.confirmacionInscripcion === "RECHAZADA" || i.confirmacionAsistencia === "RECHAZADA");

  const IconButton = ({ onClick, icon: IconComponent, title, colorClass = "text-gray-600 hover:text-gray-900" }) => (
    <button onClick={onClick} title={title} className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-colors ${colorClass}`}>
      <IconComponent />
    </button>
  );

  const Seccion = ({ titulo, ayuda, idSeccion, children }) => (
    <div className="border border-gray-700 rounded-xl mb-4 overflow-hidden">
      <button onClick={() => setAbierto(prev => ({ ...prev, [idSeccion]: !prev[idSeccion] }))} className="w-full flex justify-between items-center px-4 py-3 font-bold bg-[var(--color-bg-secondary)] hover:bg-gray-700 transition">
        <span className="flex items-center gap-2">{abierto[idSeccion] ? "▼" : "▶"} {titulo}</span>
        {ayuda && <span title={ayuda} className="text-gray-400 cursor-help ml-2">ℹ️</span>}
      </button>
      {abierto[idSeccion] && <div className="p-4 bg-[var(--color-bg)] max-h-96 overflow-y-auto">{children && children.length > 0 ? children : <p className="text-sm text-gray-500 italic">No hay elementos.</p>}</div>}
    </div>
  );

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true, state: { from: location.pathname } });
  }, [user, authLoading, navigate, location]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [resTorneo, resInscritos] = await Promise.all([
            fetch(`${API_URL}/torneo/${id}`),
            fetch(`${API_URL}/inscritos_torneo/${id}`, { credentials: "include" })
        ]);

        if (resTorneo.ok && resInscritos.ok) {
            const dataTorneo = await resTorneo.json();
            
            //Redirigir si ya empezó
            if (dataTorneo.estado === "EN_CURSO") {
                navigate(`/torneo/${slug}/en-curso`, { replace: true });
                return;
            }
            if (dataTorneo.estado === "FINALIZADO") {
                navigate(`/torneo/${slug}`, { replace: true });
                return;
            }

            setTorneo(dataTorneo);
            setInscritos(await resInscritos.json());
        } else {
            setError("No se pudo cargar la información.");
        }
      } catch {
        setError("Error de conexión cargando datos.");
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, [id, slug, navigate]);

  const esOrganizador = user && torneo && user.idUsuario === torneo.idOrganizador;
  useEffect(() => {
    if (!cargando && user && torneo && !esOrganizador) navigate(`/torneo/${slug}`);
  }, [cargando, user, torneo, esOrganizador, navigate, slug]);

  const postAccion = async (endpoint, idEquipo) => {
    try {
        const res = await fetch(`${API_URL}/${endpoint}`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ idEquipo, idTorneo: id }),
        });
        if (!res.ok) throw new Error("Error acción");
        const resInscritos = await fetch(`${API_URL}/inscritos_torneo/${id}`, { credentials: "include" });
        setInscritos(await resInscritos.json());
    } catch (err) { 
        setNotificacion({ mensaje: "Error al procesar la solicitud", tipo: "error" });
    }
  };

  const iniciarTorneo = async () => {
    setProcesandoInicio(true);
    setNotificacion(null);

    try {
      //1. Validar
      const resValidacion = await fetch(`${API_URL}/rondas/validacion_inicial_torneo/${id}`, { 
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" 
      });
      const validacion = await resValidacion.json();

      if (!resValidacion.ok || !validacion.ok) {
        throw new Error(validacion.motivo || "El torneo no cumple los requisitos.");
      }

      //2. Comenzar
      const resComenzar = await fetch(`${API_URL}/rondas/comenzar_torneo/${id}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include"
      });
      
      const comenzarData = await resComenzar.json();
      
      if (!resComenzar.ok) throw new Error(comenzarData.detail || comenzarData.error || "Error al iniciar.");

      //3. Éxito -> Redirigir
      navigate(`/torneo/${slug}/en-curso`);

    } catch (e) {
      setMostrarConfirmacion(false);
      setNotificacion({
          mensaje: `No se pudo iniciar: ${e.message}`, 
          tipo: "error" 
      });
    } finally {
      setProcesandoInicio(false);
    }
  };

  if (cargando) return <div className="flex justify-center mt-20">Cargando...</div>;
  if (error) return <p className="text-center mt-6 text-red-500 font-bold">{error}</p>;
  if (!esOrganizador || (torneo && torneo.estado !== "PLANIFICADO")) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] p-4 md:p-8 flex justify-center font-play relative">
      
      {notificacion && (
        <div className={`fixed top-20 right-4 md:right-10 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-right duration-300 max-w-sm ${
            notificacion.tipo === 'error' 
            ? 'bg-red-500/10 border-red-500 text-red-400' 
            : 'bg-green-500/10 border-green-500 text-green-400'
        }`}>
            <span className="text-2xl">{notificacion.tipo === 'error' ? '⚠️' : '✅'}</span>
            <p className="text-sm font-semibold">{notificacion.mensaje}</p>
            <button 
                onClick={() => setNotificacion(null)} 
                className="ml-auto text-xl hover:opacity-70"
            >
                &times;
            </button>
        </div>
      )}

      <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg p-6 md:p-8 max-w-4xl w-full">
        
        <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-4">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-primary)]">{torneo.nombre}</h1>
                <p className="text-sm text-gray-400 mt-1">Panel de Gestión</p>
            </div>
            <button onClick={() => navigate(`/torneo/${slug}`)} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-white transition">
                Ver vista pública
            </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm bg-[var(--color-bg)] p-4 rounded-xl">
            <div><p className="text-gray-500">Lugar</p><p className="font-semibold">{torneo.lugarCelebracion}</p></div>
            <div><p className="text-gray-500">Inicio</p><p className="font-semibold">{new Date(torneo.fechaHoraInicio).toLocaleDateString()}</p></div>
            <div><p className="text-gray-500">Juego</p><p className="font-semibold">{torneo.nombreJuego}</p></div>
            <div><p className="text-gray-500">Inscritos</p><p className="font-semibold">{inscritos.length} / {torneo.plazasMax}</p></div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Participantes</h2>

        {/*Pendientes*/}
        <Seccion titulo={`Solicitudes (${solicitudesInscripcion.length})`} ayuda="Acepta o rechaza." idSeccion="inscripcion">
            {solicitudesInscripcion.map(eq => (
                <div key={eq.idEquipo} className="border border-gray-700 rounded-lg p-3 mb-2 flex justify-between items-center bg-[var(--color-bg-secondary)]">
                    <p className="font-semibold">{eq.nombreEquipo}</p>
                    <div className="flex gap-2">
                        <IconButton onClick={() => postAccion("confirmar_inscripcion", eq.idEquipo)} icon={TickIcon} title="Aceptar" colorClass="text-green-500 hover:text-green-400 bg-green-500/10 rounded" />
                        <IconButton onClick={() => postAccion("rechazar_inscripcion", eq.idEquipo)} icon={CruzIcon} title="Rechazar" colorClass="text-red-500 hover:text-red-400 bg-red-500/10 rounded" />
                    </div>
                </div>
            ))}
        </Seccion>
        {/*Gestión Asistencia*/}
        <Seccion titulo={`Asistencia (${gestionAsistencia.length})`} ayuda="Confirma presencia." idSeccion="asistencia">
            {gestionAsistencia.map(eq => (
                <div key={eq.idEquipo} className="border border-gray-700 rounded-lg p-3 mb-2 flex justify-between items-center bg-[var(--color-bg-secondary)]">
                    <p className="font-semibold">{eq.nombreEquipo}</p>
                    <div className="flex gap-2">
                        <IconButton onClick={() => postAccion("confirmar_asistencia", eq.idEquipo)} icon={TickIcon} title="Confirmar" colorClass="text-blue-500 hover:text-blue-400 bg-blue-500/10 rounded" />
                        <IconButton onClick={() => postAccion("rechazar_asistencia", eq.idEquipo)} icon={CruzIcon} title="No asistió" colorClass="text-red-500 hover:text-red-400 bg-red-500/10 rounded" />
                    </div>
                </div>
            ))}
        </Seccion>
        {/*Rechazados*/}
        <Seccion titulo={`Rechazados (${rechazados.length})`} idSeccion="rechazados">
            {rechazados.map(eq => (
                <div key={eq.idEquipo} className="border border-gray-700 rounded-lg p-3 mb-2 flex justify-between items-center opacity-70">
                    <p className="font-semibold text-gray-400">{eq.nombreEquipo}</p>
                    <div className="flex items-center gap-3">
                        <span className="text-red-500 text-xs font-bold uppercase border border-red-500 px-2 py-0.5 rounded">Rechazado</span>
                        <IconButton onClick={() => postAccion("aceptar_inscripcion", eq.idEquipo)} icon={UndoIcon} title="Readmitir" colorClass="text-gray-400 hover:text-white" />
                    </div>
                </div>
            ))}
        </Seccion>

        {/*Partipantes*/}
        <Seccion titulo={`Participantes (${participantes.length})`} ayuda="Listos para jugar." idSeccion="participantes">
            {participantes.map(eq => (
                <div key={eq.idEquipo} className="border border-green-500/30 rounded-lg p-3 mb-2 flex justify-between items-center bg-green-500/5">
                    <p className="font-semibold text-green-400">{eq.nombreEquipo}</p>
                    <div className="flex items-center gap-3">
                        <span className="text-green-500 text-xs font-bold uppercase">Listo</span>
                        <IconButton onClick={() => postAccion("deshacer_asistencia", eq.idEquipo)} icon={UndoIcon} title="Deshacer" colorClass="text-gray-400 hover:text-white" />
                    </div>
                </div>
            ))}

            {participantes.length > 1 && (
                <div className="mt-6 pt-4 border-t border-gray-700 flex justify-center">
                    <button 
                        onClick={() => { setNotificacion(null); setMostrarConfirmacion(true); }} 
                        className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-8 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition flex items-center gap-2"
                    >
                        🚀 Comenzar Torneo
                    </button>
                </div>
            )}
        </Seccion>

        {mostrarConfirmacion && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-700">
                    <h2 className="text-xl font-bold mb-4 text-[var(--color-primary)]">¿Iniciar Torneo?</h2>
                    
                    <p className="mb-6 opacity-80 text-sm">
                        Se generarán los enfrentamientos para <strong>{participantes.length} participantes</strong>. 
                        <br/><br/>
                        <span className="text-yellow-500">No se podrán añadir más participantes ni editar datos una vez iniciado.</span>
                    </p>

                    <div className="flex justify-center gap-4">
                        <button onClick={() => setMostrarConfirmacion(false)} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 text-white transition">
                            Cancelar
                        </button>
                        
                        <button 
                            onClick={iniciarTorneo} 
                            disabled={procesandoInicio}
                            className="px-4 py-2 bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-secondary)] text-white font-bold transition flex items-center gap-2"
                        >
                            {procesandoInicio ? "Iniciando..." : "Confirmar Inicio"}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}