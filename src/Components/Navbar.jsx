import { useState } from "react";

export default function Navbar({
  onAbrirPresupuesto,
  onAbrirAdmin,
  cantidadPendientes = 0,
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = [
    { nombre: "Servicios", href: "#servicios" },
    { nombre: "Ejemplos por Rubro", href: "#soluciones" },
    { nombre: "Trayectoria", href: "#trayectoria" },
    { nombre: "Contacto", href: "#contacto" },
  ];

  const irAPresupuesto = (e) => {
    e.preventDefault();
    setMenuAbierto(false);
    if (onAbrirPresupuesto) {
      onAbrirPresupuesto("");
    } else {
      window.location.href = "/presupuesto";
    }
  };

  const irAAdmin = (e) => {
    e.preventDefault();
    setMenuAbierto(false);
    if (onAbrirAdmin) {
      onAbrirAdmin();
    } else {
      window.location.href = "/admin";
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md text-slate-800 border-b border-slate-200 shadow-xs z-50">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo / Marca */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
            LH
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              LHBO<span className="text-blue-600">.</span>
            </span>
            <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-slate-500 font-semibold border-l border-slate-300 pl-3 ml-3">
              Sistemas & Desarrollo Web
            </span>
          </div>
        </a>

        {/* Enlaces de navegación (Escritorio) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          {enlaces.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-blue-600 transition-colors"
            >
              {item.nombre}
            </a>
          ))}
          <a
            href="/presupuesto"
            onClick={irAPresupuesto}
            className="text-blue-600 hover:text-blue-800 font-bold transition-colors"
          >
            Consultar Presupuesto
          </a>
        </div>

        {/* Botones de acción rápida */}
        <div className="hidden sm:flex items-center gap-2.5">
          <a
            href="/admin"
            onClick={irAAdmin}
            className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all border ${
              cantidadPendientes > 0
                ? "bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-400 shadow-sm ring-2 ring-amber-400/30"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
            }`}
            title="Abrir Bandeja de Requerimientos y Elaboración de Presupuestos"
          >
            <span>📋</span>
            <span>Panel Presupuestos</span>
            {cantidadPendientes > 0 && (
              <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full animate-pulse">
                🔔 {cantidadPendientes} nuevo{cantidadPendientes > 1 ? "s" : ""}
              </span>
            )}
          </a>
          <a
            href="#contacto"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            Solicitar Presupuesto
          </a>
        </div>

        {/* Botón menú móvil */}
        <button
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Abrir menú"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {menuAbierto ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {menuAbierto && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 shadow-lg">
          {enlaces.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuAbierto(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              {item.nombre}
            </a>
          ))}
          <a
            href="/presupuesto"
            onClick={irAPresupuesto}
            className="block py-2 text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            Consultar Mi Presupuesto
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="/admin"
              onClick={irAAdmin}
              className="w-full text-center bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              <span>📋 Panel de Requerimientos y Presupuestos</span>
              {cantidadPendientes > 0 && (
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full">
                  🔔 {cantidadPendientes} nuevo{cantidadPendientes > 1 ? "s" : ""}
                </span>
              )}
            </a>
            <a
              href="#contacto"
              onClick={() => setMenuAbierto(false)}
              className="w-full text-center bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl"
            >
              Solicitar Presupuesto
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
