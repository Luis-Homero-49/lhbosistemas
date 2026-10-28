import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARCHIVO_LOCAL_AUTH = path.join(
  __dirname,
  "../../database/admin_auth_local.json"
);

const TIENE_CONFIG_PG = Boolean(
  process.env.DATABASE_URL ||
    process.env.PGPASSWORD ||
    process.env.PGHOST ||
    process.env.PGDATABASE
);

const pool = TIENE_CONFIG_PG
  ? new Pool(
      process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl:
              process.env.NODE_ENV === "production"
                ? { rejectUnauthorized: false }
                : false,
            connectionTimeoutMillis: 3500,
          }
        : {
            host: process.env.PGHOST || "localhost",
            port: Number(process.env.PGPORT || 5432),
            database: process.env.PGDATABASE || "lhbosistemas",
            user: process.env.PGUSER || "postgres",
            password: process.env.PGPASSWORD || "",
            connectionTimeoutMillis: 3500,
          }
    )
  : null;

if (pool) {
  pool.on("error", () => {});
}

let usarModoLocal = !TIENE_CONFIG_PG;
let tablaAuthInicializada = false;

const USUARIO_POR_DEFECTO = (
  process.env.ADMIN_EMAIL || "luishomerobo@gmail.com"
)
  .trim()
  .toLowerCase();
const ALIAS_USUARIO_POR_DEFECTO = (process.env.ADMIN_USER || "admin")
  .trim()
  .toLowerCase();
const CLAVE_POR_DEFECTO = (
  process.env.ADMIN_PASSWORD || "LhboAdmin2026*"
).trim();

function crearHashClave(clave, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(clave), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verificarHashClave(clave, hashGuardado) {
  if (!hashGuardado || !hashGuardado.includes(":")) return false;
  const [salt, originalHash] = hashGuardado.split(":");
  const hash = crypto.scryptSync(String(clave), salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(originalHash, "hex")
    );
  } catch {
    return false;
  }
}

function crearConfigInicial() {
  return {
    email: USUARIO_POR_DEFECTO,
    usuario: ALIAS_USUARIO_POR_DEFECTO,
    password_hash: crearHashClave(CLAVE_POR_DEFECTO),
    actualizado_en: new Date().toISOString(),
  };
}

function leerStoreLocal() {
  try {
    const dir = path.dirname(ARCHIVO_LOCAL_AUTH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(ARCHIVO_LOCAL_AUTH)) {
      const inicial = crearConfigInicial();
      fs.writeFileSync(
        ARCHIVO_LOCAL_AUTH,
        JSON.stringify(inicial, null, 2),
        "utf-8"
      );
      return inicial;
    }
    const contenido = fs.readFileSync(ARCHIVO_LOCAL_AUTH, "utf-8");
    const parsed = JSON.parse(contenido);
    if (!parsed || !parsed.password_hash) {
      const inicial = crearConfigInicial();
      fs.writeFileSync(
        ARCHIVO_LOCAL_AUTH,
        JSON.stringify(inicial, null, 2),
        "utf-8"
      );
      return inicial;
    }
    return parsed;
  } catch {
    return crearConfigInicial();
  }
}

