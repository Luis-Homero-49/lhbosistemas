/**
 * Esquemas de validación para el Módulo de Presupuestos, Proyectos y P&L
 * Equivalente en Node.js a backend/schemas/presupuesto_schema.py
 */

const ACCIONES_PERMITIDAS = ["aprobar", "negociar", "rechazar"];
const MONEDAS_PERMITIDAS = ["USD", "VES"];

/**
 * Valida la acción del cliente sobre un presupuesto (Aprobar, Negociar o Rechazar)
 * @param {object} payload
 */
export function validarAccionPresupuesto(payload = {}) {
  const accion = String(payload.accion || "").trim().toLowerCase();
  const comentarios =
    payload.comentarios !== undefined && payload.comentarios !== null
      ? String(payload.comentarios).trim()
      : null;

  if (!ACCIONES_PERMITIDAS.includes(accion)) {
    return {
      valido: false,
      error: "Acción no reconocida. Valores permitidos: 'aprobar', 'negociar', 'rechazar'.",
    };
  }

  if (accion === "negociar" && (!comentarios || comentarios.length < 3)) {
    return {
      valido: false,
      error: "Por favor ingrese sus observaciones o comentarios para iniciar la negociación.",
    };
  }

  return {
    valido: true,
    datos: {
      accion,
      comentarios,
    },
  };
}

/**
 * Valida el registro de un cobro / factura de un proyecto
 * @param {object} payload
 */
export function validarCobroRegistro(payload = {}) {
  const proyecto_id = Number(payload.proyecto_id);
  const numero_factura = String(payload.numero_factura || "").trim();
  const concepto = String(payload.concepto || "").trim();
  const monto_usd = Number(payload.monto_usd);
  const moneda_pago = String(payload.moneda_pago || "VES").trim().toUpperCase();
  const tasa_bcv =
    payload.tasa_bcv !== undefined ? Number(payload.tasa_bcv) : 1.0;
  const referencia_bancaria = payload.referencia_bancaria
    ? String(payload.referencia_bancaria).trim()
    : null;
  const detalle_cuotas =
    payload.detalle_cuotas && typeof payload.detalle_cuotas === "object"
      ? payload.detalle_cuotas
      : null;
  const estado = String(payload.estado || "cobrado").trim().toLowerCase();

  if (!Number.isInteger(proyecto_id) || proyecto_id <= 0) {
    return { valido: false, error: "El campo proyecto_id debe ser un entero válido." };
  }
  if (!numero_factura) {
    return { valido: false, error: "El campo numero_factura es obligatorio." };
  }
  if (!concepto) {
    return { valido: false, error: "El campo concepto es obligatorio." };
  }
  if (!Number.isFinite(monto_usd) || monto_usd <= 0) {
    return { valido: false, error: "El campo monto_usd debe ser un monto mayor a 0." };
  }
  if (!MONEDAS_PERMITIDAS.includes(moneda_pago)) {
    return { valido: false, error: "El campo moneda_pago debe ser 'USD' o 'VES'." };
  }
  if (!Number.isFinite(tasa_bcv) || tasa_bcv <= 0) {
    return { valido: false, error: "El campo tasa_bcv debe ser un número mayor a 0." };
  }

  const monto_ves =
    moneda_pago === "VES"
      ? Number((monto_usd * tasa_bcv).toFixed(2))
      : Number((monto_usd * (tasa_bcv > 1 ? tasa_bcv : 1)).toFixed(2));

  return {
    valido: true,
    datos: {
      proyecto_id,
      numero_factura,
      concepto,
      monto_usd: Number(monto_usd.toFixed(2)),
      moneda_pago,
      tasa_bcv: Number(tasa_bcv.toFixed(4)),
      monto_ves,
      referencia_bancaria,
      detalle_cuotas,
      estado: ["pendiente", "cobrado", "anulado"].includes(estado)
        ? estado
        : "cobrado",
    },
  };
}

/**
 * Valida el registro de un gasto directo asociado a un proyecto
 * @param {object} payload
 */
export function validarGastoRegistro(payload = {}) {
  const proyecto_id = Number(payload.proyecto_id);
  const descripcion = String(payload.descripcion || "").trim();
  const categoria = String(payload.categoria || "").trim();
  const moneda_origen = String(payload.moneda_origen || "VES")
    .trim()
    .toUpperCase();
  const monto_original = Number(payload.monto_original);
  const tasa_cambio =
    payload.tasa_cambio !== undefined ? Number(payload.tasa_cambio) : 1.0;
  const comprobante_url = payload.comprobante_url
    ? String(payload.comprobante_url).trim()
    : null;

  if (!Number.isInteger(proyecto_id) || proyecto_id <= 0) {
    return { valido: false, error: "El campo proyecto_id debe ser un entero válido." };
  }
  if (!descripcion) {
    return { valido: false, error: "El campo descripcion es obligatorio." };
  }
  if (!categoria) {
    return { valido: false, error: "El campo categoria es obligatorio." };
  }
  if (!MONEDAS_PERMITIDAS.includes(moneda_origen)) {
    return { valido: false, error: "El campo moneda_origen debe ser 'USD' o 'VES'." };
  }
  if (!Number.isFinite(monto_original) || monto_original <= 0) {
    return { valido: false, error: "El campo monto_original debe ser mayor a 0." };
  }
  if (!Number.isFinite(tasa_cambio) || tasa_cambio <= 0) {
    return { valido: false, error: "El campo tasa_cambio debe ser mayor a 0." };
  }

  const monto_equivalente_usd =
    moneda_origen === "USD"
      ? Number(monto_original.toFixed(2))
      : Number((monto_original / tasa_cambio).toFixed(2));

  return {
    valido: true,
    datos: {
      proyecto_id,
      descripcion,
      categoria,
      moneda_origen,
      monto_original: Number(monto_original.toFixed(2)),
      tasa_cambio: Number(tasa_cambio.toFixed(4)),
      monto_equivalente_usd,
      comprobante_url,
    },
  };
}
