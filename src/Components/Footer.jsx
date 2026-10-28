const ANIO_ACTUAL = new Date().getFullYear();

export default function Footer({
  onAbrirPresupuesto,
  onAbrirAdmin,
  esAdmin = false,
  onCerrarSesionAdmin,
}) {
  return (
    <footer className="bg-white border-t border-slate-200 py-10 text-slate-700 text-xs">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="font-black text-base tracking-tight text-slate-900">
            LHBO<span className="text-blue-600">.</span> Sistemas
          </span>
          <p className="text-slate-500 mt-1">
            Consultoría y desarrollo computarizado con más de 50 años de
            trayectoria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <a
            href="/presupuesto"
            onClick={(e) => {
              if (onAbrirPresupuesto) {
                e.preventDefault();
                onAbrirPresupuesto("");
              }
            }}
            className="text-slate-600 hover:text-blue-600 transition-colors"
          >
            Portal de Presupuestos (Clientes)
          </a>
          <span className="text-slate-300">•</span>
          <a
            href="/admin"
            onClick={(e) => {
              if (onAbrirAdmin) {
                e.preventDefault();
                onAbrirAdmin();
              }
            }}
            className={
              esAdmin
                ? "text-blue-600 hover:text-blue-800 font-bold transition-colors"
                : "text-slate-400 hover:text-slate-600 transition-colors"
            }
          >
            {esAdmin
              ? "📋 Centro de Requerimientos & Presupuestos"
              : "🔒 Acceso Administrador"}
          </a>
          {esAdmin && onCerrarSesionAdmin && (
            <>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={onCerrarSesionAdmin}
                className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </>
          )}
        </div>

        <div className="text-slate-500 text-center md:text-right">
          © {ANIO_ACTUAL} LHBO Sistemas. Todos los derechos reservados.
        </div>
      </div>

      {/* Botón flotante de WhatsApp permanente */}
      <a
        href="https://wa.me/584243008608?text=Hola%2C%20quisiera%20consultar%20sobre%20un%20proyecto%20web%20o%20un%20sistema%20personalizado."
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-full shadow-xl shadow-emerald-600/30 hover:scale-105 transition-all"
      >
        <span className="text-base">💬</span>
        <span className="hidden sm:inline">¿Consultas? WhatsApp</span>
      </a>
    </footer>
  );
}
