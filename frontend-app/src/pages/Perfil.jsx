import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SidebarPerfil from "../components/SidebarPerfil";
import { API_URL } from "../api/auth";

export default function Perfil() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("datos");

  const [menuAbierto, setMenuAbierto] = useState(() => window.innerWidth >= 768);

  const [torneosParticipas, setTorneosParticipas] = useState([]);
  const [torneosOrganizas, setTorneosOrganizas] = useState([]);
  const [cargandoTorneos, setCargandoTorneos] = useState(false);
  const [errorTorneos, setErrorTorneos] = useState(null);

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
    const handleResize = () => {
      if (window.innerWidth >= 768 && !menuAbierto) { }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuAbierto]);

  useEffect(() => {
    const fetchJuegos = async () => {
      try {
        const response = await fetch(`${API_URL}/juegos`);
        if (response.ok) setJuegos(await response.json());
      } catch (err) { console.error(err); }
    };
    fetchJuegos();
  }, []);

  useEffect(() => {
    if (activeTab !== "participar" && activeTab !== "organizar") return;
    if (!user) return;
    const fetchTorneos = async () => {
      setCargandoTorneos(true);
      try {
        const [respParticipas, respOrganizas] = await Promise.all([
          fetch(`${API_URL}/torneos_usuario`, { credentials: "include" }),
          fetch(`${API_URL}/torneos_organizador`, { credentials: "include" }),
        ]);
        if (respParticipas.ok && respOrganizas.ok) {
          setTorneosParticipas(await respParticipas.json());
          setTorneosOrganizas(await respOrganizas.json());
        }
      } catch (err) { setErrorTorneos("Error cargando torneos."); }
      finally { setCargandoTorneos(false); }
    };
    fetchTorneos();
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== "datos" || !user) return;
    const fetchDatos = async () => {
      setCargandoDatos(true);
      try {
        const res = await fetch(`${API_URL}/perfil`, { credentials: "include" });
        if (res.ok) setDatosUsuario(await res.json());
      } catch (err) { setErrorDatos("Error cargando perfil."); }
      finally { setCargandoDatos(false); }
    };
    fetchDatos();
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== "historial" || !user) return;
    const fetchHistorial = async () => {
      setCargandoHistorial(true);
      try {
        const res = await fetch(`${API_URL}/historial_usuario`, { credentials: "include" });
        if (res.ok) setHistorialTorneos(await res.json());
      } catch (err) { setErrorHistorial("Error historial."); }
      finally { setCargandoHistorial(false); }
    };
    fetchHistorial();
  }, [activeTab, user]);

  useEffect(() => {
    if (!mensajeExito) return;
    const timer = setTimeout(() => setMensajeExito(""), 3000);
    return () => clearTimeout(timer);
  }, [mensajeExito]);

  const filtrarTorneos = (torneos) => {
    if (!Array.isArray(torneos)) return [];

    return torneos.filter((torneo) => {
      const nombreOK = !filtrosPerfil.nombre || torneo.Nombre.toLowerCase().includes(filtrosPerfil.nombre.toLowerCase());
      const juegoOK = !filtrosPerfil.juego || torneo.Juego === filtrosPerfil.juego;
      const rawFecha = torneo.FechaHoraInicio || torneo.fechaHoraInicio;
      const fechaTorneo = new Date(rawFecha.endsWith("Z") ? rawFecha : rawFecha + "Z");
      const fechaInicioOK = !filtrosPerfil.fecha_inicio || fechaTorneo >= new Date(filtrosPerfil.fecha_inicio);
      let fechaFinOK = true;
      if (filtrosPerfil.fecha_fin) {
        const fechaFinLimite = new Date(filtrosPerfil.fecha_fin);
        fechaFinLimite.setUTCDate(fechaFinLimite.getUTCDate() + 1);
        fechaFinOK = fechaTorneo < fechaFinLimite;
      }
      return nombreOK && juegoOK && fechaInicioOK && fechaFinOK;
    });
  };
  const formatearEstado = (estado) => estado ? estado.toLowerCase().replace(/_/g, " ").replace(/^./, c => c.toUpperCase()) : "";

  const renderTorneos = (listaTorneos) => {
    if (cargandoTorneos) return <p className="text-center mt-10">Cargando...</p>;
    if (listaTorneos.length === 0) return <p className="text-center mt-10 opacity-70">No hay torneos en esta sección.</p>;

    const indiceUltimo = paginaActual * torneosPorPagina;
    const indicePrimero = indiceUltimo - torneosPorPagina;
    const torneosActuales = listaTorneos.slice(indicePrimero, indiceUltimo);
    const totalPaginas = Math.ceil(listaTorneos.length / torneosPorPagina);

    const cambiarPagina = (num) => {
      setPaginaActual(num);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
      <>
        {totalPaginas > 1 && (
          <div className="flex justify-center mt-4 mb-6 space-x-2">
            <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1} className={`px-3 py-1 rounded ${paginaActual === 1 ? 'opacity-50' : 'hover:bg-gray-700'} bg-[var(--color-bg-secondary)]`}> &lt; </button>
            <span className="px-3 py-1">Página {paginaActual} de {totalPaginas}</span>
            <button onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className={`px-3 py-1 rounded ${paginaActual === totalPaginas ? 'opacity-50' : 'hover:bg-gray-700'} bg-[var(--color-bg-secondary)]`}> &gt; </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {torneosActuales.map((torneo) => (
            <div key={torneo.idTorneo} className="bg-[var(--color-bg-secondary)] shadow-lg rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition-shadow">
              <div>
                <div className="flex justify-between items-start gap-3 mb-4">
                  <h2 className="text-lg font-bold leading-tight flex-1">{torneo.Nombre}</h2>
                  <div className="w-12 h-12 flex-shrink-0 bg-white rounded-lg p-1">
                    <img src={torneo.logoJuego} alt={torneo.Juego} className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="mb-3">
                  {torneo.EstadoInscripcion === "CONFIRMADA" && (
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded border border-green-500/30 font-bold block w-fit">
                      ✅ Inscripción Confirmada
                    </span>
                  )}
                  {torneo.EstadoInscripcion === "PENDIENTE" && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded border border-yellow-500/30 font-bold block w-fit">
                      ⏳ Pendiente de Aprobación
                    </span>
                  )}
                  {torneo.EstadoInscripcion === "RECHAZADA" && (
                    <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30 font-bold block w-fit">
                      ❌ Inscripción Rechazada
                    </span>
                  )}
                </div>

                <div className="text-sm space-y-2 mb-4 opacity-90">
                  <p> {torneo.LugarCelebracion}</p>
                  <p>
                    {new Date(torneo.FechaHoraInicio.endsWith("Z") ? torneo.FechaHoraInicio : torneo.FechaHoraInicio + "Z").toLocaleDateString()}
                    {" "}
                    {new Date(torneo.FechaHoraInicio.endsWith("Z") ? torneo.FechaHoraInicio : torneo.FechaHoraInicio + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p> {torneo.Juego}</p>
                  <p> {torneo.Precio}€</p>
                  <div className="inline-block px-2 py-1 rounded bg-[var(--color-bg)] border border-gray-600 text-xs">{formatearEstado(torneo.Estado)}</div>
                </div>
              </div>
              <button onClick={() => navigate(`/torneo/${torneo.Nombre.replace(/\s+/g, "-")}-${torneo.idTorneo}`)} className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg font-bold hover:bg-[var(--color-secondary)] transition">Ver Detalle</button>
            </div>
          ))}
        </div>
      </>
    );
  };

  const iniciarEdicion = () => { setDatosEditables({ ...datosUsuario }); setModoEdicion(true); };
  const cerrarCambioPassword = () => { setMostrarCambioPassword(false); setPasswordData({ passwordActual: "", nuevaPassword: "", confirmarPassword: "" }); setErrorPassword(""); };

const guardarCambios = async () => {
    setErrorEdicion(null);

    if (!datosEditables.nombre?.trim() || 
        !datosEditables.apellidos?.trim() || 
        !datosEditables.email?.trim()) {
      setErrorEdicion("Nombre, Apellidos y Email son obligatorios y no pueden estar vacíos.");
      return;
    }

    setProcesandoEdicion(true);

    const payload = {
        ...datosEditables,
        nombre: datosEditables.nombre.trim(),
        apellidos: datosEditables.apellidos.trim(),
        email: datosEditables.email.trim(),
        localidad: datosEditables.localidad ? datosEditables.localidad.trim() : "",
        telefono: datosEditables.telefono ? datosEditables.telefono.trim() : ""
    };

    try {
      const response = await fetch(`${API_URL}/editar_perfil`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        credentials: "include", 
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
             setErrorEdicion("Datos inválidos. Revisa los campos (longitud, formato...).");
        } else {
             setErrorEdicion(data.detail || "Error al guardar los cambios.");
        }
      } else {
          setDatosUsuario(prev => ({ ...prev, ...payload }));
          setMensajeExito("Datos actualizados correctamente.");
          setModoEdicion(false);
          setMostrarConfirmacionEdicion(false); //Cierra el modal si estaba abierto
      }

    } catch (err) { 
        setErrorEdicion("Error de conexión con el servidor."); 
    } finally { 
        setProcesandoEdicion(false); 
        if (errorEdicion) setMostrarConfirmacionEdicion(false); 
    }
  };

  const guardarPassword = async () => {
    setErrorPassword("");

    if (!passwordData.passwordActual || !passwordData.nuevaPassword || !passwordData.confirmarPassword) {
      return setErrorPassword("Todos los campos son obligatorios.");
    }

    if (passwordData.nuevaPassword.length < 6 || passwordData.nuevaPassword.length > 70) {
      return setErrorPassword("La contraseña deben tener entre 6 y 70 caracteres.");
    }

    if (passwordData.nuevaPassword !== passwordData.confirmarPassword) {
      return setErrorPassword("Las contraseñas nuevas no coinciden.");
    }

    if (passwordData.passwordActual === passwordData.nuevaPassword) {
      return setErrorPassword("La nueva contraseña no puede ser igual a la actual.");
    }

    try {
      const res = await fetch(`${API_URL}/cambiar_password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ passwordActual: passwordData.passwordActual, nuevaPassword: passwordData.nuevaPassword })
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.detail || "Error al cambiar la contraseña");

      setMostrarCambioPassword(false);
      setMensajeExito("Contraseña cambiada correctamente.");
      setPasswordData({ passwordActual: "", nuevaPassword: "", confirmarPassword: "" });

    } catch (err) {
      setErrorPassword(err.message);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "telefono") {
      if (!/^\d*$/.test(value)) return; //solo permitir dígitos
    }

    setDatosEditables({ ...datosEditables, [name]: value });
  };


  const renderDatosPersonales = () => {
    if (cargandoDatos) return <p className="text-center mt-10">Cargando perfil...</p>;
    if (!datosUsuario) return null;

    if (modoEdicion && datosEditables) {
      return (
        <div className="max-w-2xl mx-auto bg-[var(--color-bg-secondary)] p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Editar Perfil</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div><label className="text-sm text-gray-400">Nombre</label><input value={datosEditables.nombre} onChange={e => setDatosEditables({ ...datosEditables, nombre: e.target.value })} className="w-full p-2 rounded bg-[var(--color-bg)] outline-none focus:ring-2 ring-[var(--color-primary)]" /></div>
            <div><label className="text-sm text-gray-400">Apellidos</label><input value={datosEditables.apellidos} onChange={e => setDatosEditables({ ...datosEditables, apellidos: e.target.value })} className="w-full p-2 rounded bg-[var(--color-bg)] outline-none focus:ring-2 ring-[var(--color-primary)]" /></div>
            <div><label className="text-sm text-gray-400">Email</label><input value={datosEditables.email} onChange={e => setDatosEditables({ ...datosEditables, email: e.target.value })} className="w-full p-2 rounded bg-[var(--color-bg)] outline-none focus:ring-2 ring-[var(--color-primary)]" /></div>
            <div>
              <label className="text-sm text-gray-400">Teléfono</label>
              <input
                name="telefono"
                value={datosEditables.telefono || ""}
                onChange={handleEditChange} maxLength={20} inputMode="numeric"
                className="w-full p-2 rounded bg-[var(--color-bg)] outline-none focus:ring-2 ring-[var(--color-primary)]"
              />
            </div>
            <div className="md:col-span-2"><label className="text-sm text-gray-400">Localidad</label><input value={datosEditables.localidad || ""} onChange={e => setDatosEditables({ ...datosEditables, localidad: e.target.value })} className="w-full p-2 rounded bg-[var(--color-bg)] outline-none focus:ring-2 ring-[var(--color-primary)]" /></div>
          </div>
          {errorEdicion && <p className="text-red-500 text-center mb-4">{errorEdicion}</p>}
          <div className="flex justify-center gap-4 mt-6">
            <button onClick={() => setModoEdicion(false)} className="px-4 py-2 bg-gray-600 rounded-lg text-white">Cancelar</button>
            <button onClick={() => setMostrarConfirmacionEdicion(true)} className="px-4 py-2 bg-[var(--color-primary)] rounded-lg text-white font-bold">Guardar</button>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-3xl mx-auto bg-[var(--color-bg-secondary)] shadow-lg rounded-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Datos Personales</h2>
          <button onClick={iniciarEdicion} className="text-[var(--color-primary)] hover:underline">Editar</button>
        </div>
        <div className="grid md:grid-cols-2 gap-6 text-[var(--color-text)]">
          <div><p className="text-sm text-gray-500">Nombre</p><p className="font-semibold text-lg">{datosUsuario.nombre}</p></div>
          <div><p className="text-sm text-gray-500">Apellidos</p><p className="font-semibold text-lg">{datosUsuario.apellidos}</p></div>
          <div><p className="text-sm text-gray-500">Email</p><p className="font-semibold">{datosUsuario.email}</p></div>
          <div><p className="text-sm text-gray-500">Teléfono</p><p className="font-semibold">{datosUsuario.telefono || "—"}</p></div>
          <div><p className="text-sm text-gray-500">Localidad</p><p className="font-semibold">{datosUsuario.localidad || "—"}</p></div>
          <div><p className="text-sm text-gray-500">Miembro desde</p><p className="font-semibold">{new Date(datosUsuario.fechaRegistro.endsWith("Z") ? datosUsuario.fechaRegistro : datosUsuario.fechaRegistro + "Z").toLocaleDateString()}</p></div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-6">
          <button onClick={() => setMostrarCambioPassword(true)} className="text-sm bg-gray-700 px-4 py-2 rounded text-white">Cambiar contraseña</button>
        </div>
      </div>
    );
  };

  const renderHistorial = () => {
    if (cargandoHistorial) return <p className="text-center mt-10">Cargando...</p>;
    if (historialTorneos.length === 0) return <p className="text-center mt-10 opacity-70">No tienes torneos finalizados.</p>;

    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {historialTorneos.map((torneo, i) => {
          const slug = `${torneo.nombreTorneo.replace(/\s+/g, "-")}-${torneo.idTorneo}`;

          return (
            <div key={i} className="bg-[var(--color-bg-secondary)] p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-md border border-transparent hover:border-[var(--color-primary)]/30 transition-colors">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-primary)]">{torneo.nombreTorneo}</h3>

                <Link
                  to={`/torneo/${slug}/en-curso/detalle`}
                  className="text-sm text-blue-400 hover:text-blue-300 underline mb-2 block"
                >
                  Ver Resultados Completos
                </Link>

                <p className="text-sm text-gray-400">
                  {new Date(torneo.fechaHoraInicio.endsWith("Z") ? torneo.fechaHoraInicio : torneo.fechaHoraInicio + "Z").toLocaleDateString()}
                  - {torneo.lugarCelebracion}
                </p>

                <p className="mt-1 text-sm">🎮 {torneo.juego}</p>
              </div>
              <div className="text-right bg-[var(--color-bg)] p-3 rounded-lg min-w-[120px]">
                <p className="text-xs text-gray-500 uppercase">Posición</p>
                <p className="text-2xl font-bold">{torneo.posicion ?? "-"}</p>
                <p className="text-xs text-gray-500 mt-1">Puntos: {torneo.puntos ?? 0}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-4">Necesitas iniciar sesión para ver tu perfil</h2>
        <button onClick={() => navigate("/login", { state: { from: location.pathname } })} className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg">Iniciar sesión</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play">
      <div className="pt-16 px-4 md:px-8 flex gap-8 relative">

        {menuAbierto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setMenuAbierto(false)}
          ></div>
        )}

        {/*Sidebar*/}
        <SidebarPerfil
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setPaginaActual(1);
            setFiltrosPerfil({ nombre: "", fecha_inicio: "", fecha_fin: "", juego: "" });
          }}
          filtros={filtrosPerfil}
          setFiltros={setFiltrosPerfil}
          juegos={juegos}
          mostrarFiltros={mostrarFiltros}
          onToggleFiltros={() => setMostrarFiltros(!mostrarFiltros)}
          abierto={menuAbierto}
          setAbierto={setMenuAbierto}
        />

        <main className="flex-1 min-w-0 transition-all duration-300">
          <button
            onClick={() => setMenuAbierto(true)}
            className={`mb-4 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md ${menuAbierto ? 'md:hidden' : 'flex'}`}
          >
            <span>☰</span> Opciones
          </button>

          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Perfil de {user.usuario}</h1>
          </header>

          {mensajeExito && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mb-6 text-center">{mensajeExito}</div>}

          {activeTab === "datos" && renderDatosPersonales()}
          {activeTab === "historial" && renderHistorial()}
          {activeTab === "participar" && renderTorneos(filtrarTorneos(torneosParticipas))}
          {activeTab === "organizar" && renderTorneos(filtrarTorneos(torneosOrganizas))}
        </main>

        {mostrarConfirmacionEdicion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl w-80 text-center">
              <h3 className="text-xl font-bold mb-4">¿Guardar cambios?</h3>
              <div className="flex justify-center gap-4">
                <button onClick={guardarCambios} className="bg-[var(--color-primary)] px-4 py-2 rounded text-white">Sí</button>
                <button onClick={() => setMostrarConfirmacionEdicion(false)} className="bg-gray-600 px-4 py-2 rounded text-white">No</button>
              </div>
            </div>
          </div>
        )}

        {mostrarCambioPassword && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl w-96">
              <h3 className="text-xl font-bold mb-4 text-center">Nueva Contraseña</h3>
              <input type="password" placeholder="Actual" className="w-full p-2 mb-3 rounded bg-[var(--color-bg)]" onChange={e => setPasswordData({ ...passwordData, passwordActual: e.target.value })} maxLength={70} />
              <input type="password" placeholder="Nueva" className="w-full p-2 mb-3 rounded bg-[var(--color-bg)]" onChange={e => setPasswordData({ ...passwordData, nuevaPassword: e.target.value })} maxLength={70} />
              <input type="password" placeholder="Confirmar" className="w-full p-2 mb-3 rounded bg-[var(--color-bg)]" onChange={e => setPasswordData({ ...passwordData, confirmarPassword: e.target.value })} maxLength={70} />
              {errorPassword && <p className="text-red-500 text-sm text-center mb-3">{errorPassword}</p>}
              <div className="flex justify-center gap-4">
                <button onClick={guardarPassword} className="bg-[var(--color-primary)] px-4 py-2 rounded text-white">Cambiar</button>
                <button onClick={cerrarCambioPassword} className="bg-gray-600 px-4 py-2 rounded text-white">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}