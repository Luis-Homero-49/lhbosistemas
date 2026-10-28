import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  validarAccionPresupuesto,
  validarCobroRegistro,
  validarGastoRegistro,
} from "../schemas/presupuesto_schema.js";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");
const SCHEMA_PATH = path.join(ROOT_DIR, "database", "presupuestos_schema.sql");
const LOCAL_STORE_PATH = path.join(
  ROOT_DIR,
  "database",
  "presupuestos_local.json"
);

let pgPool = null;
let usarPostgres = false;
let dbInicializada = false;

/**
 * Datos semilla de demostración para poder probar la vista del cliente y la bandeja de requerimientos
 */
const PRESUPUESTO_DEMO_TOKEN = "demo-pre-2026-001";

function escaparHtml(texto = "") {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obtenerRequerimientosSemilla() {
  return [
    {
      id: 1,
      cliente_id: null,
      nombre: "María Fernanda Rivas",
      empresa: "Comercializadora Los Andes C.A.",
      email: "mfrivas@comercializadoralosandes.com",
      telefono: "+58 412-8904512",
      rubro: "Sistema de Inventario / Facturación",
      mensaje:
        "Hola, necesitamos un sistema web para controlar el inventario de 3 sucursales, lista de precios en dólares con cálculo automático en bolívares a tasa BCV y emisión de pedidos por vendedores.",
      estado: "nuevo",
      presupuesto_id: null,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    },
    {
      id: 2,
      cliente_id: 1,
      nombre: "Carlos Mendoza",
      empresa: "Distribuidora El Sol C.A.",
      email: "cmendoza@distribuidoraelsol.com",
      telefono: "+58 414-5551234",
      rubro: "Página Web / Catálogo Comercial",
      mensaje:
        "Requerimos catálogo digital B2B para clientes mayoristas integrado con inventario y cuentas por cobrar multimoneda.",
      estado: "cotizado",
      presupuesto_id: 1,
      creado_en: new Date(Date.now() - 86400000).toISOString(),
      actualizado_en: new Date().toISOString(),
    },
  ];
}

function obtenerStoreLocalInicial() {
  return {
    clientes: [
      {
        id: 1,
        nombre: "Carlos Mendoza",
        empresa: "Distribuidora El Sol C.A.",
        email: "cmendoza@distribuidoraelsol.com",
        telefono: "+58 414-5551234",
        creado_en: new Date().toISOString(),
      },
    ],
    requerimientos: obtenerRequerimientosSemilla(),
    presupuestos: [
      {
        id: 1,
        cliente_id: 1,
        codigo: "PRE-2026-001",
        titulo:
          "Sistema Web de Inventario, Catálogo B2B y Facturación Multimoneda (USD/VES)",
        alcance: [
          "1. Panel Administrativo de Inventario y Precios en USD con conversión automática a Bolívares (VES) según tasa oficial BCV.",
          "2. Catálogo Digital B2B con carrito de pedidos para clientes mayoristas y generación de notas de entrega en PDF.",
          "3. Módulo de Cuentas por Cobrar, registro de pagos en divisas y Bolívares (Pago Móvil / Transferencia) con conciliación de referencias bancarias.",
          "4. Reporte gerencial de Ganancias y Pérdidas (P&L) en tiempo real y despliegue en servidor seguro con certificado SSL.",
          "5. Capacitación remota al personal y soporte técnico garantizado por 60 días tras la puesta en producción.",
        ].join("\n\n"),
        monto_total_usd: 1450.0,
        token_acceso: PRESUPUESTO_DEMO_TOKEN,
        estado: "pendiente",
        comentarios_cliente: null,
        fecha_vencimiento: "2026-11-15",
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      },
    ],
    proyectos: [],
    facturas_cobros: [],
    gastos_proyecto: [],
  };
}

function leerStoreLocal() {
  try {
    if (!fs.existsSync(LOCAL_STORE_PATH)) {
      const inicial = obtenerStoreLocalInicial();
      fs.mkdirSync(path.dirname(LOCAL_STORE_PATH), { recursive: true });
      fs.writeFileSync(
        LOCAL_STORE_PATH,
        JSON.stringify(inicial, null, 2),
        "utf-8"
      );
      return inicial;
    }
    const contenido = fs.readFileSync(LOCAL_STORE_PATH, "utf-8");
    const parsed = JSON.parse(contenido);
    let modificado = false;
    if (!Array.isArray(parsed.requerimientos)) {
      parsed.requerimientos = obtenerRequerimientosSemilla();
      modificado = true;
    }
    if (!Array.isArray(parsed.clientes)) parsed.clientes = [];
    if (!Array.isArray(parsed.presupuestos)) parsed.presupuestos = [];
    if (!Array.isArray(parsed.proyectos)) parsed.proyectos = [];
    if (!Array.isArray(parsed.facturas_cobros)) parsed.facturas_cobros = [];
    if (!Array.isArray(parsed.gastos_proyecto)) parsed.gastos_proyecto = [];
    if (modificado) {
      guardarStoreLocal(parsed);
    }
    return parsed;
  } catch (err) {
    console.warn("Error leyendo store local, usando memoria inicial:", err);
    return obtenerStoreLocalInicial();
  }
}

function guardarStoreLocal(datos) {
  fs.mkdirSync(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(datos, null, 2), "utf-8");
}

/**
 * Inicializa la conexión a PostgreSQL si las variables de entorno están configuradas,
 * o activa automáticamente el almacenamiento local JSON de respaldo.
 */
export async function inicializarBaseDeDatos() {
  if (dbInicializada) return;
  dbInicializada = true;

  const connectionString = process.env.DATABASE_URL;
  const tieneConfigPg = Boolean(
    connectionString ||
      process.env.PGPASSWORD ||
      process.env.PGDATABASE ||
      process.env.PGHOST
  );

  if (!tieneConfigPg) {
    usarPostgres = false;
    leerStoreLocal();
    console.log(
      `[Presupuestos] Modo almacenamiento local activo (${LOCAL_STORE_PATH}). Configure DATABASE_URL o PGPASSWORD para conectar a PostgreSQL.`
    );
    return;
  }

  try {
    pgPool = connectionString
      ? new Pool({ connectionString })
      : new Pool({
          host: process.env.PGHOST || "localhost",
          port: Number(process.env.PGPORT || 5432),
          database: process.env.PGDATABASE || "lhvosistemas",
          user: process.env.PGUSER || "postgres",
          password: process.env.PGPASSWORD || "",
        });

    const client = await pgPool.connect();
    try {
      if (fs.existsSync(SCHEMA_PATH)) {
        const sqlSchema = fs.readFileSync(SCHEMA_PATH, "utf-8");
        await client.query(sqlSchema);
      }
      await client.query(
        "ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS plan_pago JSONB"
      );
      await client.query(
        "ALTER TABLE facturas_cobros ADD COLUMN IF NOT EXISTS detalle_cuotas JSONB"
      );

      // Insertar presupuesto demo si la tabla está vacía
      const { rows } = await client.query(
        "SELECT COUNT(*)::int AS total FROM presupuestos"
      );
      if (rows[0].total === 0) {
        const clienteRes = await client.query(
          `INSERT INTO clientes (nombre, empresa, email, telefono)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre
           RETURNING id`,
          [
            "Carlos Mendoza",
            "Distribuidora El Sol C.A.",
            "cmendoza@distribuidoraelsol.com",
            "+58 414-5551234",
          ]
        );
        const demo = obtenerStoreLocalInicial().presupuestos[0];
        await client.query(
          `INSERT INTO presupuestos (cliente_id, codigo, titulo, alcance, monto_total_usd, token_acceso, estado, fecha_vencimiento)
           VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', $7)
           ON CONFLICT (codigo) DO NOTHING`,
          [
            clienteRes.rows[0].id,
            demo.codigo,
            demo.titulo,
            demo.alcance,
            demo.monto_total_usd,
            demo.token_acceso,
            demo.fecha_vencimiento,
          ]
        );
      }

      const reqCount = await client.query(
        "SELECT COUNT(*)::int AS total FROM requerimientos"
      );
      if (reqCount.rows[0].total === 0) {
        const reqDemo = obtenerRequerimientosSemilla()[0];
        await client.query(
          `INSERT INTO requerimientos (nombre, empresa, email, telefono, rubro, mensaje, estado)
           VALUES ($1, $2, $3, $4, $5, $6, 'nuevo')`,
          [
            reqDemo.nombre,
            reqDemo.empresa,
            reqDemo.email,
            reqDemo.telefono,
            reqDemo.rubro,
            reqDemo.mensaje,
          ]
        );
      }

      usarPostgres = true;
      console.log(
        "[Presupuestos] Conectado exitosamente a PostgreSQL y esquema verificado."
      );
    } finally {
      client.release();
    }
  } catch (err) {
    usarPostgres = false;
    leerStoreLocal();
    console.warn(
      `[Presupuestos] No se pudo conectar a PostgreSQL (${err.message}). Usando almacenamiento persistente local de respaldo.`
    );
  }
}

/**
 * Registra un requerimiento entrante (desde el formulario web /api/contacto o manual)
 */
export async function registrarRequerimientoContacto(payload = {}) {
  await inicializarBaseDeDatos();

  const nombre = String(payload.nombre || "").trim();
  const email = String(
    payload.correo || payload.email || payload.contactoCliente || ""
  ).trim();
  const telefono = payload.telefono ? String(payload.telefono).trim() : null;
  const empresa = payload.empresa ? String(payload.empresa).trim() : null;
  const rubro = String(payload.rubro || "No especificado").trim();
  const mensaje = String(payload.mensaje || "").trim();

  if (!nombre || !email || !mensaje) {
    return {
      status: 400,
      body: {
        detail: "Nombre, correo electrónico y mensaje son obligatorios.",
      },
    };
  }

  if (usarPostgres && pgPool) {
    const cliRes = await pgPool.query(
      `INSERT INTO clientes (nombre, empresa, email, telefono)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
         SET nombre = EXCLUDED.nombre,
             empresa = COALESCE(EXCLUDED.empresa, clientes.empresa),
             telefono = COALESCE(EXCLUDED.telefono, clientes.telefono)
       RETURNING id`,
      [nombre, empresa, email, telefono]
    );
    const clienteId = cliRes.rows[0].id;

    const { rows } = await pgPool.query(
      `INSERT INTO requerimientos (cliente_id, nombre, empresa, email, telefono, rubro, mensaje, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'nuevo')
       RETURNING *`,
      [clienteId, nombre, empresa, email, telefono, rubro, mensaje]
    );
    return { status: 201, body: rows[0] };
  }

  const store = leerStoreLocal();
  let cliente = store.clientes.find(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );
  if (!cliente) {
    const nuevoClienteId =
      store.clientes.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    cliente = {
      id: nuevoClienteId,
      nombre,
      empresa,
      email,
      telefono,
      creado_en: new Date().toISOString(),
    };
    store.clientes.push(cliente);
  } else {
    cliente.nombre = nombre;
    if (empresa) cliente.empresa = empresa;
    if (telefono) cliente.telefono = telefono;
  }

  const nuevoId =
    store.requerimientos.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  const ahora = new Date().toISOString();
  const nuevoReq = {
    id: nuevoId,
    cliente_id: cliente.id,
    nombre,
    empresa,
    email,
    telefono,
    rubro,
    mensaje,
    estado: "nuevo",
    presupuesto_id: null,
    creado_en: ahora,
    actualizado_en: ahora,
  };
  store.requerimientos.unshift(nuevoReq);
  guardarStoreLocal(store);
  return { status: 201, body: nuevoReq };
}

/**
 * Actualiza el estado de un requerimiento ('nuevo', 'en_elaboracion', 'cotizado', 'archivado')
 */
export async function actualizarEstadoRequerimiento(id, payload = {}) {
  await inicializarBaseDeDatos();
  const reqId = Number(id);
  const estado = String(payload.estado || "").trim();
  const estadosValidos = ["nuevo", "en_elaboracion", "cotizado", "archivado"];

  if (!estadosValidos.includes(estado)) {
    return {
      status: 400,
      body: { detail: "Estado de requerimiento no válido." },
    };
  }

  if (usarPostgres && pgPool) {
    const { rows } = await pgPool.query(
      `UPDATE requerimientos
       SET estado = $1, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [estado, reqId]
    );
    if (rows.length === 0) {
      return { status: 404, body: { detail: "Requerimiento no encontrado." } };
    }
    return { status: 200, body: rows[0] };
  }

  const store = leerStoreLocal();
  const reqItem = store.requerimientos.find((r) => r.id === reqId);
  if (!reqItem) {
    return { status: 404, body: { detail: "Requerimiento no encontrado." } };
  }
  reqItem.estado = estado;
  reqItem.actualizado_en = new Date().toISOString();
  guardarStoreLocal(store);
  return { status: 200, body: reqItem };
}

let ultimaSincronizacionResend = 0;
let ultimoEstadoSyncResend = null;

function esperarMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sincroniza automáticamente en la Bandeja de Requerimientos los correos de
 * "Nueva Consulta Web:" que hayan sido enviados previamente vía Resend.
 * Así recupera el requerimiento de prueba que se envió desde lhbosistemas antes
 * de activar la base de datos o tras un reinicio del contenedor.
 */
export async function sincronizarRequerimientosDesdeResend(forzar = false) {
  const apiKey = (
    process.env.RESEND_API_KEY ||
    process.env.resend_api_key ||
    ""
  ).trim();

  if (!apiKey) {
    ultimoEstadoSyncResend = { ok: false, motivo: "sin_api_key" };
    return ultimoEstadoSyncResend;
  }

  const ahoraMs = Date.now();
  if (
    !forzar &&
    ultimoEstadoSyncResend &&
    ahoraMs - ultimaSincronizacionResend < 30000
  ) {
    return ultimoEstadoSyncResend;
  }
  ultimaSincronizacionResend = ahoraMs;

  try {
    const listResp = await fetch("https://api.resend.com/emails", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const listData = await listResp.json().catch(() => ({}));
    if (!listResp.ok) {
      ultimoEstadoSyncResend = {
        ok: false,
        status: listResp.status,
        error: listData?.message || listData?.name || "Error al listar correos en Resend",
      };
      return ultimoEstadoSyncResend;
    }

    const listaCorreos = Array.isArray(listData?.data) ? listData.data : [];

    // Filtrar los correos internos de requerimiento ("Nueva Consulta Web: ...")
    const consultasWeb = listaCorreos.filter((item) =>
      String(item.subject || "").startsWith("Nueva Consulta Web:")
    );

    let nuevosInsertados = 0;

    for (const item of consultasWeb.slice(0, 10)) {
      await esperarMs(600);
      const detailResp = await fetch(
        `https://api.resend.com/emails/${encodeURIComponent(item.id)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const detalle = detailResp.ok
        ? await detailResp.json().catch(() => item)
        : item;

      const texto = String(detalle?.text || "");
      const html = String(detalle?.html || "");
      const asunto = String(detalle?.subject || item.subject || "");

      // Extraer del asunto: "Nueva Consulta Web: Nombre (Rubro)"
      const matchAsunto = asunto.match(
        /^Nueva Consulta Web:\s*(.+?)\s*\((.+)\)$/i
      );

      const extraerCampo = (etiqueta) => {
        const regex = new RegExp(`^${etiqueta}:\\s*(.+)$`, "im");
        const m = texto.match(regex);
        return m ? m[1].trim() : "";
      };

      const nombre =
        extraerCampo("Nombre") ||
        (matchAsunto ? matchAsunto[1].trim() : "Cliente Web");
      const replyToSource = detalle?.reply_to || item?.reply_to;
      const replyToRaw = Array.isArray(replyToSource)
        ? replyToSource[0]
        : replyToSource;
      const email =
        extraerCampo("Correo del cliente") ||
        String(replyToRaw || "cliente@lhbosistemas.com").trim();
      const telefonoRaw = extraerCampo("Teléfono / WhatsApp");
      const telefono =
        telefonoRaw && telefonoRaw !== "No especificado" ? telefonoRaw : null;
      const empresaRaw = extraerCampo("Empresa / Negocio");
      const empresa =
        empresaRaw && empresaRaw !== "No especificada" ? empresaRaw : null;
      const rubro =
        extraerCampo("Tipo de solución") ||
        (matchAsunto ? matchAsunto[2].trim() : "Consulta General");

      let mensaje = "";
      const partesMensaje = texto.split(/Detalles del requerimiento:\s*\r?\n/i);
      if (partesMensaje.length > 1) {
        mensaje = partesMensaje.slice(1).join("\n").trim();
      } else if (html) {
        const matchHtml = html.match(/white-space:\s*pre-wrap[^>]*>([\s\S]*?)<\/p>/i);
        mensaje = matchHtml ? matchHtml[1].trim() : asunto;
      } else {
        mensaje = texto.trim() || asunto;
      }

      const fechaRaw = detalle?.created_at || item?.created_at;
      const fechaCreacion = fechaRaw
        ? new Date(fechaRaw).toISOString()
        : new Date().toISOString();

      if (usarPostgres && pgPool) {
        const existeRes = await pgPool.query(
          `SELECT id FROM requerimientos WHERE LOWER(email) = LOWER($1) AND mensaje = $2 LIMIT 1`,
          [email, mensaje]
        );
        if (existeRes.rows.length === 0) {
          const cliRes = await pgPool.query(
            `INSERT INTO clientes (nombre, empresa, email, telefono)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) DO UPDATE
               SET nombre = EXCLUDED.nombre
             RETURNING id`,
            [nombre, empresa, email, telefono]
          );
          await pgPool.query(
            `INSERT INTO requerimientos (cliente_id, nombre, empresa, email, telefono, rubro, mensaje, estado, creado_en)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'nuevo', $8)`,
            [
              cliRes.rows[0].id,
              nombre,
              empresa,
              email,
              telefono,
              rubro,
              mensaje,
              fechaCreacion,
            ]
          );
          nuevosInsertados++;
        }
      } else {
        const store = leerStoreLocal();
        const yaExiste = store.requerimientos.some(
          (r) =>
            String(r.email || "").toLowerCase() === email.toLowerCase() &&
            String(r.mensaje || "").trim() === mensaje
        );
        if (!yaExiste) {
          let cliente = store.clientes.find(
            (c) => c.email.toLowerCase() === email.toLowerCase()
          );
          if (!cliente) {
            const nuevoClienteId =
              store.clientes.reduce((max, c) => Math.max(max, c.id), 0) + 1;
            cliente = {
              id: nuevoClienteId,
              nombre,
              empresa,
              email,
              telefono,
              creado_en: fechaCreacion,
            };
            store.clientes.push(cliente);
          }
          const nuevoReqId =
            store.requerimientos.reduce((max, r) => Math.max(max, r.id), 0) + 1;
          store.requerimientos.unshift({
            id: nuevoReqId,
            cliente_id: cliente.id,
            nombre,
            empresa,
            email,
            telefono,
            rubro,
            mensaje,
            estado: "nuevo",
            presupuesto_id: null,
            creado_en: fechaCreacion,
            actualizado_en: fechaCreacion,
          });
          guardarStoreLocal(store);
          nuevosInsertados++;
        }
      }
    }

    ultimoEstadoSyncResend = {
      ok: true,
      total_correos: listaCorreos.length,
      consultas_web: consultasWeb.length,
      sincronizados: nuevosInsertados,
    };
    return ultimoEstadoSyncResend;
  } catch (err) {
    console.warn("Advertencia sincronizando correos desde Resend:", err.message);
    ultimoEstadoSyncResend = { ok: false, error: err.message };
    return ultimoEstadoSyncResend;
  }
}

/**
 * Devuelve todos los datos consolidados para el Panel de Gestión de Requerimientos y Presupuestos
 * GET /api/presupuestos/admin/resumen
 */
export async function listarPanelAdmin() {
  await inicializarBaseDeDatos();
  const syncResend = await sincronizarRequerimientosDesdeResend();

  if (usarPostgres && pgPool) {
    const reqRes = await pgPool.query(`
      SELECT r.*,
             p.codigo AS presupuesto_codigo,
             p.token_acceso AS presupuesto_token,
             p.estado AS presupuesto_estado,
             p.monto_total_usd AS presupuesto_monto_usd
      FROM requerimientos r
      LEFT JOIN presupuestos p ON r.presupuesto_id = p.id
      ORDER BY r.creado_en DESC
    `);

    const preRes = await pgPool.query(`
      SELECT p.*,
             c.nombre AS cliente_nombre,
             c.empresa,
             c.email AS cliente_email,
             c.telefono AS cliente_telefono,
             pr.id AS proyecto_id,
             pr.estado AS proyecto_estado
      FROM presupuestos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN proyectos pr ON pr.presupuesto_id = p.id
      ORDER BY p.creado_en DESC
    `);

    const proyRes = await pgPool.query(`
      SELECT pr.*,
             c.nombre AS cliente_nombre,
             c.empresa,
             p.codigo AS presupuesto_codigo,
             p.plan_pago AS plan_pago,
             COALESCE((SELECT SUM(monto_usd) FROM facturas_cobros f WHERE f.proyecto_id = pr.id AND f.estado = 'cobrado'), 0) AS total_cobrado_usd,
             COALESCE((SELECT SUM(monto_equivalente_usd) FROM gastos_proyecto g WHERE g.proyecto_id = pr.id), 0) AS total_gastos_usd
      FROM proyectos pr
      JOIN clientes c ON pr.cliente_id = c.id
      JOIN presupuestos p ON pr.presupuesto_id = p.id
      ORDER BY pr.creado_en DESC
    `);

    const facturasRes = await pgPool.query(`
      SELECT * FROM facturas_cobros ORDER BY id DESC
    `);
    const todasFacturas = facturasRes.rows.map((f) => ({
      ...f,
      monto_usd: Number(f.monto_usd),
      tasa_bcv: Number(f.tasa_bcv || 1),
      monto_ves: Number(f.monto_ves || 0),
    }));

    return {
      status: 200,
      body: {
        sincronizacion_resend: syncResend,
        requerimientos: reqRes.rows,
        presupuestos: preRes.rows.map((p) => ({
          ...p,
          monto_total_usd: Number(p.monto_total_usd),
        })),
        proyectos: proyRes.rows.map((pr) => {
          const cobrado = Number(pr.total_cobrado_usd);
          const gastos = Number(pr.total_gastos_usd);
          const ganancia = Number((cobrado - gastos).toFixed(2));
          const margen =
            cobrado > 0 ? Number(((ganancia / cobrado) * 100).toFixed(2)) : 0;
          return {
            ...pr,
            monto_acordado_usd: Number(pr.monto_acordado_usd),
            total_cobrado_usd: cobrado,
            total_gastos_usd: gastos,
            ganancia_neta_usd: ganancia,
            margen_rentabilidad_porcentaje: margen,
            facturas: todasFacturas.filter((f) => f.proyecto_id === pr.id),
          };
        }),
      },
    };
  }

  const store = leerStoreLocal();

  const requerimientos = [...store.requerimientos]
    .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
    .map((r) => {
      const pre = store.presupuestos.find((p) => p.id === r.presupuesto_id);
      return {
        ...r,
        presupuesto_codigo: pre ? pre.codigo : null,
        presupuesto_token: pre ? pre.token_acceso : null,
        presupuesto_estado: pre ? pre.estado : null,
        presupuesto_monto_usd: pre ? Number(pre.monto_total_usd) : null,
      };
    });

  const presupuestos = [...store.presupuestos]
    .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
    .map((p) => {
      const cli = store.clientes.find((c) => c.id === p.cliente_id) || {};
      const proy = store.proyectos.find((pr) => pr.presupuesto_id === p.id);
      return {
        ...p,
        monto_total_usd: Number(p.monto_total_usd),
        cliente_nombre: cli.nombre || "Cliente",
        empresa: cli.empresa || null,
        cliente_email: cli.email || null,
        cliente_telefono: cli.telefono || null,
        proyecto_id: proy ? proy.id : null,
        proyecto_estado: proy ? proy.estado : null,
      };
    });

  const proyectos = [...store.proyectos]
    .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
    .map((pr) => {
      const cli = store.clientes.find((c) => c.id === pr.cliente_id) || {};
      const pre = store.presupuestos.find((p) => p.id === pr.presupuesto_id) || {};
      const cobrado = store.facturas_cobros
        .filter((f) => f.proyecto_id === pr.id && f.estado === "cobrado")
        .reduce((acc, f) => acc + Number(f.monto_usd), 0);
      const gastos = store.gastos_proyecto
        .filter((g) => g.proyecto_id === pr.id)
        .reduce((acc, g) => acc + Number(g.monto_equivalente_usd), 0);
      const totalCobrado = Number(cobrado.toFixed(2));
      const totalGastos = Number(gastos.toFixed(2));
      const ganancia = Number((totalCobrado - totalGastos).toFixed(2));
      const margen =
        totalCobrado > 0
          ? Number(((ganancia / totalCobrado) * 100).toFixed(2))
          : 0;

      return {
        ...pr,
        cliente_nombre: cli.nombre || "Cliente",
        empresa: cli.empresa || null,
        presupuesto_codigo: pre.codigo || null,
        plan_pago: pre.plan_pago || null,
        monto_acordado_usd: Number(pr.monto_acordado_usd),
        total_cobrado_usd: totalCobrado,
        total_gastos_usd: totalGastos,
        ganancia_neta_usd: ganancia,
        margen_rentabilidad_porcentaje: margen,
        facturas: store.facturas_cobros
          .filter((f) => f.proyecto_id === pr.id)
          .sort((a, b) => b.id - a.id),
      };
    });

  return {
    status: 200,
    body: {
      sincronizacion_resend: syncResend,
      requerimientos,
      presupuestos,
      proyectos,
    },
  };
}

/**
 * Envía el presupuesto con su enlace seguro directamente al correo del cliente vía Resend
 * POST /api/presupuestos/enviar-correo/:id
 */
export async function enviarPresupuestoPorCorreo(presupuestoId, payload = {}) {
  await inicializarBaseDeDatos();
  const id = Number(presupuestoId);
  const baseUrl = String(payload.base_url || "https://lhbosistemas.com").replace(
    /\/$/,
    ""
  );

  const panel = await listarPanelAdmin();
  const presupuesto = panel.body.presupuestos.find((p) => p.id === id);

  if (!presupuesto) {
    return { status: 404, body: { detail: "Presupuesto no encontrado." } };
  }

  if (!presupuesto.cliente_email) {
    return {
      status: 400,
      body: { detail: "El cliente no tiene un correo electrónico registrado." },
    };
  }

  const enlaceCliente = `${baseUrl}/presupuesto/${encodeURIComponent(
    presupuesto.token_acceso
  )}`;

  const montoFormateado = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(presupuesto.monto_total_usd);

  const apiKey = (
    process.env.RESEND_API_KEY ||
    process.env.resend_api_key ||
    ""
  ).trim();

  const rawFrom = (
    process.env.RESEND_FROM_EMAIL ||
    process.env.resend_from_email ||
    "onboarding@resend.dev"
  ).trim();

  const fromEmail = rawFrom.includes("<")
    ? rawFrom
    : `LHBO Sistemas <${rawFrom}>`;

  const replyToEmail = (
    process.env.RESEND_TO_EMAIL ||
    process.env.resend_to_email ||
    "luishomerobo@gmail.com"
  ).trim();

  const asunto = `Propuesta Técnica y Presupuesto ${presupuesto.codigo} — LHBO Sistemas`;

  const fmtUsd = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(n || 0));

  const pp = presupuesto.plan_pago || null;
  const tienePlanPartes =
    pp && (pp.modalidad === "partes" || pp.modalidad === "ambas");

  const lineasCronogramaTexto =
    tienePlanPartes && Array.isArray(pp.cronograma_cuotas)
      ? [
          "Cronograma detallado de pagos parciales y vencimientos:",
          ...pp.cronograma_cuotas.map(
            (c) =>
              `  • Cuota #${c.numero}: ${fmtUsd(c.monto_cuota_usd)} USD — Vence: ${c.fecha_vencimiento}`
          ),
        ]
      : [];

  const lineasPlanTexto = tienePlanPartes
    ? [
        "",
        "Modalidad de Pago por Partes / Financiamiento disponible:",
        pp.tiene_inicial
          ? `- Pago Inicial (Anticipo ${pp.porcentaje_inicial || 0}%): ${fmtUsd(pp.monto_inicial_usd)} USD${pp.fecha_inicio_pagos ? ` (Fecha: ${pp.fecha_inicio_pagos})` : ""}`
          : "- Pago Inicial: Sin pago inicial ($0.00 USD)",
        `- Pagos Parciales: ${pp.numero_cuotas} cuota(s) con periodicidad ${pp.periodicidad} de ${fmtUsd(pp.monto_cuota_usd)} USD cada una`,
        pp.con_intereses
          ? `- Financiamiento: Incluye ${pp.porcentaje_interes}% de interés (${fmtUsd(pp.monto_interes_usd)} USD) — Total con financiamiento: ${fmtUsd(pp.monto_total_financiado_usd)} USD`
          : "- Financiamiento: Sin intereses (0%)",
        ...lineasCronogramaTexto,
        pp.penalizacion_mora
          ? `- Condición por mora / vencimiento: ${pp.penalizacion_mora}`
          : null,
      ].filter(Boolean)
    : [];

  const htmlBloquePlan = tienePlanPartes
    ? `
      <div style="padding: 16px 18px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; margin-bottom: 20px; font-size: 13px; color: #1e293b;">
        <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; color: #1d4ed8;">
          💳 Plan de Pago por Partes (${escaparHtml(pp.periodicidad)})
        </p>
        <ul style="margin: 0; padding-left: 18px; line-height: 1.7;">
          <li><strong>Pago Inicial:</strong> ${
            pp.tiene_inicial
              ? `${escaparHtml(fmtUsd(pp.monto_inicial_usd))} USD (${escaparHtml(String(pp.porcentaje_inicial || 0))}%)`
              : "Sin pago inicial ($0.00 USD)"
          }</li>
          <li><strong>Pagos Parciales:</strong> ${escaparHtml(String(pp.numero_cuotas))} cuota(s) con periodicidad <strong>${escaparHtml(pp.periodicidad)}</strong> de <strong>${escaparHtml(fmtUsd(pp.monto_cuota_usd))} USD</strong> c/u</li>
          <li><strong>Intereses:</strong> ${
            pp.con_intereses
              ? `${escaparHtml(String(pp.porcentaje_interes))}% (${escaparHtml(fmtUsd(pp.monto_interes_usd))} USD) · Total financiado: <strong>${escaparHtml(fmtUsd(pp.monto_total_financiado_usd))} USD</strong>`
              : "Sin intereses (0%)"
          }</li>
        </ul>
        ${
          pp.penalizacion_mora
            ? `<p style="margin: 10px 0 0; padding-top: 8px; border-top: 1px dashed #93c5fd; font-size: 11.5px; color: #475569;"><strong>Penalización por incumplimiento / mora:</strong> ${escaparHtml(pp.penalizacion_mora)}</p>`
            : ""
        }
      </div>
    `
    : "";

  const textoPlano = [
    `Hola ${presupuesto.cliente_nombre},`,
    "",
    `En respuesta a su requerimiento, hemos preparado la propuesta técnica y económica correspondiente al proyecto: "${presupuesto.titulo}".`,
    "",
    `Código de Presupuesto: ${presupuesto.codigo}`,
    `Inversión Total: ${montoFormateado} USD`,
    ...lineasPlanTexto,
    "",
    "(En caso de realizar el pago en Bolívares VES, se calculará a la tasa oficial del BCV vigente el día de pago).",
    "",
    "Puede revisar el alcance técnico detallado y aprobar, solicitar ajustes o descargar en PDF desde el siguiente enlace seguro:",
    enlaceCliente,
    "",
    "Quedamos atentos a sus comentarios.",
    "Atentamente,",
    "Equipo de LHBO Sistemas",
  ].join("\n");

  const htmlCorreo = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
      <div style="background: #0f172a; color: #ffffff; padding: 24px 28px;">
        <span style="display: inline-block; background: rgba(59,130,246,0.25); color: #93c5fd; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 6px; margin-bottom: 8px;">
          ${escaparHtml(presupuesto.codigo)}
        </span>
        <h2 style="margin: 0; font-size: 20px;">Propuesta Técnica y Presupuesto</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #cbd5e1;">LHBO Sistemas — Soluciones Web & Software a la Medida</p>
      </div>
      <div style="padding: 28px; background: #ffffff; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 12px;">Estimado(a) <strong>${escaparHtml(presupuesto.cliente_nombre)}</strong>${presupuesto.empresa ? ` (${escaparHtml(presupuesto.empresa)})` : ""},</p>
        <p style="margin: 0 0 18px; color: #334155;">
          En atención a su solicitud, hemos elaborado la propuesta técnica y económica para su proyecto:
        </p>

        <div style="padding: 18px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 16px; font-weight: bold; color: #0f172a;">
            ${escaparHtml(presupuesto.titulo)}
          </p>
          <p style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #1d4ed8;">
            ${escaparHtml(montoFormateado)} <span style="font-size: 12px; color: #64748b;">USD</span>
          </p>
          <p style="margin: 0; font-size: 12px; color: #475569;">
            <strong>Condición de pago:</strong> Si el pago se realiza en Bolívares (VES), se efectuará a la tasa oficial del <strong>Banco Central de Venezuela (BCV)</strong> vigente el día de pago.
          </p>
        </div>

        ${htmlBloquePlan}

        <div style="text-align: center; margin: 26px 0;">
          <a href="${escaparHtml(enlaceCliente)}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 28px; border-radius: 10px;">
            Ver Presupuesto Completo y Responder →
          </a>
        </div>

        <p style="margin: 0 0 14px; font-size: 13px; color: #475569;">
          Desde el enlace anterior podrá revisar el alcance detallado, descargar el documento en PDF y <strong>Aprobar</strong>, <strong>Solicitar Ajustes</strong> o <strong>Rechazar</strong> la propuesta con un solo clic.
        </p>

        <p style="margin: 0; font-size: 12px; color: #64748b; word-break: break-all;">
          Enlace directo: <a href="${escaparHtml(enlaceCliente)}" style="color: #2563eb;">${escaparHtml(enlaceCliente)}</a>
        </p>
      </div>
    </div>
  `;

  if (!apiKey) {
    return {
      status: 200,
      body: {
        ok: true,
        modo_local: true,
        mensaje:
          "Presupuesto listo para enviar. (En servidor local sin RESEND_API_KEY activa; puede enviarlo por WhatsApp o abrir el cliente de correo con un clic).",
        enlace_cliente: enlaceCliente,
        asunto,
        texto_plano: textoPlano,
      },
    };
  }

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [presupuesto.cliente_email],
        reply_to: replyToEmail,
        subject: asunto,
        text: textoPlano,
        html: htmlCorreo,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      // Si Resend está en modo sandbox (onboarding@resend.dev), enviamos copia de respaldo al correo administrador
      // y devolvemos modo_local: true para abrir el cliente de correo con el mensaje prellenado para el cliente.
      if (
        replyToEmail &&
        replyToEmail.toLowerCase() !== presupuesto.cliente_email.toLowerCase()
      ) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [replyToEmail],
            reply_to: presupuesto.cliente_email,
            subject: `[Copia para enviar a ${presupuesto.cliente_email}] ${asunto}`,
            text: textoPlano,
            html: htmlCorreo,
          }),
        }).catch(() => {});
      }

      return {
        status: 200,
        body: {
          ok: true,
          modo_local: true,
          aviso_resend: data?.message || null,
          mensaje: `Se envió copia de respaldo a ${replyToEmail} y se abrió tu cliente de correo listo para enviar a ${presupuesto.cliente_email}.`,
          enlace_cliente: enlaceCliente,
          asunto,
          texto_plano: textoPlano,
        },
      };
    }

    return {
      status: 200,
      body: {
        ok: true,
        modo_local: false,
        id: data.id,
        mensaje: `Presupuesto enviado exitosamente por correo a ${presupuesto.cliente_email}`,
        enlace_cliente: enlaceCliente,
      },
    };
  } catch (err) {
    return {
      status: 500,
      body: {
        ok: false,
        detail: err.message || "Error al conectar con el servidor de correo.",
        enlace_cliente: enlaceCliente,
      },
    };
  }
}

/**
 * 1. Obtener presupuesto para la vista del cliente vía Token seguro
 * GET /api/presupuestos/ver/:token
 */
export async function obtenerPresupuestoPorToken(token) {
  await inicializarBaseDeDatos();

  if (usarPostgres && pgPool) {
    const query = `
      SELECT p.id, p.codigo, p.titulo, p.alcance, p.monto_total_usd, p.plan_pago, p.estado,
             p.comentarios_cliente, p.creado_en, p.actualizado_en,
             c.nombre AS cliente_nombre, c.empresa, c.email AS cliente_email,
             p.fecha_vencimiento,
             pr.id AS proyecto_id, pr.estado AS proyecto_estado
      FROM presupuestos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN proyectos pr ON pr.presupuesto_id = p.id
      WHERE p.token_acceso = $1
    `;
    const { rows } = await pgPool.query(query, [token]);
    if (rows.length === 0) return null;
    const item = rows[0];
    return {
      ...item,
      monto_total_usd: Number(item.monto_total_usd),
      plan_pago: item.plan_pago || null,
    };
  }

  // Modo respaldo local
  const store = leerStoreLocal();
  const presupuesto = store.presupuestos.find((p) => p.token_acceso === token);
  if (!presupuesto) return null;

  const cliente =
    store.clientes.find((c) => c.id === presupuesto.cliente_id) || {};
  const proyecto = store.proyectos.find(
    (pr) => pr.presupuesto_id === presupuesto.id
  );

  return {
    id: presupuesto.id,
    codigo: presupuesto.codigo,
    titulo: presupuesto.titulo,
    alcance: presupuesto.alcance,
    monto_total_usd: Number(presupuesto.monto_total_usd),
    plan_pago: presupuesto.plan_pago || null,
    estado: presupuesto.estado,
    comentarios_cliente: presupuesto.comentarios_cliente,
    cliente_nombre: cliente.nombre || "Cliente",
    empresa: cliente.empresa || null,
    cliente_email: cliente.email || null,
    fecha_vencimiento: presupuesto.fecha_vencimiento,
    creado_en: presupuesto.creado_en,
    actualizado_en: presupuesto.actualizado_en,
    proyecto_id: proyecto ? proyecto.id : null,
    proyecto_estado: proyecto ? proyecto.estado : null,
  };
}

/**
 * 2. Procesar acción del cliente (Aprobar, Negociar o Rechazar)
 * POST /api/presupuestos/responder/:token
 */
export async function responderPresupuestoPorToken(token, payload) {
  await inicializarBaseDeDatos();

  const validacion = validarAccionPresupuesto(payload);
  if (!validacion.valido) {
    return { status: 400, body: { detail: validacion.error } };
  }

  const { accion, comentarios } = validacion.datos;

  if (usarPostgres && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "SELECT id, cliente_id, titulo, monto_total_usd, estado FROM presupuestos WHERE token_acceso = $1 FOR UPDATE",
        [token]
      );

      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return { status: 404, body: { detail: "Presupuesto no encontrado." } };
      }

      const presupuesto = rows[0];
      if (presupuesto.estado !== "pendiente") {
        await client.query("ROLLBACK");
        return {
          status: 400,
          body: { detail: "Este presupuesto ya ha sido procesado." },
        };
      }

      if (accion === "aprobar") {
        await client.query(
          `UPDATE presupuestos
           SET estado = 'aprobado', comentarios_cliente = COALESCE($1, comentarios_cliente), actualizado_en = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [comentarios, presupuesto.id]
        );

        const proyRes = await client.query(
          `INSERT INTO proyectos (presupuesto_id, cliente_id, nombre, monto_acordado_usd, estado)
           VALUES ($1, $2, $3, $4, 'en_desarrollo')
           RETURNING id`,
          [
            presupuesto.id,
            presupuesto.cliente_id,
            presupuesto.titulo,
            presupuesto.monto_total_usd,
          ]
        );

        await client.query("COMMIT");
        return {
          status: 200,
          body: {
            mensaje: "Presupuesto aprobado exitosamente. Proyecto creado.",
            estado: "aprobado",
            proyecto_id: proyRes.rows[0].id,
          },
        };
      }

      if (accion === "negociar") {
        await client.query(
          `UPDATE presupuestos
           SET estado = 'en_negociacion', comentarios_cliente = $1, actualizado_en = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [comentarios, presupuesto.id]
        );
        await client.query("COMMIT");
        return {
          status: 200,
          body: {
            mensaje:
              "Observaciones recibidas. Entrando en proceso de negociación.",
            estado: "en_negociacion",
          },
        };
      }

      if (accion === "rechazar") {
        await client.query(
          `UPDATE presupuestos
           SET estado = 'rechazado', comentarios_cliente = $1, actualizado_en = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [comentarios, presupuesto.id]
        );
        await client.query("COMMIT");
        return {
          status: 200,
          body: {
            mensaje: "Presupuesto marcado como rechazado.",
            estado: "rechazado",
          },
        };
      }
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Modo respaldo local
  const store = leerStoreLocal();
  const presupuesto = store.presupuestos.find((p) => p.token_acceso === token);

  if (!presupuesto) {
    return { status: 404, body: { detail: "Presupuesto no encontrado." } };
  }

  if (presupuesto.estado !== "pendiente") {
    return {
      status: 400,
      body: { detail: "Este presupuesto ya ha sido procesado." },
    };
  }

  const ahora = new Date().toISOString();

  if (accion === "aprobar") {
    presupuesto.estado = "aprobado";
    if (comentarios) presupuesto.comentarios_cliente = comentarios;
    presupuesto.actualizado_en = ahora;

    const nuevoProyectoId =
      store.proyectos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const nuevoProyecto = {
      id: nuevoProyectoId,
      presupuesto_id: presupuesto.id,
      cliente_id: presupuesto.cliente_id,
      nombre: presupuesto.titulo,
      monto_acordado_usd: Number(presupuesto.monto_total_usd),
      fecha_inicio: ahora.slice(0, 10),
      fecha_estimada_fin: null,
      estado: "en_desarrollo",
      creado_en: ahora,
    };
    store.proyectos.push(nuevoProyecto);
    guardarStoreLocal(store);

    return {
      status: 200,
      body: {
        mensaje: "Presupuesto aprobado exitosamente. Proyecto creado.",
        estado: "aprobado",
        proyecto_id: nuevoProyecto.id,
      },
    };
  }

  if (accion === "negociar") {
    presupuesto.estado = "en_negociacion";
    presupuesto.comentarios_cliente = comentarios;
    presupuesto.actualizado_en = ahora;
    guardarStoreLocal(store);

    return {
      status: 200,
      body: {
        mensaje: "Observaciones recibidas. Entrando en proceso de negociación.",
        estado: "en_negociacion",
      },
    };
  }

  if (accion === "rechazar") {
    presupuesto.estado = "rechazado";
    presupuesto.comentarios_cliente = comentarios;
    presupuesto.actualizado_en = ahora;
    guardarStoreLocal(store);

    return {
      status: 200,
      body: {
        mensaje: "Presupuesto marcado como rechazado.",
        estado: "rechazado",
      },
    };
  }
}

