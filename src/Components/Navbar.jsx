import { useState } from "react";

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = [
    { nombre: "Servicios", href: "#servicios" },
    { nombre: "Ejemplos por Rubro", href: "#soluciones" },
    { nombre: "Trayectoria", href: "#trayectoria" },
    { nombre: "Contacto", href: "#contacto" },
  ];

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
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          {enlaces.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-blue-600 transition-colors"
            >
              {item.nombre}
            </a>
          ))}
        </div>

        {/* Botones de acción rápida */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="https://wa.me/584243008608?text=Hola%2C%20quisiera%20consultar%20sobre%20un%20proyecto%20web%20o%20un%20sistema%20personalizado."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            WhatsApp Directo
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
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuAbierto ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="https://wa.me/584243008608?text=Hola%2C%20quisiera%20consultar%20sobre%20un%20proyecto%20web%20o%20un%20sistema%20personalizado."
              target="_blank"
              rel="noreferrer"
              className="w-full text-center bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl"
            >
              Escribir por WhatsApp
            </a>
            <a
              href="#contacto"
              onClick={() => setMenuAbierto(false)}
              className="w-full text-center bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl"
            >
              Formulario de Contacto
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
