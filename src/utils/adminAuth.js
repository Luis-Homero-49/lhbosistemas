const STORAGE_KEY = "lhbo_admin_session_token_v1";

export function obtenerTokenAdmin() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function guardarTokenAdmin(token) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Silencioso en caso de bloqueo de almacenamiento
  }
}

export function limpiarSesionAdmin() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silencioso
  }
}

// Interceptar automáticamente peticiones a /api/* para adjuntar el token de Administrador si existe
let interceptorInstalado = false;

export function instalarInterceptorFetchAdmin() {
  if (interceptorInstalado || typeof window === "undefined" || !window.fetch) {
    return;
  }
  interceptorInstalado = true;
  const fetchOriginal = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const token = obtenerTokenAdmin();
    const urlStr = typeof input === "string" ? input : input?.url || "";

    if (token && urlStr.includes("/api/")) {
      const headers = new Headers(init.headers || {});
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return fetchOriginal(input, {
        ...init,
        headers,
      });
    }

    return fetchOriginal(input, init);
  };
}
