import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const WHATSAPP_NUMERO = "584243008608";

const ESTADOS_CONFIG = {
  pendiente: {
    etiqueta: "Pendiente de Revisión",
    clases: "bg-amber-100 text-amber-800 border-amber-300",
    punto: "bg-amber-500",
    descripcion:
      "Este presupuesto se encuentra activo y a la espera de su aprobación o comentarios.",
  },
  aprobado: {
    etiqueta: "Presupuesto Aprobado",
    clases: "bg-emerald-100 text-emerald-800 border-emerald-300",
    punto: "bg-emerald-500",
    descripcion:
      "¡Gracias por su confianza! Este presupuesto ha sido aprobado y el proyecto se encuentra en fase de desarrollo.",
  },
  en_negociacion: {
    etiqueta: "En Proceso de Negociación",
    clases: "bg-blue-100 text-blue-800 border-blue-300",
    punto: "bg-blue-600",
    descripcion:
      "Hemos recibido sus observaciones. Nuestro equipo técnico revisará sus comentarios para ajustar la propuesta.",
  },
  rechazado: {
    etiqueta: "Presupuesto Rechazado",
    clases: "bg-rose-100 text-rose-800 border-rose-300",
    punto: "bg-rose-500",
    descripcion:
      "Este presupuesto fue marcado como rechazado. Si desea reactivar la solicitud, contáctenos directamente.",
  },
};

