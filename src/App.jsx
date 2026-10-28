import { useState, useEffect } from "react";
import Navbar from "./Components/Navbar";
import Hero from "./Components/Hero";
import Servicios from "./Components/Servicios";
import Soluciones from "./Components/Soluciones";
import Trayectoria from "./Components/Trayectoria";
import Contacto from "./Components/Contacto";
import Footer from "./Components/Footer";
import VistaPresupuestoCliente from "./Components/VistaPresupuestoCliente";
import PanelGestionPresupuestos from "./Components/PanelGestionPresupuestos";

function detectarRutaActiva() {
  const { pathname, search, hash } = window.location;

  // 0. Panel Administrativo de Requerimientos y Presupuestos: /admin, /panel o /requerimientos
  if (
    /^\/(admin|panel|requerimientos)\/?/i.test(pathname) ||
    /^#\/(admin|panel|requerimientos)\/?/i.test(hash)
  ) {
    return {
      vista: "admin",
      token: "",
    };
  }

  // 1. Ruta limpia de cliente: /presupuesto/:token o /presupuestos/ver/:token
  const matchPath =
    pathname.match(/^\/presupuestos?\/(?:ver\/)?([^/?#]+)/i) ||
    hash.match(/^#\/presupuestos?\/(?:ver\/)?([^/?#]+)/i);

  if (matchPath) {
    return {
      vista: "presupuesto",
      token: decodeURIComponent(matchPath[1]),
    };
  }

  // 2. Ruta base /presupuesto sin token (para ingresar el token manualmente)
  if (
    /^\/presupuestos?\/?$/i.test(pathname) ||
    /^#\/presupuestos?\/?$/i.test(hash)
  ) {
    return {
      vista: "presupuesto",
      token: "",
    };
  }

  // 3. Query string: ?presupuesto=TOKEN o ?token=TOKEN o ?vista=admin
  const params = new URLSearchParams(search);
  if (params.get("vista") === "admin") {
    return {
      vista: "admin",
      token: "",
    };
  }

  const tokenQuery = params.get("presupuesto") || params.get("token");
  if (tokenQuery) {
    return {
      vista: "presupuesto",
      token: tokenQuery.trim(),
    };
  }

  return { vista: "inicio", token: "" };
}

export default function App() {
  const [rutaActiva, setRutaActiva] = useState(() => detectarRutaActiva());
  const [resumenAlertas, setResumenAlertas] = useState({
    nuevosRequerimientos: [],
    enNegociacion: [],
  });
  const [ocultarBannerAlerta, setOcultarBannerAlerta] = useState(false);

  useEffect(() => {
    const manejarPopState = () => {
      setRutaActiva(detectarRutaActiva());
    };
    window.addEventListener("popstate", manejarPopState);
    window.addEventListener("hashchange", manejarPopState);
    return () => {
      window.removeEventListener("popstate", manejarPopState);
      window.removeEventListener("hashchange", manejarPopState);
    };
  }, []);

  useEffect(() => {
    if (rutaActiva.vista !== "inicio") return;
    let cancelado = false;

    async function verificarNuevosRequerimientos() {
      try {
        const res = await fetch("/api/presupuestos/admin/resumen");
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (cancelado) return;
        const reqs = Array.isArray(data.requerimientos)
          ? data.requerimientos
          : [];
        const pres = Array.isArray(data.presupuestos)
          ? data.presupuestos
          : [];
        setResumenAlertas({
          nuevosRequerimientos: reqs.filter(
            (r) => r.estado === "nuevo" || r.estado === "en_elaboracion"
          ),
          enNegociacion: pres.filter((p) => p.estado === "en_negociacion"),
        });
      } catch {
        // Silencioso en caso de carga offline
      }
    }

    verificarNuevosRequerimientos();
    return () => {
      cancelado = true;
    };
  }, [rutaActiva.vista]);

  const volverAlSitioPrincipal = () => {
    window.history.pushState({}, "", "/");
    setRutaActiva({ vista: "inicio", token: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const abrirPanelAdmin = () => {
    window.history.pushState({}, "", "/admin");
    setRutaActiva({ vista: "admin", token: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const abrirVistaPresupuesto = (token) => {
    const limpio = String(token || "").trim();
    const rutaDestino = limpio
      ? `/presupuesto/${encodeURIComponent(limpio)}`
      : "/presupuesto";
    window.history.pushState({}, "", rutaDestino);
    setRutaActiva({ vista: "presupuesto", token: limpio });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (rutaActiva.vista === "admin") {
    return (
      <PanelGestionPresupuestos
        onVolverInicio={volverAlSitioPrincipal}
        onAbrirPresupuesto={abrirVistaPresupuesto}
      />
    );
  }

  if (rutaActiva.vista === "presupuesto") {
    return (
      <VistaPresupuestoCliente
        tokenInicial={rutaActiva.token}
        onVolverInicio={volverAlSitioPrincipal}
        onAbrirAdmin={abrirPanelAdmin}
      />
    );
  }

  const totalAlertas =
    resumenAlertas.nuevosRequerimientos.length +
    resumenAlertas.enNegociacion.length;
  const ultimoRequerimiento = resumenAlertas.nuevosRequerimientos[0] || null;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar
        onAbrirPresupuesto={abrirVistaPresupuesto}
        onAbrirAdmin={abrirPanelAdmin}
        cantidadPendientes={totalAlertas}
      />

      {/* Aviso destacado en la página principal cuando hay requerimientos o presupuestos nuevos */}
      {totalAlertas > 0 && !ocultarBannerAlerta && (
        <div className="pt-20 bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 text-slate-950 shadow-md relative z-40">
          <div className="max-w-6xl mx-auto px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-sm shrink-0 animate-bounce">
                🔔
              </span>
              <div className="text-xs sm:text-sm">
                <p className="font-extrabold text-slate-950">
                  ¡Aviso de Bandeja! Tienes{" "}
                  {resumenAlertas.nuevosRequerimientos.length > 0
                    ? `${resumenAlertas.nuevosRequerimientos.length} requerimiento(s) de presupuesto nuevo(s) por atender`
                    : `${resumenAlertas.enNegociacion.length} presupuesto(s) con observaciones del cliente`}
                </p>
                {ultimoRequerimiento && (
                  <p className="text-xs font-semibold text-slate-900/90 mt-0.5">
                    Último recibido:{" "}
                    <strong>{ultimoRequerimiento.nombre}</strong>
                    {ultimoRequerimiento.empresa
                      ? ` (${ultimoRequerimiento.empresa})`
                      : ""}{" "}
                    — <em>{ultimoRequerimiento.rubro}</em>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={abrirPanelAdmin}
                className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                📋 Entrar al Panel de Presupuestos →
              </button>
              <button
                type="button"
                onClick={() => setOcultarBannerAlerta(true)}
                className="text-slate-900/80 hover:text-slate-950 font-bold text-xs px-2 py-1 rounded-lg cursor-pointer"
                title="Ocultar aviso temporalmente"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        <Hero />
        <Servicios />
        <Soluciones />
        <Trayectoria />
        <Contacto onAbrirAdmin={abrirPanelAdmin} />
      </main>
      <Footer
        onAbrirPresupuesto={abrirVistaPresupuesto}
        onAbrirAdmin={abrirPanelAdmin}
      />
    </div>
  );
}
