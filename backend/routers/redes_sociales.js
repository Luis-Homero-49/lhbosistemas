import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");
const LOCAL_REDES_PATH = path.join(
  ROOT_DIR,
  "database",
  "redes_sociales_local.json"
);

let pgPool = null;
let usarPostgres = false;
let inicializado = false;

function obtenerDatosSemillaRedes() {
  return {
    perfiles: [
      {
        id: "instagram",
        nombre: "Instagram",
        usuario: "@lhbosistemas",
        url: "https://www.instagram.com/lhbosistemas",
        activo: true,
        color: "from-pink-500 via-rose-500 to-amber-500",
        descripcion:
          "Demostraciones de sistemas web a la medida, automatización empresarial y casos de éxito.",
      },
      {
        id: "facebook",
        nombre: "Facebook",
        usuario: "LHBO Sistemas — Desarrollo de Software",
        url: "https://www.facebook.com/lhbosistemas",
        activo: true,
        color: "from-blue-600 to-blue-800",
        descripcion:
          "Novedades tecnológicas, soluciones de inventario y facturación multimoneda para empresas.",
      },
      {
        id: "linkedin",
        nombre: "LinkedIn",
        usuario: "LHBO Sistemas & Consultoría TI",
        url: "https://www.linkedin.com/company/lhbosistemas",
        activo: true,
        color: "from-sky-600 to-blue-900",
        descripcion:
          "Arquitectura de software, transformación digital y consultoría B2B.",
      },
      {
        id: "tiktok",
        nombre: "TikTok",
        usuario: "@lhbosistemas",
        url: "https://www.tiktok.com/@lhbosistemas",
        activo: true,
        color: "from-slate-800 to-slate-950",
        descripcion:
          "Videos cortos mostrando cómo digitalizar inventarios, presupuestos y procesos operativos.",
      },
      {
        id: "youtube",
        nombre: "YouTube",
        usuario: "LHBO Sistemas Canal Oficial",
        url: "https://www.youtube.com/@lhbosistemas",
        activo: false,
        color: "from-red-600 to-rose-800",
        descripcion:
          "Tutoriales de uso de plataformas, paneles gerenciales P&L y recorridos de software.",
      },
      {
        id: "whatsapp",
        nombre: "WhatsApp Business",
        usuario: "+58 412-0000000",
        url: "https://wa.me/584120000000",
        activo: true,
        color: "from-emerald-500 to-teal-700",
        descripcion:
          "Atención directa para cotizar tu página web, catálogo digital o sistema a la medida.",
      },
    ],
    publicaciones: [
      {
        id: 1,
        titulo: "Digitaliza tu Empresa con Sistemas Web a la Medida",
        contenido:
          "En LHBO Sistemas desarrollamos plataformas de inventario, facturación multimoneda (USD/VES a tasa BCV) y portales de clientes adaptados exactamente al flujo de tu negocio.",
        hashtags:
          "#LHBOSistemas #DesarrolloDeSoftware #SistemasALaMedida #TransformacionDigital #Inventario #Automatizacion",
        imagen_url: "",
        plataformas: ["instagram", "facebook", "linkedin"],
        estado: "publicado",
        fecha_programada: new Date().toISOString().slice(0, 10),
        cta_texto: "Solicitar Presupuesto",
        creado_en: new Date().toISOString(),
      },
      {
        id: 2,
        titulo: "Páginas Web Profesionales con Gestión de Presupuestos y Redes",
        contenido:
          "Tu sitio web no debe ser solo un folleto estático: conviértelo en una herramienta que recibe requerimientos 24/7, elabora presupuestos con planes de pago y administra tus redes sociales en un solo lugar.",
        hashtags:
          "#PaginasWeb #DesarrolloWeb #PresupuestosOnline #Emprendimiento #NegociosDigitales #LHBOSistemas",
        imagen_url: "",
        plataformas: ["instagram", "facebook", "tiktok", "whatsapp"],
        estado: "publicado",
        fecha_programada: new Date().toISOString().slice(0, 10),
        cta_texto: "Cotizar mi Proyecto Web",
        creado_en: new Date().toISOString(),
      },
      {
        id: 3,
        titulo: "Facilidades de Pago: Contado o Planes de Cuotas a tu Medida",
        contenido:
          "Impulsa la modernización tecnológica de tu negocio hoy mismo. Ofrecemos presupuestos transparentes con opción de pago de contado o cronogramas de pagos parciales.",
        hashtags:
          "#SoftwareEmpresarial #Pymes #GestionComercial #Tecnologia #SolucionesWeb",
        imagen_url: "",
        plataformas: ["instagram", "facebook", "whatsapp"],
        estado: "publicado",
        fecha_programada: new Date().toISOString().slice(0, 10),
        cta_texto: "Hablar con un Consultor",
        creado_en: new Date().toISOString(),
      },
    ],
  };
}