/**
 * 3. Estado de Ganancias y Pérdidas (P&L) por Proyecto
 * GET /api/presupuestos/proyecto/:proyecto_id/balance
 */
export async function obtenerBalanceProyecto(proyectoId) {
  await inicializarBaseDeDatos();
  const id = Number(proyectoId);
  if (!Number.isInteger(id) || id <= 0) {
    return { status: 400, body: { detail: "ID de proyecto inválido." } };
  }

  if (usarPostgres && pgPool) {
    const cobradoRes = await pgPool.query(
      `SELECT COALESCE(SUM(monto_usd), 0) AS total_cobrado_usd
       FROM facturas_cobros
       WHERE proyecto_id = $1 AND estado = 'cobrado'`,
      [id]
    );
    const gastosRes = await pgPool.query(
      `SELECT COALESCE(SUM(monto_equivalente_usd), 0) AS total_gastos_usd
       FROM gastos_proyecto
       WHERE proyecto_id = $1`,
      [id]
    );

    const cobrado = Number(cobradoRes.rows[0].total_cobrado_usd);
    const gastos = Number(gastosRes.rows[0].total_gastos_usd);
    const gananciaNeta = Number((cobrado - gastos).toFixed(2));
    const margenRentabilidad =
      cobrado > 0 ? Number(((gananciaNeta / cobrado) * 100).toFixed(2)) : 0.0;

    return {
      status: 200,
      body: {
        proyecto_id: id,
        total_cobrado_usd: cobrado,
        total_gastos_usd: gastos,
        ganancia_neta_usd: gananciaNeta,
        margen_rentabilidad_porcentaje: margenRentabilidad,
      },
    };
  }

  const store = leerStoreLocal();
  const cobrado = store.facturas_cobros
    .filter((f) => f.proyecto_id === id && f.estado === "cobrado")
    .reduce((acc, f) => acc + Number(f.monto_usd), 0);

  const gastos = store.gastos_proyecto
    .filter((g) => g.proyecto_id === id)
    .reduce((acc, g) => acc + Number(g.monto_equivalente_usd), 0);

  const totalCobrado = Number(cobrado.toFixed(2));
  const totalGastos = Number(gastos.toFixed(2));
  const gananciaNeta = Number((totalCobrado - totalGastos).toFixed(2));
  const margenRentabilidad =
    totalCobrado > 0
      ? Number(((gananciaNeta / totalCobrado) * 100).toFixed(2))
      : 0.0;

  return {
    status: 200,
    body: {
      proyecto_id: id,
      total_cobrado_usd: totalCobrado,
      total_gastos_usd: totalGastos,
      ganancia_neta_usd: gananciaNeta,
      margen_rentabilidad_porcentaje: margenRentabilidad,
    },
  };
}

