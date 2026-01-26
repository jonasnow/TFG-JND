import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterTorneo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [juegos, setJuegos] = useState([]);
  const [formatosTorneo, setFormatosTorneo] = useState([]);
  const [formatosJuego, setFormatosJuego] = useState([]);
  const [ligas, setLigas] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [erroresCampos, setErroresCampos] = useState({});
  const [resultado, setResultado] = useState("");
  const [exito, setExito] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    idOrganizador: "",
    idLiga: "",
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
  });
  //Interpretación de errores de validación de Pydantic
  const traducirError = (campo, msg, tipo, ctx) => {
    // 1. Identificamos si el campo es un Select (Desplegable)
    const esSelect = ["idJuego", "idFormatoTorneo", "idFormatoJuego", "idLiga"].includes(campo);

    // 2. Errores de "Campo Requerido" o "Falta valor"
    if (msg.includes("required") || tipo === "missing") {
      return esSelect ? "Selecciona una opción" : "Este campo es obligatorio";
    }

    // 3. Error específico: Cadena vacía en campo con min_length (ej: Lugar)
    if (tipo.includes("too_short") || (ctx && ctx.min_length > 0)) {
      return "Este campo es obligatorio";
    }

    // 4. Errores de Enteros (Int)
    if (msg.includes("valid integer") || tipo === "int_parsing" || tipo === "type_error.integer") {
      return esSelect ? "Selecciona una opción válida" : "Introduce un número entero";
    }

    // 5. Errores de Decimales (Float)
    if (msg.includes("valid number") || tipo === "float_parsing" || tipo === "type_error.float") {
      return "Introduce un importe válido";
    }

    // 6. Errores de String (Texto)
    if (msg.includes("valid string") || tipo === "string_parsing" || tipo === "type_error.string") {
      return "Este campo es obligatorio";
    }

    // 7. Errores de Fecha
    if (msg.includes("valid datetime") || tipo === "datetime_parsing") {
      return "Fecha y hora inválidas";
    }

    // 8. Validaciones de rango numérico
    if (tipo === "greater_than") return `Debe ser mayor que ${ctx.gt}`;
    if (tipo === "greater_than_equal") return `Debe ser mayor o igual a ${ctx.ge}`;

    return msg; // Fallback
  };

  //Cargar juegos, formatos base y ligas
  useEffect(() => {
    const inicializar = async () => {
      if (!user?.email) {
        setCargando(false);
        return;
      }

      try {
        const resJuegos = await fetch("http://localhost:8000/juegos");
        setJuegos(await resJuegos.json());
        const resFormatos = await fetch("http://localhost:8000/formatos_torneo");
        setFormatosTorneo(await resFormatos.json());
        const resLigas = await fetch("http://localhost:8000/ligas_disponibles");
        setLigas(await resLigas.json());
      } catch (err) {
        setError("Error cargando datos iniciales");
      }

      setCargando(false);
    };
    inicializar();
  }, [user]);

  useEffect(() => {
    if (user?.idUsuario) {
      setFormData(prev => ({
        ...prev,
        idOrganizador: user.idUsuario //Carga el id del organizador desde el usuario autenticado
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!formData.idJuego) return;
    const cargarFormatosJuego = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/formatos_juego/${formData.idJuego}`
        );
        const data = await response.json();
        setFormatosJuego(data);
      } catch (err) {
        console.error("Error cargando formatos del juego", err);
        setFormatosJuego([]);
      }
    };
    cargarFormatosJuego();
  }, [formData.idJuego]);

  if (!user)
    return (
      <div className="text-center mt-10 text-[var(--color-text)]">
        No has iniciado sesión.
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
          </button></div>
      </div>
    );

  if (error)
    return (
      <div className="text-center mt-10 text-red-600 font-semibold">
        {error}
      </div>
    );

  if (cargando)
    return (
      <div className="text-center mt-10 text-[var(--color-text)]">
        Cargando...
      </div>
    );

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "idJuego") {
      setFormData((prev) => ({
        ...prev,
        idJuego: value,
        idFormatoJuego: "", //Reset formato juego al cambiar juego
      }));
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setResultado("Enviando...");
    setErroresCampos({}); // Limpiamos errores anteriores
    try {
      const response = await fetch("http://localhost:8000/torneo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && !result.errores) {
        setResultado("Torneo registrado con éxito.");
        setExito(true);
        setIsLoading(true);
        setTimeout(() => {
          navigate("/torneos");
        }, 2000);
      }
      else {
        setExito(false);
        const nuevosErrores = {};

        //Errores de Validación de Tipos (Pydantic - 422)
        if (Array.isArray(result.detail)) {
          result.detail.forEach((error) => {
            //nombre del campo
            const campo = error.loc[error.loc.length - 1];
            nuevosErrores[campo] = traducirError(campo, error.msg, error.type, error.ctx);
          });

          setErroresCampos(nuevosErrores);
          setResultado("Por favor, revisa los campos marcados en rojo.");
        }

        //Errores de Lógica de Negocio (HTTPException - 400)
        else if (typeof result.detail === 'string') {
          if (result.detail.includes("Round Robin")) {
            setErroresCampos({ idFormatoTorneo: result.detail });
            setResultado("Error en el formato del torneo.");
          } else {
            setResultado(result.detail);
          }
        }

        //Estructura antigua de errores (por si acaso)
        else if (result.errores) {
          setErroresCampos(result.errores); // Asumiendo que result.errores ya es un objeto {campo: mensaje}
          setResultado("Por favor, revisa los campos marcados.");
        }

        //Error desconocido
        else {
          setResultado("Ocurrió un error inesperado al procesar la solicitud.");
        }
      }
    } catch (error) {
      console.error("Error de red:", error.message);
      setResultado("Error de conexión con el servidor.");
      setExito(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] font-play p-6">
      <div className="bg-[var(--color-bg-secondary)] shadow-md rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Registrar Torneo
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4" style={{ pointerEvents: isLoading ? "none" : "auto" }}>
          {[
            { label: "Nombre", name: "nombre", type: "text", required: true },
            { label: "Descripción", name: "descripcion", type: "textarea" },
            { label: "Juego", name: "idJuego", type: "select", required: true, options: juegos },
            { label: "Formato del Torneo", name: "idFormatoTorneo", type: "select", required: true, options: formatosTorneo },
            { label: "Formato del Juego", name: "idFormatoJuego", type: "select", required: true, options: formatosJuego, disabled: !formData.idJuego },
            { label: "Liga", name: "idLiga", type: "select", options: ligas },
            { label: "Precio inscripción", name: "precioInscripcion", type: "number", note: "En €" },
            { label: "Plazas Disponibles", name: "plazasMax", type: "number", note: "Por defecto, número máximo de jugadores para una partida" },
            { label: "Número de rondas", name: "numeroRondas", type: "number", required: true },
            { label: "Duración de rondas (min)", name: "duracionRondas", type: "number", required: true },
            { label: "Premios", name: "premios", type: "textarea" },
            { label: "Fecha y hora de inicio", name: "fechaHoraInicio", type: "datetime-local", required: true },
            { label: "Lugar", name: "lugarCelebracion", type: "text", required: true },
          ].map((field) => (
            <div key={field.name}>
              <label className="block mb-1 opacity-80">{field.label}{field.required && <span className="text-red-500">*</span>}
              </label>
              {field.note && <small className="block text-gray-500 mb-1">{field.note}</small>}
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2 bg-[var(--color-bg)] text-[var(--color-text)] font-play focus:outline-none focus:ring-2 
          ${erroresCampos[field.name]
                      ? "border-red-500 focus:ring-red-500" //para errores
                      : "border-gray-300 dark:border-gray-700 focus:ring-[var(--color-primary)]" // Estilo normal
                    }`} />
              ) : field.type === "select" ? (
                <select
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  disabled={field.disabled}
                  className={`w-full border rounded-lg p-2 bg-[var(--color-bg)] text-[var(--color-text)] font-play focus:outline-none focus:ring-2 
          ${erroresCampos[field.name]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-700 focus:ring-[var(--color-primary)]"
                    }`}
                >
                  <option value="">Selecciona una opción</option>
                  {field.options && field.options.map((opt) => (
                    <option key={opt.idJuego || opt.idFormatoTorneo || opt.idFormatoJuego || opt.idLiga} value={opt.idJuego || opt.idFormatoTorneo || opt.idFormatoJuego || opt.idLiga} className="font-play">
                      {opt.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2 bg-[var(--color-bg)] text-[var(--color-text)] font-play focus:outline-none focus:ring-2 
          ${erroresCampos[field.name]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-700 focus:ring-[var(--color-primary)]"
                    }`} />
              )}
              {erroresCampos[field.name] && (
                <p className="text-red-500 text-sm mt-1">
                  {erroresCampos[field.name]}
                </p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading || exito}
            className={`w-full py-2 rounded-lg text-white transition
              ${isLoading ? "bg-gray-400" : "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)]"}`}
          >
            {isLoading ? "Registrando..." : "Registrar Torneo"}
          </button>
        </form>

        {resultado && (
          <pre className="bg-[var(--color-bg)] text-[var(--color-text)] text-sm p-3 rounded-lg mt-4 whitespace-pre-wrap break-words font-play">
            {resultado}
          </pre>
        )}
      </div>
    </div>
  );
}
