import { useState } from "react";
import { guardarTokenAdmin } from "../utils/adminAuth";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function LoginAdmin({ onLoginExitoso, onVolverInicio }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: usuario.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.token) {
        throw new Error(
          data.detail ||
            "Credenciales inválidas. Verifique su usuario y contraseña."
        );
      }

      guardarTokenAdmin(data.token);
      if (onLoginExitoso) {
        onLoginExitoso(data);
      }
    } catch (err) {
      setError(
        err.message || "Error al conectar con el servidor de autenticación."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6">
      {/* Cabecera con retorno al sitio público */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <button
          type="button"
          onClick={onVolverInicio}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-md">
            LH
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white">
              LHBO<span className="text-blue-400">.</span> Sistemas
            </span>
            <span className="block text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
              Acceso Restringido · Administración
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onVolverInicio}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>🏠</span>
          <span>Volver al Sitio Público</span>
        </button>
      </header>

      {/* Tarjeta Central de Autenticación */}
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-2xl mx-auto">
              🔒
            </div>
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-full">
              Área Privada del Administrador
            </span>
            <h1 className="text-2xl font-black text-white">
              Iniciar Sesión Administrativa
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingrese sus credenciales de administrador para acceder a la
              Bandeja de Requerimientos, Elaboración de Presupuestos, Proyectos
              P&L y Gestión de Redes Sociales.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-700/70 text-rose-200 text-xs font-semibold flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={manejarSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo o Usuario Administrador
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="luishomerobo@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Contraseña de Acceso
              </label>
              <div className="relative">
                <input
                  type={mostrarClave ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-20 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarClave((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  {mostrarClave ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-extrabold text-sm py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-600/25 cursor-pointer"
            >
              {cargando
                ? "Verificando credenciales..."
                : "🔓 Entrar al Panel de Administración"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              ¿Es usted un cliente y desea consultar su presupuesto?{" "}
              <a
                href="/presupuesto"
                className="text-blue-400 hover:text-blue-300 font-bold underline"
              >
                Ir al Portal de Presupuestos con Token →
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-2">
        © {new Date().getFullYear()} LHBO Sistemas · Seguridad de Acceso Activa
      </footer>
    </div>
  );
}
