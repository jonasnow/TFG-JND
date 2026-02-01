import PerfilFilterDropdown from "./PerfilFilterDropdown";

export default function SidebarPerfil({ 
    activeTab, 
    setActiveTab, 
    onToggleFiltros, 
    mostrarFiltros, 
    filtros, 
    setFiltros, 
    juegos, 
    onCloseFiltros,
    abierto,
    setAbierto
}) {
    const items = [
        { id: "datos", label: "Datos personales" },
        { id: "participar", label: "Torneos en los que participas" },
        { id: "organizar", label: "Torneos que organizas" },
        { id: "historial", label: "Historial de participación" },
    ];

    const handleTabClick = (id) => {
        setActiveTab(id);
        if (window.innerWidth < 768) { //móvil
            setAbierto(false);
        }
    };

    return (
        <aside
            className={`
                bg-[var(--color-bg-secondary)] shadow-xl 
                transition-all duration-300 ease-in-out overflow-y-auto
                
                fixed top-16 left-0 h-[calc(100vh-64px)] z-40 border-r border-gray-700
                w-72 p-5
                ${abierto ? "translate-x-0" : "-translate-x-full"}

                md:translate-x-0 md:static md:h-auto md:min-h-[calc(100vh-64px)] 
                md:sticky md:top-16 md:border-none md:rounded-2xl
                
                ${abierto ? "md:w-72 md:opacity-100 md:p-5" : "md:w-0 md:opacity-0 md:p-0 md:overflow-hidden"}
            `}
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-center flex-1 whitespace-nowrap overflow-hidden">
                    Opciones
                </h2>
                
                <button 
                    onClick={() => setAbierto(false)}
                    className="text-gray-400 hover:text-white p-2 rounded-lg bg-[var(--color-bg)] hover:bg-red-500/20 transition-colors"
                    title="Cerrar menú"
                >
                    ✕
                </button>
            </div>

            <nav className="space-y-2 whitespace-nowrap overflow-hidden">
                {items.map((item) => {
                    const esFiltrable = item.id === "participar" || item.id === "organizar";
                    const estaActivo = activeTab === item.id;

                    return (
                        <div key={item.id} className="flex flex-col">
                            <button
                                onClick={() => handleTabClick(item.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                    estaActivo 
                                    ? "bg-[var(--color-primary)] text-white font-bold shadow-md" 
                                    : "hover:bg-[var(--color-bg)] text-[var(--color-text)]"
                                }`}
                            >
                                {item.label}
                            </button>

                            {esFiltrable && estaActivo && (
                                <div className="pl-2 mt-2">
                                    <button
                                        onClick={onToggleFiltros}
                                        className="w-full bg-[var(--color-bg)] px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 transition"
                                    >
                                        <span>🔍</span> Filtrar torneos
                                    </button>

                                    {mostrarFiltros && (
                                        <div className="mt-2">
                                            <PerfilFilterDropdown
                                                filtros={filtros}
                                                setFiltros={setFiltros}
                                                juegos={juegos}
                                                onClose={onCloseFiltros}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}