import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SidebarPerfil from "../components/SidebarPerfil";
import PerfilFilterDropdown from "../components/PerfilFilterDropdown";

export default function Perfil() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("datos");
  const [torneosParticipas, setTorneosParticipas] = useState([]);
  const [torneosOrganizas, setTorneosOrganizas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [datosUsuario, setDatosUsuario] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState(null);
  const [historialTorneos, setHistorialTorneos] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState(null);
  const [juegos, setJuegos] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [filtrosPerfil, setFiltrosPerfil] = useState({
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    juego: ""
  });


  const [paginaActual, setPaginaActual] = useState(1);
  const torneosPorPagina = 12;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchJuegos = async () => {
      try {
        const response = await fetch("http://localhost:8000/juegos");
        const data = await response.json();
        setJuegos(data);
      } catch (err) {
        console.error("Error cargando juegos", err);
      }
    };

    fetchJuegos();
  }, []);

  const filtrarTorneos = (torneos) => {
    return torneos.filter((torneo) => {
      const nombreOK =
        !filtrosPerfil.nombre ||
        torneo.Nombre.toLowerCase().includes(filtrosPerfil.nombre.toLowerCase());

      const juegoOK =
        !filtrosPerfil.juego ||
        torneo.Juego === filtrosPerfil.juego;

      const fechaTorneo = new Date(torneo.FechaHoraInicio);

      const fechaInicioOK =
        !filtrosPerfil.fecha_inicio ||
        fechaTorneo >= new Date(filtrosPerfil.fecha_inicio);

      const fechaFinOK =
        !filtrosPerfil.fecha_fin ||
        fechaTorneo <= new Date(filtrosPerfil.fecha_fin);

      return nombreOK && juegoOK && fechaInicioOK && fechaFinOK;
    });
  };



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

  useEffect(() => {
    if (activeTab !== "datos" || !user?.idUsuario) return;

    const fetchDatosUsuario = async () => {
      try {
        setCargandoDatos(true);
        setErrorDatos(null);

        const response = await fetch(
          `http://localhost:8000/datos_usuario/${user.idUsuario}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("Error al cargar los datos del usuario");
        }

        const data = await response.json();
        setDatosUsuario(data);
      } catch (err) {
        console.error(err);
        setErrorDatos("No se han podido cargar los datos personales.");
      } finally {
        setCargandoDatos(false);
      }
    };

    fetchDatosUsuario();
  }, [activeTab, user]);
  useEffect(() => {
    if (activeTab !== "historial" || !user?.idUsuario) return;

    const fetchHistorial = async () => {
      try {
        setCargandoHistorial(true);
        setErrorHistorial(null);

        const response = await fetch(
          `http://localhost:8000/historial_usuario/${user.idUsuario}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("Error al cargar el historial");
        }

        const data = await response.json();
        setHistorialTorneos(data);
      } catch (err) {
        console.error(err);
        setErrorHistorial("No se ha podido cargar el historial de torneos.");
      } finally {
        setCargandoHistorial(false);
      }
    };

    fetchHistorial();
  }, [activeTab, user]);

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


    const formatearEstado = (estado) => {
      if (!estado) return "";

      return estado
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^./, (c) => c.toUpperCase());
    };




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
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h2 className="text-xl font-semiboldtext-[var(--color-text)]">{torneo.Nombre}</h2>
                  <div className="w-[80px] h-[80px] flex-shrink-0 flex items-center justify-center bg-white rounded-lg shadow-inner">
                    <img
                      src={torneo.logoJuego}
                      alt={torneo.nombreJuego}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                </div>
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
                  <p><strong>Estado:</strong> {formatearEstado(torneo.Estado)}</p>
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

  const renderDatosPersonales = () => {
    if (cargandoDatos) {
      return (
        <p className="text-center text-[var(--color-text)]">
          Cargando datos personales...
        </p>
      );
    }

    if (errorDatos) {
      return (
        <p className="text-center text-red-600 font-semibold">
          {errorDatos}
        </p>
      );
    }

    if (!datosUsuario) return null;

    return (
      <div className="max-w-3xl mx-auto bg-[var(--color-bg-secondary)] shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Datos personales
        </h2>

        <div className="grid md:grid-cols-2 gap-6 text-[var(--color-text)]">
          <div>
            <p className="text-sm text-gray-500">Nombre</p>
            <p className="font-semibold">{datosUsuario.nombre}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Apellidos</p>
            <p className="font-semibold">{datosUsuario.apellidos}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-semibold">{datosUsuario.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Teléfono</p>
            <p className="font-semibold">
              {datosUsuario.telefono || "No indicado"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Localidad</p>
            <p className="font-semibold">
              {datosUsuario.localidad || "No indicada"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Fecha de registro</p>
            <p className="font-semibold">
              {new Date(datosUsuario.fechaRegistro).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            disabled
            className="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed"
          >
            Editar datos
          </button>
        </div>
      </div>
    );
  };

  const renderHistorialTorneos = () => {
    if (cargandoHistorial) {
      return (
        <p className="text-center text-[var(--color-text)]">
          Cargando historial de torneos...
        </p>
      );
    }

    if (errorHistorial) {
      return (
        <p className="text-center text-red-600 font-semibold">
          {errorHistorial}
        </p>
      );
    }

    if (historialTorneos.length === 0) {
      return (
        <p className="text-center text-[var(--color-text)]">
          No has participado en torneos finalizados.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {historialTorneos.map((torneo, index) => (
          <div
            key={index}
            className="bg-[var(--color-bg-secondary)] shadow-lg rounded-2xl p-6 flex flex-col md:flex-row md:justify-between md:items-center"
          >
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text)]">
                {torneo.nombreTorneo}
              </h2>

              <p className="text-sm text-gray-500">
                {new Date(torneo.fechaHoraInicio).toLocaleDateString()} ·{" "}
                {torneo.lugarCelebracion}
              </p>

              <p className="mt-2 text-sm text-[var(--color-text)]">
                <strong>Juego:</strong> {torneo.juego} ·{" "}
                <strong>Formato:</strong> {torneo.formatoJuego} ·{" "}
                <strong>Torneo:</strong> {torneo.formatoTorneo}
              </p>
            </div>

            <div className="mt-4 md:mt-0 text-sm text-[var(--color-text)] space-y-1 text-right">
              <p>
                <strong>Posición:</strong>{" "}
                {torneo.posicionFinal ?? "—"}
              </p>
              <p>
                <strong>Puntos:</strong>{" "}
                {torneo.puntos ?? 0}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };


  if (error)
    return <div className="text-center mt-10 text-red-600 font-semibold font-play">{error}</div>;

  if (cargando)
    return <div className="text-center mt-10 text-[var(--color-text)] font-play">Cargando torneos...</div>;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play">
      <div className="pt-16 px-8">

        <div className="flex gap-8">

          <SidebarPerfil
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              cambiarPagina(1);
              setMostrarFiltros(false);
              setFiltrosPerfil({
                nombre: "",
                fecha_inicio: "",
                fecha_fin: "",
                juego: ""
              });
            }}
            onToggleFiltros={() => setMostrarFiltros((v) => !v)}
            mostrarFiltros={mostrarFiltros}
            filtros={filtrosPerfil}
            setFiltros={setFiltrosPerfil}
            juegos={juegos}
            onCloseFiltros={() => setMostrarFiltros(false)}
          />


          <main className="flex-1">
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-bold">
                Perfil de {user.nombre}
              </h1>
            </div>
            {activeTab === "datos" && renderDatosPersonales()}
            {activeTab === "historial" && renderHistorialTorneos()}
            {activeTab === "participar" &&
              renderTorneos(filtrarTorneos(torneosParticipas))}

            {activeTab === "organizar" &&
              renderTorneos(filtrarTorneos(torneosOrganizas))}

          </main>

        </div>
      </div>
    </div>
  );

}
