import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/auth";
import SidebarTorneo from "../components/SidebarTorneo";

export default function GestionTorneoEnCurso() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const idTorneo = slug ? Number(slug.split("-").pop()) : null;

  const [torneo, setTorneo] = useState(null);
  const [ronda, setRonda] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [resultados, setResultados] = useState({});
  const [historicoRonda, setHistoricoRonda] = useState(null);

  const [activeTab, setActiveTab] = useState("partidas"); //Se abre con partidas
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [validarOrganizador, setValidarOrganizador] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [error, setError] = useState(null);

  const [numRondaHist, setNumRondaHist] = useState(1);

  //1. Auth y Validación Inicial
  useEffect(() => { if (!user && !authLoading) navigate("/login", { replace: true }); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !idTorneo) return;
    const validar = async () => {
      try {
        const res = await fetch(`${API_URL}/torneo/${idTorneo}`, { credentials: "include" });
        const data = await res.json();
        if (data.idOrganizador !== user.idUsuario) return navigate(`/torneo/${slug}`, { replace: true });
        if (data.estado === 'FINALIZADO') navigate(`/torneo/${slug}`);
        setTorneo(data);
      } catch (e) { setError(e.message); } finally { setValidarOrganizador(false); }
    };
    validar();
  }, [user, idTorneo, slug, navigate]);

  //2. Cargar Ronda y Decidir Pestaña
  const cargarDatos = async () => {
    try {
      setCargando(true);
      //Cargar Ronda
      const resRonda = await fetch(`${API_URL}/rondas/${idTorneo}/ronda-actual`, { credentials: "include" });
      const dataRonda = await resRonda.json();

      if (!resRonda.ok) throw new Error(dataRonda.error || "Error");

      setRonda(dataRonda);

      if (dataRonda.rondaFinalizada) {
        await cargarRanking();
        setActiveTab("clasificacion");
      } else {
        setActiveTab("partidas");

        //Inicializar resultados
        const initRes = {};
        dataRonda.mesas.forEach(m => m.jugadores.forEach(j => {
          initRes[m.idEnfrentamiento] = { ...initRes[m.idEnfrentamiento], [j.idEquipo]: j.puntos ?? 0 };
        }));
        setResultados(initRes);
      }
    } catch (e) { setError(e.message); } finally { setCargando(false); }
  };

  const cargarRanking = async () => {
    const res = await fetch(`${API_URL}/rondas/${idTorneo}/clasificacion`, { credentials: "include" });
    if (res.ok) setRanking(await res.json());
  };

  const cargarHistorico = async (num) => {
    try {
      const res = await fetch(`${API_URL}/rondas/${idTorneo}/ronda/${num}`, { credentials: "include" });
      if (res.ok) setHistoricoRonda(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!validarOrganizador && torneo) cargarDatos();
  }, [validarOrganizador, torneo]);

  //3. Acciones
  const actualizarResultado = (idEnf, idEquipo, valor) => {
    setResultados(prev => ({ ...prev, [idEnf]: { ...prev[idEnf], [idEquipo]: valor } }));
  };

  const confirmarCierre = async () => {
    setProcesando(true);
    try {
      //A. Guardar Puntos
      for (const mesa of ronda.mesas.filter(m => m.jugadores.length > 1)) {
        const payload = {
          idEnfrentamiento: mesa.idEnfrentamiento,
          resultados: mesa.jugadores.map(j => ({
            idEquipo: j.idEquipo,
        puntos: parseInt(resultados[mesa.idEnfrentamiento]?.[j.idEquipo] ?? 0), //Por defecto manda 0
          })),
        };
        await fetch(`${API_URL}/rondas/enfrentamiento/guardar-resultado`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload)
        });
      }

      //B. Calcular Ranking (Cerrar)
      const resCierre = await fetch(`${API_URL}/rondas/cerrar-ronda`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ idTorneo })
      });
      const dataCierre = await resCierre.json();

      if (dataCierre.finalizado) {
        navigate(`/torneo/${slug}`);
      } else {
        //C. Éxito -> Ir a Ranking
        await cargarRanking();
        setActiveTab("clasificacion");
      }
    } catch (e) { alert(e.message); }
    finally { setProcesando(false); setMostrarConfirmacion(false); }
  };

  const generarSiguiente = async () => {
    setProcesando(true);
    try {
      await fetch(`${API_URL}/rondas/generar-siguiente-ronda`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ idTorneo })
      });
      await cargarDatos();
    } catch (e) { alert(e.message); }
    finally { setProcesando(false); }
  };

  if (authLoading || validarOrganizador || cargando) return <div className="flex justify-center mt-20">Cargando...</div>;
  if (error) return <p className="text-center mt-6 text-red-500 font-bold">{error}</p>;

  const mesasNormales = ronda?.mesas?.filter(m => m.jugadores.length > 1) || [];
  const mesasBye = ronda?.mesas?.filter(m => m.jugadores.length === 1) || [];

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play">

      <SidebarTorneo
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        abierto={sidebarAbierto}
        setAbierto={setSidebarAbierto}
        rondaActual={ronda?.numeroRonda}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">

        {!sidebarAbierto && (
          <button
            onClick={() => setSidebarAbierto(true)}
            className="md:hidden fixed top-20 left-4 z-30 bg-[var(--color-bg-secondary)] p-2 rounded-full shadow-lg border border-gray-600 text-xl"
          >
            ☰
          </button>
        )}

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-[var(--color-primary)]">{torneo.nombre}</h1>
          <p className="text-gray-400 mb-8 text-sm">Gestión del Torneo - {torneo.estado}</p>

          {/*Partidas*/}
          {activeTab === "partidas" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Ronda {ronda.numeroRonda}</h2>
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase">En Curso</span>
              </div>

              {mesasNormales.map((mesa) => (
                <div key={mesa.idEnfrentamiento} className="bg-[var(--color-bg-secondary)] rounded-xl p-4 mb-6 shadow border border-gray-700">
                  <h3 className="font-semibold mb-4 text-center text-lg">{mesa.mesa}</h3>
                  <div className="space-y-3">
                    {mesa.jugadores.map((jugador) => (
                      <div key={jugador.idEquipo} className="flex justify-between items-center bg-[var(--color-bg)]/50 p-2 rounded">
                        <span className="font-medium">{jugador.nombre}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => actualizarResultado(mesa.idEnfrentamiento, jugador.idEquipo, Math.max(0, (resultados[mesa.idEnfrentamiento]?.[jugador.idEquipo] ?? 0) - 1))} className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center hover:bg-gray-500">-</button>
                          <span className="w-10 text-center font-bold text-xl">{resultados[mesa.idEnfrentamiento]?.[jugador.idEquipo] ?? 0}</span>
                          <button onClick={() => actualizarResultado(mesa.idEnfrentamiento, jugador.idEquipo, (resultados[mesa.idEnfrentamiento]?.[jugador.idEquipo] ?? 0) + 1)} className="w-8 h-8 bg-[var(--color-primary)] rounded flex items-center justify-center hover:bg-[var(--color-secondary)]">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {mesasBye.length > 0 && (
                <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 mb-6 opacity-70 text-center">
                  <h3 className="font-semibold mb-2">Bye (Descanso)</h3>
                  <div className="flex flex-wrap justify-center gap-2">{mesasBye.map(m => <span key={m.idEnfrentamiento} className="bg-gray-700 px-3 py-1 rounded text-sm">{m.jugadores[0].nombre}</span>)}</div>
                </div>
              )}

              <div className="text-center mt-8 pb-10">
                <button
                  disabled={procesando}
                  onClick={() => setMostrarConfirmacion(true)}
                  className={`px-8 py-3 rounded-xl font-bold transition shadow-lg bg-[var(--color-primary)] hover:scale-105 text-white`}
                >
                  Publicar Resultados
                </button>
              </div>
            </div>
          )}

          {/*Clasificación*/}
          {activeTab === "clasificacion" && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold mb-6">Clasificación General</h2>

              <div className="bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden shadow-lg mb-8">
                <table className="w-full text-left">
                  <thead className="bg-gray-700 text-gray-200">
                    <tr><th className="p-4">Pos</th><th className="p-4">Equipo</th><th className="p-4 text-center">Puntos</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {ranking.map((eq, index) => (
                      <tr key={eq.idEquipo} className="hover:bg-white/5">
                        <td className="p-4 font-bold text-[var(--color-primary)]">#{index + 1}</td>
                        <td className="p-4">{eq.nombre}</td>
                        <td className="p-4 text-center font-bold">{eq.puntosAcumulados ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-center">
                <button
                  onClick={generarSiguiente}
                  disabled={procesando}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-8 py-3 rounded-xl font-bold shadow-lg transition flex items-center gap-2 mx-auto"
                >
                  {procesando ? "Generando..." : "⚔️ Generar Siguiente Ronda"}
                </button>
              </div>
            </div>
          )}

          {/*Historial de Rondas*/}
          {activeTab === "historico" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex gap-4 items-center mb-6">
                <h2 className="text-2xl font-bold">Historial</h2>
                <select
                  value={numRondaHist}
                  onChange={(e) => { setNumRondaHist(e.target.value); cargarHistorico(e.target.value); }}
                  className="bg-[var(--color-bg-secondary)] border border-gray-600 rounded px-3 py-1"
                >
                  {Array.from({ length: ronda.numeroRonda - 1 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>Ronda {n}</option>
                  ))}
                </select>
              </div>

              {historicoRonda ? (
                <div className="grid gap-4">
                  {historicoRonda.mesas.map(m => (
                    <div key={m.idEnfrentamiento} className="bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-gray-700">
                      <h4 className="text-center font-bold mb-2">{m.mesa}</h4>
                      <div className="text-center text-gray-300 text-sm">
                        {m.marcador ? (
                          <div className="flex justify-center gap-4 flex-wrap">
                            {Object.entries(m.marcador.puntos).map(([idEq, pts]) => {
                              const nombre = m.jugadores.find(j => j.idEquipo == idEq)?.nombre || "Equipo";
                              return <span key={idEq}>{nombre}: <strong>{pts}</strong></span>
                            })}
                          </div>
                        ) : "Sin datos"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Selecciona una ronda anterior para ver sus detalles.</p>
              )}
            </div>
          )}

          {/*Detalles del Torneo*/}
          {activeTab === "detalles" && (
            <div className="animate-in fade-in duration-300 bg-[var(--color-bg-secondary)] p-6 rounded-xl">
              <h2 className="text-2xl font-bold mb-4">Información del Torneo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="text-gray-400 block">Juego</span> {torneo.nombreJuego}</div>
                <div><span className="text-gray-400 block">Formato</span> {torneo.formato}</div>
                <div><span className="text-gray-400 block">Fecha</span> {new Date(torneo.fechaHoraInicio).toLocaleDateString()}</div>
                <div><span className="text-gray-400 block">Lugar</span> {torneo.lugarCelebracion}</div>
              </div>
            </div>
          )}

        </div>
      </main>

      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl w-96 text-center border border-gray-600">
            <h3 className="text-xl font-bold mb-4">¿Cerrar Ronda?</h3>
            <p className="mb-6 text-sm text-gray-300">Se guardarán los resultados y se mostrará la clasificación.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setMostrarConfirmacion(false)} className="px-4 py-2 bg-gray-600 rounded">Cancelar</button>
              <button onClick={confirmarCierre} disabled={procesando} className="px-4 py-2 bg-[var(--color-primary)] rounded font-bold">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}