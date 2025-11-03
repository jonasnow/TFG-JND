import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Torneos() {
  const [torneos, setTorneos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
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

  if (cargando) return <p className="text-center mt-6">Cargando torneos...</p>;
  if (error) return <p className="text-center text-red-500 mt-6">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Torneos Vigentes
      </h1>

      {torneos.length === 0 ? (
        <p className="text-center text-gray-600">
          No hay torneos vigentes en este momento.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {torneos.map((torneo) => (
            <div
              key={torneo.idTorneo}
              className="bg-white shadow-lg rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-800">
                  {torneo.nombre}
                </h2>
                <p className="text-gray-600 text-sm mb-2">
                  {torneo.lugarCelebracion}
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  {new Date(torneo.fechaHoraInicio).toLocaleString()}
                </p>
                <p className="text-gray-700 mb-4">{torneo.descripcion}</p>
              </div>
              <button
                onClick={() => navigate(`/torneo/${torneo.idTorneo}`)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Ver detalles
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
