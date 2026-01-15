import { useEffect, useRef, useState } from "react";

export default function PerfilFilterDropdown({
  filtros,
  setFiltros,
  juegos,
  onClose
}) {
  const [busquedaJuego, setBusquedaJuego] = useState("");
  const [mostrarJuegos, setMostrarJuegos] = useState(false);
  const contenedorRef = useRef(null);

  const juegosFiltrados = juegos.filter((juego) =>
    juego.nombre.toLowerCase().includes(busquedaJuego.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target)
      ) {
        setMostrarJuegos(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="
        mt-2 w-full
        bg-[var(--color-bg-secondary)]
        shadow-xl rounded-2xl p-4
        transform transition-all duration-200 ease-out
        origin-top animate-dropdown
      "
    >
      <div className="space-y-3">
        <label className="text-sm text-gray-500">Nombre</label>
        <input
          type="text"
          value={filtros.nombre}
          onChange={(e) =>
            setFiltros({ ...filtros, nombre: e.target.value })
          }
          className="w-full p-2 rounded bg-[var(--color-bg)]"
        />

        <label className="text-sm text-gray-500">Fecha inicio</label>
        <input
          type="date"
          onChange={(e) =>
            setFiltros({ ...filtros, fecha_inicio: e.target.value })
          }
          className="w-full p-2 rounded bg-[var(--color-bg)]"
        />

        <label className="text-sm text-gray-500">Fecha fin</label>
        <input
          type="date"
          onChange={(e) =>
            setFiltros({ ...filtros, fecha_fin: e.target.value })
          }
          className="w-full p-2 rounded bg-[var(--color-bg)]"
        />

        <label className="text-sm text-gray-500">Juego</label>

        <div className="relative" ref={contenedorRef}>
          <input
            type="text"
            placeholder="Buscar juego..."
            value={busquedaJuego}
            onChange={(e) => {
              const valor = e.target.value;
              setBusquedaJuego(valor);

              if (valor === "") {
                setFiltros({ ...filtros, juego: "" });
              }

              setMostrarJuegos(true);
            }}
            onFocus={() => setMostrarJuegos(true)}
            className="w-full p-2 rounded bg-[var(--color-bg)]"
          />

          {mostrarJuegos && juegosFiltrados.length > 0 && (
            <ul className="absolute z-50 w-full bg-[var(--color-bg)] border border-gray-600 rounded max-h-40 overflow-y-auto mt-1">
              {juegosFiltrados.map((juego) => (
                <li
                  key={juego.idJuego}
                  onClick={() => {
                    setBusquedaJuego(juego.nombre);
                    setFiltros({ ...filtros, juego: juego.nombre });
                    setMostrarJuegos(false);
                  }}
                  className="p-2 hover:bg-[var(--color-bg-secondary)] cursor-pointer"
                >
                  {juego.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[var(--color-primary)] text-white p-2 rounded-lg"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
