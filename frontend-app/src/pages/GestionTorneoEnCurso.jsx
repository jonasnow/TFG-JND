import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GestionTorneoEnCurso() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const idTorneo = slug ? Number(slug.split("-").pop()) : null;

  const [torneo, setTorneo] = useState(null);
  const [ronda, setRonda] = useState(null);
  const [validarOrganizador, setValidarOrganizador] = useState(true);
  const [cargandoRonda, setCargandoRonda] = useState(true);
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState({});
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [procesando, setProcesando] = useState(false);

  //Redirigir si no hay usuario
  useEffect(() => {
    if (!user && !authLoading) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  //Validar organizador y cargar torneo
  useEffect(() => {
    if (!user || !idTorneo) return;

    let redirect = false;

    const validar = async () => {
      try {
        const res = await fetch(`http://localhost:8000/torneo/${idTorneo}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("No se pudo validar el organizador");

        const data = await res.json();

        if (!data || data.idOrganizador !== user.idUsuario) {
          redirect = true;
          return;
        }

        setTorneo(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setValidarOrganizador(false);

        if (redirect) {
          navigate(`/torneo/${slug}`, { replace: true });
        }
      }
    };

    validar();
  }, [user, idTorneo, slug, navigate]);

  //Cargar la ronda actual
  const cargarRonda = async () => {
    if (!idTorneo) return;

    try {
      setError(null);
      setCargandoRonda(true);

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
        setResultados({});
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setCargandoRonda(false);
    }
  };

  useEffect(() => {
    if (!validarOrganizador && torneo) {
      cargarRonda();
    }
  }, [validarOrganizador, torneo]);

  //Actualizar resultados
  const actualizarResultado = (idEnf, idEquipo, valor) => {
    setResultados((prev) => ({
      ...prev,
      [idEnf]: {
        ...prev[idEnf],
        [idEquipo]: valor,
      },
    }));
  };

  if (authLoading || validarOrganizador || cargandoRonda)
    return <p className="text-center">Cargando ronda...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!ronda) return null;

  const mesas = ronda.mesas ?? [];
  const mesasNormales = mesas.filter((m) => m.jugadores.length > 1);
  const mesasBye = mesas.filter((m) => m.jugadores.length === 1);

  const todosResultadosIntroducidos = mesasNormales.every(
    (mesa) =>
      resultados[mesa.idEnfrentamiento] &&
      mesa.jugadores.every(
        (j) =>
          resultados[mesa.idEnfrentamiento][j.idEquipo] !== undefined &&
          resultados[mesa.idEnfrentamiento][j.idEquipo] !== ""
      )
  );

  //Publicar resultados
  const publicarResultados = async () => {
    if (!idTorneo) return;

    setProcesando(true);

    try {
      for (const mesa of mesasNormales) {
        const payload = {
          idEnfrentamiento: mesa.idEnfrentamiento,
          resultados: mesa.jugadores.map((j) => ({
            idEquipo: j.idEquipo,
            puntos: resultados[mesa.idEnfrentamiento][j.idEquipo],
          })),
        };

        const res = await fetch(
          "http://localhost:8000/enfrentamiento/guardar-resultado",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) throw new Error("Error al guardar los resultados de una mesa");

        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }

      const resCerrar = await fetch(
        "http://localhost:8000/rondas/cerrar-ronda",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idTorneo }),
        }
      );

      if (!resCerrar.ok) throw new Error("Error al cerrar la ronda");

      const cierre = await resCerrar.json();

      if (cierre.finalizado) {
        navigate(`/torneo/${slug}`);
      } else {
        cargarRonda();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesando(false);
      setMostrarConfirmacion(false);
    }
  };

  const ResultadoInput = ({ mesaId, idEquipo, value, actualizarResultado }) => {
    const aumentar = () => actualizarResultado(mesaId, idEquipo, value + 1);
    const disminuir = () => actualizarResultado(mesaId, idEquipo, Math.max(0, value - 1));

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={disminuir}
          className="bg-gray-600 text-white px-2 py-1 rounded"
        >
          -
        </button>
        <span className="w-8 text-center">{value}</span>
        <button
          onClick={aumentar}
          className="bg-[var(--color-primary)] text-white px-2 py-1 rounded"
        >
          +
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">{ronda.nombre}</h1>
      <h2 className="text-xl text-center mb-8">RONDA {ronda.numeroRonda}</h2>

      {mesasNormales.map((mesa) => (
        <div
          key={mesa.idEnfrentamiento}
          className="bg-[var(--color-bg-secondary)] rounded-xl p-4 mb-6 shadow"
        >
          <h3 className="font-semibold mb-4 text-center">{mesa.mesa}</h3>

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

                  <div className="flex gap-2">
                    {j1 && (
                      <ResultadoInput
                        mesaId={mesa.idEnfrentamiento}
                        idEquipo={j1.idEquipo}
                        value={resultados[mesa.idEnfrentamiento]?.[j1.idEquipo] ?? 0}
                        actualizarResultado={actualizarResultado}
                      />
                    )}
                    {j2 && (
                      <ResultadoInput
                        mesaId={mesa.idEnfrentamiento}
                        idEquipo={j2.idEquipo}
                        value={resultados[mesa.idEnfrentamiento]?.[j2.idEquipo] ?? 0}
                        actualizarResultado={actualizarResultado}
                      />
                    )}
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
            <p key={mesa.idEnfrentamiento}>{mesa.jugadores[0].nombre} descansa esta ronda</p>
          ))}
        </div>
      )}

      {todosResultadosIntroducidos && (
        <div className="text-center mt-6">
          <button
            disabled={procesando}
            onClick={() => setMostrarConfirmacion(true)}
            className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg"
          >
            Publicar resultados
          </button>
        </div>
      )}

      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 w-96 text-center shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-white">Confirmar resultados</h2>
            <p className="mb-4 text-white">
              ¿Deseas cerrar la ronda y publicar los resultados?
            </p>
            <div className="flex justify-center gap-4">
              <button
                disabled={procesando}
                onClick={publicarResultados}
                className="bg-[var(--color-primary)] text-white px-4 py-2 rounded"
              >
                Confirmar
              </button>
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {procesando && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="animate-pulse text-3xl mb-2">⏳</div>
            <p>Procesando resultados...</p>
          </div>
        </div>
      )}
    </div>
  );
}
