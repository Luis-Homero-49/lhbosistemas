const ICONOS_REDES = {
  instagram: "📸",
  facebook: "📘",
  linkedin: "💼",
  tiktok: "🎬",
  youtube: "▶️",
  whatsapp: "💬",
};

const ETIQUETAS_REDES = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
};

export default function SeccionRedesSociales({
  datosRedes,
  onAbrirGestorRedes,
}) {
  const perfilesActivos = (datosRedes?.perfiles || []).filter((p) => p.activo);
  const publicacionesPublicadas = (datosRedes?.publicaciones || []).filter(
    (pub) => pub.estado === "publicado"
  );

  const perfilInstagram =
    perfilesActivos.find((p) => p.id === "instagram") || perfilesActivos[0];

  return (
    <section
      id="redes-sociales"
      className="py-24 bg-slate-50 border-t border-slate-200"
    >
      <div className="max-w-6xl mx-auto px-6 space-y-14">
        {/* Encabezado y Botón de Administración de Redes */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-blue-700 bg-blue-100 border border-blue-200 px-3.5 py-1 rounded-full inline-block">
              📱 Comunidad Digital y Redes Sociales
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Síguenos en Instagram, Facebook y Nuestros Canales Oficiales
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Conoce nuestros desarrollos más recientes, demostraciones de
              sistemas de inventario y facturación multimoneda, y novedades
              sobre transformación digital empresarial.
            </p>
          </div>

          {onAbrirGestorRedes && (
            <button
              type="button"
              onClick={onAbrirGestorRedes}
              className="self-start lg:self-auto bg-slate-900 hover:bg-blue-700 text-white text-xs font-extrabold px-5 py-3.5 rounded-2xl transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0"
            >
              <span>📱</span>
              <span>Administrar Redes Sociales y Publicaciones</span>
              <span>→</span>
            </button>
          )}
        </div>

        {/* Tarjetas de Canales Oficiales Activos */}
        {perfilesActivos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {perfilesActivos.map((red) => (
              <a
                key={red.id}
                href={red.url}
                target="_blank"
                rel="noreferrer"
                className="group bg-white border border-slate-200 hover:border-blue-500 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                        red.color || "from-blue-600 to-cyan-500"
                      } text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform`}
                    >
                      {ICONOS_REDES[red.id] || "🌐"}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {red.nombre}
                      </h3>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {red.usuario}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Oficial
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {red.descripcion}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-slate-900 group-hover:text-blue-600">
                  <span>Abrir {red.nombre}</span>
                  <span>↗</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Muro / Feed de Publicaciones Recientes sincronizadas desde el Gestor */}
        {publicacionesPublicadas.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Últimas Publicaciones Destacadas en Redes
                </h3>
                <p className="text-xs text-slate-500">
                  Contenido gestionado desde el Centro de Redes Sociales de LHBO
                  Sistemas
                </p>
              </div>
              {perfilInstagram && (
                <a
                  href={perfilInstagram.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-extrabold text-pink-600 hover:text-pink-700 underline"
                >
                  Ver perfil {perfilInstagram.usuario} ↗
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {publicacionesPublicadas.slice(0, 6).map((post) => (
                <div
                  key={post.id}
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Cabecera estilo post de Instagram / Facebook */}
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 p-0.5">
                          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-white text-[10px] font-black">
                            LH
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900 block leading-none">
                            LHBO Sistemas
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {post.fecha_programada || "Publicación destacada"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(post.plataformas || []).map((plat) => (
                          <span
                            key={plat}
                            title={ETIQUETAS_REDES[plat] || plat}
                            className="text-sm"
                          >
                            {ICONOS_REDES[plat] || "🌐"}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Imagen opcional o Banner Ejecutivo del Post */}
                    {post.imagen_url ? (
                      <div className="h-44 bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-center">
                        <img
                          src={post.imagen_url}
                          alt={post.titulo}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-28 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-5 flex items-center justify-between text-white">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 block">
                            LHBO SISTEMAS · SOLUCIONES TI
                          </span>
                          <span className="text-sm font-black line-clamp-2 mt-0.5">
                            {post.titulo}
                          </span>
                        </div>
                        <span className="text-2xl">💻</span>
                      </div>
                    )}

                    {/* Cuerpo del Post */}
                    <div className="p-5 space-y-2.5">
                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {post.titulo}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {post.contenido}
                      </p>
                      {post.hashtags && (
                        <p className="text-[11px] font-semibold text-blue-600 leading-relaxed">
                          {post.hashtags}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones inferiores del Post */}
                  <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                    <a
                      href="#contacto"
                      className="flex-1 bg-slate-900 hover:bg-blue-600 text-white text-center text-xs font-extrabold py-2.5 px-3 rounded-xl transition-colors"
                    >
                      {post.cta_texto || "Solicitar Presupuesto"} →
                    </a>
                    {perfilInstagram && (
                      <a
                        href={perfilInstagram.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors"
                        title="Ver en Redes Sociales"
                      >
                        📸
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
