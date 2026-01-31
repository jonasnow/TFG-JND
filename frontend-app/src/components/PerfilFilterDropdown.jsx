import { useEffect, useRef, useState } from "react";

export default function PerfilFilterDropdown({filtros, setFiltros, juegos, onClose}) {
  const [busquedaJuego, setBusquedaJuego] = useState(filtros.juego || "");
  const [mostrarJuegos, setMostrarJuegos] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    setBusquedaJuego(filtros.juego || "");
  }, [filtros.juego]);

  const listaJuegos = juegos;

  const juegosFiltrados = listaJuegos.filter((juego) =>
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
      <div className="space-y-4">
        
        <div>
            <label className="block text-sm text-gray-500 mb-1">Nombre</label>
            <input
            type="text"
            value={filtros.nombre || ""}
            onChange={(e) =>
                setFiltros({ ...filtros, nombre: e.target.value })
            }
            className="w-full p-2 rounded bg-[var(--color-bg)] border border-transparent focus:border-[var(--color-primary)] outline-none transition-colors"
            placeholder="Nombre del torneo..."
            />
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="block text-sm text-gray-500 mb-1">Desde</label>
                <input
                type="date"
                value={filtros.fecha_inicio || ""}
                onChange={(e) =>
                    setFiltros({ ...filtros, fecha_inicio: e.target.value })
                }
                className="w-full p-2 rounded bg-[var(--color-bg)] text-sm outline-none"
                />
            </div>
            <div>
                <label className="block text-sm text-gray-500 mb-1">Hasta</label>
                <input
                type="date"
                value={filtros.fecha_fin || ""}
                onChange={(e) =>
                    setFiltros({ ...filtros, fecha_fin: e.target.value })
                }
                className="w-full p-2 rounded bg-[var(--color-bg)] text-sm outline-none"
                />
            </div>
        </div>

        <div className="relative" ref={contenedorRef}>
          <label className="block text-sm text-gray-500 mb-1">Juego</label>
          <input
            type="text"
            placeholder="Escribe para buscar..."
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
            className="w-full p-2 rounded bg-[var(--color-bg)] border border-transparent focus:border-[var(--color-primary)] outline-none"
          />

          {mostrarJuegos && busquedaJuego && juegosFiltrados.length > 0 && (
            <ul className="absolute z-50 w-full bg-[var(--color-bg-secondary)] border border-gray-600 rounded-lg max-h-48 overflow-y-auto mt-1 shadow-2xl">
              {juegosFiltrados.map((juego) => (
                <li
                  key={juego.idJuego}
                  onClick={() => {
                    setBusquedaJuego(juego.nombre);
                    setFiltros({ ...filtros, juego: juego.nombre });
                    setMostrarJuegos(false);
                  }}
                  className="p-3 text-sm hover:bg-[var(--color-primary)] hover:text-white cursor-pointer transition-colors border-b border-gray-700 last:border-0"
                >
                  {juego.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2 pt-2">
            <button
                onClick={() => {
                    setFiltros({ nombre: "", fecha_inicio: "", fecha_fin: "", juego: "" });
                    setBusquedaJuego("");
                }}
                className="flex-1 bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition"
            >
                Limpiar
            </button>
            <button
                onClick={onClose}
                className="flex-1 bg-[var(--color-primary)] text-white p-2 rounded-lg hover:bg-[var(--color-secondary)] transition"
            >
                Aplicar
            </button>
        </div>
      </div>
    </div>
  );
}