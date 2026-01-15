import { useEffect, useRef, useState } from "react";

export default function SidebarFilter({ abierto, filtros, setFiltros, onBuscar, busqueda, setBusqueda, juegos }) {
  const [busquedaJuego, setBusquedaJuego] = useState("");
  const [mostrarJuegos, setMostrarJuegos] = useState(false);

  const contenedorRef = useRef(null);

  const juegosFiltrados = juegos.filter((juego) =>
    juego.nombre.toLowerCase().includes(busquedaJuego.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
        setMostrarJuegos(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`
        bg-[var(--color-bg-secondary)] shadow-xl p-5 overflow-hidden rounded-2xl
        fixed md:relative top-0 left-0 h-full md:h-auto
        md:min-h-[calc(100vh-64px)]
        z-50 md:z-auto

        transition-all duration-500 ease-in-out
        ${abierto ? "w-72 md:w-80 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-4"}
      `}
    >
      {abierto && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onBuscar();
          }}
          className="space-y-3"
        >
          <label className="text-sm text-gray-500">Buscar por nombre</label>
          <input
            type="text"
            placeholder="Nombre del torneo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />

          <label className="text-sm text-gray-500">Precio mínimo</label>
          <input
            type="number"
            placeholder="€"
            onChange={(e) => setFiltros({ ...filtros, precio_min: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />
          <label className="text-sm text-gray-500">Precio máximo</label>
          <input
            type="number"
            placeholder="€"
            onChange={(e) => setFiltros({ ...filtros, precio_max: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />
          <label className="text-sm text-gray-500">Fecha inicial</label>
          <input
            type="date"
            onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />
          <label className="text-sm text-gray-500">Fecha final</label>

          <input
            type="date"
            onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />
          <label className="text-sm text-gray-500">Lugar de celebración</label>
          <input
            type="text"
            placeholder="Lugar"
            onChange={(e) => setFiltros({ ...filtros, lugar: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
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
              className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
            />

            {mostrarJuegos && juegosFiltrados.length > 0 && (
              <ul className="absolute z-50 w-full bg-[var(--color-bg)] border border-gray-600 rounded max-h-48 overflow-y-auto mt-1">
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
            type="submit"
            className="w-full bg-[var(--color-primary)] text-white p-2 rounded-lg mt-2"
          >
            Buscar
          </button>
        </form>
      )}
    </div>
  );
}
