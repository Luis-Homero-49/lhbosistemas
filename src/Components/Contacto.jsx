export default function Contacto() {
  return (
    <section id="contacto" className="py-24 bg-slate-900 border-t border-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold block mb-3">
            Iniciemos una conversación
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Hablemos sobre su próximo desarrollo
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Ya sea que requiera una página corporativa moderna o un sistema adaptado a los procesos de su negocio, conversemos para plantear la solución más conveniente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Información y acceso rápido a WhatsApp */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-2">Atención Directa</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Respuesta ágil y asesoría técnica de primera mano, sin intermediarios.
              </p>
              
              {/* Botón directo de WhatsApp */}
              <a
                href="https://wa.me/584243008608?text=Hola%2C%20quisiera%20consultar%20sobre%20un%20proyecto%20web%20o%20un%20sistema%20personalizado."
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-3 px-5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                <span>Escribir directamente al WhatsApp</span>
              </a>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Ubicación & Cobertura
              </span>
              <p className="text-sm text-slate-200">
                Atención remota a proyectos y empresas a nivel nacional e internacional.
              </p>
            </div>
          </div>

          {/* Formulario de consulta */}
          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Empresa o Negocio (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Distribuidora Central"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="nombre@empresa.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Detalles de su necesidad o proyecto
                </label>
                <textarea
                  rows="4"
                  placeholder="Describa brevemente qué tipo de página o sistema requiere..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-sm"
              >
                Enviar Consulta
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}