function formatearUsd(monto) {
  const num = Number(monto || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return "Por definir";
  const fecha = new Date(
    fechaStr.includes("T") ? fechaStr : `${fechaStr}T00:00:00`
  );
  if (Number.isNaN(fecha.getTime())) return fechaStr;
  return fecha.toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function VistaPresupuestoCliente({ tokenInicial, onVolverInicio }) {
  const [token, setToken] = useState(tokenInicial || "");
  const [inputToken, setInputToken] = useState(tokenInicial || "");
  const [presupuesto, setPresupuesto] = useState(null);
  const [cargando, setCargando] = useState(Boolean(tokenInicial));
  const [error, setError] = useState("");

  // Estado para acciones del cliente (Aprobar, Negociar, Rechazar)
  const [accionSeleccionada, setAccionSeleccionada] = useState(null); // 'aprobar' | 'negociar' | 'rechazar'
  const [comentarios, setComentarios] = useState("");
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [respuestaExito, setRespuestaExito] = useState(null);
  const [errorRespuesta, setErrorRespuesta] = useState("");

  const cargarPresupuesto = useCallback(async (tokenConsulta) => {
    const limpio = String(tokenConsulta || "").trim();
    if (!limpio) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");
    setRespuestaExito(null);
    setErrorRespuesta("");

    try {
      const res = await fetch(
        `${API_BASE}/api/presupuestos/ver/${encodeURIComponent(limpio)}`
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Presupuesto no encontrado o enlace inválido."
        );
      }

      setPresupuesto(data);
    } catch (err) {
      setPresupuesto(null);
      setError(
        err.message || "No se pudo cargar la información del presupuesto."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!tokenInicial) return;
    let cancelado = false;

    async function fetchInicial() {
      try {
        const res = await fetch(
          `${API_BASE}/api/presupuestos/ver/${encodeURIComponent(tokenInicial.trim())}`
        );
        const data = await res.json().catch(() => ({}));
        if (cancelado) return;
        if (!res.ok) {
          setPresupuesto(null);
          setError(
            data.detail ||
              data.error ||
              "Presupuesto no encontrado o enlace inválido."
          );
        } else {
          setPresupuesto(data);
        }
      } catch (err) {
        if (!cancelado) {
          setPresupuesto(null);
          setError(
            err.message || "No se pudo cargar la información del presupuesto."
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    fetchInicial();
    return () => {
      cancelado = true;
    };
  }, [tokenInicial]);

  const manejarBusquedaManual = (e) => {
    e.preventDefault();
    const limpio = inputToken.trim();
    if (!limpio) return;
    setToken(limpio);
    window.history.pushState(
      {},
      "",
      `/presupuesto/${encodeURIComponent(limpio)}`
    );
    cargarPresupuesto(limpio);
  };

  const enviarDecisionCliente = async (e) => {
    e.preventDefault();
    if (!accionSeleccionada || !token) return;

    if (accionSeleccionada === "negociar" && comentarios.trim().length < 5) {
      setErrorRespuesta(
        "Por favor detalle sus observaciones o ajustes requeridos para poder revisarlos."
      );
      return;
    }

    setEnviandoRespuesta(true);
    setErrorRespuesta("");

    try {
      const res = await fetch(
        `${API_BASE}/api/presupuestos/responder/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accion: accionSeleccionada,
            comentarios: comentarios.trim() || null,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "No se pudo procesar su respuesta en este momento."
        );
      }

      setRespuestaExito(data);
      setAccionSeleccionada(null);
      await cargarPresupuesto(token);
    } catch (err) {
      setErrorRespuesta(
        err.message || "Ocurrió un error al enviar su respuesta."
      );
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const configEstado =
    ESTADOS_CONFIG[presupuesto?.estado] || ESTADOS_CONFIG.pendiente;

  const mensajeWhatsApp = presupuesto
    ? encodeURIComponent(
        `Hola equipo de LHBO Sistemas, estoy revisando el presupuesto ${presupuesto.codigo} (${presupuesto.titulo}) y quisiera conversar al respecto.`
      )
    : encodeURIComponent(
        "Hola equipo de LHBO Sistemas, quisiera consultar sobre un presupuesto."
      );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Barra superior ejecutiva */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:static print:border-none">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            type="button"
            onClick={onVolverInicio}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              LH
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                LHBO<span className="text-blue-600">.</span>
              </span>
              <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-slate-500 font-semibold border-l border-slate-300 pl-3 ml-3">
                Portal de Presupuestos & Proyectos
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3 print:hidden">
            {presupuesto && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>🖨️</span>
                <span className="hidden sm:inline">Imprimir / Guardar PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={onVolverInicio}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <span>←</span>
              <span>Volver al sitio web</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {/* Buscador por token si no hay token activo o si ocurrió un error */}
        {(!token || error) && !cargando && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
            <span className="inline-block text-xs uppercase tracking-widest text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full mb-3">
              Acceso Seguro por Token
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
              Consultar Propuesta Técnica y Económica
            </h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Ingrese el token de acceso seguro proporcionado en su enlace de
              cotización para visualizar los detalles, aprobar el proyecto o
              enviar observaciones.
            </p>

            {error && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-3">
                <span>⚠️ {error}</span>
                <button
                  type="button"
                  onClick={() => {
                    setInputToken("demo-pre-2026-001");
                    setToken("demo-pre-2026-001");
                    window.history.pushState(
                      {},
                      "",
                      "/presupuesto/demo-pre-2026-001"
                    );
                    cargarPresupuesto("demo-pre-2026-001");
                  }}
                  className="underline font-bold text-rose-900 hover:text-blue-700 shrink-0 cursor-pointer"
                >
                  Ver presupuesto demo →
                </button>
              </div>
            )}

            <form onSubmit={manejarBusquedaManual} className="flex gap-3">
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Ej. demo-pre-2026-001 o su UUID de acceso"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Abrir
              </button>
            </form>
          </div>
        )}

        {/* Estado de carga */}
        {cargando && (
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-slate-700">
              Verificando enlace seguro y cargando presupuesto...
            </p>
          </div>
        )}

        {/* Vista detallada del Presupuesto */}
        {presupuesto && !cargando && (
          <div className="space-y-8">
            {/* Banner de confirmación recién enviada */}
            {respuestaExito && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm flex items-start gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {respuestaExito.mensaje}
                  </h3>
                  {respuestaExito.proyecto_id && (
                    <p className="text-xs text-emerald-800 mt-1">
                      Código interno de Proyecto asignado:{" "}
                      <strong>#PROY-{respuestaExito.proyecto_id}</strong>. Nuestro
                      equipo se pondrá en contacto para dar inicio formal al
                      cronograma de trabajo.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Documento principal del presupuesto */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              {/* Cabecera del documento */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-8 sm:p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-xs font-mono uppercase tracking-widest bg-white/10 border border-white/15 px-3 py-1 rounded-lg text-blue-200 font-bold">
                        {presupuesto.codigo}
                      </span>
                      <span
                        className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-1 rounded-full border ${configEstado.clases}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${configEstado.punto}`}
                        ></span>
                        {configEstado.etiqueta}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                      {presupuesto.titulo}
                    </h1>
                  </div>

                  {/* Tarjeta resumen de inversión en USD */}
                  <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-5 md:text-right shrink-0 max-w-xs">
                    <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold block mb-1">
                      Inversión Total Acordada
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      {formatearUsd(presupuesto.monto_total_usd)}{" "}
                      <span className="text-sm font-bold text-blue-300">
                        USD
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-300 block mt-1.5 leading-snug">
                      Si el pago es en bolívares (VES), se calculará a la tasa BCV vigente el día de pago.
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del Cliente y Vigencia */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-8 bg-slate-50/70 border-b border-slate-200 text-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Preparado para
                  </span>
                  <p className="font-bold text-slate-900 text-base">
                    {presupuesto.cliente_nombre}
                  </p>
                  {presupuesto.empresa && (
                    <p className="text-slate-600 text-xs font-medium mt-0.5">
                      {presupuesto.empresa}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Fecha de Vencimiento
                  </span>
                  <p className="font-semibold text-slate-800">
                    {formatearFecha(presupuesto.fecha_vencimiento)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Validez de la oferta comercial
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Estado del Proyecto
                  </span>
                  <p className="font-semibold text-slate-800">
                    {presupuesto.proyecto_id
                      ? `Proyecto #${presupuesto.proyecto_id} (${presupuesto.proyecto_estado || "en_desarrollo"})`
                      : "Se genera automáticamente al aprobar"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    LHBO Sistemas & Desarrollo Web
                  </p>
                </div>
              </div>

              {/* Alcance Técnico Detallado */}
              <div className="p-8 sm:p-10 space-y-8">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-3">
                    Alcance Técnico y Entregables del Proyecto
                  </h2>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {presupuesto.alcance}
                  </div>
                </div>

                {/* Modalidades de Pago y Plan de Pago por Partes (si aplica) */}
                {presupuesto.plan_pago &&
                  (presupuesto.plan_pago.modalidad === "partes" ||
                    presupuesto.plan_pago.modalidad === "ambas") && (
                    <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-6 sm:p-8 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-4">
                        <div>
                          <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-1">
                            Facilidad de Inversión
                          </span>
                          <h2 className="text-lg font-extrabold text-slate-900">
                            💳 Plan de Pago por Partes y Condiciones Financieras
                          </h2>
                        </div>
                        <span className="text-xs font-bold text-blue-800 bg-white border border-blue-200 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                          Periodicidad: {presupuesto.plan_pago.periodicidad}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Pago Inicial (Anticipo)
                          </span>
                          <p className="text-lg font-black text-slate-900">
                            {presupuesto.plan_pago.tiene_inicial
                              ? formatearUsd(
                                  presupuesto.plan_pago.monto_inicial_usd
                                )
                              : "$0.00 USD"}
                          </p>
                          <span className="text-xs text-slate-500">
                            {presupuesto.plan_pago.tiene_inicial
                              ? `${presupuesto.plan_pago.porcentaje_inicial}% al aprobar el proyecto`
                              : "Sin pago inicial requerido"}
                          </span>
                        </div>

                        <div className="bg-white border border-blue-300 ring-2 ring-blue-500/10 rounded-xl p-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                            Pagos Parciales ({presupuesto.plan_pago.numero_cuotas}{" "}
                            cuotas)
                          </span>
                          <p className="text-xl font-black text-blue-700">
                            {formatearUsd(presupuesto.plan_pago.monto_cuota_usd)}{" "}
                            <span className="text-xs font-bold">c/u</span>
                          </p>
                          <span className="text-xs text-slate-600">
                            Frecuencia: {presupuesto.plan_pago.periodicidad}
                          </span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Intereses de Financiamiento
                          </span>
                          <p className="text-lg font-black text-slate-900">
                            {presupuesto.plan_pago.con_intereses
                              ? `${presupuesto.plan_pago.porcentaje_interes}% (${formatearUsd(presupuesto.plan_pago.monto_interes_usd)})`
                              : "0% (Sin Intereses)"}
                          </p>
                          <span className="text-xs text-slate-500">
                            {presupuesto.plan_pago.con_intereses
                              ? "Incluido en el monto de cada cuota"
                              : "Financiamiento directo sin recargo"}
                          </span>
                        </div>

                        <div className="bg-slate-900 text-white rounded-xl p-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
                            Total Plan por Partes
                          </span>
                          <p className="text-lg font-black text-emerald-300">
                            {formatearUsd(
                              presupuesto.plan_pago.monto_total_financiado_usd
                            )}{" "}
                            USD
                          </p>
                          <span className="text-xs text-slate-300">
                            Hasta su total cancelación
                          </span>
                        </div>
                      </div>

                      {/* Cronograma detallado de cada pago parcial con su fecha de vencimiento */}
                      {Array.isArray(
                        presupuesto.plan_pago.cronograma_cuotas
                      ) &&
                        presupuesto.plan_pago.cronograma_cuotas.length > 0 && (
                          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 text-xs font-extrabold text-slate-700">
                              📅 Cronograma de Pagos Parciales y Fechas de
                              Vencimiento
                            </div>
                            <div className="divide-y divide-slate-200 text-xs sm:text-sm">
                              {presupuesto.plan_pago.tiene_inicial && (
                                <div className="px-4 py-3 flex items-center justify-between bg-emerald-50/50">
                                  <div>
                                    <span className="font-extrabold text-emerald-900">
                                      Pago Inicial (Anticipo{" "}
                                      {
                                        presupuesto.plan_pago
                                          .porcentaje_inicial
                                      }
                                      %)
                                    </span>
                                    {presupuesto.plan_pago
                                      .fecha_inicio_pagos && (
                                      <span className="text-slate-600 ml-2">
                                        · Fecha:{" "}
                                        {formatearFecha(
                                          presupuesto.plan_pago
                                            .fecha_inicio_pagos
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-black text-emerald-800">
                                    {formatearUsd(
                                      presupuesto.plan_pago.monto_inicial_usd
                                    )}{" "}
                                    USD
                                  </span>
                                </div>
                              )}
                              {presupuesto.plan_pago.cronograma_cuotas.map(
                                (cuota) => (
                                  <div
                                    key={cuota.numero}
                                    className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                                  >
                                    <div>
                                      <span className="font-bold text-slate-900">
                                        {cuota.concepto}
                                      </span>
                                      <span className="text-slate-600 ml-2">
                                        · Vencimiento:{" "}
                                        <strong className="text-blue-700">
                                          {formatearFecha(
                                            cuota.fecha_vencimiento
                                          )}
                                        </strong>
                                      </span>
                                    </div>
                                    <span className="font-black text-slate-900">
                                      {formatearUsd(cuota.monto_cuota_usd)} USD
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {presupuesto.plan_pago.penalizacion_mora && (
                        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 text-xs text-amber-950 leading-relaxed">
                          <strong className="font-extrabold uppercase tracking-wider block mb-1 text-amber-900">
                            ⚠️ Cláusula de Vencimiento y Penalización por Mora:
                          </strong>
                          {presupuesto.plan_pago.penalizacion_mora}
                        </div>
                      )}
                    </div>
                  )}

                {/* Nota / Coletilla comercial sobre pagos en Bolívares */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-base mt-0.5">ℹ️</span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Condición de pago:</strong> El costo del proyecto está expresado en Dólares Estadounidenses (<strong>USD</strong>). En caso de realizar el pago en Bolívares (<strong>VES</strong>), este deberá efectuarse a la tasa oficial del <strong>Banco Central de Venezuela (BCV)</strong> vigente el día de pago.
                  </p>
                </div>

                {/* Comentarios registrados del cliente si existen */}
                {presupuesto.comentarios_cliente && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-1">
                      Observaciones registradas del cliente:
                    </span>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">
                      {presupuesto.comentarios_cliente}
                    </p>
                  </div>
                )}

                {/* Panel de Decisión del Cliente (Solo activo cuando estado === 'pendiente') */}
                {presupuesto.estado === "pendiente" ? (
                  <div className="border-t border-slate-200 pt-8 print:hidden">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                      Respuesta a esta Propuesta
                    </h3>
                    <p className="text-xs text-slate-600 mb-6">
                      Seleccione una opción para confirmar la aprobación e iniciar
                      el proyecto, proponer ajustes o rechazar el presupuesto:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <button
                        type="button"
                        onClick={() => {
                          setAccionSeleccionada("aprobar");
                          setErrorRespuesta("");
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          accionSeleccionada === "aprobar"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20"
                            : "bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-950 border-emerald-200"
                        }`}
                      >
                        <div className="text-lg font-extrabold mb-1">
                          ✅ Aprobar Presupuesto
                        </div>
                        <p
                          className={`text-xs ${
                            accionSeleccionada === "aprobar"
                              ? "text-emerald-100"
                              : "text-emerald-800"
                          }`}
                        >
                          Acepto el alcance y monto acordado para dar inicio al
                          desarrollo del proyecto.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAccionSeleccionada("negociar");
                          setErrorRespuesta("");
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          accionSeleccionada === "negociar"
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                            : "bg-blue-50/70 hover:bg-blue-100/80 text-blue-950 border-blue-200"
                        }`}
                      >
                        <div className="text-lg font-extrabold mb-1">
                          💬 Solicitar Ajustes
                        </div>
                        <p
                          className={`text-xs ${
                            accionSeleccionada === "negociar"
                              ? "text-blue-100"
                              : "text-blue-800"
                          }`}
                        >
                          Deseo negociar el alcance, los plazos o las condiciones
                          de pago.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAccionSeleccionada("rechazar");
                          setErrorRespuesta("");
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          accionSeleccionada === "rechazar"
                            ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/20"
                            : "bg-rose-50/60 hover:bg-rose-100/70 text-rose-950 border-rose-200"
                        }`}
                      >
                        <div className="text-lg font-extrabold mb-1">
                          ✕ Rechazar Propuesta
                        </div>
                        <p
                          className={`text-xs ${
                            accionSeleccionada === "rechazar"
                              ? "text-rose-100"
                              : "text-rose-800"
                          }`}
                        >
                          Desestimar esta cotización por el momento.
                        </p>
                      </button>
                    </div>

                    {accionSeleccionada && (
                      <form
                        onSubmit={enviarDecisionCliente}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            {accionSeleccionada === "negociar"
                              ? "Detalle los ajustes o comentarios que desea proponer *"
                              : "Comentarios adicionales (Opcional)"}
                          </label>
                          <textarea
                            rows="3"
                            value={comentarios}
                            onChange={(e) => setComentarios(e.target.value)}
                            required={accionSeleccionada === "negociar"}
                            placeholder={
                              accionSeleccionada === "aprobar"
                                ? "Ej. Aprobado, podemos coordinar la reunión de inicio para esta semana..."
                                : accionSeleccionada === "negociar"
                                  ? "Indique qué módulos, plazos o esquema de pagos desea ajustar..."
                                  : "Indique brevemente el motivo por el cual rechaza la propuesta..."
                            }
                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        {errorRespuesta && (
                          <p className="text-xs font-bold text-rose-600">
                            ⚠️ {errorRespuesta}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setAccionSeleccionada(null)}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={enviandoRespuesta}
                            className="bg-slate-900 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-md cursor-pointer"
                          >
                            {enviandoRespuesta
                              ? "Procesando respuesta..."
                              : accionSeleccionada === "aprobar"
                                ? "Confirmar Aprobación e Iniciar Proyecto"
                                : accionSeleccionada === "negociar"
                                  ? "Enviar Propuesta de Negociación"
                                  : "Confirmar Rechazo del Presupuesto"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-slate-600">
                      <strong>Nota de estado:</strong> {configEstado.descripcion}
                    </div>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMERO}?text=${mensajeWhatsApp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition-colors shrink-0 print:hidden"
                    >
                      <span>💬</span>
                      <span>Contactar al Analista por WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
