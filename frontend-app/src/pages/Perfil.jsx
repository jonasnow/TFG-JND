import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Perfil() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("participas");
  const [torneosParticipas, setTorneosParticipas] = useState([]);
  const [torneosOrganizas, setTorneosOrganizas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const torneosPorPagina = 12;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user?.email) {
      setCargando(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [respParticipas, respOrganizas] = await Promise.all([
          fetch(`http://localhost:8000/torneos_usuario/${user.idUsuario}`, {
            credentials: "include",
          }),
          fetch(`http://localhost:8000/torneos_organizador/${user.idUsuario}`, {
            credentials: "include",
          }),
        ]);

        if (!respParticipas.ok || !respOrganizas.ok)
          throw new Error("Error al cargar torneos");

        const dataParticipas = await respParticipas.json();
        const dataOrganizas = await respOrganizas.json();

        setTorneosParticipas(dataParticipas);
        setTorneosOrganizas(dataOrganizas);
      } catch (err) {
        console.error(err);
        setError("No se han podido cargar los torneos.");
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, [user]);

  //Cambiar de página y subir arriba
  const cambiarPagina = (num) => {
    setPaginaActual(num);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };

  const renderTorneos = (torneos) => {
    if (torneos.length === 0)
      return <p className="text-center text-[var(--color-text)] font-play">No hay torneos en esta categoría.</p>;

    const indiceUltimoTorneo = paginaActual * torneosPorPagina;
    const indicePrimerTorneo = indiceUltimoTorneo - torneosPorPagina;
    const torneosActuales = torneos.slice(indicePrimerTorneo, indiceUltimoTorneo);
    const totalPaginas = Math.ceil(torneos.length / torneosPorPagina);

    const botonesPaginacion = totalPaginas > 1 && (
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
    );

    return (
      <>
        {botonesPaginacion}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {torneosActuales.map((torneo, index) => (
            <div
              key={index}
              className="bg-[var(--color-bg-secondary)] shadow-lg rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold mb-2 text-[var(--color-text)]">{torneo.Nombre}</h2>
                <p className="text-[var(--color-text)] text-sm mb-2">{torneo.LugarCelebracion}</p>
                <p className="text-gray-500 text-sm mb-2">{new Date(torneo.FechaHoraInicio).toLocaleString()}</p>
                <p className="text-[var(--color-text)] mb-2"><strong>Juego:</strong> {torneo.Juego}</p>
                <p className="text-[var(--color-text)] mb-2"><strong>Formato del juego:</strong> {torneo.FormatoJuego}</p>
                <p className="text-[var(--color-text)] mb-2"><strong>Formato del torneo:</strong> {torneo.FormatoTorneo}</p>
                <p className="text-[var(--color-text)] mb-4">{torneo.Descripcion}</p>
                <div className="text-sm text-[var(--color-text)] space-y-1">
                  <p><strong>Precio:</strong> {torneo.Precio} €</p>
                  <p><strong>Rondas:</strong> {torneo.Rondas}</p>
                  <p><strong>Plazas máximas:</strong> {torneo.PlazasMax}</p>
                  <p><strong>Duración de las rondas:</strong> {torneo.DuracionRondas} min</p>
                  <p><strong>Premios:</strong> {torneo.Premios}</p>
                  <p><strong>Estado:</strong> {torneo.Estado}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/torneo/${torneo.Nombre.replace(/\s+/g, "-")}-${torneo.idTorneo}`)}
                className="mt-4 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-secondary)] transition"
              >
                Ver detalles
              </button>
            </div>
          ))}
        </div>
        {botonesPaginacion}
      </>
    );
  };

  if (!user)
    return <div className="text-center mt-10 text-[var(--color-text)] font-play">No has iniciado sesión.
      <div>
        <button
          onClick={() =>
            navigate("/login", {
              state: { from: location.pathname }
            })
          }
          className="mt-4 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-secondary)] transition"
        >
          Iniciar sesión
        </button>
      </div>
    </div>;

  if (error)
    return <div className="text-center mt-10 text-red-600 font-semibold font-play">{error}</div>;

  if (cargando)
    return <div className="text-center mt-10 text-[var(--color-text)] font-play">Cargando torneos...</div>;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play p-8">
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-4xl font-bold mb-2">Perfil de {user.nombre}</h1>
      </div>

      <div className="flex justify-center mb-6">
        <button
          className={`px-6 py-2 rounded-l-lg border font-play ${activeTab === "participas"
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]"
            }`}
          onClick={() => { setActiveTab("participas"); cambiarPagina(1); }}
        >
          Torneos en los que participas
        </button>
        <button
          className={`px-6 py-2 rounded-r-lg border font-play ${activeTab === "organizas"
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]"
            }`}
          onClick={() => { setActiveTab("organizas"); cambiarPagina(1); }}
        >
          Torneos que organizas
        </button>
      </div>

      {activeTab === "participas"
        ? renderTorneos(torneosParticipas)
        : renderTorneos(torneosOrganizas)}
    </div>
  );
}