function leerStoreLocal() {
  try {
    if (!fs.existsSync(LOCAL_REDES_PATH)) {
      const inicial = obtenerDatosSemillaRedes();
      fs.mkdirSync(path.dirname(LOCAL_REDES_PATH), { recursive: true });
      fs.writeFileSync(
        LOCAL_REDES_PATH,
        JSON.stringify(inicial, null, 2),
        "utf-8"
      );
      return inicial;
    }
    const raw = fs.readFileSync(LOCAL_REDES_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.perfiles)) {
      parsed.perfiles = obtenerDatosSemillaRedes().perfiles;
    }
    if (!Array.isArray(parsed.publicaciones)) {
      parsed.publicaciones = obtenerDatosSemillaRedes().publicaciones;
    }
    return parsed;
  } catch {
    return obtenerDatosSemillaRedes();
  }
}

function guardarStoreLocal(datos) {
  fs.mkdirSync(path.dirname(LOCAL_REDES_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_REDES_PATH, JSON.stringify(datos, null, 2), "utf-8");
}

async function inicializarRedesDb() {
  if (inicializado) return;
  inicializado = true;

  const tieneConfigPg = Boolean(
    process.env.DATABASE_URL || process.env.PGPASSWORD
  );
  if (!tieneConfigPg) {
    usarPostgres = false;
    leerStoreLocal();
    return;
  }

  try {
    pgPool = new Pool(
      process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL.includes("localhost")
              ? false
              : { rejectUnauthorized: false },
          }
        : {
            host: process.env.PGHOST || "localhost",
            port: Number(process.env.PGPORT || 5432),
            database: process.env.PGDATABASE || "lhbosistemas",
            user: process.env.PGUSER || "postgres",
            password: process.env.PGPASSWORD || "",
          }
    );

    const client = await pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS redes_sociales_store (
          id INT PRIMARY KEY DEFAULT 1,
          datos JSONB NOT NULL,
          actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const res = await client.query(
        "SELECT datos FROM redes_sociales_store WHERE id = 1"
      );
      if (res.rowCount === 0) {
        await client.query(
          "INSERT INTO redes_sociales_store (id, datos) VALUES (1, $1)",
          [JSON.stringify(obtenerDatosSemillaRedes())]
        );
      }
      usarPostgres = true;
    } finally {
      client.release();
    }
  } catch {
    usarPostgres = false;
    leerStoreLocal();
  }
}

async function obtenerEstadoRedes() {
  await inicializarRedesDb();
  if (usarPostgres && pgPool) {
    const res = await pgPool.query(
      "SELECT datos FROM redes_sociales_store WHERE id = 1"
    );
    if (res.rowCount > 0 && res.rows[0].datos) {
      return res.rows[0].datos;
    }
  }
  return leerStoreLocal();
}

async function guardarEstadoRedes(nuevosDatos) {
  await inicializarRedesDb();
  if (usarPostgres && pgPool) {
    await pgPool.query(
      `INSERT INTO redes_sociales_store (id, datos, actualizado_en)
       VALUES (1, $1, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET datos = EXCLUDED.datos, actualizado_en = CURRENT_TIMESTAMP`,
      [JSON.stringify(nuevosDatos)]
    );
    return nuevosDatos;
  }
  guardarStoreLocal(nuevosDatos);
  return nuevosDatos;
}

