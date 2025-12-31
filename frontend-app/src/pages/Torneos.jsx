import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarFilter from "../components/SidebarFilter";

export default function Torneos() {
  const [torneos, setTorneos] = useState([]);
  const [torneosOriginales, setTorneosOriginales] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const torneosPorPagina = 12;
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
    const fetchTorneos = async () => {
      try {
        const response = await fetch("http://localhost:8000/torneos_vigentes");
        const data = await response.json();
        setTorneosOriginales(data);
        setTorneos(data);
      } catch (err) {
        setError("Error al cargar torneos");
      } finally {
        setCargando(false);
      }
    };


    const fetchJuegos = async () => {
      try {
        const response = await fetch("http://localhost:8000/juegos");
        const data = await response.json();
        setJuegos(data);
      } catch (err) {
        console.error("Error cargando juegos");
      }
    };

    fetchTorneos();
    fetchJuegos();
  }, []);

  useEffect(() => {
    let resultado = torneosOriginales;

    if (busqueda.trim() !== "") {
      resultado = resultado.filter((torneo) =>
        torneo.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    setTorneos(resultado);
    setPaginaActual(1);
  }, [busqueda, torneosOriginales]);


  if (cargando)
    return (
      <p className="text-center mt-6 text-[var(--color-text)] font-play">
        Cargando torneos...
      </p>
    );

  if (error)
    return (
      <p className="text-center mt-6 text-red-600 font-semibold font-play">{error}</p>
    );

  const indiceUltimoTorneo = paginaActual * torneosPorPagina;
  const indicePrimerTorneo = indiceUltimoTorneo - torneosPorPagina;
  const torneosActuales = torneos.slice(indicePrimerTorneo, indiceUltimoTorneo);
  const totalPaginas = Math.ceil(torneos.length / torneosPorPagina);

  const cambiarPagina = (num) => {
    setPaginaActual(num);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };

  const botonesPaginacion =
    totalPaginas > 1 ? (
      <div className="flex justify-center mt-6 space-x-2 flex-wrap">
        <button
          onClick={() => cambiarPagina(paginaActual - 1)}
          className={`
      w-10 px-3 py-1 rounded font-play 
      ${paginaActual > 1
              ? "bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]"
              : "invisible"
            }
    `}
        >
          &lt;
        </button>

        {Array.from({ length: totalPaginas }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => cambiarPagina(i + 1)}
            className={`
        w-10 px-3 py-1 rounded font-play text-center
        ${paginaActual === i + 1
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]"
              }
      `}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => cambiarPagina(paginaActual + 1)}
          className={`w-10 px-3 py-1 rounded font-play ${paginaActual < totalPaginas ? "bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]" : "invisible"
            }`}
        >
          &gt;
        </button>
      </div>

    ) : null;

  const buscarTorneos = async () => {
    try {
      const response = await fetch("http://localhost:8000/torneos_vigentes_filtrados", {
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
      setTorneos(data);
      setPaginaActual(1);
    } catch (err) {
      console.error("Error filtrando torneos", err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play">

      {/* Contenedor principal debajo del navbar */}
      <div className="pt-16 px-8">

        {/* Botón abrir/cerrar sidebar */}
        <button
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg mb-6"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          🔍 Buscar
        </button>

        {/* Layout lateral */}
        <div className="flex transition-all duration-300">

          {/* Sidebar que empuja contenido */}
          <SidebarFilter
            abierto={menuAbierto}
            filtros={filtros}
            setFiltros={setFiltros}
            onBuscar={buscarTorneos}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            juegos={juegos}
          />


          {/* Contenido principal */}
          <div className={`flex-1 transition-all duration-500 ${menuAbierto ? "md:pl-8" : "md:pl-0"} ml-0`}>
            <h1 className="text-3xl font-bold text-center mb-8">Torneos Vigentes</h1>

            {botonesPaginacion}

            {torneosActuales.length === 0 ? (
              <p className="text-center text-[var(--color-text)] mt-6">
                No hay torneos vigentes en este momento.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {torneosActuales.map((torneo) => (
                  <div key={torneo.idTorneo} className="bg-[var(--color-bg-secondary)] shadow-lg rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{torneo.nombre}</h2>
                      <p className="text-[var(--color-text)] text-sm mb-2">{torneo.lugarCelebracion}</p>
                      <p className="text-gray-500 text-sm mb-4">{new Date(torneo.fechaHoraInicio).toLocaleString() + " hora local"}</p>
                      <p className="text-[var(--color-text)] mb-4">{torneo.juego}</p>
                      <p className="text-[var(--color-text)] mb-4">{torneo.precioInscripcion + "€"}</p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/torneo/${torneo.nombre.replace(/\s+/g, "-")}-${torneo.idTorneo}`)
                      }
                      className="mt-4 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-secondary)] transition"
                    >
                      Ver detalles
                    </button>
                  </div>
                ))}
              </div>
            )}

            {botonesPaginacion}
          </div>

        </div>
      </div>
    </div>
  );
}
