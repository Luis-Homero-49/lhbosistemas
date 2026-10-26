import { useState } from "react";

const WHATSAPP_NUMERO = "584243008608";
const CORREO_CONTACTO = "luishomerobo@gmail.com";
const API_BASE = import.meta.env.VITE_API_URL || "";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contacto({ onAbrirAdmin }) {
  const [formulario, setFormulario] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    empresa: "",
    rubro: "Página Web / Catálogo Comercial",
    mensaje: "",
  });

  const [estadoCorreo, setEstadoCorreo] = useState({
    enviando: false,
    exito: false,
    correoConfirmado: "",
    error: "",
  });

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    if (estadoCorreo.exito || estadoCorreo.error) {
      setEstadoCorreo({ enviando: false, exito: false, correoConfirmado: "", error: "" });
    }
  };

  const construirTextoConsulta = () => {
    const lineas = [
      "Hola, le escribo desde la página web de LHBO Sistemas.",
      formulario.nombre ? `• Nombre: ${formulario.nombre}` : null,
      formulario.correo ? `• Correo electrónico: ${formulario.correo}` : null,
      formulario.telefono ? `• Teléfono / WhatsApp: ${formulario.telefono}` : null,
      formulario.empresa ? `• Empresa/Negocio: ${formulario.empresa}` : null,
      formulario.rubro ? `• Tipo de proyecto: ${formulario.rubro}` : null,
      formulario.mensaje ? `• Detalles: ${formulario.mensaje}` : null,
    ].filter(Boolean);
    return lineas.join("\n");
  };

  const enviarPorWhatsApp = (e) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(formulario.correo.trim())) {
      setEstadoCorreo({
        enviando: false,
        exito: false,
        correoConfirmado: "",
        error: "Por favor ingrese un correo electrónico válido antes de enviar su requerimiento.",
      });
      return;
    }
    // Registrar también en la Bandeja de Requerimientos del Panel
    fetch(`${API_BASE}/api/presupuestos/requerimientos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formulario),
    }).catch(() => {});
    const texto = encodeURIComponent(construirTextoConsulta());
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${texto}`, "_blank", "noopener,noreferrer");
  };

  const abrirClienteCorreoManual = () => {
    const asunto = encodeURIComponent(
      `Consulta Web - ${formulario.nombre || "Nuevo Proyecto"} (${formulario.rubro})`
    );
    const cuerpo = encodeURIComponent(construirTextoConsulta());
    window.location.href = `mailto:${CORREO_CONTACTO}?subject=${asunto}&body=${cuerpo}`;
  };

  const enviarPorCorreo = async () => {
    const correoLimpio = formulario.correo.trim();

    if (!formulario.nombre.trim() || !correoLimpio || !formulario.mensaje.trim()) {
      setEstadoCorreo({
        enviando: false,
        exito: false,
        correoConfirmado: "",
        error:
          "Por favor complete su nombre, su correo electrónico obligatorio y los detalles de su requerimiento.",
      });
      return;
    }

    if (!EMAIL_REGEX.test(correoLimpio)) {
      setEstadoCorreo({
        enviando: false,
        exito: false,
        correoConfirmado: "",
        error:
          "Por favor ingrese una dirección de correo electrónico válida para poder enviarle la confirmación.",
      });
      return;
    }

    setEstadoCorreo({ enviando: true, exito: false, correoConfirmado: "", error: "" });

    try {
      const res = await fetch(`${API_BASE}/api/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(
          data.error || "No se pudo enviar el correo directamente desde el servidor."
        );
      }

      setEstadoCorreo({
        enviando: false,
        exito: true,
        correoConfirmado: correoLimpio,
        error: "",
      });
      setFormulario({
        nombre: "",
        correo: "",
        telefono: "",
        empresa: "",
        rubro: "Página Web / Catálogo Comercial",
        mensaje: "",
      });
    } catch (err) {
      setEstadoCorreo({
        enviando: false,
        exito: false,
        correoConfirmado: "",
        error:
          err.message ||
          "Hubo un inconveniente al enviar el correo. Puede usar WhatsApp o abrir su cliente de correo.",
      });
    }
  };

  return (
    <section
      id="contacto"
      className="py-24 bg-gradient-to-b from-sky-50/70 to-blue-50/50 border-t border-slate-200 text-slate-900"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <span className="inline-block text-xs uppercase tracking-widest text-blue-600 font-bold bg-blue-100/80 px-3 py-1 rounded-full mb-3">
            Canales de Atención Directa
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Hablemos sobre su próximo desarrollo
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Elija la vía que le resulte más cómoda: escríbanos directamente por WhatsApp, llámenos o complete el formulario para enviarnos los detalles de su negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Columna izquierda: Tarjetas de canales de contacto directo */}
          <div className="lg:col-span-5 space-y-5">
            {/* Tarjeta WhatsApp */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  💬
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">WhatsApp Inmediato</h3>
                  <p className="text-xs text-emerald-700 font-semibold">+58 424-3008608</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Respuesta ágil y asesoría técnica de primera mano, directamente con el analista responsable.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMERO}?text=Hola%2C%20quisiera%20consultar%20sobre%20un%20proyecto%20web%20o%20un%20sistema%20personalizado.`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-3 px-5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                <span>Iniciar chat en WhatsApp</span>
                <span>→</span>
              </a>
            </div>

            {/* Tarjeta Llamada y Correo */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Otras vías de comunicación
              </h3>

              <a
                href={`tel:+${WHATSAPP_NUMERO}`}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📞</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Llamada Telefónica</span>
                    <span className="text-xs text-slate-500">+58 424-3008608</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600">Llamar</span>
              </a>

              <a
                href={`mailto:${CORREO_CONTACTO}`}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">✉️</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Correo Electrónico</span>
                    <span className="text-xs text-slate-500">{CORREO_CONTACTO}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600">Escribir</span>
              </a>
            </div>

            {/* Cobertura */}
            <div className="bg-white/80 border border-slate-200 rounded-2xl p-5">
              <span className="text-xs text-blue-600 uppercase tracking-wider font-bold block mb-1">
                🌎 Ubicación & Cobertura
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Atención personalizada y remota para comercios, profesionales y empresas a nivel nacional e internacional.
              </p>
            </div>
          </div>

          {/* Columna derecha: Formulario interactivo */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-md">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Cuéntenos sobre su idea o requerimiento
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Complete los datos para recibir una confirmación inmediata en su correo y una respuesta personalizada en las próximas <strong>2 a 4 horas hábiles</strong>.
            </p>

            <form className="space-y-4" onSubmit={enviarPorWhatsApp}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Su Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    placeholder="Ej. Juan Pérez"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Su Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={formulario.correo}
                    onChange={manejarCambio}
                    placeholder="Ej. cliente@empresa.com"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Empresa o Negocio
                  </label>
                  <input
                    type="text"
                    name="empresa"
                    value={formulario.empresa}
                    onChange={manejarCambio}
                    placeholder="Ej. Distribuidora Central"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teléfono / WhatsApp (Opcional)
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={manejarCambio}
                    placeholder="Ej. 0414-0000000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rama o Tipo de Solución
                </label>
                <select
                  name="rubro"
                  value={formulario.rubro}
                  onChange={manejarCambio}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                >
                  <option value="Página Web / Catálogo Comercial">Comercio / Catálogo en Línea</option>
                  <option value="Clínica / Consultorio Médico">Salud / Consultorio / Laboratorio</option>
                  <option value="Distribuidora / Inventario y Precios">Distribuidora / Ferretería / Stock</option>
                  <option value="Restaurante / Menú Digital">Restaurante / Gastronomía</option>
                  <option value="Firma Profesional / Consultora">Bufete / Contadores / Consultora</option>
                  <option value="Inmobiliaria / Constructora">Inmobiliaria / Servicios Técnicos</option>
                  <option value="Sistema a Medida">Otro Sistema a la Medida</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detalles de su necesidad o proyecto <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="4"
                  name="mensaje"
                  value={formulario.mensaje}
                  onChange={manejarCambio}
                  placeholder="Describa brevemente qué desea mostrar en su página o qué proceso de su negocio quiere automatizar..."
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors resize-none"
                ></textarea>
              </div>

              {/* Avisos de estado de envío por Resend */}
              {estadoCorreo.exito && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-start gap-2.5">
                  <span>✅</span>
                  <div className="space-y-2">
                    <p className="font-bold">¡Su requerimiento fue recibido con éxito!</p>
                    <p className="text-emerald-700 leading-relaxed">
                      Hemos enviado la confirmación de recepción a{" "}
                      <strong>{estadoCorreo.correoConfirmado}</strong>. Nuestro equipo analizará su solicitud y le responderá en las próximas{" "}
                      <strong>2 a 4 horas hábiles</strong> (plazo máximo de 24 horas).
                    </p>
                    {onAbrirAdmin && (
                      <button
                        type="button"
                        onClick={onAbrirAdmin}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 hover:text-blue-900 underline cursor-pointer pt-1"
                      >
                        <span>📋</span>
                        <span>Ir a la Bandeja de Requerimientos para elaborar este presupuesto →</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {estadoCorreo.error && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <p className="font-semibold">⚠️ {estadoCorreo.error}</p>
                  <button
                    type="button"
                    onClick={abrirClienteCorreoManual}
                    className="underline font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    Abrir mi aplicación de correo manualmente →
                  </button>
                </div>
              )}

              {/* Botones de envío duales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-5 rounded-xl transition-all shadow-md shadow-emerald-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>💬</span>
                  <span>Enviar por WhatsApp</span>
                </button>

                <button
                  type="button"
                  disabled={estadoCorreo.enviando}
                  onClick={enviarPorCorreo}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 px-5 rounded-xl transition-all shadow-md shadow-blue-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait"
                >
                  <span>✉️</span>
                  <span>
                    {estadoCorreo.enviando ? "Enviando correo..." : "Enviar por Correo"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
