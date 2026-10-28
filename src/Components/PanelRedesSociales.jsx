import { useState, useEffect, useCallback } from "react";

const ICONOS_REDES = {
  instagram: "📸",
  facebook: "📘",
  linkedin: "💼",
  tiktok: "🎬",
  youtube: "▶️",
  whatsapp: "💬",
};

const PLANTILLAS_POSTS_LHBO = [
  {
    nombre: "💻 Sistemas de Inventario y Facturación Multimoneda",
    titulo: "Controla tu Inventario y Facturación en USD / VES en Tiempo Real",
    contenido:
      "¿Sigues llevando el inventario y las cuentas por cobrar en hojas de cálculo sueltas? En LHBO Sistemas desarrollamos plataformas web con control de stock, facturación multimoneda referenciada a tasa BCV y reporte de ganancias (P&L) automático.",
    hashtags:
      "#LHBOSistemas #SistemaDeInventario #Facturacion #SoftwareEmpresarial #TransformacionDigital #Venezuela",
    imagen_url: "",
    cta_texto: "Solicitar Demostración",
  },
  {
    nombre: "🌐 Diseño de Páginas Web y Catálogos Digitales",
    titulo: "Convierte tu Página Web en una Máquina de Ventas y Cotizaciones",
    contenido:
      "Diseñamos sitios web corporativos ultrarrápidos con catálogo interactivo, recepción automática de requerimientos, elaboración de presupuestos con planes de pago y conexión directa a tu WhatsApp Business.",
    hashtags:
      "#DiseñoWeb #PaginasWeb #CatalogoDigital #VentasOnline #Emprendedores #LHBOSistemas",
    imagen_url: "",
    cta_texto: "Cotizar mi Página Web",
  },
  {
    nombre: "💳 Facilidades de Pago en Desarrollos a la Medida",
    titulo: "Moderniza tu Negocio Hoy con Nuestros Planes de Pago por Cuotas",
    contenido:
      "En LHBO Sistemas nos adaptamos al flujo de caja de tu empresa. Solicita el presupuesto para tu sistema web o aplicación y elige entre pago de contado o cronogramas de pagos parciales.",
    hashtags:
      "#DesarrolloDeSoftware #SistemasALaMedida #Pymes #Automatizacion #Negocios #Tecnologia",
    imagen_url: "",
    cta_texto: "Solicitar Presupuesto",
  },
  {
    nombre: "📊 Automatización de Procesos y Paneles Gerenciales",
    titulo: "Toma Decisiones con Datos Reales de tu Empresa desde Cualquier Lugar",
    contenido:
      "Centraliza las operaciones de tus sucursales, vendedores, citas o servicios técnicos en una plataforma web segura en la nube, accesible desde tu teléfono, tablet o computadora 24/7.",
    hashtags:
      "#GestionEmpresarial #CloudComputing #SoftwareIngenieria #Productividad #LHBOSistemas",
    imagen_url: "",
    cta_texto: "Agendar Consultoría",
  },
];

