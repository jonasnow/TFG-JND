import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Torneos() {
  const [torneos, setTorneos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const torneosPorPagina = 12;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTorneos = async () => {
      try {
        const response = await fetch("http://localhost:8000/torneos_vigentes");
        const data = await response.json();
        setTorneos(data);
      } catch (err) {
        setError("Error al cargar torneos");
      } finally {
        setCargando(false);
      }
    };
    fetchTorneos();
  }, []);

  if (cargando)
    return <p className="text-center mt-6 text-[var(--color-text)] font-play">Cargando torneos...</p>;

  if (error)
    return <p className="text-center mt-6 text-red-600 font-semibold font-play">{error}</p>;

  // Calcular torneos a mostrar
  const indiceUltimoTorneo = paginaActual * torneosPorPagina;
  const indicePrimerTorneo = indiceUltimoTorneo - torneosPorPagina;
  const torneosActuales = torneos.slice(indicePrimerTorneo, indiceUltimoTorneo);

  const totalPaginas = Math.ceil(torneos.length / torneosPorPagina);

  // Función para cambiar de página y hacer scroll arriba
  const cambiarPagina = (num) => {
    setPaginaActual(num);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };

  // Generar botones de paginación
  const botonesPaginacion =
    totalPaginas > 1 ? (
      <div className="flex justify-center mt-6 space-x-2 flex-wrap">
        {paginaActual > 1 && (
          <button
            onClick={() => cambiarPagina(paginaActual - 1)}
            className="px-3 py-1 rounded font-play bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]"
          >
            &lt;
          </button>
        )}

        {Array.from({ length: totalPaginas }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => cambiarPagina(i + 1)}
            className={`px-3 py-1 rounded font-play ${paginaActual === i + 1
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]"
              }`}
          >
            {i + 1}
          </button>
        ))}

        {paginaActual < totalPaginas && (
          <button
            onClick={() => cambiarPagina(paginaActual + 1)}
            className="px-3 py-1 rounded font-play bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]"
          >
            &gt;
          </button>
        )}
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Torneos Vigentes</h1>

      {botonesPaginacion}

      {torneosActuales.length === 0 ? (
        <p className="text-center text-[var(--color-text)] mt-6">
          No hay torneos vigentes en este momento.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {torneosActuales.map((torneo) => (
            <div
              key={torneo.idTorneo}
              className="bg-[var(--color-bg-secondary)] shadow-lg rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold mb-2">{torneo.nombre}</h2>
                <p className="text-[var(--color-text)] text-sm mb-2">{torneo.lugarCelebracion}</p>
                <p className="text-gray-500 text-sm mb-4">{new Date(torneo.fechaHoraInicio).toLocaleString()}</p>
                <p className="text-[var(--color-text)] mb-4">{torneo.descripcion}</p>
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
  );
}
