import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/auth";

export default function RegisterTorneo() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [juegos, setJuegos] = useState([]);
  const [formatosTorneo, setFormatosTorneo] = useState([]);
  const [formatosJuego, setFormatosJuego] = useState([]);
  const [ligas, setLigas] = useState([]);

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [error, setError] = useState("");
  const [erroresCampos, setErroresCampos] = useState({});
  const [resultado, setResultado] = useState("");
  const [exito, setExito] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precioInscripcion: "",
    numeroRondas: "",
    duracionRondas: "",
    fechaHoraInicio: "",
    lugarCelebracion: "",
    plazasMax: "",
    estado: "PLANIFICADO",
    premios: "",
    idFormatoTorneo: "",
    idJuego: "",
    idFormatoJuego: "",
    idLiga: ""
  });

  const traducirError = (campo, msg, tipo, ctx) => {
    if (["idJuego", "idFormatoTorneo", "idFormatoJuego"].includes(campo)) {
      if (tipo === "int_type" || tipo === "missing") return "Debes seleccionar una opción.";
    }
    if (["nombre", "lugarCelebracion"].includes(campo)) {
      if (tipo === "string_type" || tipo === "missing") return "Este campo no puede estar vacío.";
    }
    if (tipo === "greater_than") return `El valor debe ser mayor a ${ctx?.gt ?? 0}.`;
    if (tipo === "int_type") return "Introduce un número entero válido.";
    if (tipo === "float_type" || msg.includes("valid number")) return "Introduce un importe válido.";
    if (tipo === "datetime_type" || tipo === "missing") return "Fecha inválida.";
    return msg;
  };

  useEffect(() => {
    const inicializar = async () => {
      if (authLoading) return;
      if (!user) {
        setCargandoDatos(false);
        return;
      }
      try {
        const [resJuegos, resFormatos, resLigas] = await Promise.all([
          fetch(`${API_URL}/juegos`),
          fetch(`${API_URL}/formatos_torneo`),
          fetch(`${API_URL}/ligas_disponibles`).catch(() => ({ json: () => [] }))
        ]);

        if (resJuegos.ok) setJuegos(await resJuegos.json());
        if (resFormatos.ok) setFormatosTorneo(await resFormatos.json());
        if (resLigas.ok) setLigas(await resLigas.json());

      } catch (err) {
        console.error(err);
        setError("Error cargando datos iniciales.");
      } finally {
        setCargandoDatos(false);
      }
    };
    inicializar();
  }, [user, authLoading]);

  useEffect(() => {
    if (!formData.idJuego) {
      setFormatosJuego([]);
      return;
    }
    const cargarFormatosJuego = async () => {
      try {
        const response = await fetch(`${API_URL}/formatos_juego/${formData.idJuego}`);
        if (response.ok) {
          const data = await response.json();
          setFormatosJuego(data);
        }
      } catch (err) { console.error(err); }
    };
    cargarFormatosJuego();
  }, [formData.idJuego]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "idJuego") {
      setFormData(prev => ({ ...prev, idJuego: value, idFormatoJuego: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (erroresCampos[name]) {
      setErroresCampos(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setResultado("");
    setErroresCampos({});

    const payload = {
      ...formData,
      idOrganizador: user.idUsuario,
      precioInscripcion: formData.precioInscripcion === "" ? 0 : Number(formData.precioInscripcion),
      numeroRondas: formData.numeroRondas === "" ? 0 : parseInt(formData.numeroRondas),
      duracionRondas: formData.duracionRondas === "" ? 0 : parseInt(formData.duracionRondas),
      plazasMax: formData.plazasMax === "" ? null : parseInt(formData.plazasMax),
      idLiga: formData.idLiga === "" ? null : parseInt(formData.idLiga),
      idJuego: parseInt(formData.idJuego),
      idFormatoTorneo: parseInt(formData.idFormatoTorneo),
      idFormatoJuego: parseInt(formData.idFormatoJuego),
      descripcion: formData.descripcion || null,
      premios: formData.premios || null
    };

    try {
      const response = await fetch(`${API_URL}/torneo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setResultado("¡Torneo creado con éxito! Redirigiendo...");
        setExito(true);
        setTimeout(() => navigate("/torneos"), 2000);
      } else {
        setExito(false);

        if (result.detail && Array.isArray(result.detail)) {
          const nuevosErrores = {};
          result.detail.forEach(err => {
            const campo = err.loc[err.loc.length - 1];
            nuevosErrores[campo] = traducirError(campo, err.msg, err.type, err.ctx);
          });
          setErroresCampos(nuevosErrores);
          setResultado("Por favor, corrige los errores marcados.");
        }
        else {
          const errorMsg = result.detail || "Error al crear el torneo.";
          setResultado(errorMsg);

          if (errorMsg.includes("Round Robin")) {
            setErroresCampos({
              idFormatoTorneo: "No se puede crear un torneo Round Robin de este formato de juego"
            });
          }
        }
      }
    } catch (error) {
      setResultado("Error de conexión con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };
  if (authLoading || (cargandoDatos && user)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] font-play p-6">
        <div className="bg-[var(--color-bg-secondary)] p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <p className="mb-6 opacity-90">Debes iniciar sesión para poder crear y organizar torneos.</p>
          <button
            onClick={() => navigate("/login", { state: { from: location.pathname } })}
            className="w-full bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--color-secondary)] transition font-bold shadow-md"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[var(--color-bg)] text-[var(--color-text)] font-play p-6 pt-20">
      <div className="bg-[var(--color-bg-secondary)] shadow-xl rounded-2xl p-8 w-full max-w-2xl border border-transparent hover:border-[var(--color-primary)] transition-colors duration-300">
        <h1 className="text-3xl font-bold text-center mb-8">Registrar Torneo</h1>

        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm font-semibold">Nombre del Torneo <span className="text-red-500">*</span></label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className={`w-full p-2 rounded bg-[var(--color-bg)] border ${erroresCampos.nombre ? 'border-red-500' : 'border-transparent'} focus:border-[var(--color-primary)] outline-none`} />
              {erroresCampos.nombre && <p className="text-red-500 text-xs mt-1">{erroresCampos.nombre}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-semibold">Juego <span className="text-red-500">*</span></label>
              <select name="idJuego" value={formData.idJuego} onChange={handleChange} className={`w-full p-2 rounded bg-[var(--color-bg)] border ${erroresCampos.idJuego ? 'border-red-500' : 'border-transparent'}`}>
                <option value="">Selecciona...</option>
                {juegos.map(j => <option key={j.idJuego} value={j.idJuego}>{j.nombre}</option>)}
              </select>
              {erroresCampos.idJuego && <p className="text-red-500 text-xs mt-1">{erroresCampos.idJuego}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-semibold">Formato Juego <span className="text-red-500">*</span></label>
              <select name="idFormatoJuego" value={formData.idFormatoJuego} onChange={handleChange} disabled={!formData.idJuego} className={`w-full p-2 rounded bg-[var(--color-bg)] border ${erroresCampos.idFormatoJuego ? 'border-red-500' : 'border-transparent'} disabled:opacity-50`}>
                <option value="">Selecciona...</option>
                {formatosJuego.map(f => <option key={f.idFormatoJuego} value={f.idFormatoJuego}>{f.nombre}</option>)}
              </select>
              {erroresCampos.idFormatoJuego && <p className="text-red-500 text-xs mt-1">{erroresCampos.idFormatoJuego}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-semibold">Formato Torneo <span className="text-red-500">*</span></label>
              <select
                name="idFormatoTorneo"
                value={formData.idFormatoTorneo}
                onChange={handleChange}
                className={`w-full p-2 rounded bg-[var(--color-bg)] border ${erroresCampos.idFormatoTorneo ? 'border-red-500' : 'border-transparent'} focus:border-[var(--color-primary)] outline-none`}
              >
                <option value="">Selecciona...</option>
                {formatosTorneo.map(f => <option key={f.idFormatoTorneo} value={f.idFormatoTorneo}>{f.nombre}</option>)}
              </select>

              {erroresCampos.idFormatoTorneo && (
                <p className="text-red-500 text-xs mt-1 font-bold">
                  {erroresCampos.idFormatoTorneo}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-semibold">Liga (Opcional)</label>
              <select name="idLiga" value={formData.idLiga} onChange={handleChange} className="w-full p-2 rounded bg-[var(--color-bg)] border border-transparent focus:border-[var(--color-primary)] outline-none">
                <option value="">Ninguna</option>
                {ligas.map(l => <option key={l.idLiga} value={l.idLiga}>{l.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-semibold">Fecha y Hora <span className="text-red-500">*</span></label>
              <input type="datetime-local" name="fechaHoraInicio" value={formData.fechaHoraInicio} onChange={handleChange} className={`w-full p-2 rounded bg-[var(--color-bg)] border ${erroresCampos.fechaHoraInicio ? 'border-red-500' : 'border-transparent'}`} />
              {erroresCampos.fechaHoraInicio && <p className="text-red-500 text-xs mt-1">{erroresCampos.fechaHoraInicio}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold">Lugar <span className="text-red-500">*</span></label>
              <input type="text" name="lugarCelebracion" value={formData.lugarCelebracion} onChange={handleChange} className={`w-full p-2 rounded bg-[var(--color-bg)] border ${erroresCampos.lugarCelebracion ? 'border-red-500' : 'border-transparent'}`} />
              {erroresCampos.lugarCelebracion && <p className="text-red-500 text-xs mt-1">{erroresCampos.lugarCelebracion}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold">Precio (€)</label>
              <input type="number" name="precioInscripcion" value={formData.precioInscripcion} onChange={handleChange} placeholder="0" className="w-full p-2 rounded bg-[var(--color-bg)]" />
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold">Plazas Máximas</label>
              <input type="number" name="plazasMax" value={formData.plazasMax} onChange={handleChange} placeholder="Auto" className="w-full p-2 rounded bg-[var(--color-bg)]" />
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold">Nº Rondas <span className="text-red-500">*</span></label>
              <input type="number" name="numeroRondas" value={formData.numeroRondas} onChange={handleChange} className={`w-full p-2 rounded bg-[var(--color-bg)] border ${erroresCampos.numeroRondas ? 'border-red-500' : 'border-transparent'}`} />
              {erroresCampos.numeroRondas && <p className="text-red-500 text-xs mt-1">{erroresCampos.numeroRondas}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold">Duración Ronda (min) <span className="text-red-500">*</span></label>
              <input type="number" name="duracionRondas" value={formData.duracionRondas} onChange={handleChange} className={`w-full p-2 rounded bg-[var(--color-bg)] border ${erroresCampos.duracionRondas ? 'border-red-500' : 'border-transparent'}`} />
              {erroresCampos.duracionRondas && <p className="text-red-500 text-xs mt-1">{erroresCampos.duracionRondas}</p>}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold">Descripción</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" className="w-full p-2 rounded bg-[var(--color-bg)]"></textarea>
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold">Premios</label>
            <textarea name="premios" value={formData.premios} onChange={handleChange} rows="2" className="w-full p-2 rounded bg-[var(--color-bg)]"></textarea>
          </div>

          <button
            type="submit"
            disabled={isLoading || exito}
            className={`w-full py-3 rounded-lg text-white font-bold text-lg transition ${isLoading ? "bg-gray-500 cursor-not-allowed" : "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"}`}
          >
            {isLoading ? "Creando Torneo..." : "Crear Torneo"}
          </button>

          {resultado && (
            <div className={`p-4 rounded-lg text-center font-bold ${exito ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {resultado}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}