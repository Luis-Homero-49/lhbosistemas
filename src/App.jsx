import { useState, useEffect } from "react";
import Navbar from "./Components/Navbar";
import Hero from "./Components/Hero";
import Servicios from "./Components/Servicios";
import Soluciones from "./Components/Soluciones";
import Trayectoria from "./Components/Trayectoria";
import SeccionRedesSociales from "./Components/SeccionRedesSociales";
import Contacto from "./Components/Contacto";
import Footer from "./Components/Footer";
import VistaPresupuestoCliente from "./Components/VistaPresupuestoCliente";
import PanelGestionPresupuestos from "./Components/PanelGestionPresupuestos";
import LoginAdmin from "./Components/LoginAdmin";
import {
  obtenerTokenAdmin,
  limpiarSesionAdmin,
  instalarInterceptorFetchAdmin,
} from "./utils/adminAuth";

instalarInterceptorFetchAdmin();

function detectarRutaActiva() {
  const { pathname, search, hash } = window.location;

  // 0a. Acceso directo al Gestor de Redes Sociales: /redes
  if (/^\/redes\/?/i.test(pathname) || /^#\/redes\/?/i.test(hash)) {
    return {
      vista: "admin",
      token: "",
      pestanaAdmin: "redes",
    };
  }

  // 0. Panel Administrativo de Requerimientos y Presupuestos: /admin, /panel o /requerimientos
  if (
    /^\/(admin|panel|requerimientos)\/?/i.test(pathname) ||
    /^#\/(admin|panel|requerimientos)\/?/i.test(hash)
  ) {
    return {
      vista: "admin",
      token: "",
      pestanaAdmin: "requerimientos",
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
      pestanaAdmin: "requerimientos",
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
  const [esAdmin, setEsAdmin] = useState(false);
  const [verificandoAdmin, setVerificandoAdmin] = useState(() =>
    Boolean(obtenerTokenAdmin())
  );
  const [resumenAlertas, setResumenAlertas] = useState({
    nuevosRequerimientos: [],
    enNegociacion: [],
  });
  const [datosRedes, setDatosRedes] = useState(null);
  const [ocultarBannerAlerta, setOcultarBannerAlerta] = useState(false);

  // Verificar sesión de administrador al cargar la aplicación
  useEffect(() => {
    const token = obtenerTokenAdmin();
    if (!token) {
      setEsAdmin(false);
      setVerificandoAdmin(false);
      return;
    }

    let cancelado = false;
    async function verificarSesion() {
      try {
        const res = await fetch("/api/auth/verificar");
        if (!cancelado) {
          if (res.ok) {
            setEsAdmin(true);
          } else {
            limpiarSesionAdmin();
            setEsAdmin(false);
          }
        }
      } catch {
        if (!cancelado) {
          setEsAdmin(false);
        }
      } finally {
        if (!cancelado) {
          setVerificandoAdmin(false);
        }
      }
    }
    verificarSesion();
    return () => {
      cancelado = true;
    };
  }, []);

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

  // Cargar datos públicos de redes sociales y (solo si es Admin) alertas de requerimientos
  useEffect(() => {
    if (rutaActiva.vista !== "inicio") return;
    let cancelado = false;

    async function cargarDatosInicio() {
      try {
        // 1. Muro público de redes sociales (para cualquier visitante)
        const resRedes = await fetch("/api/redes-sociales").catch(() => null);
        if (!cancelado && resRedes && resRedes.ok) {
          const dataRedes = await resRedes.json().catch(() => null);
          if (dataRedes) setDatosRedes(dataRedes);
        }

        // 2. Alertas de requerimientos nuevos EXCLUSIVAMENTE si el administrador tiene sesión activa
        if (esAdmin) {
          const resPres = await fetch("/api/presupuestos/admin/resumen").catch(
            () => null
          );
          if (!cancelado && resPres && resPres.ok) {
            const data = await resPres.json().catch(() => ({}));
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
          }
        } else {
          setResumenAlertas({ nuevosRequerimientos: [], enNegociacion: [] });
        }
      } catch {
        // Silencioso en caso de carga offline
      }
    }

    cargarDatosInicio();
    return () => {
      cancelado = true;
    };
  }, [rutaActiva.vista, esAdmin]);

  const volverAlSitioPrincipal = () => {
    window.history.pushState({}, "", "/");
    setRutaActiva({ vista: "inicio", token: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const abrirPanelAdmin = () => {
    window.history.pushState({}, "", "/admin");
    setRutaActiva({
      vista: "admin",
      token: "",
      pestanaAdmin: "requerimientos",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const abrirGestorRedes = () => {
    window.history.pushState({}, "", "/redes");
    setRutaActiva({ vista: "admin", token: "", pestanaAdmin: "redes" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cerrarSesionAdmin = () => {
    limpiarSesionAdmin();
    setEsAdmin(false);
    setResumenAlertas({ nuevosRequerimientos: [], enNegociacion: [] });
    window.history.pushState({}, "", "/");
    setRutaActiva({ vista: "inicio", token: "" });
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

  // Vista Administrativa (/admin, /panel, /requerimientos, /redes) protegida por credenciales
  if (rutaActiva.vista === "admin") {
    if (verificandoAdmin) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-300">
              Verificando credenciales de administrador...
            </p>
          </div>
        </div>
      );
    }

    if (!esAdmin) {
      return (
        <LoginAdmin
          onLoginExitoso={() => setEsAdmin(true)}
          onVolverInicio={volverAlSitioPrincipal}
        />
      );
    }

    return (
      <PanelGestionPresupuestos
        onVolverInicio={volverAlSitioPrincipal}
        onAbrirPresupuesto={abrirVistaPresupuesto}
        onCerrarSesion={cerrarSesionAdmin}
        pestanaInicial={rutaActiva.pestanaAdmin || "requerimientos"}
      />
    );
  }

  // Vista del Cliente (/presupuesto/:token): solo ve su presupuesto y el botón para volver al sitio público
  if (rutaActiva.vista === "presupuesto") {
    return (
      <VistaPresupuestoCliente
        tokenInicial={rutaActiva.token}
        onVolverInicio={volverAlSitioPrincipal}
        onAbrirAdmin={esAdmin ? abrirPanelAdmin : null}
      />
    );
  }

  const totalAlertas = esAdmin
    ? resumenAlertas.nuevosRequerimientos.length +
      resumenAlertas.enNegociacion.length
    : 0;
  const ultimoRequerimiento = esAdmin
    ? resumenAlertas.nuevosRequerimientos[0] || null
    : null;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar
        onAbrirPresupuesto={abrirVistaPresupuesto}
        onAbrirAdmin={esAdmin ? abrirPanelAdmin : null}
        onAbrirRedes={esAdmin ? abrirGestorRedes : null}
        onCerrarSesionAdmin={esAdmin ? cerrarSesionAdmin : null}
        esAdmin={esAdmin}
        cantidadPendientes={totalAlertas}
      />

      {/* Aviso destacado en la página principal EXCLUSIVO para el Administrador autenticado */}
      {esAdmin && totalAlertas > 0 && !ocultarBannerAlerta && (
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
        <SeccionRedesSociales
          datosRedes={datosRedes}
          onAbrirGestorRedes={esAdmin ? abrirGestorRedes : null}
        />
        <Contacto onAbrirAdmin={esAdmin ? abrirPanelAdmin : null} />
      </main>
      <Footer
        onAbrirPresupuesto={abrirVistaPresupuesto}
        onAbrirAdmin={abrirPanelAdmin}
        esAdmin={esAdmin}
        onCerrarSesionAdmin={esAdmin ? cerrarSesionAdmin : null}
      />
    </div>
  );
}