export default function PanelRedesSociales({
  onVolverInicio,
  onActualizarDatosExternos,
}) {
  const [perfiles, setPerfiles] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoPerfiles, setGuardandoPerfiles] = useState(false);
  const [guardandoPost, setGuardandoPost] = useState(false);
  const [notificacion, setNotificacion] = useState(null);
  const [subPestana, setSubPestana] = useState("publicaciones");

  const [formPost, setFormPost] = useState({
    id: null,
    titulo: "",
    contenido: "",
    hashtags:
      "#LHBOSistemas #DesarrolloDeSoftware #SistemasALaMedida #PaginasWeb",
    imagen_url: "",
    plataformas: ["instagram", "facebook", "whatsapp"],
    estado: "publicado",
    fecha_programada: new Date().toISOString().slice(0, 10),
    cta_texto: "Solicitar Presupuesto",
  });

  const cargarRedes = useCallback(async () => {
    try {
      const res = await fetch("/api/redes-sociales");
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPerfiles(Array.isArray(data.perfiles) ? data.perfiles : []);
        setPublicaciones(
          Array.isArray(data.publicaciones) ? data.publicaciones : []
        );
        if (onActualizarDatosExternos) {
          onActualizarDatosExternos(data);
        }
      }
    } catch {
      // Silencioso en carga inicial
    } finally {
      setCargando(false);
    }
  }, [onActualizarDatosExternos]);

  useEffect(() => {
    cargarRedes();
  }, [cargarRedes]);

  const manejarCambioPerfil = (id, campo, valor) => {
    setPerfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  };

  const guardarPerfiles = async (e) => {
    if (e) e.preventDefault();
    setGuardandoPerfiles(true);
    setNotificacion(null);
    try {
      const res = await fetch("/api/redes-sociales/perfiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfiles }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "No se pudieron guardar los perfiles.");
      }
      setNotificacion({
        tipo: "exito",
        texto:
          "✅ Perfiles oficiales de redes sociales actualizados y sincronizados con la página principal.",
      });
      await cargarRedes();
    } catch (err) {
      setNotificacion({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoPerfiles(false);
    }
  };

  const alternarPlataformaPost = (platId) => {
    setFormPost((prev) => {
      const existe = prev.plataformas.includes(platId);
      const nuevas = existe
        ? prev.plataformas.filter((p) => p !== platId)
        : [...prev.plataformas, platId];
      return {
        ...prev,
        plataformas: nuevas.length > 0 ? nuevas : ["instagram"],
      };
    });
  };

  const aplicarPlantilla = (plantilla) => {
    setFormPost((prev) => ({
      ...prev,
      titulo: plantilla.titulo,
      contenido: plantilla.contenido,
      hashtags: plantilla.hashtags,
      imagen_url: plantilla.imagen_url,
      cta_texto: plantilla.cta_texto,
    }));
  };

  const guardarPublicacion = async (e) => {
    e.preventDefault();
    setGuardandoPost(true);
    setNotificacion(null);
    try {
      const res = await fetch("/api/redes-sociales/publicaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPost),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "No se pudo guardar la publicación.");
      }
      setNotificacion({
        tipo: "exito",
        texto: formPost.id
          ? "✅ Publicación actualizada correctamente."
          : "✅ Nueva publicación creada y publicada en el muro social de la web.",
      });
      setFormPost({
        id: null,
        titulo: "",
        contenido: "",
        hashtags:
          "#LHBOSistemas #DesarrolloDeSoftware #SistemasALaMedida #PaginasWeb",
        imagen_url: "",
        plataformas: ["instagram", "facebook", "whatsapp"],
        estado: "publicado",
        fecha_programada: new Date().toISOString().slice(0, 10),
        cta_texto: "Solicitar Presupuesto",
      });
      await cargarRedes();
    } catch (err) {
      setNotificacion({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoPost(false);
    }
  };

  const editarPublicacion = (pub) => {
    setFormPost({
      id: pub.id,
      titulo: pub.titulo || "",
      contenido: pub.contenido || "",
      hashtags: pub.hashtags || "",
      imagen_url: pub.imagen_url || "",
      plataformas: Array.isArray(pub.plataformas)
        ? pub.plataformas
        : ["instagram", "facebook"],
      estado: pub.estado || "publicado",
      fecha_programada:
        pub.fecha_programada || new Date().toISOString().slice(0, 10),
      cta_texto: pub.cta_texto || "Solicitar Presupuesto",
    });
    setSubPestana("publicaciones");
    window.scrollTo({ top: 140, behavior: "smooth" });
  };

  const eliminarPublicacion = async (pubId) => {
    try {
      const res = await fetch(
        `/api/redes-sociales/publicaciones/${pubId}/eliminar`,
        { method: "POST" }
      );
      if (res.ok) {
        setNotificacion({
          tipo: "exito",
          texto: "🗑️ Publicación eliminada del muro social.",
        });
        await cargarRedes();
      }
    } catch {
      // Silencioso
    }
  };

  const construirTextoCompletoPost = (pub) => {
    return [
      `📌 *${pub.titulo}*`,
      "",
      pub.contenido,
      "",
      `👉 ${pub.cta_texto || "Solicita tu presupuesto en"}: ${window.location.origin}`,
      "",
      pub.hashtags || "",
    ]
      .join("\n")
      .trim();
  };

  const copiarPostPortapapeles = async (pub, redDestino = "") => {
    const texto = construirTextoCompletoPost(pub);
    try {
      await navigator.clipboard.writeText(texto);
      setNotificacion({
        tipo: "exito",
        texto: redDestino
          ? `📋 ¡Texto y hashtags copiados al portapapeles! Se abrió ${redDestino} para que solo pegues (Ctrl+V) y publiques.`
          : "📋 ¡Texto completo y hashtags copiados al portapapeles listos para pegar en Instagram o Facebook!",
      });
    } catch {
      setNotificacion({
        tipo: "exito",
        texto: `Texto listo para publicar: ${pub.titulo}`,
      });
    }
  };

  const despacharARedSocial = async (pub, plataforma) => {
    const perfil = perfiles.find((p) => p.id === plataforma);
    await copiarPostPortapapeles(
      pub,
      plataforma.charAt(0).toUpperCase() + plataforma.slice(1)
    );

    if (plataforma === "whatsapp") {
      const texto = construirTextoCompletoPost(pub);
      window.open(
        `https://wa.me/?text=${encodeURIComponent(texto)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    if (plataforma === "facebook") {
      const urlFb = perfil?.url || "https://business.facebook.com/latest/composer";
      window.open(urlFb, "_blank", "noopener,noreferrer");
      return;
    }

    if (plataforma === "instagram") {
      const urlIg = perfil?.url || "https://www.instagram.com/";
      window.open(urlIg, "_blank", "noopener,noreferrer");
      return;
    }

    if (plataforma === "linkedin") {
      const urlLi = perfil?.url || "https://www.linkedin.com/feed/";
      window.open(urlLi, "_blank", "noopener,noreferrer");
      return;
    }

    if (plataforma === "tiktok") {
      const urlTk = perfil?.url || "https://www.tiktok.com/tiktokstudio/upload";
      window.open(urlTk, "_blank", "noopener,noreferrer");
    }
  };

  if (cargando) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm font-bold text-slate-600">
        Cargando Centro de Administración de Redes Sociales...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo de Redes Sociales */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-pink-500/20 text-pink-300 border border-pink-400/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <span>📱 Centro de Redes Sociales & Contenido Digital</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Administración de Instagram, Facebook, LinkedIn, TikTok y WhatsApp
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Configura los perfiles oficiales que aparecen en{" "}
            <strong>lhbosistemas.com</strong>, redacta publicaciones con
            plantillas profesionales, visualiza cómo quedarán en
            Instagram/Facebook y publícalas con un clic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSubPestana("publicaciones")}
            className={`text-xs font-extrabold px-4 py-3 rounded-xl transition-all cursor-pointer ${
              subPestana === "publicaciones"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            ✍️ Crear y Publicar Contenido ({publicaciones.length})
          </button>
          <button
            type="button"
            onClick={() => setSubPestana("perfiles")}
            className={`text-xs font-extrabold px-4 py-3 rounded-xl transition-all cursor-pointer ${
              subPestana === "perfiles"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            🔗 Configurar Cuentas y Enlaces (
            {perfiles.filter((p) => p.activo).length} activas)
          </button>
          {onVolverInicio && (
            <button
              type="button"
              onClick={onVolverInicio}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold px-4 py-3 rounded-xl transition-colors cursor-pointer"
            >
              🏠 Página Principal
            </button>
          )}
        </div>
      </div>

      {/* Accesos rápidos a herramientas externas de Meta / Redes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-extrabold text-slate-700">
          🚀 Conexión directa con plataformas oficiales de publicación:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://business.facebook.com/latest/home"
            target="_blank"
            rel="noreferrer"
            className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            📘 Meta Business Suite (IG + FB) ↗
          </a>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            📸 Instagram Web ↗
          </a>
          <a
            href="https://www.tiktok.com/tiktokstudio/upload"
            target="_blank"
            rel="noreferrer"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            🎬 TikTok Studio ↗
          </a>
          <a
            href="https://www.linkedin.com/"
            target="_blank"
            rel="noreferrer"
            className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            💼 LinkedIn Pages ↗
          </a>
        </div>
      </div>

      {/* Notificación de estado */}
      {notificacion && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs sm:text-sm font-bold ${
            notificacion.tipo === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          <span>{notificacion.texto}</span>
          <button
            type="button"
            onClick={() => setNotificacion(null)}
            className="underline text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* VISTA 1: ESTUDIO DE CREACIÓN Y BANDEJA DE PUBLICACIONES            */}
      {/* ================================================================== */}
      {subPestana === "publicaciones" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Formulario Creador de Post */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {formPost.id
                      ? `✏️ Editando Publicación #${formPost.id}`
                      : "✍️ Redactar Nueva Publicación para Redes y Web"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Usa una plantilla rápida o escribe el contenido de tu post.
                  </p>
                </div>
                {formPost.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormPost({
                        id: null,
                        titulo: "",
                        contenido: "",
                        hashtags:
                          "#LHBOSistemas #DesarrolloDeSoftware #SistemasALaMedida #PaginasWeb",
                        imagen_url: "",
                        plataformas: ["instagram", "facebook", "whatsapp"],
                        estado: "publicado",
                        fecha_programada: new Date().toISOString().slice(0, 10),
                        cta_texto: "Solicitar Presupuesto",
                      })
                    }
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    + Crear nueva en blanco
                  </button>
                )}
              </div>

              {/* Plantillas Rápidas de 1 Clic */}
              <div>
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  ⚡ Cargar Plantilla Rápida de Contenido:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PLANTILLAS_POSTS_LHBO.map((pl) => (
                    <button
                      key={pl.nombre}
                      type="button"
                      onClick={() => aplicarPlantilla(pl)}
                      className="text-left text-xs font-bold bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-slate-800 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      {pl.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={guardarPublicacion} className="space-y-4">
                {/* Redes Destino */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Redes Sociales Destino
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "instagram",
                      "facebook",
                      "linkedin",
                      "tiktok",
                      "whatsapp",
                    ].map((plat) => {
                      const activa = formPost.plataformas.includes(plat);
                      return (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => alternarPlataformaPost(plat)}
                          className={`text-xs font-extrabold px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                            activa
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span>{ICONOS_REDES[plat]}</span>
                          <span className="capitalize">{plat}</span>
                          {activa && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Título de la Publicación / Campaña *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPost.titulo}
                    onChange={(e) =>
                      setFormPost((p) => ({ ...p, titulo: e.target.value }))
                    }
                    placeholder="Ej. Digitaliza tu Inventario y Facturación en USD/VES"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Texto / Copy para Instagram y Facebook *
                  </label>
                  <textarea
                    rows="4"
                    required
                    value={formPost.contenido}
                    onChange={(e) =>
                      setFormPost((p) => ({ ...p, contenido: e.target.value }))
                    }
                    placeholder="Escribe el mensaje persuasivo que verán tus seguidores y potenciales clientes..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    URL de Imagen / Arte Gráfico (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formPost.imagen_url}
                    onChange={(e) =>
                      setFormPost((p) => ({
                        ...p,
                        imagen_url: e.target.value,
                      }))
                    }
                    placeholder="https://... (Si lo dejas en blanco se usará el banner ejecutivo de LHBO)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Hashtags (Etiquetas de posicionamiento)
                  </label>
                  <input
                    type="text"
                    value={formPost.hashtags}
                    onChange={(e) =>
                      setFormPost((p) => ({ ...p, hashtags: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-blue-700 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={formPost.estado}
                      onChange={(e) =>
                        setFormPost((p) => ({ ...p, estado: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold"
                    >
                      <option value="publicado">
                        🟢 Publicado (Visible en Web)
                      </option>
                      <option value="programado">📅 Programado</option>
                      <option value="borrador">📝 Borrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Fecha de Publicación
                    </label>
                    <input
                      type="date"
                      value={formPost.fecha_programada}
                      onChange={(e) =>
                        setFormPost((p) => ({
                          ...p,
                          fecha_programada: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Botón de Acción (CTA)
                    </label>
                    <input
                      type="text"
                      value={formPost.cta_texto}
                      onChange={(e) =>
                        setFormPost((p) => ({
                          ...p,
                          cta_texto: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={guardandoPost}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm py-3.5 px-6 rounded-2xl transition-colors shadow-md cursor-pointer"
                >
                  {guardandoPost
                    ? "Guardando..."
                    : formPost.id
                      ? "💾 Guardar Cambios en la Publicación"
                      : "✅ Guardar Publicación y Mostrar en el Muro Social"}
                </button>
              </form>
            </div>

            {/* Simulador en Vivo estilo Instagram / Facebook */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                    📱 Vista Previa en Vivo (Instagram / Facebook)
                  </span>
                  <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded-full">
                    Simulador en tiempo real
                  </span>
                </div>

                <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-md">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 p-0.5">
                        <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-white text-[10px] font-black">
                          LH
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-black block leading-none">
                          lhbosistemas
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Desarrollo de Software & Soluciones Web
                        </span>
                      </div>
                    </div>
                    <span className="text-slate-400 font-bold">•••</span>
                  </div>

                  {formPost.imagen_url ? (
                    <div className="h-48 bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100">
                      <img
                        src={formPost.imagen_url}
                        alt="Vista previa"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 flex flex-col justify-between text-white">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">
                        LHBO SISTEMAS · SOLUCIONES WEB
                      </span>
                      <p className="text-base font-black leading-snug">
                        {formPost.titulo ||
                          "Digitaliza y Automatiza tu Empresa con Software a la Medida"}
                      </p>
                      <span className="text-[11px] text-blue-200">
                        lhbosistemas.com
                      </span>
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-3">
                        <span>❤️</span>
                        <span>💬</span>
                        <span>🚀</span>
                      </div>
                      <span>🔖</span>
                    </div>

                    <p className="text-xs font-black text-slate-900">
                      {formPost.titulo ||
                        "Título de tu publicación en redes sociales"}
                    </p>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                      {formPost.contenido ||
                        "Aquí se mostrará el texto persuasivo de tu publicación a medida que lo escribas o selecciones una plantilla..."}
                    </p>
                    {formPost.hashtags && (
                      <p className="text-[11px] font-semibold text-blue-600">
                        {formPost.hashtags}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copiarPostPortapapeles(formPost)}
                    className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold py-2.5 px-3 rounded-xl cursor-pointer"
                  >
                    📋 Copiar Texto + Hashtags
                  </button>
                  <button
                    type="button"
                    onClick={() => despacharARedSocial(formPost, "instagram")}
                    className="bg-gradient-to-r from-pink-600 to-amber-500 hover:opacity-95 text-white text-xs font-extrabold py-2.5 px-3 rounded-xl cursor-pointer"
                  >
                    📸 Copiar e Ir a Instagram
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Publicaciones Guardadas con Botones de Publicación Directa */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  📚 Bandeja de Publicaciones y Campañas ({publicaciones.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Las publicaciones en estado <strong>Publicado</strong> se
                  muestran automáticamente en la página principal de{" "}
                  <strong>lhbosistemas.com</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicaciones.map((pub) => (
                <div
                  key={pub.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          pub.estado === "publicado"
                            ? "bg-emerald-100 text-emerald-800"
                            : pub.estado === "programado"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {pub.estado} · {pub.fecha_programada}
                      </span>
                      <div className="flex items-center gap-1">
                        {(pub.plataformas || []).map((pl) => (
                          <span key={pl} className="text-sm">
                            {ICONOS_REDES[pl] || "🌐"}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h4 className="text-sm font-black text-slate-900">
                      {pub.titulo}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-3">
                      {pub.contenido}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => despacharARedSocial(pub, "instagram")}
                        className="bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-bold py-2 px-2.5 rounded-xl cursor-pointer"
                      >
                        📸 Publicar en IG
                      </button>
                      <button
                        type="button"
                        onClick={() => despacharARedSocial(pub, "facebook")}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2 px-2.5 rounded-xl cursor-pointer"
                      >
                        📘 Publicar en FB
                      </button>
                      <button
                        type="button"
                        onClick={() => despacharARedSocial(pub, "whatsapp")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 px-2.5 rounded-xl cursor-pointer"
                      >
                        💬 Enviar por WA
                      </button>
                      <button
                        type="button"
                        onClick={() => copiarPostPortapapeles(pub)}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-2 px-2.5 rounded-xl cursor-pointer"
                      >
                        📋 Copiar Post
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => editarPublicacion(pub)}
                        className="text-xs font-extrabold text-blue-700 hover:underline cursor-pointer"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarPublicacion(pub.id)}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* VISTA 2: CONFIGURACIÓN DE PERFILES Y ENLACES OFICIALES             */}
      {/* ================================================================== */}
      {subPestana === "perfiles" && (
        <form
          onSubmit={guardarPerfiles}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                🔗 Perfiles Oficiales de Redes Sociales de LHBO Sistemas
              </h3>
              <p className="text-xs text-slate-500">
                Configura el usuario (<code>@usuario</code>), el enlace directo
                y qué redes están visibles en la página principal de{" "}
                <strong>lhbosistemas.com</strong>.
              </p>
            </div>
            <button
              type="submit"
              disabled={guardandoPerfiles}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-5 py-3 rounded-xl shadow-sm cursor-pointer shrink-0"
            >
              {guardandoPerfiles
                ? "Guardando..."
                : "💾 Guardar Configuración de Redes"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {perfiles.map((red) => (
              <div
                key={red.id}
                className={`rounded-2xl border p-5 space-y-3 transition-all ${
                  red.activo
                    ? "bg-white border-slate-300 shadow-xs"
                    : "bg-slate-50 border-slate-200 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">
                      {ICONOS_REDES[red.id] || "🌐"}
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {red.nombre}
                    </span>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(red.activo)}
                      onChange={(e) =>
                        manejarCambioPerfil(red.id, "activo", e.target.checked)
                      }
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span
                      className={
                        red.activo ? "text-emerald-700" : "text-slate-500"
                      }
                    >
                      {red.activo ? "Visible en la Web" : "Oculto"}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Usuario / Nombre visible
                    </label>
                    <input
                      type="text"
                      value={red.usuario}
                      onChange={(e) =>
                        manejarCambioPerfil(red.id, "usuario", e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      URL / Enlace directo al perfil
                    </label>
                    <input
                      type="text"
                      value={red.url}
                      onChange={(e) =>
                        manejarCambioPerfil(red.id, "url", e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Descripción comercial en la tarjeta
                  </label>
                  <input
                    type="text"
                    value={red.descripcion}
                    onChange={(e) =>
                      manejarCambioPerfil(red.id, "descripcion", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end">
                  <a
                    href={red.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-extrabold text-blue-600 hover:underline"
                  >
                    Probar enlace de {red.nombre} ↗
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={guardandoPerfiles}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold px-6 py-3.5 rounded-xl shadow-md cursor-pointer"
            >
              {guardandoPerfiles
                ? "Guardando..."
                : "💾 Guardar Configuración de Redes Sociales"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
