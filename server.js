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

async function manejarEnvioContacto(req, res) {
  try {
    const body = await leerCuerpoJson(req);
    const {
      nombre = "",
      empresa = "",
      rubro = "No especificado",
      contactoCliente = "",
      mensaje = "",
    } = body;

    if (!nombre.trim() || !mensaje.trim()) {
      return responderJson(res, 400, {
        ok: false,
        error: "Por favor complete al menos su nombre y los detalles del proyecto.",
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
      : `LHBO Sistemas Web <${rawFrom}>`;

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

    const asunto = `Nueva Consulta Web: ${nombre.trim()} (${rubro.trim()})`;

    const textoPlano = [
      "Nueva consulta recibida desde la página web de LHBO Sistemas",
      "------------------------------------------------------------",
      `Nombre: ${nombre.trim()}`,
      `Empresa / Negocio: ${empresa.trim() || "No especificada"}`,
      `Tipo de solución: ${rubro.trim()}`,
      `Teléfono / Correo del cliente: ${contactoCliente.trim() || "No especificado"}`,
      "",
      "Detalles del requerimiento:",
      mensaje.trim(),
    ].join("\n");

    const html = `
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
              <td style="padding: 8px 0; color: #64748b;"><strong>Empresa / Negocio:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${escaparHtml(empresa.trim() || "No especificada")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Rama / Solución:</strong></td>
              <td style="padding: 8px 0; color: #1d4ed8; font-weight: bold;">${escaparHtml(rubro.trim())}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Contacto del cliente:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${escaparHtml(contactoCliente.trim() || "No especificado")}</td>
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

    const payloadResend = {
      from: fromEmail,
      to: [toEmail],
      subject: asunto,
      text: textoPlano,
      html,
    };

    // Si el cliente ingresó un correo válido en el campo de contacto, lo asignamos a reply_to
    const posibleCorreo = contactoCliente.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(posibleCorreo)) {
      payloadResend.reply_to = posibleCorreo;
    }

    const respuestaResend = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadResend),
    });

    const dataResend = await respuestaResend.json().catch(() => ({}));

    if (!respuestaResend.ok) {
      console.error("Error devuelto por Resend:", dataResend);
      return responderJson(res, respuestaResend.status || 502, {
        ok: false,
        error:
          dataResend?.message ||
          "No se pudo enviar el correo en este momento. Intente por WhatsApp.",
      });
    }

    return responderJson(res, 200, {
      ok: true,
      id: dataResend.id,
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
