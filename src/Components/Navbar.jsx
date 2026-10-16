export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-slate-900/90 backdrop-blur-md text-white border-b border-slate-800 z-50">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo / Marca */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-tight text-white">
            LHBO<span className="text-blue-500">.</span>
          </span>
          <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-slate-400 font-semibold border-l border-slate-700 pl-3">
            Sistemas & Desarrollo Web
          </span>
        </div>

        {/* Enlaces de navegación */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#servicios" className="hover:text-blue-400 transition-colors">Servicios</a>
          <a href="#experiencia" className="hover:text-blue-400 transition-colors">Trayectoria</a>
          <a href="#soluciones" className="hover:text-blue-400 transition-colors">Soluciones</a>
        </div>

        {/* Botón de acción rápida */}
        <div>
          <a
            href="#contacto"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-md shadow-blue-500/20"
          >
            Contactar
          </a>
        </div>
      </div>
    </nav>
  );
}