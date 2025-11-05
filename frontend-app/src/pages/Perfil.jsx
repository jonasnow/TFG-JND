import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Perfil() {
  const { user } = useAuth();
  const [torneos, setTorneos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTorneos = async () => {
      if (!user?.email) {
        console.log("No hay email, se detiene la carga");
        setCargando(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/torneos_usuario/${user.email}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) throw new Error("Error al cargar torneos");
        const data = await response.json();
        setTorneos(data);
      } catch (err) {
        console.error(err);
        setError("No se han podido cargar los torneos.");
      } finally {
        setCargando(false);
      }
    };

    fetchTorneos();
  }, [user]);

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
        Cargando torneos...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Perfil de {user.nombre}
        </h1>
      </div>

      <h2 className="text-2xl font-semibold mb-6 text-gray-700 text-center">
        Torneos en los que participas
      </h2>

      {torneos.length === 0 ? (
        <p className="text-center text-gray-600">
          No estás inscrito en ningún torneo.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {torneos.map((torneo, index) => (
            <div
              key={index}
              className="bg-white shadow-lg rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-800">
                  {torneo.Nombre}
                </h2>

                <p className="text-gray-600 text-sm mb-2">
                  {torneo.LugarCelebracion}
                </p>

                <p className="text-gray-500 text-sm mb-2">
                  {new Date(torneo.FechaHoraInicio).toLocaleString()}
                </p>

                <p className="text-gray-700 mb-2">
                  <strong>Juego:</strong> {torneo.Juego}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Formato del juego:</strong> {torneo.FormatoJuego}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Formato del torneo:</strong> {torneo.FormatoTorneo}
                </p>

                <p className="text-gray-700 mb-4">{torneo.Descripcion}</p>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Precio:</strong> {torneo.Precio} €
                  </p>
                  <p>
                    <strong>Rondas:</strong> {torneo.Rondas}
                  </p>
                  <p>
                    <strong>Rondas:</strong> {torneo.plazasMax}
                  </p>
                  <p>
                    <strong>Duración de las rondas:</strong>{" "}
                    {torneo.DuracionRondas} min
                  </p>
                  <p>
                    <strong>Premios:</strong> {torneo.Premios}
                  </p>
                  <p>
                    <strong>Estado:</strong> {torneo.Estado}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate(`/torneo/${torneo.Nombre.replace(/\s+/g, "-")}-${torneo.idTorneo}`)
                }
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
