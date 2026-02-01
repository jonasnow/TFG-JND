import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/auth";
import SidebarTorneo from "../components/SidebarTorneo"; 

export default function VistaTorneoEnCurso() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const idTorneo = slug ? Number(slug.split("-").pop()) : null;

  // Estados de datos
  const [torneoInfo, setTorneoInfo] = useState(null);
  const [rondaActual, setRondaActual] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [historicoRonda, setHistoricoRonda] = useState(null);

  // Estados de UI
  const [activeTab, setActiveTab] = useState("partidas");
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [numRondaHist, setNumRondaHist] = useState(1);

  useEffect(() => {
    if (!user && !authLoading) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!idTorneo || !user) return;

    const inicializar = async () => {
      setCargando(true);
      setError(null);
      try {
        //A. Info del Torneo
        const resTorneo = await fetch(`${API_URL}/torneo/${idTorneo}`);
        if (!resTorneo.ok) throw new Error("Error al cargar torneo");
        const info = await resTorneo.json();
        setTorneoInfo(info);

        //B. Cargar la última ronda
        const resRonda = await fetch(`${API_URL}/rondas/${idTorneo}/ronda-actual`, { credentials: "include" });
        const dataRonda = await resRonda.json();
        
        if (!dataRonda.error) {
            setRondaActual(dataRonda);
        } else {
            if (info.estado !== "FINALIZADO") setError(dataRonda.error);
        }

        //C. Decidir qué pestaña mostrar
        if (info.estado === "FINALIZADO") {
          setActiveTab("clasificacion");
          await fetchRanking();
        } 

      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    };

    inicializar();
  }, [idTorneo, user]);

  //3. Cargas bajo demanda
  const fetchRanking = async () => {
    try {
      const res = await fetch(`${API_URL}/rondas/${idTorneo}/clasificacion`, { credentials: "include" });
      if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setRanking(data); 
          else if (data.ranking) setRanking(data.ranking);
      }
    } catch (e) { console.error(e); }
  };

  const fetchHistorico = async (num) => {
    try {
      const res = await fetch(`${API_URL}/rondas/${idTorneo}/ronda/${num}`, { credentials: "include" });
      if (res.ok) setHistoricoRonda(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeTab === "clasificacion" && ranking.length === 0) fetchRanking();
    
    if (activeTab === "historico" && !historicoRonda && rondaActual) {
        const ultimaRonda = rondaActual.numeroRonda;
        const rInicial = torneoInfo?.estado === "FINALIZADO" ? ultimaRonda : Math.max(1, ultimaRonda - 1);
        
        setNumRondaHist(rInicial);
        fetchHistorico(rInicial);
    }
  }, [activeTab, rondaActual, idTorneo, torneoInfo]);


  if (authLoading || cargando) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div></div>;
  if (error) return <div className="text-center mt-10 text-red-500 font-bold">{error}</div>;
  if (!torneoInfo) return null;

  const mesasNormales = rondaActual?.mesas?.filter(m => m.jugadores.length > 1) || [];
  const mesasBye = rondaActual?.mesas?.filter(m => m.jugadores.length === 1) || [];

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play">
      
      <SidebarTorneo
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        abierto={sidebarAbierto}
        setAbierto={setSidebarAbierto}
        rondaActual={rondaActual?.numeroRonda || 0} 
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        
        {!sidebarAbierto && (
          <button
            onClick={() => setSidebarAbierto(true)}
            className="md:hidden fixed top-20 left-4 z-30 bg-[var(--color-bg-secondary)] p-2 rounded-full shadow-lg border border-gray-600 text-xl"
          >
            ☰
          </button>
        )}

        <div className="max-w-5xl mx-auto pb-20">
            <div className="mb-8 border-b border-gray-700 pb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)] mb-2">
                    {torneoInfo.nombre}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${torneoInfo.estado === "EN_CURSO" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                        {torneoInfo.estado.replace("_", " ")}
                    </span>
                    <span>• {torneoInfo.nombreJuego}</span>
                </div>
            </div>

            {activeTab === "partidas" && rondaActual && (
                <div className="animate-in fade-in duration-300">
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-2xl font-bold">Ronda {rondaActual.numeroRonda}</h2>
                        <button onClick={() => window.location.reload()} className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
                            🔄 Actualizar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {mesasNormales.map((mesa) => {
                            const mesaJugadorActivo = mesa.jugadores.some(j => j.idUsuario == user.idUsuario);
                            return (
                                <div
                                    key={mesa.idEnfrentamiento}
                                    className={`
                                        relative rounded-2xl p-6 transition-all duration-300 flex flex-col h-full
                                        ${mesaJugadorActivo 
                                            ? "bg-[var(--color-bg-secondary)] border-2 border-[var(--color-primary)] z-10 transform scale-[1.02]" 
                                            : "bg-[var(--color-bg-secondary)] border border-gray-700/50 hover:border-gray-600 shadow-md"
                                        }
                                    `}
                                >
                                    {mesaJugadorActivo && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[var(--color-primary)] text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-wide border-2 border-[var(--color-bg)]">
                                            Tu Partida
                                        </div>
                                    )}

                                    <h3 className={`text-center text-xs uppercase tracking-widest mb-4 border-b pb-2 ${mesaJugadorActivo ? "text-[var(--color-primary)] font-bold border-[var(--color-primary)]/30" : "text-gray-500 border-gray-700/50"}`}>
                                        {mesaJugadorActivo ? <span className="flex items-center justify-center gap-2 text-sm">⚔️ {mesa.mesa} ⚔️</span> : mesa.mesa}
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-center">
                                        {mesa.jugadores.map((jugador) => {
                                            const jugadorActivo = jugador.idUsuario == user.idUsuario;
                                            return (
                                                <div 
                                                    key={jugador.idEquipo} 
                                                    className={`
                                                        flex items-center gap-3 p-3 rounded-xl border transition-colors
                                                        ${jugadorActivo 
                                                            ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/50" 
                                                            : "bg-[var(--color-bg)] border-gray-700/50"
                                                        }
                                                    `}
                                                >
                                                    <div className={`
                                                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                                        ${jugadorActivo ? "bg-[var(--color-primary)] text-white shadow-sm" : "bg-gray-700 text-gray-300"}
                                                    `}>
                                                        {jugador.nombre.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`font-semibold truncate ${jugadorActivo ? "text-[var(--color-primary)] text-lg" : "text-gray-200"}`}>
                                                            {jugador.nombre}
                                                        </p>
                                                        {jugadorActivo && <p className="text-[10px] uppercase font-bold opacity-70 tracking-wider text-[var(--color-primary)]">Tú</p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {mesasBye.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-gray-700">
                            <h3 className="text-gray-400 text-sm uppercase tracking-widest font-semibold mb-4 text-center">Descansos (Bye)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {mesasBye.map((mesa) => {
                                    const byeJugadorActivo = mesa.jugadores.some(j => j.idUsuario == user.idUsuario);
                                    return (
                                        <div key={mesa.idEnfrentamiento} className={`p-4 rounded-xl text-center border ${byeJugadorActivo ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-gray-700 border-dashed bg-gray-800/20"}`}>
                                            <p className={`font-medium ${byeJugadorActivo ? "text-[var(--color-primary)] font-bold" : "text-gray-300"}`}>{mesa.jugadores[0].nombre}</p>
                                            <p className="text-xs text-gray-500 mt-1">Pasa automáticamente</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "clasificacion" && (
                <div className="animate-in fade-in duration-300">
                    <h2 className="text-2xl font-bold mb-6">Tabla de Clasificación</h2>
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden shadow-lg border border-gray-700">
                        <table className="w-full text-left">
                            <thead className="bg-gray-800 text-gray-400 uppercase text-sm">
                                <tr><th className="p-4 text-center">Pos</th><th className="p-4">Jugador</th><th className="p-4 text-right">Puntos</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {ranking.map((row, index) => (
                                    <tr key={index} className={`hover:bg-white/5 transition ${row.nombre.includes(user.usuario) ? "bg-[var(--color-primary)]/10" : ""}`}>
                                        <td className="p-4 text-center font-bold text-[var(--color-primary)]">
                                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                                        </td>
                                        <td className="p-4 font-medium">
                                            {row.nombre}
                                            {row.nombre.includes(user.usuario) && <span className="text-xs ml-2 text-[var(--color-primary)] font-bold">(Tú)</span>}
                                        </td>
                                        <td className="p-4 text-right font-bold text-lg">{row.puntosAcumulados ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {ranking.length === 0 && <p className="p-8 text-center text-gray-500">Aún no hay resultados registrados.</p>}
                    </div>
                </div>
            )}

            {activeTab === "historico" && (
                <div className="animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
                        <h2 className="text-2xl font-bold">Historial de Rondas</h2>
                        {rondaActual ? (
                            <select
                                value={numRondaHist}
                                onChange={(e) => { setNumRondaHist(e.target.value); fetchHistorico(e.target.value); }}
                                className="bg-[var(--color-bg-secondary)] border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            >
                                {Array.from({ length: rondaActual.numeroRonda }, (_, i) => i + 1).map(n => (
                                    <option key={n} value={n}>Ronda {n}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="text-sm text-gray-500 bg-gray-800 px-3 py-1 rounded-full">Aún no hay historial disponible</span>
                        )}
                    </div>

                    {historicoRonda ? (
                        <div className="grid gap-4">
                            {historicoRonda.mesas.map(m => (
                                <div key={m.idEnfrentamiento} className="bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-gray-700">
                                    <h4 className="text-center font-bold mb-3 text-gray-400 text-sm uppercase tracking-wider">{m.mesa}</h4>
                                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                                        {m.marcador && m.marcador.puntos ? (
                                            Object.entries(m.marcador.puntos).map(([idEq, pts]) => {
                                                const nombre = m.jugadores.find(j => j.idEquipo == idEq)?.nombre || "Equipo";
                                                const soyYo = m.jugadores.find(j => j.idEquipo == idEq && j.nombre.includes(user.usuario)); 
                                                return (
                                                    <div key={idEq} className={`flex items-center gap-2 ${soyYo ? "text-[var(--color-primary)] font-bold" : "text-gray-300"}`}>
                                                        <span>{nombre}</span>
                                                        <span className="bg-gray-700 px-2 py-0.5 rounded text-white font-mono">{pts}</span>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <span className="text-gray-500 italic">Resultados no registrados</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        rondaActual && <p className="text-center mt-10 text-gray-500">Cargando datos de la ronda {numRondaHist}...</p>
                    )}
                </div>
            )}

            {activeTab === "detalles" && torneoInfo && (
                <div className="animate-in fade-in duration-300 bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-gray-700">
                    <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">Información Técnica</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                        <div>
                            <span className="text-gray-500 text-sm block mb-1">Juego</span>
                            <span className="font-semibold text-[var(--color-primary)]">{torneoInfo.nombreJuego}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 text-sm block mb-1">Formato</span>
                            <span>{torneoInfo.formato || "Estándar"}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 text-sm block mb-1">Fecha de Inicio</span>
                            <span>{new Date(torneoInfo.fechaHoraInicio.endsWith("Z") ? torneoInfo.fechaHoraInicio : torneoInfo.fechaHoraInicio + "Z").toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 text-sm block mb-1">Ubicación</span>
                            <span>{torneoInfo.lugarCelebracion}</span>
                        </div>
                        <div className="md:col-span-2">
                            <span className="text-gray-500 text-sm block mb-1">Descripción</span>
                            <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">{torneoInfo.descripcion || "Sin descripción."}</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </main>
    </div>
  );
}