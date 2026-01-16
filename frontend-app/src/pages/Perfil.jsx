import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SidebarPerfil from "../components/SidebarPerfil";

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

  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEditables, setDatosEditables] = useState(null);
  const [mostrarConfirmacionEdicion, setMostrarConfirmacionEdicion] = useState(false);
  const [procesandoEdicion, setProcesandoEdicion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [errorEdicion, setErrorEdicion] = useState(null);

  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    passwordActual: "",
    nuevaPassword: "",
    confirmarPassword: ""
  });
  const [errorPassword, setErrorPassword] = useState("");


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

  useEffect(() => {
    if (!mensajeExito) return;

    const timer = setTimeout(() => {
      setMensajeExito("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [mensajeExito]);

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

    if (modoEdicion && datosEditables) {
      return (
        <div className="max-w-3xl mx-auto bg-[var(--color-bg-secondary)] shadow-lg rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Editar datos personales
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Nombre</label>
              <input
                value={datosEditables.nombre}
                onChange={(e) =>
                  setDatosEditables({ ...datosEditables, nombre: e.target.value })
                }
                className="w-full p-2 rounded bg-[var(--color-bg)]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Apellidos</label>
              <input
                value={datosEditables.apellidos}
                onChange={(e) =>
                  setDatosEditables({ ...datosEditables, apellidos: e.target.value })
                }
                className="w-full p-2 rounded bg-[var(--color-bg)]"
              />
            </div>
            {/*
            <div>
              <label className="text-sm text-gray-500">
                Email (no editable por ahora)
              </label>
              <input
                value={datosEditables.email}
                disabled
                className="w-full p-2 rounded bg-gray-200 cursor-not-allowed opacity-70"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Teléfono (no editable por ahora)
              </label>
              <input
                value={datosEditables.telefono || ""}
                disabled
                className="w-full p-2 rounded bg-gray-200 cursor-not-allowed opacity-70"
              />
            </div>
            */}

            <div>
              <label className="text-sm text-gray-500">Localidad</label>
              <input
                value={datosEditables.localidad || ""}
                onChange={(e) =>
                  setDatosEditables({ ...datosEditables, localidad: e.target.value })
                }
                className="w-full p-2 rounded bg-[var(--color-bg)]"
              />
            </div>
          </div>

          {mostrarCambioPassword && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl w-96">
                <h2 className="text-xl font-bold mb-4 text-center">
                  Cambiar contraseña
                </h2>

                <input
                  type="password"
                  placeholder="Contraseña actual"
                  className="w-full p-2 mb-3 rounded"
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, passwordActual: e.target.value })
                  }
                />

                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  className="w-full p-2 mb-3 rounded"
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, nuevaPassword: e.target.value })
                  }
                />

                <input
                  type="password"
                  placeholder="Confirmar nueva contraseña"
                  className="w-full p-2 mb-3 rounded"
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmarPassword: e.target.value })
                  }
                />

                {errorPassword && (
                  <p className="text-red-500 text-sm text-center">{errorPassword}</p>
                )}

                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={guardarPassword}
                    className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg"
                  >
                    Cambiar
                  </button>
                  <button
                    onClick={cerrarCambioPassword}
                    className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}


          {errorEdicion && (
            <p className="text-red-500 text-center mt-4">{errorEdicion}</p>
          )}
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={() => setMostrarCambioPassword(true)}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              Cambiar contraseña
            </button>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setMostrarConfirmacionEdicion(true)}
              className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg"
            >
              Guardar cambios
            </button>

            <button
              onClick={() => setModoEdicion(false)}
              className="bg-gray-400 text-white px-6 py-2 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      );
    }

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
            onClick={iniciarEdicion}
            className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--color-secondary)] transition"
          >
            Editar datos
          </button>
        </div>
      </div>
    );
  };
  const iniciarEdicion = () => {
    setDatosEditables({ ...datosUsuario });
    setModoEdicion(true);
  };
  const guardarPassword = async () => {
    if (passwordData.nuevaPassword !== passwordData.confirmarPassword) {
      setErrorPassword("Las contraseñas no coinciden");
      return;
    }

    const response = await fetch(
      `http://localhost:8000/cambiar_password/${user.idUsuario}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(passwordData)
      }
    );

    const result = await response.json();

    if (result.error) {
      setErrorPassword(result.error);
    } else {
      setMostrarCambioPassword(false);
      setMensajeExito("Contraseña actualizada correctamente");
    }
  };
  const cerrarCambioPassword = () => {
    setMostrarCambioPassword(false);
    setPasswordData({
      passwordActual: "",
      nuevaPassword: "",
      confirmarPassword: ""
    });
    setErrorPassword("");
  };

  const guardarCambios = async () => {
    setProcesandoEdicion(true);
    setErrorEdicion(null);

    try {
      const response = await fetch(
        `http://localhost:8000/editar_datos_usuario/${user.idUsuario}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(datosEditables),
        }
      );

      if (!response.ok) {
        throw new Error("Error al guardar los cambios");
      }

      const data = await response.json();
      setDatosUsuario((prev) => ({
        ...prev,
        ...datosEditables
      }));
      setMensajeExito("Datos actualizados correctamente");
      setModoEdicion(false);
    } catch (err) {
      setErrorEdicion("No se pudieron guardar los cambios");
    } finally {
      setProcesandoEdicion(false);
      setMostrarConfirmacionEdicion(false);
    }
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
            {mensajeExito && (
              <div className="mb-6 text-center text-green-600 font-semibold">
                {mensajeExito}
              </div>
            )}
            {activeTab === "datos" && renderDatosPersonales()}
            {activeTab === "historial" && renderHistorialTorneos()}
            {activeTab === "participar" &&
              renderTorneos(filtrarTorneos(torneosParticipas))}

            {activeTab === "organizar" &&
              renderTorneos(filtrarTorneos(torneosOrganizas))}
            {mostrarConfirmacionEdicion && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg p-6 w-96">
                  <h2 className="text-xl font-semibold mb-4 text-center">
                    Confirmar cambios
                  </h2>

                  <p className="text-center mb-4">
                    ¿Estás seguro de que quieres guardar los cambios en tus datos personales?
                  </p>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={guardarCambios}
                      className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setMostrarConfirmacionEdicion(false)}
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                    >
                      Atrás
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>
      </div>
    </div>
  );

}
