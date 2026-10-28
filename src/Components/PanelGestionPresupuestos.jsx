import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

const PLANTILLAS_ALCANCE = {
  "Página Web / Catálogo Comercial": [
    "1. Diseño y desarrollo de Sitio Web Corporativo y Catálogo Digital adaptable a móviles, tablets y escritorio.",
    "2. Panel autogestionable de productos/servicios con categorías, fotografías, precios en USD y botón directo de pedido por WhatsApp.",
    "3. Formulario de requerimientos conectado a correo electrónico con respuesta automática al potencial cliente.",
    "4. Optimización de velocidad de carga, configuración de dominio propio y certificado de seguridad SSL.",
    "5. Capacitación remota de uso y garantía de soporte técnico por 30 días.",
  ].join("\n\n"),
  "Sistema de Inventario / Facturación": [
    "1. Módulo de Inventario y Almacén con control de entradas, salidas, alertas de stock mínimo y precios base en USD.",
    "2. Conversión multimoneda automática en Bolívares (VES) referenciada a la tasa oficial del BCV vigente el día de cobro.",
    "3. Emisión de cotizaciones, notas de entrega y control de cuentas por cobrar (registro de pagos en USD y VES con referencia bancaria).",
    "4. Panel gerencial de Ganancias y Pérdidas (P&L) con reportes exportables.",
    "5. Despliegue en la nube, respaldo de base de datos, capacitación al personal y soporte técnico por 60 días.",
  ].join("\n\n"),
  "Gestión de Citas / Servicios": [
    "1. Portal web interactivo de agendamiento de citas y solicitud de servicios para clientes o pacientes.",
    "2. Panel administrativo de control de agenda, asignación de especialistas/técnicos y estatus de atención.",
    "3. Notificaciones automáticas por correo electrónico y enlace directo de confirmación vía WhatsApp.",
    "4. Historial de atenciones por cliente y reporte de ingresos por servicios prestados.",
    "5. Puesta en producción, certificado SSL y acompañamiento técnico inicial.",
  ].join("\n\n"),
  "Sistema a la Medida": [
    "1. Levantamiento técnico detallado y diseño de arquitectura de base de datos relacional ajustada al flujo operativo del cliente.",
    "2. Desarrollo de interfaz web moderna (Frontend React) y servidor de aplicaciones seguro (Backend API).",
    "3. Módulos operativos personalizados con control de usuarios, perfiles de acceso y bitácora de operaciones.",
    "4. Reportes ejecutivos en tiempo real e impresión/descarga de documentos en formato PDF.",
    "5. Despliegue en servidor productivo, capacitación integral y garantía técnica post-implementación.",
  ].join("\n\n"),
};

