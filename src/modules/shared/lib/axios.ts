import axios, { isAxiosError } from 'axios';
import { emitUnauthorized } from './authEvents';
import { API_URL } from './env';
import { PROXY_SECRET_HEADER } from './proxyHeaders';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 👈 todas las requests mandan cookies automáticamente
  // Sin esto el default de axios es 0 = SIN LÍMITE. En los Server Components
  // (landing, catálogo, detalle, publicaciones) una API lenta o colgada
  // bloqueaba la respuesta HTTP indefinidamente: se midió una request a `/` sin
  // responder por más de 4 minutos con el backend caído. El `try/catch` no
  // ayudaba porque la promesa nunca se rechazaba.
  //
  // 15s es holgado para la operación más pesada del contrato (subir hasta 10
  // imágenes a Cloudinary) y muy por debajo del umbral en que un visitante
  // asume que el sitio está roto.
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Solo en el SERVIDOR (páginas renderizadas en Vercel): se identifica ante el
// backend como "el front", para que estas requests —que son de todos los
// visitantes a la vez— no consuman el rate limit por IP. El secreto es una
// variable sin `NEXT_PUBLIC_`: en el navegador vale `undefined`. Ver proxyHeaders.ts.
const serverProxySecret = typeof window === 'undefined' ? process.env.PROXY_SHARED_SECRET : undefined;
if (serverProxySecret) api.defaults.headers.common[PROXY_SECRET_HEADER] = serverProxySecret;

// ── Interceptor de respuesta ──────────────────────────────────────────────────
// 401 → sesión inválida/expirada: se limpia la sesión y se redirige a /login
// (vía el callback que registra AuthProvider en authEvents), EXCEPTO para los
// endpoints de /auth/*:
//   - GET /auth/me: el 401 de hidratación inicial es esperado, lo maneja AuthContext.
//   - POST /auth/login: 401 = credenciales inválidas, lo muestra el formulario.
//   - POST /auth/logout: 401 = la sesión ya estaba cerrada, se trata como éxito.
//   - POST /auth/google (futuro): 401 = audience mismatch / email no verificado.
// 429 → se deja pasar tal cual para que el componente muestre su mensaje.
// Resto (400/403/404/409/502) → se deja pasar; cada componente lee
// error.response.data con el helper getErrorMessage() de apiError.ts.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isAuthEndpoint = url.startsWith('/auth/');
      if (!isAuthEndpoint) {
        emitUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
