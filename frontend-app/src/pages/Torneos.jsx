import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarFilter from "../components/SidebarFilter";
import { API_URL } from "../api/auth";

export default function Torneos() {
  const [torneos, setTorneos] = useState([]);
  const [torneosOriginales, setTorneosOriginales] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const torneosPorPagina = 9;

  const [filtros, setFiltros] = useState({
    precio_min: "",
    precio_max: "",
    fecha_inicio: "",
    fecha_fin: "",
    lugar: "",
    juego: ""
  });

  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setCargando(true);
      try {
        const resTorneos = await fetch(`${API_URL}/torneos_vigentes`);

        if (!resTorneos.ok) {
          throw new Error(`Error HTTP: ${resTorneos.status}`);
        }

        const dataTorneos = await resTorneos.json();

        if (Array.isArray(dataTorneos)) {
          setTorneosOriginales(dataTorneos);
          setTorneos(dataTorneos);
        } else {
          setTorneos([]);
        }

        try {
          const resJuegos = await fetch(`${API_URL}/juegos`);
          if (resJuegos.ok) {
            const dataJuegos = await resJuegos.json();
            setJuegos(dataJuegos);
          }
        } catch (e) {
          console.warn("No se pudieron cargar los juegos.");
        }

      } catch (err) {
        console.error(err);
        if (err.message.includes("Failed to fetch") || err.name === "TypeError") {
          setError("No se puede conectar con el servidor.");
        } else {
          setError("Error al cargar los torneos.");
        }
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!Array.isArray(torneosOriginales)) return;

    let resultado = torneosOriginales;

    if (busqueda.trim() !== "") {
      resultado = resultado.filter((torneo) =>
        torneo.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    setTorneos(resultado);
    setPaginaActual(1);
  }, [busqueda, torneosOriginales]);

  const buscarTorneosBackend = async () => {
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/torneos_vigentes_filtrados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precio_min: filtros.precio_min || null,
          precio_max: filtros.precio_max || null,
          fecha_inicio: filtros.fecha_inicio || null,
          fecha_fin: filtros.fecha_fin || null,
          lugar: filtros.lugar || null,
          juego: filtros.juego || null
        })
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        setTorneosOriginales(data);
        setTorneos(data);
        setPaginaActual(1);
      } else {
        setTorneos([]);
      }

      if (window.innerWidth < 768) setMenuAbierto(false);

    } catch (err) {
      setError("Error al filtrar los torneos.");
    } finally {
      setCargando(false);
    }
  };

  const indiceUltimoTorneo = paginaActual * torneosPorPagina;
  const indicePrimerTorneo = indiceUltimoTorneo - torneosPorPagina;
  const listaTorneos = Array.isArray(torneos) ? torneos : [];
  const torneosActuales = listaTorneos.slice(indicePrimerTorneo, indiceUltimoTorneo);
  const totalPaginas = Math.ceil(listaTorneos.length / torneosPorPagina);

  const cambiarPagina = (num) => {
    setPaginaActual(num);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const Paginacion = () => {
    if (totalPaginas <= 1) return null;
    const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);

    return (
      <div className="flex justify-center mt-8 gap-2 flex-wrap">
        <button
          onClick={() => cambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          className={`px-3 py-1 rounded font-play transition-colors ${paginaActual === 1 ? "opacity-50 cursor-not-allowed" : "bg-[var(--color-bg-secondary)] hover:bg-[var(--color-secondary)]"}`}
        >
          &lt;
        </button>
        {paginas.map((num) => (
          <button
            key={num}
            onClick={() => cambiarPagina(num)}
            className={`w-10 px-3 py-1 rounded font-play text-center transition-colors ${paginaActual === num ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-bg-secondary)] hover:bg-[var(--color-secondary)]"}`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => cambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className={`px-3 py-1 rounded font-play transition-colors ${paginaActual === totalPaginas ? "opacity-50 cursor-not-allowed" : "bg-[var(--color-bg-secondary)] hover:bg-[var(--color-secondary)]"}`}
        >
          &gt;
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play flex flex-col">
      <div className="flex flex-1 relative">

        {menuAbierto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setMenuAbierto(false)}
          ></div>
        )}

        <SidebarFilter
          abierto={menuAbierto}
          setMenuAbierto={setMenuAbierto}
          filtros={filtros}
          setFiltros={setFiltros}
          onBuscar={buscarTorneosBackend}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          juegos={juegos}
        />

        <div className={`flex-1 p-6 transition-all duration-300 ${menuAbierto ? "md:ml-80" : "ml-0"}`}>

          <div className="relative flex items-center justify-center mb-8 h-12">
            <div className="absolute left-0 top-0 h-full flex items-center">
              <button
                className={`bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:bg-[var(--color-secondary)] transition ${menuAbierto ? "hidden md:flex opacity-0 pointer-events-none" : "flex"}`}
                onClick={() => setMenuAbierto(true)}
              >
                <span>🔍</span> <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold text-center">Torneos Vigentes</h1>
          </div>

          {error && (
            <div className="text-center p-4 bg-red-100 text-red-600 rounded-lg mb-6 border border-red-200">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {cargando ? (
            <div className="flex justify-center mt-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Paginacion />
              </div>
              {listaTorneos.length === 0 ? (
                <div className="text-center py-10 opacity-70 bg-[var(--color-bg-secondary)] rounded-2xl">
                  <p className="text-xl">No se encontraron torneos.</p>
                  <button onClick={() => window.location.reload()} className="mt-2 text-[var(--color-primary)] underline">Recargar</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {torneosActuales.map((torneo) => (
                    <div key={torneo.idTorneo} className="bg-[var(--color-bg-secondary)] shadow-lg rounded-2xl p-5 flex flex-col h-full hover:shadow-xl transition-shadow border border-transparent hover:border-[var(--color-primary)]">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <h2 className="text-lg font-bold line-clamp-2 leading-tight flex-1" title={torneo.nombre}>{torneo.nombre}</h2>
                        <div className="w-12 h-12 flex-shrink-0 bg-white rounded-lg p-1 shadow-sm">
                          <img src={torneo.logoJuego} alt={torneo.nombreJuego} className="w-full h-full object-contain" />
                        </div>
                      </div>
                      <div className="text-sm space-y-2 flex-1 mb-4 opacity-90">
                        <p>{torneo.lugarCelebracion}</p>
                        <p>
                          {new Date(torneo.fechaHoraInicio.endsWith("Z") ? torneo.fechaHoraInicio : torneo.fechaHoraInicio + "Z").toLocaleDateString()}
                          {" "}
                          {new Date(torneo.fechaHoraInicio.endsWith("Z") ? torneo.fechaHoraInicio : torneo.fechaHoraInicio + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p>{torneo.nombreJuego}</p>
                        <p className="font-semibold text-[var(--color-primary)] mt-1">{torneo.precioInscripcion > 0 ? `${torneo.precioInscripcion}€` : "Gratis"}</p>
                      </div>
                      <button onClick={() => navigate(`/torneo/${torneo.nombre.replace(/\s+/g, "-")}-${torneo.idTorneo}`)} className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg font-bold hover:bg-[var(--color-secondary)] transition shadow-sm">Ver Detalles</button>
                    </div>
                  ))}
                </div>
              )}
              <Paginacion />
            </>
          )}
        </div>
      </div>
    </div>
  );
}