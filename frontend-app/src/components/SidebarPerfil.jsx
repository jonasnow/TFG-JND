
import PerfilFilterDropdown from "./PerfilFilterDropdown";

export default function SidebarPerfil({ activeTab, setActiveTab, onToggleFiltros, mostrarFiltros, filtros, setFiltros, juegos, onCloseFiltros }) {
    const items = [
        { id: "datos", label: "Datos personales" },
        { id: "participar", label: "Torneos en los que participas" },
        { id: "organizar", label: "Torneos que organizas" },
        { id: "historial", label: "Historial de participación" },
    ];

    return (
        <aside
            className="relative bg-[var(--color-bg-secondary)] shadow-xl rounded-2xl p-5 w-72 min-h-[calc(100vh-64px)] sticky top-16"
        >
            <h2 className="text-xl font-bold mb-6 text-center">
                Opciones de perfil
            </h2>

            <nav className="space-y-2">
                {items.map((item) => {
                    const esFiltrable =
                        item.id === "participar" || item.id === "organizar";
                    const estaActivo = activeTab === item.id;

                    return (
                        <div key={item.id} className="flex flex-col">
                            <button
                                onClick={() => setActiveTab(item.id)}
                                className="w-full text-left px-4 py-3 rounded-lg"
                            >
                                {item.label}
                            </button>

                            {/* 🔽 AQUÍ dentro del sidebar */}
                            {esFiltrable && estaActivo && (
                                <div className="pl-2 mt-2">
                                    <button
                                        onClick={onToggleFiltros}
                                        className="w-full bg-[var(--color-bg)] px-3 py-2 rounded-lg text-sm"
                                    >
                                        🔍 Filtrar torneos
                                    </button>

                                    {mostrarFiltros && (
                                        <PerfilFilterDropdown
                                            filtros={filtros}
                                            setFiltros={setFiltros}
                                            juegos={juegos}
                                            onClose={onCloseFiltros}
                                        />
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
