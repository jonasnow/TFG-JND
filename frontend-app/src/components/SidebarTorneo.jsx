import React from "react";

export default function SidebarTorneo({ 
    activeTab, 
    setActiveTab, 
    abierto, 
    setAbierto,
    rondaActual //Si el torneo acabó no sale
}) {
    const items = [
        { id: "partidas", label: "Ronda Actual"},
        { id: "clasificacion", label: "Clasificación"},
        { id: "historico", label: "Historial de Rondas" },
        { id: "detalles", label: "Detalles del Torneo" },
    ];

    const handleTabClick = (id) => {
        setActiveTab(id);
        if (window.innerWidth < 768) {
            setAbierto(false);
        }
    };

    return (
        <aside
            className={`
                bg-[var(--color-bg-secondary)] shadow-xl 
                transition-all duration-300 ease-in-out overflow-y-auto
                
                /* MÓVIL */
                fixed top-16 left-0 h-[calc(100vh-64px)] z-40 border-r border-gray-700
                w-72 p-5
                ${abierto ? "translate-x-0" : "-translate-x-full"}

                /* DESKTOP */
                md:translate-x-0 md:static md:h-auto md:min-h-[calc(100vh-64px)] 
                md:sticky md:top-16 md:border-none md:rounded-2xl
                ${abierto ? "md:w-72 md:opacity-100 md:p-5" : "md:w-0 md:opacity-0 md:p-0 md:overflow-hidden"}
            `}
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[var(--color-primary)] whitespace-nowrap overflow-hidden flex-1">
                    Menú Torneo
                </h2>
                
                <button 
                    onClick={() => setAbierto(false)}
                    className="text-gray-400 hover:text-white p-2 rounded-lg bg-[var(--color-bg)] hover:bg-red-500/20 transition-colors md:hidden"
                >
                    ✕
                </button>
            </div>

            <nav className="space-y-2">
                {items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                                isActive 
                                ? "bg-[var(--color-primary)] text-white font-bold shadow-md transform scale-105" 
                                : "hover:bg-[var(--color-bg)] text-[var(--color-text)] hover:text-white"
                            }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="whitespace-nowrap">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}