import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterTorneo() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [juegos, setJuegos] = useState([]);
  const [formatosTorneo, setFormatosTorneo] = useState([]);
  const [formatosJuego, setFormatosJuego] = useState([]);
  const [ligas, setLigas] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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

  // Cargar juegos, formatos base y ligas
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
        idFormatoJuego: "", // Reset formato juego al cambiar juego
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
    setResultado("Enviando...");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/torneo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && !result.errores) {
        setResultado("Torneo registrado");
        setExito(true);

        setTimeout(() => {
          setIsLoading(false);
          navigate("/torneos");
        }, 2000);
      } else {
        if (result.errores) {
          setResultado(JSON.stringify(result.errores, null, 2));
          setExito(false);
          setIsLoading(false);
        }
      }
    } catch (error) {
      setResultado("Error: " + error.message);
      setExito(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] font-play p-6">
      <div className="bg-[var(--color-bg-secondary)] shadow-md rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Registrar Torneo
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/** Inputs y selects adaptados al tema */}
          {[
            { label: "Nombre", name: "nombre", type: "text", required: true },
            { label: "Descripción", name: "descripcion", type: "textarea" },
            { label: "Juego", name: "idJuego", type: "select", required: true, options: juegos },
            { label: "Formato del Torneo", name: "idFormatoTorneo", type: "select", required: true, options: formatosTorneo },
            { label: "Formato del Juego", name: "idFormatoJuego", type: "select", options: formatosJuego, disabled: !formData.idJuego },
            { label: "Liga", name: "idLiga", type: "select", options: ligas },
            { label: "Precio inscripción", name: "precioInscripcion", type: "number" },
            { label: "Plazas Disponibles", name: "plazasMax", type: "number", note: "Por defecto, número máximo de jugadores para una partida" },
            { label: "Número de rondas", name: "numeroRondas", type: "number" },
            { label: "Duración de rondas (min)", name: "duracionRondas", type: "number" },
            { label: "Premios", name: "premios", type: "textarea" },
            { label: "Fecha y hora de inicio", name: "fechaHoraInicio", type: "datetime-local", required: true },
            { label: "Lugar", name: "lugarCelebracion", type: "text", required: true },
          ].map((field) => (
            <div key={field.name}>
              <label className="block mb-1 opacity-80">{field.label}</label>
              {field.note && <small className="block text-gray-500 mb-1">{field.note}</small>}
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 bg-[var(--color-bg)] text-[var(--color-text)] border-gray-300 dark:border-gray-700 font-play focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              ) : field.type === "select" ? (
                <select
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  disabled={field.disabled}
                  required={field.required}
                  className="w-full border rounded-lg p-2 bg-[var(--color-bg)] text-[var(--color-text)] border-gray-300 dark:border-gray-700 font-play focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">Selecciona una opción</option>
                  {field.options && field.options.map((opt) => (
                    <option key={opt.idJuego || opt.idFormatoTorneo || opt.idFormatoJuego || opt.idLiga} value={opt.idJuego || opt.idFormatoTorneo || opt.idFormatoJuego || opt.idLiga}>
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
                  required={field.required}
                  className="w-full border rounded-lg p-2 bg-[var(--color-bg)] text-[var(--color-text)] border-gray-300 dark:border-gray-700 font-play focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading}
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