/**
 * 4. Registrar cobro / factura de un proyecto (USD / VES con tasa BCV)
 * POST /api/presupuestos/cobros
 */
export async function registrarCobroProyecto(payload) {
  await inicializarBaseDeDatos();
  const validacion = validarCobroRegistro(payload);
  if (!validacion.valido) {
    return { status: 400, body: { detail: validacion.error } };
  }

  const d = validacion.datos;

  if (usarPostgres && pgPool) {
    const { rows } = await pgPool.query(
      `INSERT INTO facturas_cobros
        (proyecto_id, numero_factura, concepto, monto_usd, moneda_pago, tasa_bcv, monto_ves, referencia_bancaria, detalle_cuotas, fecha_pago, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, $10)
       RETURNING *`,
      [
        d.proyecto_id,
        d.numero_factura,
        d.concepto,
        d.monto_usd,
        d.moneda_pago,
        d.tasa_bcv,
        d.monto_ves,
        d.referencia_bancaria,
        d.detalle_cuotas ? JSON.stringify(d.detalle_cuotas) : null,
        d.estado,
      ]
    );
    return { status: 201, body: rows[0] };
  }

  const store = leerStoreLocal();
  const nuevoId =
    store.facturas_cobros.reduce((max, f) => Math.max(max, f.id), 0) + 1;
  const registro = {
    id: nuevoId,
    ...d,
    fecha_emision: new Date().toISOString().slice(0, 10),
    fecha_pago: new Date().toISOString().slice(0, 10),
    creado_en: new Date().toISOString(),
  };
  store.facturas_cobros.push(registro);
  guardarStoreLocal(store);
  return { status: 201, body: registro };
}

