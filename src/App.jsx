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
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar
        onAbrirPresupuesto={abrirVistaPresupuesto}
        onAbrirAdmin={abrirPanelAdmin}
      />
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
