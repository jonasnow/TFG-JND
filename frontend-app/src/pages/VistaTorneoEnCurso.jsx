import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DetalleTorneoEnCurso() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const idTorneo = slug ? Number(slug.split("-").pop()) : null;

  const [ronda, setRonda] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user && !authLoading) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!idTorneo || !user) return;

    const cargarRonda = async () => {
      try {
        setCargando(true);
        const res = await fetch(
          `http://localhost:8000/rondas/${idTorneo}/ronda-actual`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("Error al cargar la ronda actual");

        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setRonda(data);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    };

    cargarRonda();
  }, [idTorneo, user]);

  if (authLoading || cargando)
    return <p className="text-center mt-6">Cargando ronda...</p>;

  if (error)
    return <p className="text-center mt-6 text-red-500">{error}</p>;

  if (!ronda) return null;

  const mesas = ronda.mesas ?? [];
  const mesasNormales = mesas.filter((m) => m.jugadores.length > 1);
  const mesasBye = mesas.filter((m) => m.jugadores.length === 1);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-4">
        {ronda.nombre}
      </h1>

      <h2 className="text-xl text-center mb-8">
        RONDA {ronda.numeroRonda}
      </h2>

      {mesasNormales.map((mesa) => (
        <div
          key={mesa.idEnfrentamiento}
          className="bg-[var(--color-bg-secondary)] rounded-xl p-4 mb-6 shadow"
        >
          <h3 className="font-semibold mb-4 text-center">
            {mesa.mesa}
          </h3>

          {Array.from({ length: Math.floor(mesa.jugadores.length / 2) }).map(
            (_, pairIndex) => {
              const j1 = mesa.jugadores[pairIndex * 2];
              const j2 = mesa.jugadores[pairIndex * 2 + 1];

              return (
                <div
                  key={pairIndex}
                  className="flex justify-between items-center mb-2"
                >
                  <div className="flex-1 text-right pr-2">
                    {j1?.nombre}
                  </div>


                  <div className="flex-1 text-left pl-2">
                    {j2?.nombre}
                  </div>
                </div>
              );
            }
          )}
        </div>
      ))}

      {mesasBye.length > 0 && (
        <div className="border-2 border-dashed rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-2">Bye</h3>
          {mesasBye.map((mesa) => (
            <p key={mesa.idEnfrentamiento}>
              {mesa.jugadores[0].nombre} descansa esta ronda
            </p>
          ))}
        </div>
      )}

      <div className="text-center mt-8">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