/**
 * 5. Registrar gasto directo de un proyecto (Normalizado a USD para P&L)
 * POST /api/presupuestos/gastos
 */
export async function registrarGastoProyecto(payload) {
  await inicializarBaseDeDatos();
  const validacion = validarGastoRegistro(payload);
  if (!validacion.valido) {
    return { status: 400, body: { detail: validacion.error } };
  }

  const d = validacion.datos;

  if (usarPostgres && pgPool) {
    const { rows } = await pgPool.query(
      `INSERT INTO gastos_proyecto
        (proyecto_id, descripcion, categoria, moneda_origen, monto_original, tasa_cambio, monto_equivalente_usd, comprobante_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        d.proyecto_id,
        d.descripcion,
        d.categoria,
        d.moneda_origen,
        d.monto_original,
        d.tasa_cambio,
        d.monto_equivalente_usd,
        d.comprobante_url,
      ]
    );
    return { status: 201, body: rows[0] };
  }

  const store = leerStoreLocal();
  const nuevoId =
    store.gastos_proyecto.reduce((max, g) => Math.max(max, g.id), 0) + 1;
  const registro = {
    id: nuevoId,
    ...d,
    fecha_gasto: new Date().toISOString().slice(0, 10),
    creado_en: new Date().toISOString(),
  };
  store.gastos_proyecto.push(registro);
  guardarStoreLocal(store);
  return { status: 201, body: registro };
}

/**
 * 6. Crear un nuevo presupuesto y cliente (Genera token UUID seguro y vincula el requerimiento si aplica)
 * POST /api/presupuestos/crear
 */
export async function crearPresupuesto(payload = {}) {
  await inicializarBaseDeDatos();

  const nombreCliente = String(payload.cliente_nombre || "").trim();
  const emailCliente = String(payload.cliente_email || "").trim();
  const empresaCliente = payload.empresa ? String(payload.empresa).trim() : null;
  const telefonoCliente = payload.telefono
    ? String(payload.telefono).trim()
    : null;
  const titulo = String(payload.titulo || "").trim();
  const alcance = String(payload.alcance || "").trim();
  const montoTotalUsd = Number(payload.monto_total_usd);
  const fechaVencimiento = payload.fecha_vencimiento || null;
  const planPago =
    payload.plan_pago && typeof payload.plan_pago === "object"
      ? payload.plan_pago
      : null;
  const requerimientoId = payload.requerimiento_id
    ? Number(payload.requerimiento_id)
    : null;
  const presupuestoIdExistente = payload.presupuesto_id
    ? Number(payload.presupuesto_id)
    : null;

  if (
    !nombreCliente ||
    !emailCliente ||
    !titulo ||
    !alcance ||
    !(montoTotalUsd > 0)
  ) {
    return {
      status: 400,
      body: {
        detail:
          "Faltan campos obligatorios: cliente_nombre, cliente_email, titulo, alcance y monto_total_usd.",
      },
    };
  }

  const tokenAcceso = crypto.randomUUID();
  const anio = new Date().getFullYear();

  if (usarPostgres && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      const cliRes = await client.query(
        `INSERT INTO clientes (nombre, empresa, email, telefono)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE
           SET nombre = EXCLUDED.nombre,
               empresa = COALESCE(EXCLUDED.empresa, clientes.empresa),
               telefono = COALESCE(EXCLUDED.telefono, clientes.telefono)
         RETURNING id`,
        [nombreCliente, empresaCliente, emailCliente, telefonoCliente]
      );
      const clienteId = cliRes.rows[0].id;

      let presupuestoCreado = null;

      if (presupuestoIdExistente) {
        const updRes = await client.query(
          `UPDATE presupuestos
           SET cliente_id = $1,
               titulo = $2,
               alcance = $3,
               monto_total_usd = $4,
               plan_pago = $5,
               fecha_vencimiento = $6,
               estado = 'pendiente',
               actualizado_en = CURRENT_TIMESTAMP
           WHERE id = $7
           RETURNING *`,
          [
            clienteId,
            titulo,
            alcance,
            Number(montoTotalUsd.toFixed(2)),
            planPago ? JSON.stringify(planPago) : null,
            fechaVencimiento,
            presupuestoIdExistente,
          ]
        );
        presupuestoCreado = updRes.rows[0] || null;
      }

      if (!presupuestoCreado) {
        const countRes = await client.query(
          "SELECT COUNT(*)::int AS total FROM presupuestos"
        );
        const consecutivo = String(countRes.rows[0].total + 1).padStart(3, "0");
        const codigo = payload.codigo || `PRE-${anio}-${consecutivo}`;

        const preRes = await client.query(
          `INSERT INTO presupuestos
            (cliente_id, codigo, titulo, alcance, monto_total_usd, plan_pago, token_acceso, estado, fecha_vencimiento)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente', $8)
           RETURNING *`,
          [
            clienteId,
            codigo,
            titulo,
            alcance,
            Number(montoTotalUsd.toFixed(2)),
            planPago ? JSON.stringify(planPago) : null,
            tokenAcceso,
            fechaVencimiento,
          ]
        );
        presupuestoCreado = preRes.rows[0];
      }

      if (requerimientoId) {
        await client.query(
          `UPDATE requerimientos
           SET estado = 'cotizado', presupuesto_id = $1, cliente_id = $2, actualizado_en = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [presupuestoCreado.id, clienteId, requerimientoId]
        );
      }

      await client.query("COMMIT");
      return {
        status: presupuestoIdExistente ? 200 : 201,
        body: {
          ...presupuestoCreado,
          monto_total_usd: Number(presupuestoCreado.monto_total_usd),
          plan_pago: presupuestoCreado.plan_pago || planPago,
          cliente_nombre: nombreCliente,
          cliente_email: emailCliente,
          cliente_telefono: telefonoCliente,
          empresa: empresaCliente,
          url_cliente: `/presupuesto/${presupuestoCreado.token_acceso}`,
        },
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  const store = leerStoreLocal();
  let cliente = store.clientes.find(
    (c) => c.email.toLowerCase() === emailCliente.toLowerCase()
  );
  if (!cliente) {
    const nuevoClienteId =
      store.clientes.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    cliente = {
      id: nuevoClienteId,
      nombre: nombreCliente,
      empresa: empresaCliente,
      email: emailCliente,
      telefono: telefonoCliente,
      creado_en: new Date().toISOString(),
    };
    store.clientes.push(cliente);
  } else {
    cliente.nombre = nombreCliente;
    if (empresaCliente) cliente.empresa = empresaCliente;
    if (telefonoCliente) cliente.telefono = telefonoCliente;
  }

  let presupuestoGuardar = presupuestoIdExistente
    ? store.presupuestos.find((p) => p.id === presupuestoIdExistente)
    : null;

  if (presupuestoGuardar) {
    presupuestoGuardar.cliente_id = cliente.id;
    presupuestoGuardar.titulo = titulo;
    presupuestoGuardar.alcance = alcance;
    presupuestoGuardar.monto_total_usd = Number(montoTotalUsd.toFixed(2));
    presupuestoGuardar.plan_pago = planPago;
    presupuestoGuardar.estado = "pendiente";
    presupuestoGuardar.fecha_vencimiento = fechaVencimiento;
    presupuestoGuardar.actualizado_en = new Date().toISOString();
  } else {
    const nuevoPresupuestoId =
      store.presupuestos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const consecutivo = String(nuevoPresupuestoId).padStart(3, "0");
    const codigo = payload.codigo || `PRE-${anio}-${consecutivo}`;

    presupuestoGuardar = {
      id: nuevoPresupuestoId,
      cliente_id: cliente.id,
      codigo,
      titulo,
      alcance,
      monto_total_usd: Number(montoTotalUsd.toFixed(2)),
      plan_pago: planPago,
      token_acceso: tokenAcceso,
      estado: "pendiente",
      comentarios_cliente: null,
      fecha_vencimiento: fechaVencimiento,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };
    store.presupuestos.push(presupuestoGuardar);
  }

  if (requerimientoId) {
    const reqItem = store.requerimientos.find((r) => r.id === requerimientoId);
    if (reqItem) {
      reqItem.estado = "cotizado";
      reqItem.presupuesto_id = presupuestoGuardar.id;
      reqItem.cliente_id = cliente.id;
      reqItem.actualizado_en = new Date().toISOString();
    }
  }

  guardarStoreLocal(store);

  return {
    status: presupuestoIdExistente ? 200 : 201,
    body: {
      ...presupuestoGuardar,
      cliente_nombre: nombreCliente,
      cliente_email: emailCliente,
      cliente_telefono: telefonoCliente,
      empresa: empresaCliente,
      url_cliente: `/presupuesto/${presupuestoGuardar.token_acceso}`,
    },
  };
}
