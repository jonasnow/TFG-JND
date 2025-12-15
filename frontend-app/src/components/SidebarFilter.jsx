export default function SidebarFilter({ abierto, filtros, setFiltros, onBuscar }) {
  return (
    <div
      className={`
        bg-[var(--color-bg-secondary)] shadow-xl p-5 overflow-hidden
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
          <h2 className="text-lg font-bold mb-4">Filtros</h2>

          <input
            type="number"
            placeholder="Precio mínimo"
            onChange={(e) => setFiltros({ ...filtros, precio_min: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />

          <input
            type="number"
            placeholder="Precio máximo"
            onChange={(e) => setFiltros({ ...filtros, precio_max: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />

          <input
            type="date"
            onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />

          <input
            type="date"
            onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />

          <input
            type="text"
            placeholder="Lugar"
            onChange={(e) => setFiltros({ ...filtros, lugar: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />

          <input
            type="text"
            placeholder="Juego"
            onChange={(e) => setFiltros({ ...filtros, juego: e.target.value })}
            className="w-full p-2 rounded bg-[var(--color-bg)] text-[var(--color-text)]"
          />

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