function formatearUsd(monto) {
  const num = Number(monto || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatearFechaHora(fechaIso) {
  if (!fechaIso) return "Reciente";
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return fechaIso;
  return fecha.toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obtenerFechaVencimientoSugerida() {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toISOString().slice(0, 10);
}

function limpiarTelefonoWhatsApp(telefono = "") {
  const soloDigitos = String(telefono).replace(/\D/g, "");
  if (!soloDigitos) return "";
  if (soloDigitos.startsWith("0") && soloDigitos.length === 11) {
    return `58${soloDigitos.slice(1)}`;
  }
  if (soloDigitos.length === 10) {
    // Si comienza por operadoras móviles de Venezuela (412, 414, 424, 416, 426) agregar 58; de lo contrario 1 (EE.UU./Canadá)
    if (/^(412|414|424|416|426)/.test(soloDigitos)) {
      return `58${soloDigitos}`;
    }
    return `1${soloDigitos}`;
  }
  return soloDigitos;
}

function obtenerFechaHoyIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return "Por definir";
  const f = new Date(
    fechaStr.includes("T") ? fechaStr : `${fechaStr}T00:00:00`
  );
  if (Number.isNaN(f.getTime())) return fechaStr;
  return f.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calcularFechaCuota(fechaBaseStr, periodicidad = "", indiceCuota = 1) {
  const base = fechaBaseStr ? new Date(`${fechaBaseStr}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return obtenerFechaHoyIso();
  const d = new Date(base.getTime());
  const per = String(periodicidad).toLowerCase();

  if (per.includes("semanal")) {
    d.setDate(d.getDate() + 7 * indiceCuota);
  } else if (per.includes("quincenal") || per.includes("hito")) {
    d.setDate(d.getDate() + 15 * indiceCuota);
  } else if (per.includes("bimestral")) {
    d.setMonth(d.getMonth() + 2 * indiceCuota);
  } else if (per.includes("trimestral")) {
    d.setMonth(d.getMonth() + 3 * indiceCuota);
  } else {
    // Mensual por defecto
    d.setMonth(d.getMonth() + 1 * indiceCuota);
  }
  return d.toISOString().slice(0, 10);
}

function generarTextoPenalizacion(porcentajeMora = 5, diasGracia = 5) {
  return `En caso de incumplimiento en la fecha de vencimiento de cualquiera de los pagos parciales acordados, tras un período de gracia de ${diasGracia} días continuos se aplicará un recargo administrativo por mora del ${porcentajeMora}% sobre el monto de la cuota vencida. De mantenerse el retraso, LHBO Sistemas podrá pausar temporalmente el cronograma de desarrollo, soporte técnico o acceso al sistema hasta la total regularización del saldo vencido.`;
}

function calcularPlanPago(form) {
  const montoBase = Math.max(0, Number(form.monto_total_usd || 0));
  const modalidad = form.modalidad_pago || "ambas";
  const tieneInicial = Boolean(form.tiene_inicial);
  const pctInicial = tieneInicial
    ? Math.min(99, Math.max(0, Number(form.porcentaje_inicial || 0)))
    : 0;
  const montoInicial = tieneInicial
    ? Number(((montoBase * pctInicial) / 100).toFixed(2))
    : 0;
  const saldoFinanciar = Math.max(
    0,
    Number((montoBase - montoInicial).toFixed(2))
  );
  const numeroCuotas = Math.max(1, parseInt(form.numero_cuotas, 10) || 1);
  const periodicidad = form.periodicidad || "Mensual (cada 30 días)";
  const fechaInicioPagos = form.fecha_inicio_pagos || obtenerFechaHoyIso();
  const conIntereses = Boolean(form.con_intereses);
  const porcentajeInteres = conIntereses
    ? Math.max(0, Number(form.porcentaje_interes || 0))
    : 0;
  const tipoInteres = form.tipo_interes || "saldo_deudor";

  // Construir cronograma detallado de cada pago parcial con su saldo deudor, capital, interés y fecha de vencimiento
  const cronogramaCuotas = [];
  let capitalAcumulado = 0;
  let sumaIntereses = 0;
  const capitalBasePorCuota =
    numeroCuotas > 0 ? Number((saldoFinanciar / numeroCuotas).toFixed(2)) : 0;

  for (let i = 1; i <= numeroCuotas; i++) {
    const esUltima = i === numeroCuotas;
    const saldoDeudorActual = Math.max(
      0,
      Number((saldoFinanciar - capitalAcumulado).toFixed(2))
    );
    const capitalCuota = esUltima
      ? saldoDeudorActual
      : capitalBasePorCuota;

    let interesCuota = 0;
    if (conIntereses && porcentajeInteres > 0) {
      if (
        tipoInteres === "saldo_deudor" ||
        tipoInteres === "saldo_deudor_fijo"
      ) {
        // Interés calculado estrictamente sobre el saldo deudor de este período
        interesCuota = Number(
          (saldoDeudorActual * (porcentajeInteres / 100)).toFixed(2)
        );
      } else if (tipoInteres === "por_cuota") {
        interesCuota = Number(
          (saldoFinanciar * (porcentajeInteres / 100)).toFixed(2)
        );
      } else {
        // 'sobre_saldo' (global único dividido entre las cuotas)
        const interesGlobal = Number(
          (saldoFinanciar * (porcentajeInteres / 100)).toFixed(2)
        );
        interesCuota = Number((interesGlobal / numeroCuotas).toFixed(2));
      }
    }

    capitalAcumulado = Number((capitalAcumulado + capitalCuota).toFixed(2));
    sumaIntereses = Number((sumaIntereses + interesCuota).toFixed(2));

    cronogramaCuotas.push({
      numero: i,
      concepto: `Pago Parcial / Cuota #${i} de ${numeroCuotas}`,
      fecha_vencimiento: calcularFechaCuota(fechaInicioPagos, periodicidad, i),
      saldo_deudor_usd: saldoDeudorActual,
      capital_usd: capitalCuota,
      interes_usd: interesCuota,
      monto_cuota_usd: Number((capitalCuota + interesCuota).toFixed(2)),
    });
  }

  const montoInteres = Number(sumaIntereses.toFixed(2));
  const totalEnCuotas = Number((saldoFinanciar + montoInteres).toFixed(2));
  const montoCuotaPromedio =
    numeroCuotas > 0 ? Number((totalEnCuotas / numeroCuotas).toFixed(2)) : 0;

  // Si eligió cuotas iguales sobre saldo deudor ('saldo_deudor_fijo'), nivelamos el monto a pagar en cada cuota
  if (conIntereses && tipoInteres === "saldo_deudor_fijo") {
    let acumNivelado = 0;
    for (let i = 0; i < cronogramaCuotas.length; i++) {
      const esUlt = i === cronogramaCuotas.length - 1;
      const cuotaNiv = esUlt
        ? Math.max(0, Number((totalEnCuotas - acumNivelado).toFixed(2)))
        : montoCuotaPromedio;
      acumNivelado = Number((acumNivelado + cuotaNiv).toFixed(2));
      cronogramaCuotas[i].monto_cuota_usd = cuotaNiv;
    }
  }

  const montoCuota =
    cronogramaCuotas.length > 0
      ? cronogramaCuotas[0].monto_cuota_usd
      : montoCuotaPromedio;
  const montoTotalFinanciado = Number(
    (montoInicial + totalEnCuotas).toFixed(2)
  );

  return {
    modalidad, // 'contado' | 'partes' | 'ambas'
    monto_base_usd: Number(montoBase.toFixed(2)),
    tiene_inicial: tieneInicial,
    porcentaje_inicial: pctInicial,
    monto_inicial_usd: montoInicial,
    fecha_inicio_pagos: fechaInicioPagos,
    saldo_financiar_usd: saldoFinanciar,
    numero_cuotas: numeroCuotas,
    periodicidad,
    con_intereses: conIntereses,
    porcentaje_interes: porcentajeInteres,
    tipo_interes: tipoInteres,
    monto_interes_usd: montoInteres,
    monto_cuota_usd: montoCuota,
    monto_total_financiado_usd: montoTotalFinanciado,
    cronograma_cuotas: cronogramaCuotas,
    porcentaje_mora: Number(form.porcentaje_mora || 5),
    dias_gracia_mora: Number(form.dias_gracia_mora || 5),
    penalizacion_mora: String(form.penalizacion_mora || "").trim(),
  };
}

export default function PanelGestionPresupuestos({
  onVolverInicio,
  onAbrirPresupuesto,
}) {
  const [pestanaActiva, setPestanaActiva] = useState("requerimientos"); // 'requerimientos' | 'elaborar' | 'presupuestos' | 'proyectos'
  const [datos, setDatos] = useState({
    requerimientos: [],
    presupuestos: [],
    proyectos: [],
  });
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [notificacion, setNotificacion] = useState(null);

  // Requerimiento seleccionado actualmente para elaborar su presupuesto
  const [requerimientoSeleccionado, setRequerimientoSeleccionado] =
    useState(null);

  // Presupuesto recién creado o seleccionado para enviar al cliente
  const [presupuestoParaEnviar, setPresupuestoParaEnviar] = useState(null);
  const [enviandoCorreoId, setEnviandoCorreoId] = useState(null);

  // Control de Vista Previa del Presupuesto Completado y Reescritura de versión
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [presupuestoEditandoId, setPresupuestoEditandoId] = useState(null);

  // Formulario de Elaboración de Presupuesto
  const [formPresupuesto, setFormPresupuesto] = useState({
    cliente_nombre: "",
    cliente_email: "",
    empresa: "",
    telefono: "",
    titulo: "",
    alcance: "",
    monto_total_usd: "",
    fecha_vencimiento: obtenerFechaVencimientoSugerida(),
    fecha_inicio_pagos: obtenerFechaHoyIso(),
    modalidad_pago: "ambas", // 'contado' | 'partes' | 'ambas'
    tiene_inicial: true,
    porcentaje_inicial: "40",
    numero_cuotas: "3",
    periodicidad: "Quincenal (cada 15 días)",
    con_intereses: false,
    porcentaje_interes: "5",
    tipo_interes: "saldo_deudor",
    porcentaje_mora: "5",
    dias_gracia_mora: "5",
    penalizacion_mora: generarTextoPenalizacion(5, 5),
  });
  const [guardandoPresupuesto, setGuardandoPresupuesto] = useState(false);

  // Modal / Formulario para registrar un requerimiento manualmente
  const [mostrarModalReq, setMostrarModalReq] = useState(false);
  const [formNuevoReq, setFormNuevoReq] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    empresa: "",
    rubro: "Sistema de Inventario / Facturación",
    mensaje: "",
  });

  // Formulario de registro de cobros y gastos en Proyectos (P&L)
  const [formCobro, setFormCobro] = useState({
    proyecto_id: "",
    numero_factura: "",
    tipo_aplicacion: "cuota_completa", // 'pago_inicial' | 'cuota_completa' | 'multiples_cuotas' | 'abono_parcial_cuota' | 'pago_total'
    numero_cuota_inicio: "1",
    cantidad_cuotas: "2",
    concepto: "",
    monto_usd: "",
    moneda_pago: "VES",
    tasa_bcv: "45.50",
    referencia_bancaria: "",
  });
  const [formGasto, setFormGasto] = useState({
    proyecto_id: "",
    descripcion: "",
    categoria: "hosting",
    moneda_origen: "VES",
    monto_original: "",
    tasa_cambio: "45.50",
  });

  const recargarDatos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/presupuestos/admin/resumen`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.detail || "No se pudo cargar el panel.");
      }
      setDatos({
        requerimientos: json.requerimientos || [],
        presupuestos: json.presupuestos || [],
        proyectos: json.proyectos || [],
      });
      setErrorCarga("");
    } catch (err) {
      setErrorCarga(err.message || "Error al conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    async function cargarInicial() {
      try {
        const res = await fetch(`${API_BASE}/api/presupuestos/admin/resumen`);
        const json = await res.json().catch(() => ({}));
        if (cancelado) return;
        if (!res.ok) {
          setErrorCarga(json.detail || "No se pudo cargar el panel.");
        } else {
          setDatos({
            requerimientos: json.requerimientos || [],
            presupuestos: json.presupuestos || [],
            proyectos: json.proyectos || [],
          });
        }
      } catch (err) {
        if (!cancelado) {
          setErrorCarga(err.message || "Error al conectar con el servidor.");
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }
    cargarInicial();
    return () => {
      cancelado = true;
    };
  }, []);

  const cargarPresupuestoEnFormulario = (preExistente, reqItem = null) => {
    const pp = preExistente.plan_pago || {};
    setRequerimientoSeleccionado(reqItem);
    setPresupuestoEditandoId(preExistente.id);
    setFormPresupuesto({
      cliente_nombre: preExistente.cliente_nombre || reqItem?.nombre || "",
      cliente_email: preExistente.cliente_email || reqItem?.email || "",
      empresa: preExistente.empresa || reqItem?.empresa || "",
      telefono: preExistente.cliente_telefono || reqItem?.telefono || "",
      titulo: preExistente.titulo || "",
      alcance: preExistente.alcance || "",
      monto_total_usd: String(preExistente.monto_total_usd || ""),
      fecha_vencimiento: preExistente.fecha_vencimiento
        ? String(preExistente.fecha_vencimiento).slice(0, 10)
        : obtenerFechaVencimientoSugerida(),
      fecha_inicio_pagos: pp.fecha_inicio_pagos || obtenerFechaHoyIso(),
      modalidad_pago: pp.modalidad || "ambas",
      tiene_inicial:
        pp.tiene_inicial !== undefined ? Boolean(pp.tiene_inicial) : true,
      porcentaje_inicial: String(
        pp.porcentaje_inicial !== undefined ? pp.porcentaje_inicial : 40
      ),
      numero_cuotas: String(pp.numero_cuotas || 3),
      periodicidad: pp.periodicidad || "Quincenal (cada 15 días)",
      con_intereses: Boolean(pp.con_intereses),
      porcentaje_interes: String(pp.porcentaje_interes || 5),
      tipo_interes: pp.tipo_interes || "saldo_deudor",
      porcentaje_mora: String(pp.porcentaje_mora || 5),
      dias_gracia_mora: String(pp.dias_gracia_mora || 5),
      penalizacion_mora:
        pp.penalizacion_mora ||
        generarTextoPenalizacion(
          pp.porcentaje_mora || 5,
          pp.dias_gracia_mora || 5
        ),
    });
    setMostrarVistaPrevia(false);
    setPresupuestoParaEnviar(null);
    setNotificacion({
      tipo: "exito",
      texto: `Reescribiendo / actualizando el presupuesto ${preExistente.codigo}. Ajusta las opciones de pago o alcance y presiona "Ver Presupuesto Completado".`,
    });
    setPestanaActiva("elaborar");
  };

  const iniciarElaboracionDesdeRequerimiento = async (reqItem) => {
    // Si el requerimiento ya tenía un presupuesto generado, lo cargamos para reescribirlo con las nuevas alternativas
    if (reqItem.presupuesto_id) {
      const preExistente = datos.presupuestos.find(
        (p) => p.id === reqItem.presupuesto_id
      );
      if (preExistente) {
        cargarPresupuestoEnFormulario(preExistente, reqItem);
        return;
      }
    }

    setRequerimientoSeleccionado(reqItem);
    setPresupuestoEditandoId(null);
    const plantillaSugerida =
      PLANTILLAS_ALCANCE[reqItem.rubro] ||
      PLANTILLAS_ALCANCE["Sistema a la Medida"];

    setFormPresupuesto({
      cliente_nombre: reqItem.nombre || "",
      cliente_email: reqItem.email || "",
      empresa: reqItem.empresa || "",
      telefono: reqItem.telefono || "",
      titulo: `Desarrollo de ${reqItem.rubro || "Solución Web"} — ${reqItem.empresa || reqItem.nombre}`,
      alcance: plantillaSugerida,
      monto_total_usd: "",
      fecha_vencimiento: obtenerFechaVencimientoSugerida(),
      fecha_inicio_pagos: obtenerFechaHoyIso(),
      modalidad_pago: "ambas",
      tiene_inicial: true,
      porcentaje_inicial: "40",
      numero_cuotas: "3",
      periodicidad: "Quincenal (cada 15 días)",
      con_intereses: false,
      porcentaje_interes: "5",
      tipo_interes: "sobre_saldo",
      porcentaje_mora: "5",
      dias_gracia_mora: "5",
      penalizacion_mora: generarTextoPenalizacion(5, 5),
    });
    setMostrarVistaPrevia(false);
    setPresupuestoParaEnviar(null);
    setNotificacion(null);
    setPestanaActiva("elaborar");

    if (reqItem.estado === "nuevo") {
      await fetch(
        `${API_BASE}/api/presupuestos/requerimientos/${reqItem.id}/estado`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "en_elaboracion" }),
        }
      ).catch(() => {});
      recargarDatos();
    }
  };

  const abrirVistaPreviaPresupuesto = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (
      !formPresupuesto.cliente_nombre.trim() ||
      !formPresupuesto.cliente_email.trim() ||
      !formPresupuesto.titulo.trim() ||
      !formPresupuesto.alcance.trim() ||
      !(Number(formPresupuesto.monto_total_usd) > 0)
    ) {
      setNotificacion({
        tipo: "error",
        texto:
          "Por favor completa los datos del cliente, el título, el alcance y un monto en USD mayor a 0 para ver el presupuesto completado.",
      });
      return;
    }
    setNotificacion(null);
    setMostrarVistaPrevia(true);
    window.scrollTo({ top: 140, behavior: "smooth" });
  };

  const manejarCrearPresupuesto = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setGuardandoPresupuesto(true);
    setNotificacion(null);

    try {
      const planCalculado = calcularPlanPago(formPresupuesto);
      const res = await fetch(`${API_BASE}/api/presupuestos/crear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formPresupuesto,
          monto_total_usd: Number(formPresupuesto.monto_total_usd),
          plan_pago: planCalculado,
          requerimiento_id: requerimientoSeleccionado?.id || null,
          presupuesto_id: presupuestoEditandoId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "No se pudo generar el presupuesto.");
      }

      await recargarDatos();
      setPresupuestoParaEnviar(data);
      setPresupuestoEditandoId(data.id);
      setNotificacion({
        tipo: "exito",
        texto: `¡Presupuesto ${data.codigo} confirmado y guardado! Ahora puedes enviarlo por Correo o WhatsApp al cliente desde el panel superior.`,
      });
      window.scrollTo({ top: 120, behavior: "smooth" });
    } catch (err) {
      setNotificacion({
        tipo: "error",
        texto: err.message || "Error al guardar el presupuesto.",
      });
    } finally {
      setGuardandoPresupuesto(false);
    }
  };

  const manejarEnviarPorCorreo = async (presupuesto) => {
    setEnviandoCorreoId(presupuesto.id);
    setNotificacion(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/presupuestos/enviar-correo/${presupuesto.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base_url: window.location.origin,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.detail || "No se pudo enviar el correo automáticamente."
        );
      }

      if (data.modo_local) {
        // Si está en localhost sin RESEND_API_KEY, abrimos el cliente de correo con el texto ya listo
        const mailtoUrl = `mailto:${encodeURIComponent(
          presupuesto.cliente_email
        )}?subject=${encodeURIComponent(
          data.asunto
        )}&body=${encodeURIComponent(data.texto_plano)}`;
        window.open(mailtoUrl, "_blank", "noopener,noreferrer");
        setNotificacion({
          tipo: "exito",
          texto: `Se abrió tu aplicación de correo con la propuesta ${presupuesto.codigo} y el enlace seguro listos para enviar a ${presupuesto.cliente_email}.`,
        });
      } else {
        setNotificacion({
          tipo: "exito",
          texto:
            data.mensaje ||
            `Presupuesto enviado por correo a ${presupuesto.cliente_email}.`,
        });
      }
    } catch (err) {
      setNotificacion({
        tipo: "error",
        texto: err.message || "Error al enviar el correo.",
      });
    } finally {
      setEnviandoCorreoId(null);
    }
  };

  const construirEnlaceCliente = (token) => {
    return `${window.location.origin}/presupuesto/${encodeURIComponent(token)}`;
  };

  const enviarPresupuestoPorWhatsApp = (presupuesto) => {
    const enlace = construirEnlaceCliente(presupuesto.token_acceso);
    const numero = limpiarTelefonoWhatsApp(presupuesto.cliente_telefono);
    const pp = presupuesto.plan_pago;
    const tienePlanPartes =
      pp && (pp.modalidad === "partes" || pp.modalidad === "ambas");

    const lineasPlan = tienePlanPartes
      ? [
          "",
          `💳 *Opción de Pago por Partes (${pp.periodicidad}):*`,
          pp.tiene_inicial
            ? `• *Pago Inicial (${pp.porcentaje_inicial}%):* ${formatearUsd(pp.monto_inicial_usd)} USD`
            : `• *Pago Inicial:* Sin inicial ($0.00 USD)`,
          `• *Pagos Parciales:* ${pp.numero_cuotas} cuota(s) de *${formatearUsd(pp.monto_cuota_usd)} USD* c/u (${pp.periodicidad})`,
          pp.con_intereses
            ? `• *Financiamiento:* Incluye ${pp.porcentaje_interes}% de interés (${formatearUsd(pp.monto_interes_usd)} USD) — Total financiado: ${formatearUsd(pp.monto_total_financiado_usd)} USD`
            : `• *Financiamiento:* Sin intereses (0%)`,
        ]
      : [];

    const texto = [
      `Hola ${presupuesto.cliente_nombre}, le escribimos del equipo de *LHBO Sistemas*.`,
      "",
      `En respuesta a su requerimiento, hemos elaborado su propuesta técnica y económica:`,
      `📄 *Código:* ${presupuesto.codigo}`,
      `📌 *Proyecto:* ${presupuesto.titulo}`,
      `💵 *Inversión Total Base:* ${formatearUsd(presupuesto.monto_total_usd)} USD (Si el pago es en Bolívares VES, se calcula a la tasa BCV del día de pago).`,
      ...lineasPlan,
      "",
      `Puede revisar el alcance detallado, el plan de pagos, descargar en PDF y aprobar o comentar la propuesta desde su enlace seguro:`,
      enlace,
    ].join("\n");

    const urlWa = numero
      ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(urlWa, "_blank", "noopener,noreferrer");
  };

  const copiarEnlacePortapapeles = async (token, codigo) => {
    const enlace = construirEnlaceCliente(token);
    try {
      await navigator.clipboard.writeText(enlace);
      setNotificacion({
        tipo: "exito",
        texto: `Enlace del presupuesto ${codigo} copiado al portapapeles: ${enlace}`,
      });
    } catch {
      setNotificacion({
        tipo: "exito",
        texto: `Enlace del presupuesto: ${enlace}`,
      });
    }
  };

  const manejarRegistrarRequerimientoManual = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/presupuestos/requerimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formNuevoReq),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Error al registrar requerimiento.");
      }
      setMostrarModalReq(false);
      setFormNuevoReq({
        nombre: "",
        correo: "",
        telefono: "",
        empresa: "",
        rubro: "Sistema de Inventario / Facturación",
        mensaje: "",
      });
      await recargarDatos();
      setNotificacion({
        tipo: "exito",
        texto: `Requerimiento de ${data.nombre} registrado en la bandeja. Ya puedes elaborar su presupuesto.`,
      });
    } catch (err) {
      setNotificacion({
        tipo: "error",
        texto: err.message,
      });
    }
  };

  const aplicarSugerenciaCobro = (
    proyId,
    tipoAplicacion,
    numCuotaInicio = "1",
    cantCuotas = "2"
  ) => {
    const proy = datos.proyectos.find((p) => p.id === Number(proyId));
    if (!proy) return;

    const pp = proy.plan_pago || null;
    const montoCuotaRef =
      pp && Number(pp.monto_cuota_usd) > 0
        ? Number(pp.monto_cuota_usd)
        : Number(proy.monto_acordado_usd || 0);
    const totalCuotasPlan = pp?.numero_cuotas || 1;
    const cuotaIni = Math.max(1, parseInt(numCuotaInicio, 10) || 1);
    const nCuotas = Math.max(2, parseInt(cantCuotas, 10) || 2);
    const cuotaFin = Math.min(totalCuotasPlan, cuotaIni + nCuotas - 1);

    if (tipoAplicacion === "pago_inicial") {
      const montoIni =
        pp && Number(pp.monto_inicial_usd) > 0
          ? Number(pp.monto_inicial_usd)
          : Number(((proy.monto_acordado_usd || 0) * 0.5).toFixed(2));
      setFormCobro((prev) => ({
        ...prev,
        proyecto_id: String(proyId),
        tipo_aplicacion: tipoAplicacion,
        concepto: `Pago Inicial / Anticipo (${pp?.porcentaje_inicial || 50}%)`,
        monto_usd: String(montoIni),
      }));
      return;
    }

    if (tipoAplicacion === "cuota_completa") {
      setFormCobro((prev) => ({
        ...prev,
        proyecto_id: String(proyId),
        tipo_aplicacion: tipoAplicacion,
        numero_cuota_inicio: String(cuotaIni),
        cantidad_cuotas: "1",
        concepto: `Pago completo de Cuota #${cuotaIni} de ${totalCuotasPlan}`,
        monto_usd: String(montoCuotaRef),
      }));
      return;
    }

    if (tipoAplicacion === "multiples_cuotas") {
      const montoMulti = Number((montoCuotaRef * nCuotas).toFixed(2));
      setFormCobro((prev) => ({
        ...prev,
        proyecto_id: String(proyId),
        tipo_aplicacion: tipoAplicacion,
        numero_cuota_inicio: String(cuotaIni),
        cantidad_cuotas: String(nCuotas),
        concepto: `Pago conjunto de ${nCuotas} cuotas (Cuota #${cuotaIni} a Cuota #${cuotaFin})`,
        monto_usd: String(montoMulti),
      }));
      return;
    }

    if (tipoAplicacion === "abono_parcial_cuota") {
      const montoParcialSug = Number((montoCuotaRef / 2).toFixed(2));
      setFormCobro((prev) => ({
        ...prev,
        proyecto_id: String(proyId),
        tipo_aplicacion: tipoAplicacion,
        numero_cuota_inicio: String(cuotaIni),
        cantidad_cuotas: "1",
        concepto: `Abono parcial a cuenta de la Cuota #${cuotaIni} (Valor cuota: ${formatearUsd(montoCuotaRef)})`,
        monto_usd: String(montoParcialSug),
      }));
      return;
    }

    if (tipoAplicacion === "pago_total") {
      const totalObjetivo =
        pp && Number(pp.monto_total_financiado_usd) > 0
          ? Number(pp.monto_total_financiado_usd)
          : Number(proy.monto_acordado_usd || 0);
      const saldoPendiente = Math.max(
        0,
        Number((totalObjetivo - Number(proy.total_cobrado_usd || 0)).toFixed(2))
      );
      setFormCobro((prev) => ({
        ...prev,
        proyecto_id: String(proyId),
        tipo_aplicacion: tipoAplicacion,
        concepto: "Cancelación total / Liquidación de saldo del proyecto",
        monto_usd: String(saldoPendiente > 0 ? saldoPendiente : totalObjetivo),
      }));
    }
  };

  const manejarRegistrarCobro = async (e) => {
    e.preventDefault();
    try {
      const proy = datos.proyectos.find(
        (p) => p.id === Number(formCobro.proyecto_id)
      );
      const pp = proy?.plan_pago || null;
      const montoCuotaRef =
        pp && Number(pp.monto_cuota_usd) > 0
          ? Number(pp.monto_cuota_usd)
          : Number(proy?.monto_acordado_usd || 0);
      const montoPagadoUsd = Number(formCobro.monto_usd || 0);
      const cuotaIni = Math.max(
        1,
        parseInt(formCobro.numero_cuota_inicio, 10) || 1
      );
      const cantCuotas =
        formCobro.tipo_aplicacion === "multiples_cuotas"
          ? Math.max(2, parseInt(formCobro.cantidad_cuotas, 10) || 2)
          : 1;

      const saldoCuotaRestante =
        formCobro.tipo_aplicacion === "abono_parcial_cuota"
          ? Math.max(0, Number((montoCuotaRef - montoPagadoUsd).toFixed(2)))
          : 0;

      const etiquetasTipo = {
        pago_inicial: "Pago Inicial / Anticipo",
        cuota_completa: `1 Cuota completa (Cuota #${cuotaIni})`,
        multiples_cuotas: `Múltiples cuotas (${cantCuotas} cuotas desde #${cuotaIni})`,
        abono_parcial_cuota: `Pago parcial de Cuota #${cuotaIni} (Restan ${formatearUsd(saldoCuotaRestante)})`,
        pago_total: "Liquidación / Pago Total",
      };

      const detalleCuotas = {
        tipo_aplicacion: formCobro.tipo_aplicacion,
        etiqueta_aplicacion:
          etiquetasTipo[formCobro.tipo_aplicacion] || "Cobro general",
        numero_cuota_inicio: cuotaIni,
        cantidad_cuotas: cantCuotas,
        monto_cuota_referencia_usd: montoCuotaRef,
        saldo_cuota_restante_usd: saldoCuotaRestante,
      };

      const res = await fetch(`${API_BASE}/api/presupuestos/cobros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formCobro,
          proyecto_id: Number(formCobro.proyecto_id),
          monto_usd: montoPagadoUsd,
          tasa_bcv: Number(formCobro.tasa_bcv || 1),
          detalle_cuotas: detalleCuotas,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "No se pudo registrar el cobro.");
      }
      setFormCobro((prev) => ({
        ...prev,
        numero_factura: "",
        concepto: "",
        monto_usd: "",
        referencia_bancaria: "",
      }));
      await recargarDatos();
      setNotificacion({
        tipo: "exito",
        texto: "Factura de cobro registrada y balance P&L actualizado.",
      });
    } catch (err) {
      setNotificacion({ tipo: "error", texto: err.message });
    }
  };

  const manejarRegistrarGasto = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/presupuestos/gastos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formGasto,
          proyecto_id: Number(formGasto.proyecto_id),
          monto_original: Number(formGasto.monto_original),
          tasa_cambio: Number(formGasto.tasa_cambio || 1),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "No se pudo registrar el gasto.");
      }
      setFormGasto((prev) => ({
        ...prev,
        descripcion: "",
        monto_original: "",
      }));
      await recargarDatos();
      setNotificacion({
        tipo: "exito",
        texto: "Gasto registrado y balance P&L actualizado.",
      });
    } catch (err) {
      setNotificacion({ tipo: "error", texto: err.message });
    }
  };

  const cantidadReqPendientes = datos.requerimientos.filter(
    (r) => r.estado === "nuevo" || r.estado === "en_elaboracion"
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Cabecera Ejecutiva del Panel Interno */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-black text-lg shadow-md">
              LH
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-black tracking-tight text-white">
                  LHBO<span className="text-blue-400">.</span>
                </span>
                <span className="text-xs uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  Centro de Requerimientos & Presupuestos
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Recepción de solicitudes, elaboración de propuestas y envío al
                cliente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMostrarModalReq(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              + Registrar Requerimiento
            </button>
            <button
              type="button"
              onClick={onVolverInicio}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              ← Ver Sitio Web Público
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Guía visual del procedimiento de 3 pasos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setPestanaActiva("requerimientos")}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                pestanaActiva === "requerimientos"
                  ? "bg-blue-50 border-blue-600 text-slate-900 shadow-xs"
                  : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                1
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                    Paso 1 · Bandeja
                  </span>
                  {cantidadReqPendientes > 0 && (
                    <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                      {cantidadReqPendientes} nuevo(s)
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">
                  Requerimientos Recibidos
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPestanaActiva("elaborar")}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                pestanaActiva === "elaborar"
                  ? "bg-blue-50 border-blue-600 text-slate-900 shadow-xs"
                  : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                2
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 block">
                  Paso 2 · Elaboración
                </span>
                <p className="text-sm font-bold text-slate-900 truncate">
                  Redactar Alcance y Monto
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPestanaActiva("presupuestos")}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                pestanaActiva === "presupuestos"
                  ? "bg-blue-50 border-blue-600 text-slate-900 shadow-xs"
                  : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                3
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                    Paso 3 · Envío y Estado
                  </span>
                  <span className="bg-slate-200 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {datos.presupuestos.length}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">
                  Enviar al Cliente y Seguimiento
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPestanaActiva("proyectos")}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                pestanaActiva === "proyectos"
                  ? "bg-blue-50 border-blue-600 text-slate-900 shadow-xs"
                  : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                4
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                    Paso 4 · Ejecución
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {datos.proyectos.length}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">
                  Proyectos Activos y P&L
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Banner de notificación de acciones */}
        {notificacion && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-sm font-medium ${
              notificacion.tipo === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
          >
            <span>
              {notificacion.tipo === "error" ? "⚠️ " : "✅ "}
              {notificacion.texto}
            </span>
            <button
              type="button"
              onClick={() => setNotificacion(null)}
              className="text-xs font-bold underline cursor-pointer shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        {errorCarga && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            ⚠️ {errorCarga}
          </div>
        )}

        {cargando ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Cargando bandeja de requerimientos y presupuestos...
            </p>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* PASO 1: BANDEJA DE LLEGADA DE REQUERIMIENTOS                   */}
            {/* ============================================================== */}
            {pestanaActiva === "requerimientos" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900">
                      Bandeja de Llegada de Requerimientos
                    </h1>
                    <p className="text-xs text-slate-600">
                      Todo requerimiento enviado desde el formulario web aparece
                      automáticamente aquí. Haz clic en{" "}
                      <strong>“Elaborar Presupuesto”</strong> para preparar y
                      enviar la cotización al cliente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={recargarDatos}
                    className="self-start sm:self-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    🔄 Actualizar Bandeja
                  </button>
                </div>

                {datos.requerimientos.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                    <p className="text-sm text-slate-600 mb-4">
                      Aún no hay requerimientos registrados en la bandeja.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMostrarModalReq(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                    >
                      + Registrar el primer requerimiento
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {datos.requerimientos.map((reqItem) => {
                      const esNuevo = reqItem.estado === "nuevo";
                      const esCotizado = reqItem.estado === "cotizado";

                      return (
                        <div
                          key={reqItem.id}
                          className={`bg-white border rounded-2xl p-6 shadow-xs transition-all ${
                            esNuevo
                              ? "border-amber-300 ring-2 ring-amber-400/20"
                              : "border-slate-200"
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                            <div className="space-y-3 flex-1">
                              <div className="flex flex-wrap items-center gap-2.5">
                                {esNuevo && (
                                  <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold px-3 py-1 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    NUEVO REQUERIMIENTO RECIBIDO
                                  </span>
                                )}
                                {reqItem.estado === "en_elaboracion" && (
                                  <span className="bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold px-3 py-1 rounded-full">
                                    📝 En elaboración de presupuesto
                                  </span>
                                )}
                                {esCotizado && (
                                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                                    ✅ Presupuesto generado (
                                    {reqItem.presupuesto_codigo || "Listo"})
                                  </span>
                                )}
                                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                                  {reqItem.rubro}
                                </span>
                                <span className="text-xs text-slate-400">
                                  Recibido:{" "}
                                  {formatearFechaHora(reqItem.creado_en)}
                                </span>
                              </div>

                              <div>
                                <h3 className="text-lg font-extrabold text-slate-900">
                                  {reqItem.nombre}
                                  {reqItem.empresa && (
                                    <span className="text-slate-500 font-semibold text-sm ml-2">
                                      — {reqItem.empresa}
                                    </span>
                                  )}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                                  <span>
                                    ✉️ <strong>Correo:</strong> {reqItem.email}
                                  </span>
                                  {reqItem.telefono && (
                                    <span>
                                      📱 <strong>Tel / WhatsApp:</strong>{" "}
                                      {reqItem.telefono}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                  Detalle de la solicitud enviada por el
                                  cliente:
                                </span>
                                {reqItem.mensaje}
                              </div>
                            </div>

                            {/* Acciones del procedimiento para este requerimiento */}
                            <div className="flex flex-col gap-2.5 lg:w-64 shrink-0 justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  iniciarElaboracionDesdeRequerimiento(reqItem)
                                }
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl transition-colors shadow-md shadow-blue-600/20 cursor-pointer text-center"
                              >
                                {esCotizado
                                  ? "✏️ Reescribir / Nueva Versión →"
                                  : "1. Elaborar Presupuesto →"}
                              </button>

                              {reqItem.presupuesto_token && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAbrirPresupuesto(
                                      reqItem.presupuesto_token
                                    )
                                  }
                                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-center"
                                >
                                  Ver Presupuesto {reqItem.presupuesto_codigo} (
                                  {formatearUsd(reqItem.presupuesto_monto_usd)})
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* PASO 2: ELABORAR EL PRESUPUESTO Y ENVIARLO AL CLIENTE          */}
            {/* ============================================================== */}
            {pestanaActiva === "elaborar" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Columna Izquierda: Requerimiento de referencia y Procedimiento */}
                <div className="lg:col-span-5 space-y-6">
                  {requerimientoSeleccionado ? (
                    <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                          Requerimiento Origen #{requerimientoSeleccionado.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRequerimientoSeleccionado(null)}
                          className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                        >
                          Limpiar selección
                        </button>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {requerimientoSeleccionado.nombre}
                        </h3>
                        {requerimientoSeleccionado.empresa && (
                          <p className="text-xs font-semibold text-slate-600">
                            {requerimientoSeleccionado.empresa}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {requerimientoSeleccionado.email}{" "}
                          {requerimientoSeleccionado.telefono
                            ? `· ${requerimientoSeleccionado.telefono}`
                            : ""}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Solución solicitada: {requerimientoSeleccionado.rubro}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {requerimientoSeleccionado.mensaje}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                      <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                        Elaboración Directa de Presupuesto
                      </h3>
                      <p className="text-xs text-slate-600 mb-4">
                        Puedes llenar los datos manualmente o seleccionar un
                        requerimiento recibido desde el Paso 1 para autocompletar
                        los datos del cliente.
                      </p>
                      <button
                        type="button"
                        onClick={() => setPestanaActiva("requerimientos")}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        ← Elegir un requerimiento de la bandeja
                      </button>
                    </div>
                  )}

                  {/* Guía del procedimiento estándar LHBO Sistemas */}
                  <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-300">
                      Procedimiento para Elaborar y Enviar el Presupuesto
                    </h3>
                    <ol className="text-xs text-slate-300 space-y-3 list-decimal list-inside leading-relaxed">
                      <li>
                        <strong className="text-white">
                          Verificar Datos del Cliente:
                        </strong>{" "}
                        Confirma el nombre, empresa, correo electrónico y
                        WhatsApp.
                      </li>
                      <li>
                        <strong className="text-white">
                          Estructurar el Alcance Técnico:
                        </strong>{" "}
                        Usa una de las plantillas rápidas por rubro y detalla
                        los módulos, entregables y el tiempo de soporte.
                      </li>
                      <li>
                        <strong className="text-white">
                          Fijar la Inversión en USD:
                        </strong>{" "}
                        Indica el monto total en dólares. El documento incluirá
                        automáticamente la coletilla de pago en Bolívares (VES)
                        a tasa oficial BCV del día de pago.
                      </li>
                      <li>
                        <strong className="text-white">
                          Generar Enlace Seguro y Enviar:
                        </strong>{" "}
                        Al guardar se crea el enlace único{" "}
                        <code>/presupuesto/:token</code> para enviarlo con un
                        clic por Correo o WhatsApp al cliente.
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Columna Derecha: Formulario de Elaboración + Tarjeta de Envío Inmediato */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Si ya se acaba de generar el presupuesto, mostrar la tarjeta destacada de Paso 3 (Enviar al cliente) */}
                  {presupuestoParaEnviar && (
                    <div className="bg-emerald-950 text-white border-2 border-emerald-500 rounded-2xl p-6 shadow-lg space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-block bg-emerald-500 text-emerald-950 text-xs font-black uppercase px-3 py-0.5 rounded-full mb-2">
                            ¡Presupuesto {presupuestoParaEnviar.codigo} Listo
                            para Enviar!
                          </span>
                          <h3 className="text-lg font-extrabold">
                            Enviar propuesta de vuelta a{" "}
                            {presupuestoParaEnviar.cliente_nombre}
                          </h3>
                          <p className="text-xs text-emerald-200 mt-1">
                            Enlace único del cliente:{" "}
                            <code className="bg-black/30 px-2 py-0.5 rounded">
                              {construirEnlaceCliente(
                                presupuestoParaEnviar.token_acceso
                              )}
                            </code>
                          </p>
                        </div>
                        <span className="text-2xl font-black text-emerald-300 shrink-0">
                          {formatearUsd(presupuestoParaEnviar.monto_total_usd)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <button
                          type="button"
                          disabled={
                            enviandoCorreoId === presupuestoParaEnviar.id
                          }
                          onClick={() =>
                            manejarEnviarPorCorreo(presupuestoParaEnviar)
                          }
                          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>✉️</span>
                          <span>
                            {enviandoCorreoId === presupuestoParaEnviar.id
                              ? "Enviando..."
                              : "Enviar por Correo al Cliente"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            enviarPresupuestoPorWhatsApp(presupuestoParaEnviar)
                          }
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>💬</span>
                          <span>Enviar por WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onAbrirPresupuesto(
                              presupuestoParaEnviar.token_acceso
                            )
                          }
                          className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>👁️</span>
                          <span>Abrir Vista del Cliente</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={manejarCrearPresupuesto}
                    className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5"
                  >
                    <div className="border-b border-slate-200 pb-4">
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Formulario de Elaboración de Presupuesto
                      </h2>
                      <p className="text-xs text-slate-500">
                        Completa o ajusta la propuesta técnica y económica que
                        recibirá el cliente.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Nombre del Cliente *
                        </label>
                        <input
                          type="text"
                          required
                          value={formPresupuesto.cliente_nombre}
                          onChange={(e) =>
                            setFormPresupuesto((p) => ({
                              ...p,
                              cliente_nombre: e.target.value,
                            }))
                          }
                          placeholder="Ej. María Fernanda Rivas"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Correo Electrónico del Cliente *
                        </label>
                        <input
                          type="email"
                          required
                          value={formPresupuesto.cliente_email}
                          onChange={(e) =>
                            setFormPresupuesto((p) => ({
                              ...p,
                              cliente_email: e.target.value,
                            }))
                          }
                          placeholder="cliente@empresa.com"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Empresa / Negocio
                        </label>
                        <input
                          type="text"
                          value={formPresupuesto.empresa}
                          onChange={(e) =>
                            setFormPresupuesto((p) => ({
                              ...p,
                              empresa: e.target.value,
                            }))
                          }
                          placeholder="Ej. Comercializadora Los Andes C.A."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Teléfono / WhatsApp
                        </label>
                        <input
                          type="text"
                          value={formPresupuesto.telefono}
                          onChange={(e) =>
                            setFormPresupuesto((p) => ({
                              ...p,
                              telefono: e.target.value,
                            }))
                          }
                          placeholder="+58 412-0000000"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Título del Proyecto / Propuesta *
                      </label>
                      <input
                        type="text"
                        required
                        value={formPresupuesto.titulo}
                        onChange={(e) =>
                          setFormPresupuesto((p) => ({
                            ...p,
                            titulo: e.target.value,
                          }))
                        }
                        placeholder="Ej. Sistema Web de Inventario y Facturación Multimoneda"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    {/* Selector de plantillas rápidas de alcance */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Alcance Técnico y Entregables *
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">
                            Cargar plantilla:
                          </span>
                          {Object.keys(PLANTILLAS_ALCANCE).map((nombreRubro) => (
                            <button
                              key={nombreRubro}
                              type="button"
                              onClick={() =>
                                setFormPresupuesto((p) => ({
                                  ...p,
                                  alcance: PLANTILLAS_ALCANCE[nombreRubro],
                                }))
                              }
                              className="text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
                            >
                              {nombreRubro.split("/")[0].trim()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        rows="7"
                        required
                        value={formPresupuesto.alcance}
                        onChange={(e) =>
                          setFormPresupuesto((p) => ({
                            ...p,
                            alcance: e.target.value,
                          }))
                        }
                        placeholder="Describa los módulos, entregables, plazos estimados y garantía..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Monto Total Base / De Contado (USD) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          required
                          value={formPresupuesto.monto_total_usd}
                          onChange={(e) =>
                            setFormPresupuesto((p) => ({
                              ...p,
                              monto_total_usd: e.target.value,
                            }))
                          }
                          placeholder="Ej. 650.00"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                        />
                        <span className="text-[11px] text-slate-500 block mt-1">
                          La vista del cliente indicará que si paga en VES se
                          usará la tasa BCV del día de pago.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Fecha de Vencimiento de la Oferta
                        </label>
                        <input
                          type="date"
                          value={formPresupuesto.fecha_vencimiento}
                          onChange={(e) =>
                            setFormPresupuesto((p) => ({
                              ...p,
                              fecha_vencimiento: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                      </div>
                    </div>

                    {/* ========================================================== */}
                    {/* CONFIGURACIÓN DE MODALIDAD DE PAGO (CONTADO / POR PARTES)  */}
                    {/* ========================================================== */}
                    {(() => {
                      const resumenPlan = calcularPlanPago(formPresupuesto);
                      const mostrarPartes =
                        formPresupuesto.modalidad_pago === "ambas" ||
                        formPresupuesto.modalidad_pago === "partes";

                      return (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900">
                                💳 Modalidad de Pago y Financiamiento por Partes
                              </h3>
                              <p className="text-xs text-slate-500">
                                Configura si deseas ofrecer pago total, pago en
                                cuotas parciales (con o sin inicial e intereses)
                                y condiciones de mora.
                              </p>
                            </div>
                          </div>

                          {/* Selector de modalidad */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {[
                              {
                                id: "ambas",
                                titulo: "Pago Total + Pago por Partes",
                                desc: "Muestra el precio de contado y el plan en cuotas",
                              },
                              {
                                id: "partes",
                                titulo: "Solo Pago por Partes",
                                desc: "Presenta el esquema fraccionado en cuotas",
                              },
                              {
                                id: "contado",
                                titulo: "Solo Pago Total / Único",
                                desc: "Sin desglose de financiamiento en cuotas",
                              },
                            ].map((op) => (
                              <button
                                key={op.id}
                                type="button"
                                onClick={() =>
                                  setFormPresupuesto((p) => ({
                                    ...p,
                                    modalidad_pago: op.id,
                                  }))
                                }
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  formPresupuesto.modalidad_pago === op.id
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                }`}
                              >
                                <span className="block text-xs font-extrabold">
                                  {op.titulo}
                                </span>
                                <span
                                  className={`block text-[11px] mt-0.5 ${
                                    formPresupuesto.modalidad_pago === op.id
                                      ? "text-blue-100"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {op.desc}
                                </span>
                              </button>
                            ))}
                          </div>

                          {mostrarPartes && (
                            <div className="space-y-4 pt-1">
                              {/* 1. Opción de Pago Inicial (Con o sin inicial) */}
                              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    1. ¿Requiere Pago Inicial (Anticipo)?
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFormPresupuesto((p) => ({
                                          ...p,
                                          tiene_inicial: true,
                                          porcentaje_inicial:
                                            Number(p.porcentaje_inicial) > 0
                                              ? p.porcentaje_inicial
                                              : "40",
                                        }))
                                      }
                                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                                        formPresupuesto.tiene_inicial
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "bg-slate-100 text-slate-600 border-slate-300"
                                      }`}
                                    >
                                      Sí, con Pago Inicial
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFormPresupuesto((p) => ({
                                          ...p,
                                          tiene_inicial: false,
                                          porcentaje_inicial: "0",
                                        }))
                                      }
                                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                                        !formPresupuesto.tiene_inicial
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "bg-slate-100 text-slate-600 border-slate-300"
                                      }`}
                                    >
                                      No (Sin Inicial · 100% en cuotas)
                                    </button>
                                  </div>
                                </div>

                                {formPresupuesto.tiene_inicial && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Porcentaje de Pago Inicial (%)
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min="1"
                                          max="95"
                                          step="1"
                                          value={
                                            formPresupuesto.porcentaje_inicial
                                          }
                                          onChange={(e) =>
                                            setFormPresupuesto((p) => ({
                                              ...p,
                                              porcentaje_inicial:
                                                e.target.value,
                                            }))
                                          }
                                          className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold"
                                        />
                                        <div className="flex flex-wrap gap-1">
                                          {["20", "30", "40", "50"].map(
                                            (pct) => (
                                              <button
                                                key={pct}
                                                type="button"
                                                onClick={() =>
                                                  setFormPresupuesto((p) => ({
                                                    ...p,
                                                    porcentaje_inicial: pct,
                                                  }))
                                                }
                                                className="text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2 py-1 rounded border border-slate-200 cursor-pointer"
                                              >
                                                {pct}%
                                              </button>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="bg-blue-50/70 border border-blue-200 rounded-lg px-3.5 py-2 flex flex-col justify-center">
                                      <span className="text-[11px] text-slate-500">
                                        Monto del Pago Inicial calculado:
                                      </span>
                                      <span className="text-sm font-black text-blue-700">
                                        {formatearUsd(
                                          resumenPlan.monto_inicial_usd
                                        )}{" "}
                                        USD
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 2. Cantidad de Pagos Parciales, Periodicidad y Fecha de Inicio */}
                              <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    2. Cantidad de Cuotas
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="1"
                                      max="36"
                                      value={formPresupuesto.numero_cuotas}
                                      onChange={(e) =>
                                        setFormPresupuesto((p) => ({
                                          ...p,
                                          numero_cuotas: e.target.value,
                                        }))
                                      }
                                      className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-sm font-bold text-slate-900"
                                    />
                                    <div className="flex flex-wrap gap-1">
                                      {["2", "3", "4", "6"].map((n) => (
                                        <button
                                          key={n}
                                          type="button"
                                          onClick={() =>
                                            setFormPresupuesto((p) => ({
                                              ...p,
                                              numero_cuotas: n,
                                            }))
                                          }
                                          className={`text-xs font-bold px-2 py-1.5 rounded-lg border cursor-pointer ${
                                            String(
                                              formPresupuesto.numero_cuotas
                                            ) === n
                                              ? "bg-blue-600 text-white border-blue-600"
                                              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                          }`}
                                        >
                                          {n}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    3. Periodicidad
                                  </label>
                                  <select
                                    value={formPresupuesto.periodicidad}
                                    onChange={(e) =>
                                      setFormPresupuesto((p) => ({
                                        ...p,
                                        periodicidad: e.target.value,
                                      }))
                                    }
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800"
                                  >
                                    <option value="Semanal (cada 7 días)">
                                      Semanal (cada 7 días)
                                    </option>
                                    <option value="Quincenal (cada 15 días)">
                                      Quincenal (cada 15 días)
                                    </option>
                                    <option value="Mensual (cada 30 días)">
                                      Mensual (cada 30 días)
                                    </option>
                                    <option value="Bimestral (cada 2 meses)">
                                      Bimestral (cada 2 meses)
                                    </option>
                                    <option value="Trimestral (cada 3 meses)">
                                      Trimestral (cada 3 meses)
                                    </option>
                                    <option value="Por Hitos de Entrega">
                                      Por Hitos de Entrega del Proyecto
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Fecha Base (Inicio / Inicial)
                                  </label>
                                  <input
                                    type="date"
                                    value={formPresupuesto.fecha_inicio_pagos}
                                    onChange={(e) =>
                                      setFormPresupuesto((p) => ({
                                        ...p,
                                        fecha_inicio_pagos: e.target.value,
                                      }))
                                    }
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800"
                                  />
                                </div>
                              </div>

                              {/* 4. Configuración de Intereses sobre los Pagos Parciales */}
                              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    4. ¿Los pagos parciales conllevan intereses?
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFormPresupuesto((p) => ({
                                          ...p,
                                          con_intereses: false,
                                        }))
                                      }
                                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                                        !formPresupuesto.con_intereses
                                          ? "bg-emerald-600 text-white border-emerald-600"
                                          : "bg-slate-100 text-slate-600 border-slate-300"
                                      }`}
                                    >
                                      Sin Intereses (0%)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFormPresupuesto((p) => ({
                                          ...p,
                                          con_intereses: true,
                                        }))
                                      }
                                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                                        formPresupuesto.con_intereses
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "bg-slate-100 text-slate-600 border-slate-300"
                                      }`}
                                    >
                                      Sí, aplicar Interés (%)
                                    </button>
                                  </div>
                                </div>

                                {formPresupuesto.con_intereses && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Porcentaje de Interés (%)
                                      </label>
                                      <input
                                        type="number"
                                        min="0.5"
                                        max="100"
                                        step="0.5"
                                        value={
                                          formPresupuesto.porcentaje_interes
                                        }
                                        onChange={(e) =>
                                          setFormPresupuesto((p) => ({
                                            ...p,
                                            porcentaje_interes: e.target.value,
                                          }))
                                        }
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Modo de cálculo del interés
                                      </label>
                                      <select
                                        value={formPresupuesto.tipo_interes}
                                        onChange={(e) =>
                                          setFormPresupuesto((p) => ({
                                            ...p,
                                            tipo_interes: e.target.value,
                                          }))
                                        }
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
                                      >
                                        <option value="saldo_deudor">
                                          Sobre saldo deudor (Cuota decreciente
                                          según baja la deuda)
                                        </option>
                                        <option value="saldo_deudor_fijo">
                                          Sobre saldo deudor (Distribuido en
                                          cuotas iguales)
                                        </option>
                                        <option value="sobre_saldo">
                                          Recargo único global sobre el saldo
                                          financiado
                                        </option>
                                        <option value="por_cuota">
                                          Interés fijo por cada período / cuota
                                        </option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Cuadro de Cálculo Automático de las Cuotas */}
                              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-300">
                                    📊 Cálculo Automático del Plan de Pagos
                                  </span>
                                  <span className="text-xs text-slate-300">
                                    Periodicidad:{" "}
                                    <strong className="text-white">
                                      {resumenPlan.periodicidad}
                                    </strong>
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                  <div className="bg-white/5 rounded-lg p-2.5">
                                    <span className="text-[11px] text-slate-400 block">
                                      Pago Inicial
                                    </span>
                                    <span className="text-sm font-black text-white">
                                      {resumenPlan.tiene_inicial
                                        ? `${formatearUsd(resumenPlan.monto_inicial_usd)} (${resumenPlan.porcentaje_inicial}%)`
                                        : "$0.00 (Sin inicial)"}
                                    </span>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-2.5">
                                    <span className="text-[11px] text-slate-400 block">
                                      Saldo + Intereses
                                    </span>
                                    <span className="text-sm font-black text-white">
                                      {formatearUsd(
                                        resumenPlan.saldo_financiar_usd +
                                          resumenPlan.monto_interes_usd
                                      )}
                                    </span>
                                  </div>
                                  <div className="bg-blue-600/30 border border-blue-400/40 rounded-lg p-2.5">
                                    <span className="text-[11px] text-blue-200 block">
                                      Cada Pago Parcial (
                                      {resumenPlan.numero_cuotas}x)
                                    </span>
                                    <span className="text-base font-black text-cyan-300">
                                      {formatearUsd(
                                        resumenPlan.monto_cuota_usd
                                      )}{" "}
                                      USD
                                    </span>
                                  </div>
                                  <div className="bg-emerald-600/25 border border-emerald-400/40 rounded-lg p-2.5">
                                    <span className="text-[11px] text-emerald-200 block">
                                      Total Final c/Plan
                                    </span>
                                    <span className="text-sm font-black text-emerald-300">
                                      {formatearUsd(
                                        resumenPlan.monto_total_financiado_usd
                                      )}{" "}
                                      USD
                                    </span>
                                  </div>
                                </div>

                                {/* Tabla rápida de fechas de vencimiento de cada cuota */}
                                {Array.isArray(resumenPlan.cronograma_cuotas) &&
                                  resumenPlan.cronograma_cuotas.length > 0 && (
                                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                        📅 Fechas de Vencimiento Calculadas por
                                        Cuota:
                                      </span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {resumenPlan.cronograma_cuotas.map(
                                          (c) => (
                                            <div
                                              key={c.numero}
                                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs"
                                            >
                                              <span className="text-slate-300 font-semibold">
                                                Cuota #{c.numero} ·{" "}
                                                <strong className="text-white">
                                                  {formatearFechaCorta(
                                                    c.fecha_vencimiento
                                                  )}
                                                </strong>
                                              </span>
                                              <span className="font-black text-cyan-300">
                                                {formatearUsd(
                                                  c.monto_cuota_usd
                                                )}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>

                              {/* 5. Penalizaciones en caso de incumplimiento / mora al vencimiento */}
                              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    5. Penalización por Incumplimiento / Mora al
                                    Vencimiento
                                  </label>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-500">
                                      Recargo mora (%):
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="50"
                                      step="0.5"
                                      value={formPresupuesto.porcentaje_mora}
                                      onChange={(e) => {
                                        const nuevoPct = e.target.value;
                                        setFormPresupuesto((p) => ({
                                          ...p,
                                          porcentaje_mora: nuevoPct,
                                          penalizacion_mora:
                                            generarTextoPenalizacion(
                                              nuevoPct || 0,
                                              p.dias_gracia_mora || 5
                                            ),
                                        }));
                                      }}
                                      className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
                                    />
                                    <span className="text-slate-500">
                                      Días gracia:
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="30"
                                      value={formPresupuesto.dias_gracia_mora}
                                      onChange={(e) => {
                                        const nuevosDias = e.target.value;
                                        setFormPresupuesto((p) => ({
                                          ...p,
                                          dias_gracia_mora: nuevosDias,
                                          penalizacion_mora:
                                            generarTextoPenalizacion(
                                              p.porcentaje_mora || 5,
                                              nuevosDias || 0
                                            ),
                                        }));
                                      }}
                                      className="w-14 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
                                    />
                                  </div>
                                </div>
                                <textarea
                                  rows="3"
                                  value={formPresupuesto.penalizacion_mora}
                                  onChange={(e) =>
                                    setFormPresupuesto((p) => ({
                                      ...p,
                                      penalizacion_mora: e.target.value,
                                    }))
                                  }
                                  placeholder="Detalle las condiciones o recargos en caso de incumplimiento de las fechas de pago..."
                                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 leading-relaxed"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        Primero verifica cómo queda el documento completo con su
                        cronograma de fechas antes de guardarlo y enviarlo.
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={abrirVistaPreviaPresupuesto}
                          className="bg-slate-900 hover:bg-blue-700 text-white text-sm font-extrabold px-6 py-3.5 rounded-xl transition-colors shadow-md cursor-pointer flex items-center gap-2"
                        >
                          <span>👁️</span>
                          <span>
                            Ver Presupuesto Completado (Verificar antes de
                            Enviar)
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* ========================================================== */}
                  {/* DOCUMENTO DE VISTA PREVIA DEL PRESUPUESTO COMPLETADO       */}
                  {/* ========================================================== */}
                  {mostrarVistaPrevia &&
                    (() => {
                      const planPrevio = calcularPlanPago(formPresupuesto);
                      const tienePartesPrevio =
                        planPrevio.modalidad === "partes" ||
                        planPrevio.modalidad === "ambas";

                      return (
                        <div className="bg-white border-2 border-blue-600 rounded-3xl shadow-xl overflow-hidden space-y-0">
                          {/* Barra superior de revisión y confirmación */}
                          <div className="bg-blue-600 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                                Vista Previa de Verificación
                              </span>
                              <h3 className="text-base font-extrabold mt-1">
                                Revisa el Presupuesto Completado antes de
                                Confirmar y Enviar
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setMostrarVistaPrevia(false)}
                                className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer"
                              >
                                ✏️ Modificar Datos
                              </button>
                              <button
                                type="button"
                                disabled={guardandoPresupuesto}
                                onClick={manejarCrearPresupuesto}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
                              >
                                {guardandoPresupuesto
                                  ? "Guardando..."
                                  : "✅ Estoy Conforme: Confirmar y Habilitar Envío →"}
                              </button>
                            </div>
                          </div>

                          {/* Cuerpo del Documento Completado */}
                          <div className="p-6 sm:p-8 space-y-6">
                            {/* Encabezado Ejecutivo */}
                            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <span className="text-xs font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-md font-bold">
                                  {presupuestoEditandoId
                                    ? "ACTUALIZACIÓN DE PRESUPUESTO"
                                    : "PROPUESTA TÉCNICA Y ECONÓMICA"}
                                </span>
                                <h4 className="text-xl font-extrabold mt-2">
                                  {formPresupuesto.titulo ||
                                    "Título del Proyecto"}
                                </h4>
                                <p className="text-xs text-slate-300 mt-1">
                                  Preparado para:{" "}
                                  <strong className="text-white">
                                    {formPresupuesto.cliente_nombre}
                                  </strong>
                                  {formPresupuesto.empresa
                                    ? ` (${formPresupuesto.empresa})`
                                    : ""}{" "}
                                  · {formPresupuesto.cliente_email}
                                </p>
                              </div>
                              <div className="bg-white/10 border border-white/15 rounded-xl p-4 sm:text-right shrink-0">
                                <span className="text-[11px] uppercase tracking-wider text-blue-200 block">
                                  Inversión Base Total
                                </span>
                                <span className="text-2xl font-black text-white">
                                  {formatearUsd(
                                    formPresupuesto.monto_total_usd
                                  )}{" "}
                                  USD
                                </span>
                                <span className="text-[11px] text-slate-300 block mt-0.5">
                                  Válido hasta:{" "}
                                  {formatearFechaCorta(
                                    formPresupuesto.fecha_vencimiento
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Alcance Técnico */}
                            <div>
                              <h5 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 mb-2">
                                1. Alcance Técnico y Entregables
                              </h5>
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {formPresupuesto.alcance}
                              </div>
                            </div>

                            {/* Plan de Pagos Parciales, Fechas de Vencimiento, Intereses y Penalizaciones */}
                            {tienePartesPrevio && (
                              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 sm:p-6 space-y-5">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-3">
                                  <div>
                                    <h5 className="text-sm font-extrabold text-slate-900">
                                      2. Plan de Pagos Parciales, Fechas de
                                      Vencimiento e Intereses
                                    </h5>
                                    <p className="text-xs text-slate-600">
                                      Periodicidad seleccionada:{" "}
                                      <strong>{planPrevio.periodicidad}</strong>
                                    </p>
                                  </div>
                                  <span className="text-xs font-extrabold bg-slate-900 text-emerald-300 px-3.5 py-1.5 rounded-xl">
                                    Total con Plan de Pagos:{" "}
                                    {formatearUsd(
                                      planPrevio.monto_total_financiado_usd
                                    )}{" "}
                                    USD
                                  </span>
                                </div>

                                {/* Tarjetas resumen del plan */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                  <div className="bg-white border border-slate-200 rounded-xl p-3">
                                    <span className="text-[11px] text-slate-500 block">
                                      Pago Inicial (Anticipo)
                                    </span>
                                    <span className="text-sm font-black text-slate-900">
                                      {planPrevio.tiene_inicial
                                        ? `${formatearUsd(planPrevio.monto_inicial_usd)} (${planPrevio.porcentaje_inicial}%)`
                                        : "$0.00 (Sin Inicial)"}
                                    </span>
                                    {planPrevio.tiene_inicial && (
                                      <span className="text-[10px] text-slate-500 block mt-0.5">
                                        Fecha:{" "}
                                        {formatearFechaCorta(
                                          planPrevio.fecha_inicio_pagos
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  <div className="bg-white border border-slate-200 rounded-xl p-3">
                                    <span className="text-[11px] text-slate-500 block">
                                      Saldo Financiado
                                    </span>
                                    <span className="text-sm font-black text-slate-900">
                                      {formatearUsd(
                                        planPrevio.saldo_financiar_usd
                                      )}{" "}
                                      USD
                                    </span>
                                  </div>

                                  <div className="bg-white border border-slate-200 rounded-xl p-3">
                                    <span className="text-[11px] text-slate-500 block">
                                      Intereses Aplicados
                                    </span>
                                    <span className="text-sm font-black text-slate-900">
                                      {planPrevio.con_intereses
                                        ? `${planPrevio.porcentaje_interes}% (${formatearUsd(planPrevio.monto_interes_usd)})`
                                        : "0% (Sin Intereses)"}
                                    </span>
                                  </div>

                                  <div className="bg-white border border-blue-300 rounded-xl p-3">
                                    <span className="text-[11px] text-blue-700 font-bold block">
                                      Pagos Parciales (
                                      {planPrevio.numero_cuotas} cuotas)
                                    </span>
                                    <span className="text-sm font-black text-blue-700">
                                      {formatearUsd(planPrevio.monto_cuota_usd)}{" "}
                                      c/u
                                    </span>
                                  </div>
                                </div>

                                {/* Tabla detallada de cada cuota con su fecha de vencimiento */}
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 text-xs font-extrabold text-slate-700">
                                    📅 Cronograma Detallado de Pagos y Fechas de
                                    Vencimiento
                                  </div>
                                  <div className="divide-y divide-slate-200 text-xs">
                                    {planPrevio.tiene_inicial && (
                                      <div className="px-4 py-3 flex items-center justify-between bg-emerald-50/50">
                                        <div>
                                          <span className="font-extrabold text-emerald-900">
                                            Pago Inicial (Anticipo{" "}
                                            {planPrevio.porcentaje_inicial}%)
                                          </span>
                                          <span className="text-slate-500 ml-2">
                                            · Al aprobar propuesta (
                                            {formatearFechaCorta(
                                              planPrevio.fecha_inicio_pagos
                                            )}
                                            )
                                          </span>
                                        </div>
                                        <span className="font-black text-emerald-800">
                                          {formatearUsd(
                                            planPrevio.monto_inicial_usd
                                          )}{" "}
                                          USD
                                        </span>
                                      </div>
                                    )}
                                    {planPrevio.cronograma_cuotas.map(
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
                                              · Fecha de vencimiento:{" "}
                                              <strong className="text-blue-700">
                                                {formatearFechaCorta(
                                                  cuota.fecha_vencimiento
                                                )}
                                              </strong>
                                            </span>
                                          </div>
                                          <div className="sm:text-right">
                                            {planPrevio.con_intereses && (
                                              <span className="text-[11px] text-slate-500 mr-2 block sm:inline">
                                                (Saldo deudor:{" "}
                                                {formatearUsd(
                                                  cuota.saldo_deudor_usd
                                                )}{" "}
                                                → Capital:{" "}
                                                {formatearUsd(
                                                  cuota.capital_usd
                                                )}{" "}
                                                + Interés:{" "}
                                                {formatearUsd(
                                                  cuota.interes_usd
                                                )}
                                                )
                                              </span>
                                            )}
                                            <span className="font-black text-slate-900">
                                              {formatearUsd(
                                                cuota.monto_cuota_usd
                                              )}{" "}
                                              USD
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Penalización por incumplimiento */}
                                {planPrevio.penalizacion_mora && (
                                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 leading-relaxed">
                                    <strong className="font-extrabold uppercase block mb-1 text-amber-900">
                                      ⚠️ Detalle de Penalización en Caso de
                                      Incumplimiento al Vencimiento:
                                    </strong>
                                    {planPrevio.penalizacion_mora}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Botones finales de decisión sobre la Vista Previa */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setMostrarVistaPrevia(false);
                                  window.scrollTo({
                                    top: 150,
                                    behavior: "smooth",
                                  });
                                }}
                                className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold px-5 py-3 rounded-xl cursor-pointer"
                              >
                                ✏️ Volver para Modificar / Ajustar Datos
                              </button>

                              <button
                                type="button"
                                disabled={guardandoPresupuesto}
                                onClick={manejarCrearPresupuesto}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs sm:text-sm font-extrabold px-6 py-3.5 rounded-xl shadow-md cursor-pointer"
                              >
                                {guardandoPresupuesto
                                  ? "Guardando Presupuesto..."
                                  : "✅ Estoy Conforme: Guardar Presupuesto y Habilitar Envío →"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PASO 3: PRESUPUESTOS EMITIDOS, ENVÍO Y SEGUIMIENTO             */}
            {/* ============================================================== */}
            {pestanaActiva === "presupuestos" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Presupuestos Emitidos y Envío al Cliente
                  </h2>
                  <p className="text-xs text-slate-600">
                    Desde aquí puedes enviar o reenviar el enlace seguro a cada
                    cliente por Correo o WhatsApp, y verificar si ya aprobaron,
                    solicitaron ajustes o rechazaron la propuesta.
                  </p>
                </div>

                <div className="space-y-4">
                  {datos.presupuestos.map((pre) => (
                    <div
                      key={pre.id}
                      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                            {pre.codigo}
                          </span>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full border ${
                              pre.estado === "aprobado"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : pre.estado === "en_negociacion"
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : pre.estado === "rechazado"
                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                    : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            Estado: {pre.estado.toUpperCase()}
                          </span>
                          <span className="text-base font-black text-blue-700">
                            {formatearUsd(pre.monto_total_usd)} USD
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900">
                          {pre.titulo}
                        </h3>

                        <p className="text-xs text-slate-600">
                          <strong>Cliente:</strong> {pre.cliente_nombre}{" "}
                          {pre.empresa ? `(${pre.empresa})` : ""} ·{" "}
                          <strong>Correo:</strong> {pre.cliente_email}{" "}
                          {pre.cliente_telefono
                            ? `· Tel: ${pre.cliente_telefono}`
                            : ""}
                        </p>

                        {pre.comentarios_cliente && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950">
                            <strong>Observaciones del cliente:</strong>{" "}
                            {pre.comentarios_cliente}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 lg:w-60">
                        <button
                          type="button"
                          disabled={enviandoCorreoId === pre.id}
                          onClick={() => manejarEnviarPorCorreo(pre)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer"
                        >
                          {enviandoCorreoId === pre.id
                            ? "Enviando correo..."
                            : "✉️ Enviar por Correo"}
                        </button>

                        <button
                          type="button"
                          onClick={() => enviarPresupuestoPorWhatsApp(pre)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer"
                        >
                          💬 Enviar por WhatsApp
                        </button>

                        <div className="flex gap-2 w-full">
                          <button
                            type="button"
                            onClick={() =>
                              copiarEnlacePortapapeles(
                                pre.token_acceso,
                                pre.codigo
                              )
                            }
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl cursor-pointer"
                          >
                            🔗 Copiar Link
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onAbrirPresupuesto(pre.token_acceso)
                            }
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl cursor-pointer"
                          >
                            👁️ Ver Vista
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => cargarPresupuestoEnFormulario(pre)}
                          className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold py-2 px-3 rounded-xl cursor-pointer"
                        >
                          ✏️ Modificar / Reescribir Presupuesto
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PASO 4: PROYECTOS APROBADOS, COBROS, GASTOS Y P&L              */}
            {/* ============================================================== */}
            {pestanaActiva === "proyectos" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Proyectos en Ejecución y Estado de Ganancias y Pérdidas
                    (P&L)
                  </h2>
                  <p className="text-xs text-slate-600">
                    Cuando un cliente aprueba su presupuesto, el proyecto se
                    crea automáticamente aquí para controlar cobros (USD/VES a
                    tasa BCV) y gastos directos.
                  </p>
                </div>

                {datos.proyectos.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                    <p className="text-sm text-slate-600">
                      Aún no hay proyectos aprobados. Puedes abrir cualquier
                      presupuesto pendiente y aprobarlo para iniciar su control
                      de P&L.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {datos.proyectos.map((proy) => (
                        <div
                          key={proy.id}
                          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                              PROYECTO #{proy.id} · {proy.presupuesto_codigo}
                            </span>
                            <span className="text-xs font-bold text-slate-500 uppercase">
                              {proy.estado}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-extrabold text-slate-900">
                              {proy.nombre}
                            </h3>
                            <p className="text-xs text-slate-600">
                              Cliente: {proy.cliente_nombre}{" "}
                              {proy.empresa ? `(${proy.empresa})` : ""}
                            </p>
                          </div>

                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
                            <div>
                              <span className="text-[11px] text-slate-500 block">
                                Acordado
                              </span>
                              <span className="text-sm font-extrabold text-slate-900">
                                {formatearUsd(proy.monto_acordado_usd)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 block">
                                Cobrado
                              </span>
                              <span className="text-sm font-extrabold text-emerald-700">
                                {formatearUsd(proy.total_cobrado_usd)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 block">
                                Gastos
                              </span>
                              <span className="text-sm font-extrabold text-rose-700">
                                {formatearUsd(proy.total_gastos_usd)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 block">
                                Utilidad Neta
                              </span>
                              <span className="text-sm font-extrabold text-blue-700">
                                {formatearUsd(proy.ganancia_neta_usd)} (
                                {proy.margen_rentabilidad_porcentaje}%)
                              </span>
                            </div>
                          </div>

                          {/* Resumen del Plan de Cuotas del Proyecto y Facturas registradas */}
                          {proy.plan_pago &&
                            (proy.plan_pago.modalidad === "partes" ||
                              proy.plan_pago.modalidad === "ambas") && (
                              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
                                <span className="font-extrabold text-blue-800 block">
                                  💳 Plan de Cuotas Acordado (
                                  {proy.plan_pago.periodicidad}):
                                </span>
                                <p>
                                  {proy.plan_pago.tiene_inicial
                                    ? `Inicial: ${formatearUsd(proy.plan_pago.monto_inicial_usd)} (${proy.plan_pago.porcentaje_inicial}%) · `
                                    : "Sin inicial · "}
                                  <strong>
                                    {proy.plan_pago.numero_cuotas} cuotas de{" "}
                                    {formatearUsd(
                                      proy.plan_pago.monto_cuota_usd
                                    )}{" "}
                                    USD
                                  </strong>{" "}
                                  · Total plan:{" "}
                                  <strong>
                                    {formatearUsd(
                                      proy.plan_pago.monto_total_financiado_usd
                                    )}{" "}
                                    USD
                                  </strong>
                                </p>
                              </div>
                            )}

                          {Array.isArray(proy.facturas) &&
                            proy.facturas.length > 0 && (
                              <div className="border-t border-slate-200 pt-3 space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                                  🧾 Facturas / Cobros Registrados (
                                  {proy.facturas.length}):
                                </span>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {proy.facturas.map((fac) => (
                                    <div
                                      key={fac.id}
                                      className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                    >
                                      <div>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                            {fac.numero_factura}
                                          </span>
                                          {fac.detalle_cuotas
                                            ?.etiqueta_aplicacion && (
                                            <span className="bg-blue-100 text-blue-800 font-bold text-[11px] px-2 py-0.5 rounded-full">
                                              {
                                                fac.detalle_cuotas
                                                  .etiqueta_aplicacion
                                              }
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-slate-700 font-medium mt-1">
                                          {fac.concepto}
                                        </p>
                                      </div>
                                      <div className="sm:text-right shrink-0">
                                        <span className="font-black text-emerald-700 block">
                                          {formatearUsd(fac.monto_usd)} USD
                                        </span>
                                        {fac.moneda_pago === "VES" && (
                                          <span className="text-[11px] text-slate-500">
                                            Bs. {fac.monto_ves} (BCV:{" "}
                                            {fac.tasa_bcv})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>

                    {/* Formularios para cargar cobros y gastos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <form
                        onSubmit={manejarRegistrarCobro}
                        className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
                      >
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">
                            ➕ Emitir / Registrar Factura de Cobro (Ingreso)
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Permite registrar pago inicial, 1 cuota completa,{" "}
                            <strong>más de una cuota</strong> o el{" "}
                            <strong>pago parcial (abono) de una cuota</strong>.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <select
                            required
                            value={formCobro.proyecto_id}
                            onChange={(e) => {
                              const nuevoProyId = e.target.value;
                              setFormCobro((p) => ({
                                ...p,
                                proyecto_id: nuevoProyId,
                              }));
                              if (nuevoProyId) {
                                aplicarSugerenciaCobro(
                                  nuevoProyId,
                                  formCobro.tipo_aplicacion,
                                  formCobro.numero_cuota_inicio,
                                  formCobro.cantidad_cuotas
                                );
                              }
                            }}
                            className="col-span-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                          >
                            <option value="">1. Seleccionar Proyecto...</option>
                            {datos.proyectos.map((pr) => (
                              <option key={pr.id} value={pr.id}>
                                #{pr.id} — {pr.nombre} ({pr.cliente_nombre})
                              </option>
                            ))}
                          </select>

                          {/* Selector de Modalidad de Facturación sobre las Cuotas */}
                          <div className="col-span-2 bg-blue-50/60 border border-blue-200 rounded-xl p-3 space-y-3">
                            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
                              2. Modalidad del Cobro / Aplicación a Cuotas
                            </label>
                            <select
                              value={formCobro.tipo_aplicacion}
                              onChange={(e) => {
                                const nuevoTipo = e.target.value;
                                setFormCobro((p) => ({
                                  ...p,
                                  tipo_aplicacion: nuevoTipo,
                                }));
                                if (formCobro.proyecto_id) {
                                  aplicarSugerenciaCobro(
                                    formCobro.proyecto_id,
                                    nuevoTipo,
                                    formCobro.numero_cuota_inicio,
                                    formCobro.cantidad_cuotas
                                  );
                                }
                              }}
                              className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                            >
                              <option value="cuota_completa">
                                Pago de 1 Cuota Completa
                              </option>
                              <option value="multiples_cuotas">
                                Pago de Más de 1 Cuota (Múltiples Cuotas Juntas)
                              </option>
                              <option value="abono_parcial_cuota">
                                Pago Parcial / Abono a Cuenta de 1 Cuota
                              </option>
                              <option value="pago_inicial">
                                Pago Inicial / Anticipo del Proyecto
                              </option>
                              <option value="pago_total">
                                Liquidación Total del Saldo Restante
                              </option>
                            </select>

                            {(formCobro.tipo_aplicacion === "cuota_completa" ||
                              formCobro.tipo_aplicacion ===
                                "multiples_cuotas" ||
                              formCobro.tipo_aplicacion ===
                                "abono_parcial_cuota") && (
                              <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    {formCobro.tipo_aplicacion ===
                                    "multiples_cuotas"
                                      ? "Desde la Cuota Nro.:"
                                      : "Corresponde a la Cuota Nro.:"}
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="36"
                                    value={formCobro.numero_cuota_inicio}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormCobro((p) => ({
                                        ...p,
                                        numero_cuota_inicio: val,
                                      }));
                                      if (formCobro.proyecto_id) {
                                        aplicarSugerenciaCobro(
                                          formCobro.proyecto_id,
                                          formCobro.tipo_aplicacion,
                                          val,
                                          formCobro.cantidad_cuotas
                                        );
                                      }
                                    }}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                                  />
                                </div>

                                {formCobro.tipo_aplicacion ===
                                  "multiples_cuotas" && (
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                      Cantidad de Cuotas a Pagar:
                                    </label>
                                    <input
                                      type="number"
                                      min="2"
                                      max="36"
                                      value={formCobro.cantidad_cuotas}
                                      onChange={(e) => {
                                        const cant = e.target.value;
                                        setFormCobro((p) => ({
                                          ...p,
                                          cantidad_cuotas: cant,
                                        }));
                                        if (formCobro.proyecto_id) {
                                          aplicarSugerenciaCobro(
                                            formCobro.proyecto_id,
                                            formCobro.tipo_aplicacion,
                                            formCobro.numero_cuota_inicio,
                                            cant
                                          );
                                        }
                                      }}
                                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                                    />
                                  </div>
                                )}

                                {formCobro.tipo_aplicacion ===
                                  "abono_parcial_cuota" &&
                                  (() => {
                                    const proySel = datos.proyectos.find(
                                      (p) =>
                                        p.id === Number(formCobro.proyecto_id)
                                    );
                                    const valorCuota =
                                      proySel?.plan_pago?.monto_cuota_usd || 0;
                                    const abonoActual = Number(
                                      formCobro.monto_usd || 0
                                    );
                                    const restaCuota = Math.max(
                                      0,
                                      Number(
                                        (valorCuota - abonoActual).toFixed(2)
                                      )
                                    );
                                    return valorCuota > 0 ? (
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex flex-col justify-center">
                                        <span className="text-[10px] text-amber-800">
                                          Cuota completa:{" "}
                                          {formatearUsd(valorCuota)}
                                        </span>
                                        <span className="text-xs font-extrabold text-amber-950">
                                          Restará de la cuota:{" "}
                                          {formatearUsd(restaCuota)}
                                        </span>
                                      </div>
                                    ) : null;
                                  })()}
                              </div>
                            )}
                          </div>

                          <input
                            type="text"
                            required
                            placeholder="Nro. Factura / Recibo (Ej. FAC-001)"
                            value={formCobro.numero_factura}
                            onChange={(e) =>
                              setFormCobro((p) => ({
                                ...p,
                                numero_factura: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Concepto detallado de la factura"
                            value={formCobro.concepto}
                            onChange={(e) =>
                              setFormCobro((p) => ({
                                ...p,
                                concepto: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          />
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Monto a cobrar en USD"
                            value={formCobro.monto_usd}
                            onChange={(e) =>
                              setFormCobro((p) => ({
                                ...p,
                                monto_usd: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                          />
                          <select
                            value={formCobro.moneda_pago}
                            onChange={(e) =>
                              setFormCobro((p) => ({
                                ...p,
                                moneda_pago: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          >
                            <option value="VES">Pagado en VES (BCV)</option>
                            <option value="USD">Pagado en USD</option>
                          </select>
                          {formCobro.moneda_pago === "VES" && (
                            <input
                              type="number"
                              step="0.0001"
                              required
                              placeholder="Tasa BCV del día"
                              value={formCobro.tasa_bcv}
                              onChange={(e) =>
                                setFormCobro((p) => ({
                                  ...p,
                                  tasa_bcv: e.target.value,
                                }))
                              }
                              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                            />
                          )}
                          <input
                            type="text"
                            placeholder="Referencia bancaria"
                            value={formCobro.referencia_bancaria}
                            onChange={(e) =>
                              setFormCobro((p) => ({
                                ...p,
                                referencia_bancaria: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                        >
                          Guardar Cobro
                        </button>
                      </form>

                      <form
                        onSubmit={manejarRegistrarGasto}
                        className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
                      >
                        <h3 className="text-sm font-extrabold text-slate-900">
                          ➖ Registrar Gasto Directo (Egreso)
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            required
                            value={formGasto.proyecto_id}
                            onChange={(e) =>
                              setFormGasto((p) => ({
                                ...p,
                                proyecto_id: e.target.value,
                              }))
                            }
                            className="col-span-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          >
                            <option value="">Seleccionar Proyecto...</option>
                            {datos.proyectos.map((pr) => (
                              <option key={pr.id} value={pr.id}>
                                #{pr.id} — {pr.nombre}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Descripción (Ej. Dominio / VPS)"
                            value={formGasto.descripcion}
                            onChange={(e) =>
                              setFormGasto((p) => ({
                                ...p,
                                descripcion: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          />
                          <select
                            value={formGasto.categoria}
                            onChange={(e) =>
                              setFormGasto((p) => ({
                                ...p,
                                categoria: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          >
                            <option value="hosting">Hosting / Servidor</option>
                            <option value="dominio">Dominio Web</option>
                            <option value="licencia">Licencia / API</option>
                            <option value="subcontratacion">
                              Subcontratación
                            </option>
                            <option value="otro">Otro costo directo</option>
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Monto original"
                            value={formGasto.monto_original}
                            onChange={(e) =>
                              setFormGasto((p) => ({
                                ...p,
                                monto_original: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          />
                          <select
                            value={formGasto.moneda_origen}
                            onChange={(e) =>
                              setFormGasto((p) => ({
                                ...p,
                                moneda_origen: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          >
                            <option value="VES">Pagado en VES</option>
                            <option value="USD">Pagado en USD</option>
                          </select>
                          {formGasto.moneda_origen === "VES" && (
                            <input
                              type="number"
                              step="0.0001"
                              required
                              placeholder="Tasa BCV aplicada"
                              value={formGasto.tasa_cambio}
                              onChange={(e) =>
                                setFormGasto((p) => ({
                                  ...p,
                                  tasa_cambio: e.target.value,
                                }))
                              }
                              className="col-span-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                            />
                          )}
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                        >
                          Guardar Gasto
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal para registrar manualmente un requerimiento (ej. recibido por correo o WhatsApp) */}
      {mostrarModalReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Registrar Requerimiento de Cliente
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModalReq(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={manejarRegistrarRequerimientoManual}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre del cliente *"
                  value={formNuevoReq.nombre}
                  onChange={(e) =>
                    setFormNuevoReq((p) => ({ ...p, nombre: e.target.value }))
                  }
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs"
                />
                <input
                  type="email"
                  required
                  placeholder="Correo electrónico *"
                  value={formNuevoReq.correo}
                  onChange={(e) =>
                    setFormNuevoReq((p) => ({ ...p, correo: e.target.value }))
                  }
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="Teléfono / WhatsApp"
                  value={formNuevoReq.telefono}
                  onChange={(e) =>
                    setFormNuevoReq((p) => ({
                      ...p,
                      telefono: e.target.value,
                    }))
                  }
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="Empresa / Negocio"
                  value={formNuevoReq.empresa}
                  onChange={(e) =>
                    setFormNuevoReq((p) => ({ ...p, empresa: e.target.value }))
                  }
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>

              <select
                value={formNuevoReq.rubro}
                onChange={(e) =>
                  setFormNuevoReq((p) => ({ ...p, rubro: e.target.value }))
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs"
              >
                {Object.keys(PLANTILLAS_ALCANCE).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <textarea
                rows="4"
                required
                placeholder="Pegue o describa aquí el requerimiento enviado por el cliente *"
                value={formNuevoReq.mensaje}
                onChange={(e) =>
                  setFormNuevoReq((p) => ({ ...p, mensaje: e.target.value }))
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalReq(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Guardar en Bandeja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
