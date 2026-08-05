/**
 * Variables de entorno públicas, resueltas en un solo lugar.
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 * `axios.ts` y `tracking.ts` hacían cada uno
 * `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'`. Ese fallback es
 * cómodo en desarrollo y **peligroso en producción**: las variables
 * `NEXT_PUBLIC_*` se hornean en el bundle en tiempo de BUILD, no se leen en
 * runtime. Si el pipeline de despliegue buildeaba sin la variable seteada, el
 * sitio compilaba, arrancaba y se veía perfecto — pero todas las llamadas del
 * cliente apuntaban a `localhost:3000` del navegador del visitante y fallaban.
 * No había ni un error de build ni un warning que lo delatara.
 *
 * ── Cómo se comporta ahora ──────────────────────────────────────────────────
 * · Variable definida            → se usa.
 * · Sin definir, en desarrollo   → fallback a `localhost:3000` + warning en consola.
 * · Sin definir, en producción   → **throw**. El `next build` falla de entrada,
 *   con el nombre de la variable que falta, en vez de generar un artefacto roto.
 *
 * El throw ocurre al evaluar el módulo, así que salta durante la generación de
 * páginas del build — el momento más temprano y más visible posible.
 */

const DEV_API_FALLBACK = 'http://localhost:3000';

function requirePublicEnv(name: string, value: string | undefined, devFallback: string): string {
  if (value) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `[env] Falta la variable de entorno ${name}. ` +
        'Es obligatoria para buildear en producción: sin ella el sitio compila pero ' +
        'todas las llamadas a la API apuntarían a localhost. ' +
        'Ver .env.example para la lista completa de variables.',
    );
  }

  console.warn(
    `[env] ${name} no está definida: usando "${devFallback}" (solo desarrollo). ` +
      'En producción esto sería un error de build.',
  );
  return devFallback;
}

/**
 * URL base del backend NestJS.
 *
 * - Cliente (navegador) en producción: '/api', ruta relativa proxeada por
 *   Vercel hacia Railway (ver rewrites en next.config.js). Necesario para
 *   que la cookie de sesión quede en el mismo dominio que el frontend.
 * - Servidor (SSR, corriendo en Vercel) en producción: URL absoluta directa
 *   a Railway, porque fetch() en Node no puede resolver rutas relativas.
 * - Desarrollo: siempre NEXT_PUBLIC_API_URL / localhost, sin distinción
 *   cliente/servidor (front y back comparten dominio en local).
 */
const isServer = typeof window === 'undefined';

export const API_URL: string =
  process.env.NODE_ENV === 'production'
    ? isServer
      ? (process.env.BACKEND_URL ?? '')
      : '/api'
    : requirePublicEnv('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL, DEV_API_FALLBACK);

/**
 * Client ID de Google Identity Services.
 *
 * A diferencia de `API_URL` **no** es obligatoria: si falta, el login con
 * email + contraseña sigue funcionando y el botón "Continuar con Google"
 * simplemente no se renderiza (ver `GoogleProvider`). Degradación intencional,
 * no un error.
 */
export const GOOGLE_CLIENT_ID: string = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';