function guardarStoreLocal(data) {
  const dir = path.dirname(ARCHIVO_LOCAL_AUTH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(ARCHIVO_LOCAL_AUTH, JSON.stringify(data, null, 2), "utf-8");
}

async function asegurarTablaPg() {
  if (usarModoLocal || !pool) return false;
  if (tablaAuthInicializada) return true;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_auth_store (
        id INTEGER PRIMARY KEY DEFAULT 1,
        data JSONB NOT NULL,
        actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const res = await pool.query(
      "SELECT data FROM admin_auth_store WHERE id = 1;"
    );
    if (res.rowCount === 0) {
      const inicial = crearConfigInicial();
      await pool.query(
        "INSERT INTO admin_auth_store (id, data) VALUES (1, $1);",
        [JSON.stringify(inicial)]
      );
    }
    tablaAuthInicializada = true;
    return true;
  } catch {
    usarModoLocal = true;
    return false;
  }
}

async function obtenerConfigAuth() {
  if (await asegurarTablaPg()) {
    try {
      const res = await pool.query(
        "SELECT data FROM admin_auth_store WHERE id = 1;"
      );
      if (res.rowCount > 0 && res.rows[0].data?.password_hash) {
        return res.rows[0].data;
      }
    } catch {
      usarModoLocal = true;
    }
  }
  return leerStoreLocal();
}

async function guardarConfigAuth(nuevaConfig) {
  if (await asegurarTablaPg()) {
    try {
      await pool.query(
        "UPDATE admin_auth_store SET data = $1, actualizado_en = CURRENT_TIMESTAMP WHERE id = 1;",
        [JSON.stringify(nuevaConfig)]
      );
      return;
    } catch {
      usarModoLocal = true;
    }
  }
  guardarStoreLocal(nuevaConfig);
}

function obtenerSecretoFirma(configAuth) {
  const baseSecret =
    process.env.ADMIN_JWT_SECRET || "lhbo-sistemas-admin-secret-2026";
  return `${baseSecret}:${configAuth.password_hash}`;
}

function firmarToken(payloadObj, secreto) {
  const payloadStr = Buffer.from(JSON.stringify(payloadObj)).toString(
    "base64url"
  );
  const firma = crypto
    .createHmac("sha256", secreto)
    .update(payloadStr)
    .digest("base64url");
  return `${payloadStr}.${firma}`;
}

function verificarTokenFirmado(tokenStr, secreto) {
  if (!tokenStr || typeof tokenStr !== "string" || !tokenStr.includes(".")) {
    return null;
  }
  const [payloadStr, firmaRecibida] = tokenStr.split(".");
  if (!payloadStr || !firmaRecibida) return null;

  const firmaEsperada = crypto
    .createHmac("sha256", secreto)
    .update(payloadStr)
    .digest("base64url");

  try {
    const bufRecibida = Buffer.from(firmaRecibida);
    const bufEsperada = Buffer.from(firmaEsperada);
    if (
      bufRecibida.length !== bufEsperada.length ||
      !crypto.timingSafeEqual(bufRecibida, bufEsperada)
    ) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(payloadStr, "base64url").toString("utf-8")
    );
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function iniciarSesionAdmin(body = {}) {
  const identificador = String(body.usuario || body.email || "")
    .trim()
    .toLowerCase();
  const clave = String(body.password || body.clave || "").trim();

  if (!identificador || !clave) {
    return {
      status: 400,
      body: {
        ok: false,
        detail: "Por favor ingrese su usuario/correo y su contraseña.",
      },
    };
  }

  const config = await obtenerConfigAuth();
  const emailValido = (config.email || USUARIO_POR_DEFECTO).toLowerCase();
  const usuarioValido = (
    config.usuario || ALIAS_USUARIO_POR_DEFECTO
  ).toLowerCase();

  const coincideUsuario =
    identificador === emailValido || identificador === usuarioValido;

  // Permitir también la contraseña definida en variable de entorno ADMIN_PASSWORD si existe
  const coincideClaveHash = verificarHashClave(clave, config.password_hash);
  const coincideClaveEnv =
    Boolean(process.env.ADMIN_PASSWORD) &&
    clave === process.env.ADMIN_PASSWORD.trim();

  if (!coincideUsuario || (!coincideClaveHash && !coincideClaveEnv)) {
    return {
      status: 401,
      body: {
        ok: false,
        detail:
          "Credenciales incorrectas. Acceso exclusivo para el administrador de LHBO Sistemas.",
      },
    };
  }

  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 días
  const token = firmarToken(
    {
      rol: "admin",
      email: config.email || USUARIO_POR_DEFECTO,
      exp,
    },
    obtenerSecretoFirma(config)
  );

  return {
    status: 200,
    body: {
      ok: true,
      token,
      admin: {
        email: config.email || USUARIO_POR_DEFECTO,
        usuario: config.usuario || ALIAS_USUARIO_POR_DEFECTO,
      },
    },
  };
}

export async function verificarSolicitudAdmin(req) {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) return null;

    const config = await obtenerConfigAuth();
    return verificarTokenFirmado(token, obtenerSecretoFirma(config));
  } catch {
    return null;
  }
}

export async function cambiarCredencialesAdmin(req, body = {}) {
  const sesion = await verificarSolicitudAdmin(req);
  if (!sesion) {
    return {
      status: 401,
      body: {
        ok: false,
        detail: "No autorizado. Inicie sesión como administrador.",
      },
    };
  }

  const claveActual = String(body.clave_actual || "").trim();
  const claveNueva = String(body.clave_nueva || "").trim();
  const nuevoEmail = String(body.email || sesion.email || "")
    .trim()
    .toLowerCase();

  if (!claveActual || !claveNueva) {
    return {
      status: 400,
      body: {
        ok: false,
        detail: "Debe ingresar la contraseña actual y la nueva contraseña.",
      },
    };
  }

  if (claveNueva.length < 6) {
    return {
      status: 400,
      body: {
        ok: false,
        detail: "La nueva contraseña debe tener al menos 6 caracteres.",
      },
    };
  }

  const config = await obtenerConfigAuth();
  const coincideActual =
    verificarHashClave(claveActual, config.password_hash) ||
    (Boolean(process.env.ADMIN_PASSWORD) &&
      claveActual === process.env.ADMIN_PASSWORD.trim());

  if (!coincideActual) {
    return {
      status: 401,
      body: {
        ok: false,
        detail: "La contraseña actual ingresada no es correcta.",
      },
    };
  }

  const nuevaConfig = {
    ...config,
    email: nuevoEmail || config.email || USUARIO_POR_DEFECTO,
    password_hash: crearHashClave(claveNueva),
    actualizado_en: new Date().toISOString(),
  };

  await guardarConfigAuth(nuevaConfig);

  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const nuevoToken = firmarToken(
    {
      rol: "admin",
      email: nuevaConfig.email,
      exp,
    },
    obtenerSecretoFirma(nuevaConfig)
  );

  return {
    status: 200,
    body: {
      ok: true,
      mensaje: "Contraseña de administrador actualizada exitosamente.",
      token: nuevoToken,
      admin: {
        email: nuevaConfig.email,
        usuario: nuevaConfig.usuario || ALIAS_USUARIO_POR_DEFECTO,
      },
    },
  };
}
