export default function Servicios() {
  const servicios = [
    {
      titulo: "Presencia Web Corporativa",
      descripcion:
        "Páginas web modernas, rápidas y adaptadas a teléfonos móviles para empresas, comercios y profesionales que necesitan proyectar confianza y captar clientes.",
      puntos: [
        "Diseño adaptativo para móviles y computadoras",
        "Optimización de velocidad y posicionamiento",
        "Integración directa con WhatsApp y correo",
      ],
      colorIcono: "bg-blue-50 text-blue-600 border-blue-200",
      icono: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    },
    {
      titulo: "Sistemas y Aplicaciones a Medida",
      descripcion:
        "Desarrollo de herramientas web enfocadas en resolver necesidades operativas específicas: catálogos interactivos, control de inventario, listas de precios y gestión de procesos.",
      puntos: [
        "Lógica de negocio adaptada a su flujo de trabajo",
        "Manejo ordenado y seguro de información",
        "Acceso directo desde cualquier navegador",
      ],
      colorIcono: "bg-emerald-50 text-emerald-600 border-emerald-200",
      icono: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    {
      titulo: "Mantenimiento y Soporte Continuo",
      descripcion:
        "Asistencia técnica responsable para mantener su plataforma actualizada, segura y operativa sin contratiempos, con respaldo profesional garantizado.",
      puntos: [
        "Actualizaciones de contenido y catálogo",
        "Revisión de seguridad y certificados SSL",
        "Atención técnica directa sin intermediarios",
      ],
      colorIcono: "bg-amber-50 text-amber-600 border-amber-200",
      icono: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="servicios" className="py-24 bg-white border-t border-slate-200 text-slate-900">
      <div className="max-w-6xl mx-auto px-6">
        {/* Encabezado de la sección */}
        <div className="max-w-2xl mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full mb-3">
            Servicios Profesionales
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Soluciones estructuradas para potenciar su actividad comercial
          </h3>
        </div>

        {/* Rejilla de servicios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {servicios.map((srv, index) => (
            <div
              key={index}
              className="bg-slate-50/70 border border-slate-200 rounded-2xl p-8 flex flex-col justify-between hover:bg-white hover:shadow-lg hover:border-blue-300 transition-all duration-300"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 ${srv.colorIcono}`}>
                  {srv.icono}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">
                  {srv.titulo}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {srv.descripcion}
                </p>
              </div>

              <ul className="space-y-2.5 border-t border-slate-200 pt-6">
                {srv.puntos.map((punto, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>{punto}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
