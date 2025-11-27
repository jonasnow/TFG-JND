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
      <div className="text-center mt-10 text-gray-600">
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
      <div className="text-center mt-10 text-gray-600">
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Registrar Torneo
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Juego</label>
            <select
              name="idJuego"
              value={formData.idJuego}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Selecciona un juego</option>
              {juegos.map((j) => (
                <option key={j.idJuego} value={j.idJuego}>
                  {j.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Formato del Torneo</label>
            <select
              name="idFormatoTorneo"
              value={formData.idFormatoTorneo}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Selecciona un formato</option>
              {formatosTorneo.map((f) => (
                <option key={f.idFormatoTorneo} value={f.idFormatoTorneo}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              Formato del Juego
            </label>
            <select
              name="idFormatoJuego"
              value={formData.idFormatoJuego}
              onChange={handleChange}
              disabled={!formData.idJuego}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Selecciona un formato</option>
              {formatosJuego.map((fj) => (
                <option key={fj.idFormatoJuego} value={fj.idFormatoJuego}>
                  {fj.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Liga</label>
            <select
              name="idLiga"
              value={formData.idLiga}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Selecciona una liga disponible</option>
              {ligas.map((f) => (
                <option key={f.idLiga} value={f.idLiga}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Precio inscripción</label>
            <input
              type="number"
              name="precioInscripcion"
              value={formData.precioInscripcion}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Plazas Disponibles</label>
            <small className="text-gray-500">Por defecto, número máximo de jugadores para una partida</small>
            <input
              type="number"
              name="plazasMax"
              value={formData.plazasMax}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Número de rondas</label>
            <input
              type="number"
              name="numeroRondas"
              value={formData.numeroRondas}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Duración de rondas (min)</label>

            <input
              type="number"
              name="duracionRondas"
              value={formData.duracionRondas}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Premios</label>
            <textarea
              name="premios"
              value={formData.premios}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Fecha y hora de inicio</label>
            <input
              type="datetime-local"
              name="fechaHoraInicio"
              value={formData.fechaHoraInicio}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Lugar</label>
            <input
              type="text"
              name="lugarCelebracion"
              value={formData.lugarCelebracion}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 rounded-lg text-white transition 
              ${isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isLoading ? "Registrando..." : "Registrar Torneo"}
          </button>
        </form>

        {resultado && (
          <pre className="bg-gray-100 text-sm p-3 rounded-lg mt-4 whitespace-pre-wrap break-words">
            {resultado}
          </pre>
        )}
      </div>
    </div>
  );
}
