export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-br from-sky-50 via-white to-indigo-50 text-slate-900 overflow-hidden">
      {/* Elementos decorativos suaves de fondo */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-amber-200/40 blur-3xl"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Columna de texto */}
          <div className="lg:col-span-7">
            {/* Etiqueta superior corregida */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Consultoría & Soluciones Digitales
            </div>

            {/* Título de alto impacto */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 mb-6">
              Desarrollo web y sistemas a la medida de su{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                empresa o negocio
              </span>
            </h1>

            {/* Subtítulo enfocado en la experiencia y soluciones */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8">
              Más de cinco décadas de criterio técnico y análisis de sistemas aplicados hoy a la creación de páginas web modernas, catálogos en línea y herramientas de gestión empresarial sólidas, claras y confiables.
            </p>

            {/* Botones de llamado a la acción */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href="#contacto"
                className="inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/25 text-center"
              >
                <span>Iniciar una consulta</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <a
                href="#soluciones"
                className="inline-flex justify-center items-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-8 py-4 rounded-xl transition-all shadow-xs text-center"
              >
                Ver ejemplos por rubro
              </a>
            </div>

            {/* Indicadores rápidos de confianza */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 max-w-lg">
              <div>
                <p className="text-2xl font-extrabold text-blue-600">+50 años</p>
                <p className="text-xs text-slate-500 font-medium">Criterio en sistemas</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-emerald-600">100%</p>
                <p className="text-xs text-slate-500 font-medium">Adaptado a móviles</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-amber-600">Directo</p>
                <p className="text-xs text-slate-500 font-medium">Trato sin intermediarios</p>
              </div>
            </div>
          </div>

          {/* Columna visual: Composición de pantallas de ejemplo */}
          <div className="lg:col-span-5">
            <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-blue-900/10 p-4 sm:p-6">
              {/* Barra de navegador simulada */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  tu-negocio-en-linea.com
                </span>
                <span className="text-xs text-blue-600 font-bold">SSL ✓</span>
              </div>

              {/* Imagen / Vista previa principal */}
              <div className="relative rounded-2xl overflow-hidden mb-4 border border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80"
                  alt="Ejemplo de sistema web comercial moderno"
                  className="w-full h-52 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <span className="inline-block text-[10px] uppercase tracking-wider font-bold bg-blue-500 px-2.5 py-0.5 rounded-full mb-1">
                      Web + Gestión
                    </span>
                    <p className="text-sm font-bold">
                      Catálogos interactivos, paneles de control y portales corporativos
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini tarjetas de rubros */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <a href="#soluciones" className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-100 transition-colors">
                  <span className="text-lg block mb-0.5">🏪</span>
                  <span className="text-[11px] font-bold text-slate-700 block">Comercios</span>
                </a>
                <a href="#soluciones" className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-colors">
                  <span className="text-lg block mb-0.5">🩺</span>
                  <span className="text-[11px] font-bold text-slate-700 block">Salud y Clínicas</span>
                </a>
                <a href="#soluciones" className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100 transition-colors">
                  <span className="text-lg block mb-0.5">📦</span>
                  <span className="text-[11px] font-bold text-slate-700 block">Distribuidoras</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
