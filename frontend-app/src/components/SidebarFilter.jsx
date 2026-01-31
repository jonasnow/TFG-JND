import { useEffect, useRef, useState } from "react";

export default function SidebarFilter({
  abierto,
  setMenuAbierto,
  filtros,
  setFiltros,
  onBuscar,
  busqueda,
  setBusqueda,
  juegos
}) {
  const [busquedaJuego, setBusquedaJuego] = useState("");
  const [mostrarJuegos, setMostrarJuegos] = useState(false);
  const contenedorRef = useRef(null);

  const listaJuegos = juegos || [];
  const juegosFiltrados = listaJuegos.filter((juego) =>
    juego.nombre.toLowerCase().includes(busquedaJuego.toLowerCase())
  );

  useEffect(() => {
    setBusquedaJuego(filtros.juego || "");
  }, [filtros.juego]);

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
    <aside
      className={`
        bg-[var(--color-bg-secondary)] shadow-xl p-5 overflow-y-auto rounded-r-2xl
        fixed top-16 left-0 h-[calc(100vh-64px)] 
        z-40 
        transition-transform duration-300 ease-in-out
        ${abierto ? "translate-x-0" : "-translate-x-full"}
        w-80 border-r border-gray-700
      `}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text)]">Filtros</h2>
        <button
          onClick={() => setMenuAbierto(false)}
          className="text-gray-400 hover:text-white p-2 rounded-lg bg-[var(--color-bg)]"
          aria-label="Cerrar menú"
        >
          ✕
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onBuscar();
        }}
        className="space-y-4"
      >
        <div>
          <label className="text-sm text-gray-500 block mb-1">Nombre torneo</label>
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)] outline-none border border-transparent focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Precio Min</label>
            <input
              type="number"
              placeholder="0"
              value={filtros.precio_min}
              onChange={(e) => setFiltros({ ...filtros, precio_min: e.target.value })}
              className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)] outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Precio Max</label>
            <input
              type="number"
              placeholder="Max"
              value={filtros.precio_max}
              onChange={(e) => setFiltros({ ...filtros, precio_max: e.target.value })}
              className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 block mb-1">Fecha inicio</label>
          <input
            type="date"
            value={filtros.fecha_inicio}
            onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)] outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 block mb-1">Fecha fin</label>
          <input
            type="date"
            value={filtros.fecha_fin}
            onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)] outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500 block mb-1">Lugar</label>
          <input
            type="text"
            placeholder="Ciudad..."
            value={filtros.lugar}
            onChange={(e) => setFiltros({ ...filtros, lugar: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)] outline-none"
          />
        </div>

        <div className="relative" ref={contenedorRef}>
          <label className="text-sm text-gray-500 block mb-1">Juego</label>
          <input
            type="text"
            placeholder="Seleccionar juego..."
            value={busquedaJuego}
            onChange={(e) => {
              setBusquedaJuego(e.target.value);
              if (e.target.value === "") setFiltros({ ...filtros, juego: "" });
              setMostrarJuegos(true);
            }}
            onFocus={() => setMostrarJuegos(true)}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)] outline-none border border-transparent focus:border-[var(--color-primary)]"
          />

          {mostrarJuegos && busquedaJuego && juegosFiltrados.length > 0 && (
            <ul className="absolute z-50 w-full bg-[var(--color-bg)] border border-gray-600 rounded max-h-40 overflow-y-auto mt-1 shadow-lg">
              {juegosFiltrados.map((juego) => (
                <li
                  key={juego.idJuego}
                  onClick={() => {
                    setBusquedaJuego(juego.nombre);
                    setFiltros({ ...filtros, juego: juego.nombre });
                    setMostrarJuegos(false);
                  }}
                  className="p-2 hover:bg-[var(--color-bg-secondary)] cursor-pointer text-sm"
                >
                  {juego.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2 pt-4">

          <button
            type="submit"
            className="flex-1 bg-[var(--color-primary)] text-white p-2 rounded-lg hover:bg-[var(--color-secondary)] transition font-bold text-sm"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltros({ precio_min: "", precio_max: "", fecha_inicio: "", fecha_fin: "", lugar: "", juego: "" });
              setBusqueda("");
              setMenuAbierto(false);
              onBuscar();
            }}
            className="flex-1 bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition text-sm font-semibold"
          >
            Limpiar
          </button>
        </div>
      </form>
    </aside>
  );
}