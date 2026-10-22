export default function Soluciones() {
  const rubros = [
    {
      categoria: "Comercio & Ventas",
      titulo: "Tiendas, Boutiques y Catálogos en Línea",
      descripcion:
        "Muestre sus productos con fotografías claras, precios organizados por categoría y carrito de pedido directo al WhatsApp de su tienda.",
      etiquetaColor: "bg-blue-100 text-blue-700 border-blue-200",
      barraColor: "from-blue-500 to-cyan-500",
      urlEjemplo: "catalogo-comercial.com",
      imagen:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
      funciones: ["Catálogo con buscador", "Pedido directo por WhatsApp", "Fácil actualización de precios"],
    },
    {
      categoria: "Salud & Bienestar",
      titulo: "Clínicas, Consultorios Médicos y Laboratorios",
      descripcion:
        "Portales limpios y confiables para presentar especialidades médicas, horarios de atención, ubicación y solicitud de citas en línea.",
      etiquetaColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      barraColor: "from-emerald-500 to-teal-500",
      urlEjemplo: "centro-medico-salud.com",
      imagen:
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
      funciones: ["Reserva de citas médicas", "Directorio de especialistas", "Consulta de servicios y estudios"],
    },
    {
      categoria: "Industria & Mayoristas",
      titulo: "Distribuidoras, Ferreterías y Repuestos",
      descripcion:
        "Sistemas pensados para negocios con cientos de ítems: listas de precios al mayor y detal, consulta de inventario y cotizaciones rápidas.",
      etiquetaColor: "bg-amber-100 text-amber-800 border-amber-200",
      barraColor: "from-amber-500 to-orange-500",
      urlEjemplo: "distribuidora-central.com",
      imagen:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
      funciones: ["Control de inventario y códigos", "Listas de precios dinámicas", "Solicitud de cotizaciones"],
    },
    {
      categoria: "Gastronomía",
      titulo: "Restaurantes, Panaderías y Cafeterías",
      descripcion:
        "Menús digitales atractivos para celulares, presentación de platos especiales, reservación de mesas y recepción ordenada de pedidos a domicilio.",
      etiquetaColor: "bg-rose-100 text-rose-700 border-rose-200",
      barraColor: "from-rose-500 to-orange-400",
      urlEjemplo: "sabor-y-mesa.com",
      imagen:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      funciones: ["Menú digital con código QR", "Pedidos para delivery / retiro", "Promociones del día"],
    },
    {
      categoria: "Servicios Profesionales",
      titulo: " Escritorios Jurídicos, Contables y Consultoras",
      descripcion:
        "Páginas corporativas sobrias y elegantes que proyectan prestigio, explican sus áreas de práctica y facilitan la captación de nuevos clientes.",
      etiquetaColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
      barraColor: "from-indigo-500 to-blue-600",
      urlEjemplo: "consultores-asociados.com",
      imagen:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      funciones: ["Presentación de credenciales", "Formulario de asesoría", "Artículos y novedades"],
    },
    {
      categoria: "Bienes Raíces & Obras",
      titulo: "Inmobiliarias, Constructoras y Servicios Técnicos",
      descripcion:
        "Vitrinas digitales para exhibir inmuebles en venta o alquiler, proyectos ejecutados, galerías fotográficas y fichas técnicas detalladas.",
      etiquetaColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      barraColor: "from-cyan-500 to-blue-500",
      urlEjemplo: "inmobiliaria-horizonte.com",
      imagen:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
      funciones: ["Filtro por zona y tipo", "Galería de fotos por propiedad", "Contacto directo con asesor"],
    },
  ];

  return (
    <section id="soluciones" className="py-24 bg-sky-50/60 border-t border-slate-200 text-slate-900">
      <div className="max-w-6xl mx-auto px-6">
        {/* Encabezado */}
        <div className="max-w-3xl mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-blue-600 font-bold bg-blue-100/80 px-3 py-1 rounded-full mb-3">
            Ejemplos por Rama de Negocio
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Páginas web y sistemas pensados para cada sector comercial
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Cada actividad tiene sus propias necesidades. Diseñamos interfaces claras, alegres y fáciles de usar tanto para usted como para sus clientes, adaptadas al giro específico de su empresa.
          </p>
        </div>

        {/* Galería de ejemplos con marco de navegador */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rubros.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Barra superior estilo ventana de navegador */}
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono bg-white px-2.5 py-0.5 rounded border border-slate-200">
                    {item.urlEjemplo}
                  </span>
                </div>

                {/* Imagen alegórica del rubro con franja de color */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.imagen}
                    alt={item.titulo}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className={`h-1.5 w-full bg-gradient-to-r ${item.barraColor} absolute bottom-0 left-0`}></div>
                  <span
                    className={`absolute top-3 left-3 text-[11px] font-bold px-3 py-1 rounded-full border shadow-xs ${item.etiquetaColor}`}
                  >
                    {item.categoria}
                  </span>
                </div>

                {/* Contenido descriptivo */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                    {item.titulo}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    {item.descripcion}
                  </p>

                  <ul className="space-y-2 border-t border-slate-100 pt-4">
                    {item.funciones.map((fn, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                          ✓
                        </span>
                        {fn}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pie de tarjeta con enlace a contacto */}
              <div className="px-6 pb-6">
                <a
                  href={`#contacto`}
                  className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 py-2.5 px-4 rounded-xl transition-colors"
                >
                  <span>Me interesa para mi negocio</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