export async function obtenerRedesSociales() {
  const datos = await obtenerEstadoRedes();
  return {
    status: 200,
    body: datos,
  };
}

export async function actualizarPerfilesRedes(payload = {}) {
  if (!Array.isArray(payload.perfiles)) {
    return {
      status: 400,
      body: { detail: "Se requiere la lista de perfiles de redes sociales." },
    };
  }
  const actual = await obtenerEstadoRedes();
  actual.perfiles = payload.perfiles.map((p) => ({
    id: String(p.id || "").trim(),
    nombre: String(p.nombre || "").trim(),
    usuario: String(p.usuario || "").trim(),
    url: String(p.url || "").trim(),
    activo: Boolean(p.activo),
    color: p.color || "from-blue-600 to-slate-900",
    descripcion: String(p.descripcion || "").trim(),
  }));
  await guardarEstadoRedes(actual);
  return {
    status: 200,
    body: {
      mensaje: "Perfiles de redes sociales actualizados correctamente.",
      perfiles: actual.perfiles,
    },
  };
}

export async function guardarPublicacionRedSocial(payload = {}) {
  const titulo = String(payload.titulo || "").trim();
  const contenido = String(payload.contenido || "").trim();
  if (!titulo || !contenido) {
    return {
      status: 400,
      body: {
        detail: "El título y el contenido de la publicación son obligatorios.",
      },
    };
  }

  const actual = await obtenerEstadoRedes();
  const idExistente = payload.id ? Number(payload.id) : null;
  const plataformas = Array.isArray(payload.plataformas)
    ? payload.plataformas
    : ["instagram", "facebook"];

  if (idExistente) {
    const idx = actual.publicaciones.findIndex((p) => p.id === idExistente);
    if (idx !== -1) {
      actual.publicaciones[idx] = {
        ...actual.publicaciones[idx],
        titulo,
        contenido,
        hashtags: String(payload.hashtags || "").trim(),
        imagen_url: String(payload.imagen_url || "").trim(),
        plataformas,
        estado: payload.estado || "publicado",
        fecha_programada:
          payload.fecha_programada || new Date().toISOString().slice(0, 10),
        cta_texto: String(
          payload.cta_texto || "Solicitar Presupuesto"
        ).trim(),
        actualizado_en: new Date().toISOString(),
      };
      await guardarEstadoRedes(actual);
      return {
        status: 200,
        body: {
          mensaje: "Publicación actualizada correctamente.",
          publicacion: actual.publicaciones[idx],
          publicaciones: actual.publicaciones,
        },
      };
    }
  }

  const nuevoId =
    actual.publicaciones.reduce((max, p) => Math.max(max, Number(p.id || 0)), 0) +
    1;
  const nuevaPub = {
    id: nuevoId,
    titulo,
    contenido,
    hashtags: String(payload.hashtags || "").trim(),
    imagen_url: String(payload.imagen_url || "").trim(),
    plataformas,
    estado: payload.estado || "publicado",
    fecha_programada:
      payload.fecha_programada || new Date().toISOString().slice(0, 10),
    cta_texto: String(payload.cta_texto || "Solicitar Presupuesto").trim(),
    creado_en: new Date().toISOString(),
  };

  actual.publicaciones.unshift(nuevaPub);
  await guardarEstadoRedes(actual);

  return {
    status: 201,
    body: {
      mensaje: "Publicación creada y sincronizada.",
      publicacion: nuevaPub,
      publicaciones: actual.publicaciones,
    },
  };
}

export async function eliminarPublicacionRedSocial(pubId) {
  const actual = await obtenerEstadoRedes();
  actual.publicaciones = actual.publicaciones.filter(
    (p) => Number(p.id) !== Number(pubId)
  );
  await guardarEstadoRedes(actual);
  return {
    status: 200,
    body: {
      mensaje: "Publicación eliminada.",
      publicaciones: actual.publicaciones,
    },
  };
}
