export default function Hero() {
  return (
    <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 bg-slate-950 text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl">
          {/* Etiqueta superior */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Consultoría & Soluciones Digitales
          </div>

          {/* Título de alto impacto */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white mb-6">
            Desarrollo web y sistemas a la medida de su{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              empresa o negocio
            </span>
          </h1>

          {/* Subtítulo enfocado en la experiencia y soluciones */}
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-8">
            Más de cinco décadas de criterio técnico y análisis de sistemas aplicados a la creación de páginas web modernas, catálogos en línea y herramientas de gestión empresarial sólidas y confiables.
          </p>

          {/* Botones de llamado a la acción */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#contacto"
              className="inline-flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-center"
            >
              Iniciar una consulta
            </a>
            <a
              href="#servicios"
              className="inline-flex justify-center items-center bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold px-8 py-3.5 rounded-xl transition-all text-center"
            >
              Ver servicios disponibles
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}