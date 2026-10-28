import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  inicializarBaseDeDatos,
  obtenerPresupuestoPorToken,
  responderPresupuestoPorToken,
  obtenerBalanceProyecto,
  registrarCobroProyecto,
  registrarGastoProyecto,
  crearPresupuesto,
  registrarRequerimientoContacto,
  actualizarEstadoRequerimiento,
  listarPanelAdmin,
  enviarPresupuestoPorCorreo,
} from "./backend/routers/presupuestos.js";
import {
  obtenerRedesSociales,
  actualizarPerfilesRedes,
  guardarPublicacionRedSocial,
  eliminarPublicacionRedSocial,
} from "./backend/routers/redes_sociales.js";
import {
  iniciarSesionAdmin,
  verificarSolicitudAdmin,
  cambiarCredencialesAdmin,
} from "./backend/routers/auth_admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "dist");

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function escaparHtml(texto = "") {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function leerCuerpoJson(req) {
  return new Promise((resolve, reject) => {
    let datos = "";
    req.on("data", (chunk) => {
      datos += chunk;
      if (datos.length > 1e6) {
        req.destroy();
        reject(new Error("Payload demasiado grande"));
      }
    });
    req.on("end", () => {
      try {
        resolve(datos ? JSON.parse(datos) : {});
      } catch {
        reject(new Error("JSON inválido"));
      }
    });
    req.on("error", reject);
  });
}

function responderJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(payload));
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function manejarEnvioContacto(req, res) {
  try {
    const body = await leerCuerpoJson(req);
    const {
      nombre = "",
      correo = "",
      telefono = "",
      empresa = "",
      rubro = "No especificado",
      contactoCliente = "",
      mensaje = "",
    } = body;

    const correoLimpio = (correo || contactoCliente || "").trim();
    const telefonoLimpio = telefono.trim();

    if (!nombre.trim() || !correoLimpio || !mensaje.trim()) {
      return responderJson(res, 400, {
        ok: false,
        error:
          "Por favor complete su nombre, su correo electrónico y los detalles del requerimiento.",
      });
    }

    if (!EMAIL_REGEX.test(correoLimpio)) {
      return responderJson(res, 400, {
        ok: false,
        error:
          "Por favor ingrese un correo electrónico válido para enviarle la confirmación de su requerimiento.",
      });
    }

    // Guardar automáticamente el requerimiento en la bandeja del Panel de Presupuestos
    let requerimientoRegistrado = null;
    try {
      const regRes = await registrarRequerimientoContacto({
        nombre: nombre.trim(),
        correo: correoLimpio,
        telefono: telefonoLimpio,
        empresa: empresa.trim(),
        rubro: rubro.trim(),
        mensaje: mensaje.trim(),
      });
      requerimientoRegistrado = regRes.body;
    } catch (errReg) {
      console.warn("Advertencia al guardar requerimiento en base de datos:", errReg);
    }

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

    const toEmail = (
      process.env.RESEND_TO_EMAIL ||
      process.env.resend_to_email ||
      "luishomerobo@gmail.com"
    ).trim();

    if (!apiKey) {
      console.warn(
        "Requerimiento guardado en la Bandeja del Panel (/admin), pero falta RESEND_API_KEY para enviar correo en este entorno."
      );
      return responderJson(res, 200, {
        ok: true,
        id: `local-req-${requerimientoRegistrado?.id || Date.now()}`,
        confirmacionEnviada: false,
        requerimiento: requerimientoRegistrado,
      });
    }

    const asuntoInterno = `Nueva Consulta Web: ${nombre.trim()} (${rubro.trim()})`;

    const textoPlanoInterno = [
      "Nueva consulta recibida desde la página web de LHBO Sistemas",
      "------------------------------------------------------------",
      `Nombre: ${nombre.trim()}`,
      `Correo del cliente: ${correoLimpio}`,
      `Teléfono / WhatsApp: ${telefonoLimpio || "No especificado"}`,
      `Empresa / Negocio: ${empresa.trim() || "No especificada"}`,
      `Tipo de solución: ${rubro.trim()}`,
      "",
      "Detalles del requerimiento:",
      mensaje.trim(),
    ].join("\n");

    const htmlInterno = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #1d4ed8; color: #ffffff; padding: 20px 24px;">
          <h2 style="margin: 0; font-size: 18px;">Nueva Consulta desde LHBO Sistemas</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #dbeafe;">Formulario de Contacto Web</p>
        </div>
        <div style="padding: 24px; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 40%;"><strong>Nombre:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${escaparHtml(nombre.trim())}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Correo electrónico:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${escaparHtml(correoLimpio)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Teléfono / WhatsApp:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${escaparHtml(telefonoLimpio || "No especificado")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Empresa / Negocio:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${escaparHtml(empresa.trim() || "No especificada")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Rama / Solución:</strong></td>
              <td style="padding: 8px 0; color: #1d4ed8; font-weight: bold;">${escaparHtml(rubro.trim())}</td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 6px;">
            <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #475569; font-weight: bold;">
              Detalles del proyecto o necesidad:
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #1e293b;">${escaparHtml(mensaje.trim())}</p>
          </div>

          <div style="margin-top: 22px; text-align: center;">
            <a href="https://lhbosistemas.com/admin" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 12px 24px; border-radius: 10px;">
              📋 Abrir Bandeja y Elaborar Presupuesto →
            </a>
          </div>
        </div>
      </div>
    `;

    const payloadInterno = {
      from: fromEmail,
      to: [toEmail],
      reply_to: correoLimpio,
      subject: asuntoInterno,
      text: textoPlanoInterno,
      html: htmlInterno,
    };

    const respuestaResend = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadInterno),
    });

    const dataResend = await respuestaResend.json().catch(() => ({}));

    if (!respuestaResend.ok) {
      console.error("Error devuelto por Resend al enviar notificación interna:", dataResend);
      return responderJson(res, respuestaResend.status || 502, {
        ok: false,
        error:
          dataResend?.message ||
          "No se pudo enviar el correo en este momento. Intente por WhatsApp.",
      });
    }

    // Enviar correo automático de confirmación al potencial cliente
    const asuntoConfirmacion = "Hemos recibido su requerimiento — LHBO Sistemas";

    const textoConfirmacion = [
      `Hola ${nombre.trim()},`,
      "",
      "Hemos recibido correctamente su requerimiento a través de la página web de LHBO Sistemas.",
      "",
      "Tiempo estimado de respuesta:",
      "Un analista revisará los detalles de su solicitud y le responderá en las próximas 2 a 4 horas hábiles (con un plazo máximo de 24 horas).",
      "",
      "Resumen de su solicitud:",
      `- Tipo de solución: ${rubro.trim()}`,
      empresa.trim() ? `- Empresa / Negocio: ${empresa.trim()}` : null,
      `- Detalles enviados: ${mensaje.trim()}`,
      "",
      "Si desea agregar algún detalle urgente, puede responder directamente a este correo o escribirnos por WhatsApp al +58 424-3008608.",
      "",
      "Atentamente,",
      "Equipo de LHBO Sistemas",
    ]
      .filter((linea) => linea !== null)
      .join("\n");

    const htmlConfirmacion = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #1d4ed8; color: #ffffff; padding: 22px 24px;">
          <h2 style="margin: 0; font-size: 18px;">¡Hemos recibido su requerimiento!</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #dbeafe;">Confirmación de recepción — LHBO Sistemas</p>
        </div>
        <div style="padding: 24px; background: #ffffff; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 12px;">Hola <strong>${escaparHtml(nombre.trim())}</strong>,</p>
          <p style="margin: 0 0 16px; color: #334155;">
            Gracias por contactar a <strong>LHBO Sistemas</strong>. Confirmamos que hemos recibido los detalles de su proyecto y ya se encuentran en revisión.
          </p>

          <div style="padding: 14px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e3a8a; font-size: 13px;">
              ⏱️ <strong>Tiempo estimado de respuesta:</strong> Nuestro equipo analizará su requerimiento y se pondrá en contacto con usted en las próximas <strong>2 a 4 horas hábiles</strong> (máximo 24 horas).
            </p>
          </div>

          <div style="padding: 16px; background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #475569; font-weight: bold;">
              Resumen de su requerimiento recibido:
            </p>
            <p style="margin: 0 0 6px; font-size: 13px; color: #334155;">
              <strong>Solución de interés:</strong> ${escaparHtml(rubro.trim())}
            </p>
            ${
              empresa.trim()
                ? `<p style="margin: 0 0 6px; font-size: 13px; color: #334155;"><strong>Empresa / Negocio:</strong> ${escaparHtml(empresa.trim())}</p>`
                : ""
            }
            <p style="margin: 8px 0 0; font-size: 13px; color: #1e293b; white-space: pre-wrap;">${escaparHtml(mensaje.trim())}</p>
          </div>

          <p style="margin: 0 0 12px; font-size: 13px; color: #475569;">
            Si desea complementar su solicitud o requiere atención inmediata, puede responder directamente a este correo o escribirnos por WhatsApp al <strong>+58 424-3008608</strong>.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            Atentamente,<br />
            <strong>LHBO Sistemas</strong> — Desarrollo de Software y Soluciones Web a la Medida
          </p>
        </div>
      </div>
    `;

    let confirmacionEnviada = false;
    try {
      const respConfirmacion = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [correoLimpio],
          reply_to: toEmail,
          subject: asuntoConfirmacion,
          text: textoConfirmacion,
          html: htmlConfirmacion,
        }),
      });

      if (respConfirmacion.ok) {
        confirmacionEnviada = true;
      } else {
        const errConfirmacion = await respConfirmacion.json().catch(() => ({}));
        console.warn(
          "No se pudo entregar el correo de confirmación al cliente (verifique que RESEND_FROM_EMAIL pertenezca a un dominio verificado en Resend):",
          errConfirmacion
        );
      }
    } catch (errConf) {
      console.warn("Error enviando confirmación al cliente:", errConf);
    }

    return responderJson(res, 200, {
      ok: true,
      id: dataResend.id,
      confirmacionEnviada,
    });
  } catch (error) {
    console.error("Error procesando /api/contacto:", error);
    return responderJson(res, 500, {
      ok: false,
      error: "Error interno al procesar el envío del correo.",
    });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  // ====================================================================
  // ENDPOINTS DE AUTENTICACIÓN DE ADMINISTRADOR
  // ====================================================================
  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const body = await leerCuerpoJson(req);
      const resultado = await iniciarSesionAdmin(body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en POST /api/auth/login:", err);
      return responderJson(res, 500, {
        ok: false,
        detail: "Error interno al verificar credenciales.",
      });
    }
  }

  if (url.pathname === "/api/auth/verificar" && req.method === "GET") {
    try {
      const sesion = await verificarSolicitudAdmin(req);
      if (!sesion) {
        return responderJson(res, 401, {
          ok: false,
          autenticado: false,
          detail: "Sesión de administrador no válida o expirada.",
        });
      }
      return responderJson(res, 200, {
        ok: true,
        autenticado: true,
        admin: sesion,
      });
    } catch {
      return responderJson(res, 401, {
        ok: false,
        autenticado: false,
      });
    }
  }

  if (url.pathname === "/api/auth/cambiar-clave" && req.method === "POST") {
    try {
      const body = await leerCuerpoJson(req);
      const resultado = await cambiarCredencialesAdmin(req, body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en POST /api/auth/cambiar-clave:", err);
      return responderJson(res, 500, {
        ok: false,
        detail: "Error interno al actualizar la contraseña.",
      });
    }
  }

  if (url.pathname === "/api/contacto" && req.method === "POST") {
    return manejarEnvioContacto(req, res);
  }

  // ====================================================================
  // ENDPOINTS DEL MÓDULO DE PRESUPUESTOS, PROYECTOS Y P&L
  // ====================================================================

  // 1. Obtener presupuesto para la vista del cliente vía Token seguro
  const matchVerPresupuesto = url.pathname.match(
    /^\/api\/presupuestos\/ver\/([^/]+)$/
  );
  if (matchVerPresupuesto && req.method === "GET") {
    try {
      const token = decodeURIComponent(matchVerPresupuesto[1]);
      const presupuesto = await obtenerPresupuestoPorToken(token);
      if (!presupuesto) {
        return responderJson(res, 404, {
          detail: "Presupuesto no encontrado o enlace inválido.",
        });
      }
      return responderJson(res, 200, presupuesto);
    } catch (err) {
      console.error("Error en GET /api/presupuestos/ver/:token:", err);
      return responderJson(res, 500, {
        detail: "Error interno al consultar el presupuesto.",
      });
    }
  }

  // 2. Procesar acción del cliente (Aprobar, Negociar o Rechazar)
  const matchResponderPresupuesto = url.pathname.match(
    /^\/api\/presupuestos\/responder\/([^/]+)$/
  );
  if (matchResponderPresupuesto && req.method === "POST") {
    try {
      const token = decodeURIComponent(matchResponderPresupuesto[1]);
      const body = await leerCuerpoJson(req);
      const resultado = await responderPresupuestoPorToken(token, body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en POST /api/presupuestos/responder/:token:", err);
      return responderJson(res, 500, {
        detail: err.message || "Error interno al procesar respuesta del presupuesto.",
      });
    }
  }

  // 3. Estado de Ganancias y Pérdidas (P&L) por Proyecto (Solo Admin)
  const matchBalanceProyecto = url.pathname.match(
    /^\/api\/presupuestos\/proyecto\/(\d+)\/balance$/
  );
  if (matchBalanceProyecto && req.method === "GET") {
    const sesionAdmin = await verificarSolicitudAdmin(req);
    if (!sesionAdmin) {
      return responderJson(res, 401, {
        detail: "No autorizado. Inicie sesión como administrador.",
      });
    }
    try {
      const proyectoId = Number(matchBalanceProyecto[1]);
      const resultado = await obtenerBalanceProyecto(proyectoId);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error(
        "Error en GET /api/presupuestos/proyecto/:id/balance:",
        err
      );
      return responderJson(res, 500, {
        detail: "Error interno al calcular el balance P&L del proyecto.",
      });
    }
  }

  // 4. Registrar cobro / factura de un proyecto (USD / VES con tasa BCV) (Solo Admin)
  if (url.pathname === "/api/presupuestos/cobros" && req.method === "POST") {
    const sesionAdmin = await verificarSolicitudAdmin(req);
    if (!sesionAdmin) {
      return responderJson(res, 401, {
        detail: "No autorizado. Inicie sesión como administrador.",
      });
    }
    try {
      const body = await leerCuerpoJson(req);
      const resultado = await registrarCobroProyecto(body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en POST /api/presupuestos/cobros:", err);
      return responderJson(res, 500, {
        detail: "Error interno al registrar el cobro.",
      });
    }
  }

  // 5. Registrar gasto directo de un proyecto (Normalizado a USD para P&L) (Solo Admin)
  if (url.pathname === "/api/presupuestos/gastos" && req.method === "POST") {
    const sesionAdmin = await verificarSolicitudAdmin(req);
    if (!sesionAdmin) {
      return responderJson(res, 401, {
        detail: "No autorizado. Inicie sesión como administrador.",
      });
    }
    try {
      const body = await leerCuerpoJson(req);
      const resultado = await registrarGastoProyecto(body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en POST /api/presupuestos/gastos:", err);
      return responderJson(res, 500, {
        detail: "Error interno al registrar el gasto.",
      });
    }
  }

  // 6. Crear un nuevo presupuesto con su token seguro (Solo Admin)
  if (url.pathname === "/api/presupuestos/crear" && req.method === "POST") {
    const sesionAdmin = await verificarSolicitudAdmin(req);
    if (!sesionAdmin) {
      return responderJson(res, 401, {
        detail: "No autorizado. Inicie sesión como administrador.",
      });
    }
    try {
      const body = await leerCuerpoJson(req);
      const resultado = await crearPresupuesto(body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en POST /api/presupuestos/crear:", err);
      return responderJson(res, 500, {
        detail: "Error interno al crear el presupuesto.",
      });
    }
  }

  // 7. Resumen consolidado para el Panel de Gestión (Requerimientos, Presupuestos y Proyectos P&L) (Solo Admin)
  if (
    url.pathname === "/api/presupuestos/admin/resumen" &&
    req.method === "GET"
  ) {
    const sesionAdmin = await verificarSolicitudAdmin(req);
    if (!sesionAdmin) {
      return responderJson(res, 401, {
        detail: "No autorizado. Inicie sesión como administrador.",
      });
    }
    try {
      const resultado = await listarPanelAdmin();
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en GET /api/presupuestos/admin/resumen:", err);
      return responderJson(res, 500, {
        detail: "Error interno al cargar el panel de gestión.",
      });
    }
  }

  // 8. Registrar un requerimiento (desde formulario público o desde el panel)
  if (
    url.pathname === "/api/presupuestos/requerimientos" &&
    req.method === "POST"
  ) {
    try {
      const body = await leerCuerpoJson(req);
      const resultado = await registrarRequerimientoContacto(body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en POST /api/presupuestos/requerimientos:", err);
      return responderJson(res, 500, {
        detail: "Error interno al registrar el requerimiento.",
      });
    }
  }

  // 9. Actualizar estado de un requerimiento (Solo Admin)
  const matchEstadoReq = url.pathname.match(
    /^\/api\/presupuestos\/requerimientos\/(\d+)\/estado$/
  );
  if (matchEstadoReq && req.method === "POST") {
    const sesionAdmin = await verificarSolicitudAdmin(req);
    if (!sesionAdmin) {
      return responderJson(res, 401, {
        detail: "No autorizado. Inicie sesión como administrador.",
      });
    }
    try {
      const reqId = Number(matchEstadoReq[1]);
      const body = await leerCuerpoJson(req);
      const resultado = await actualizarEstadoRequerimiento(reqId, body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error(
        "Error en POST /api/presupuestos/requerimientos/:id/estado:",
        err
      );
      return responderJson(res, 500, {
        detail: "Error interno al actualizar estado del requerimiento.",
      });
    }
  }

  // 10. Enviar presupuesto por correo electrónico al cliente vía Resend (Solo Admin)
  const matchEnviarCorreoPre = url.pathname.match(
    /^\/api\/presupuestos\/enviar-correo\/(\d+)$/
  );
  if (matchEnviarCorreoPre && req.method === "POST") {
    const sesionAdmin = await verificarSolicitudAdmin(req);
    if (!sesionAdmin) {
      return responderJson(res, 401, {
        detail: "No autorizado. Inicie sesión como administrador.",
      });
    }
    try {
      const preId = Number(matchEnviarCorreoPre[1]);
      const body = await leerCuerpoJson(req);
      const resultado = await enviarPresupuestoPorCorreo(preId, body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error(
        "Error en POST /api/presupuestos/enviar-correo/:id:",
        err
      );
      return responderJson(res, 500, {
        detail: "Error interno al enviar el presupuesto por correo.",
      });
    }
  }

  // 11. Módulo de Administración de Redes Sociales (GET es público para el muro; POST es Solo Admin)
  if (url.pathname === "/api/redes-sociales" && req.method === "GET") {
    try {
      const resultado = await obtenerRedesSociales();
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en GET /api/redes-sociales:", err);
      return responderJson(res, 500, {
        detail: "Error al cargar redes sociales.",
      });
    }
  }

  if (
    url.pathname === "/api/redes-sociales/perfiles" &&
    req.method === "POST"
  ) {
    const sesionAdmin = await verificarSolicitudAdmin(req);
    if (!sesionAdmin) {
      return responderJson(res, 401, {
        detail: "No autorizado. Inicie sesión como administrador.",
      });
    }
    try {
      const body = await leerCuerpoJson(req);
      const resultado = await actualizarPerfilesRedes(body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en POST /api/redes-sociales/perfiles:", err);
      return responderJson(res, 500, {
        detail: "Error al guardar perfiles de redes sociales.",
      });
    }
  }

  if (
    url.pathname === "/api/redes-sociales/publicaciones" &&
    req.method === "POST"
  ) {
    const sesionAdmin = await verificarSolicitudAdmin(req);
    if (!sesionAdmin) {
      return responderJson(res, 401, {
        detail: "No autorizado. Inicie sesión como administrador.",
      });
    }
    try {
      const body = await leerCuerpoJson(req);
      const resultado = await guardarPublicacionRedSocial(body);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error("Error en POST /api/redes-sociales/publicaciones:", err);
      return responderJson(res, 500, {
        detail: "Error al guardar la publicación.",
      });
    }
  }

  const matchEliminarPub = url.pathname.match(
    /^\/api\/redes-sociales\/publicaciones\/(\d+)\/eliminar$/
  );
  if (matchEliminarPub && req.method === "POST") {
    const sesionAdmin = await verificarSolicitudAdmin(req);
    if (!sesionAdmin) {
      return responderJson(res, 401, {
        detail: "No autorizado. Inicie sesión como administrador.",
      });
    }
    try {
      const pubId = Number(matchEliminarPub[1]);
      const resultado = await eliminarPublicacionRedSocial(pubId);
      return responderJson(res, resultado.status, resultado.body);
    } catch (err) {
      console.error(
        "Error en POST /api/redes-sociales/publicaciones/:id/eliminar:",
        err
      );
      return responderJson(res, 500, {
        detail: "Error al eliminar la publicación.",
      });
    }
  }

  // Servir archivos estáticos del build de Vite (dist)
  let filePath = path.join(
    DIST_DIR,
    url.pathname === "/" ? "index.html" : url.pathname
  );

  // Prevenir directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback SPA a index.html
      filePath = path.join(DIST_DIR, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("Archivo no encontrado. Ejecute 'npm run build' primero.");
      }
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, "0.0.0.0", async () => {
  await inicializarBaseDeDatos();
  console.log(`Servidor LHBO Sistemas activo en puerto ${PORT}`);
});
