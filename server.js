import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    "Access-Control-Allow-Headers": "Content-Type",
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
      console.error("Falta configurar RESEND_API_KEY en las variables de entorno.");
      return responderJson(res, 500, {
        ok: false,
        error: "El servidor de correo no tiene configurada la clave RESEND_API_KEY.",
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
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (url.pathname === "/api/contacto" && req.method === "POST") {
    return manejarEnvioContacto(req, res);
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor LHBO Sistemas activo en puerto ${PORT}`);
});
