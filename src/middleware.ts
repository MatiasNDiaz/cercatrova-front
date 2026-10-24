import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';
// Mismas constantes/validación que usa el cliente: el nombre del parámetro y la
// definición de "ruta interna segura" tienen que ser UNA sola en todo el
// proyecto. Son funciones puras, así que corren igual en el runtime del edge.
import { RETURN_PARAM, EXPIRED_PARAM, isSafeReturnPath } from '@/modules/shared/lib/returnTo';

/**
 * Lee el `exp` de la cookie (sin verificar la firma: eso lo hace el backend en
 * cada request). Devuelve:
 *  - `'ok'` si se puede decodificar y no venció,
 *  - `'expired'` si venció,
 *  - `'malformed'` si ni siquiera es un JWT.
 */
function tokenState(token: string): 'ok' | 'expired' | 'malformed' {
  try {
    const { exp } = decodeJwt(token);
    // 10s de margen por diferencias de reloj entre servidores.
    if (typeof exp === 'number' && exp * 1000 < Date.now() - 10_000) return 'expired';
    return 'ok';
  } catch {
    return 'malformed';
  }
}

export function middleware(request: NextRequest) {
  let token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  /**
   * Cookie VENCIDA o CORRUPTA → se trata como si no hubiera sesión y se borra.
   *
   * ── El bug que resuelve (pantalla en blanco del panel) ────────────────────
   * Antes el middleware solo decodificaba la cookie: una vencida le parecía
   * válida, dejaba entrar al panel y rebotaba `/login` de vuelta al panel,
   * mientras el panel recibía 401 del backend y no mostraba nada.
   *
   * Las cookies REVOCADAS (cerró sesión en otro dispositivo, cambió la
   * contraseña) no se pueden detectar acá sin consultar al backend: esas las
   * borra el propio backend en la primera respuesta 401 (ver `stale-session.ts`
   * en el backend), y el panel muestra "Tu sesión expiró" en vez de quedar en
   * blanco.
   */
  let clearCookie = false;
  if (token && tokenState(token) !== 'ok') {
    token = undefined;
    clearCookie = true;
  }
  const finish = (res: NextResponse) => {
    if (clearCookie) res.cookies.delete('access_token');
    return res;
  };

  // 1. Definimos las zonas según la estructura real de rutas
  // (la zona admin vive en /dashboardAdmin — el route group (admin) no afecta la URL)
  const isAdminZone = pathname.startsWith('/dashboardAdmin');
  const isPrivateZone = (pathname.startsWith('/dashboard') && !isAdminZone) || pathname.startsWith('/publicar');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // --- CAPA 1: PROTECCIÓN TOTAL (Authentication) ---
  // Si intenta entrar a algo privado o de admin sin token
  if (!token && (isPrivateZone || isAdminZone)) {
    const loginUrl = new URL('/login', request.url);
    // `pathname + search` y no solo `pathname`: hay pantallas cuyo estado vive
    // en la query (`/dashboard/notificaciones?tipo=favoritos`,
    // `/dashboardAdmin/solicitudes?estado=...`). Guardando solo el pathname el
    // usuario volvía a la pantalla pero sin el filtro que estaba mirando.
    loginUrl.searchParams.set(RETURN_PARAM, pathname + request.nextUrl.search);
    // Si había una cookie pero estaba vencida/corrupta, el login lo explica.
    if (clearCookie) loginUrl.searchParams.set(EXPIRED_PARAM, '1');
    return finish(NextResponse.redirect(loginUrl));
  }

  if (token) {
    // Nota: decodeJwt solo DECODIFICA, no verifica la firma. La verificación
    // real la hace el backend en cada request — esto es solo UX/redirección.
    // (`tokenState` ya garantizó que decodifica y que no está vencido.)
    const payload = decodeJwt(token);
    const userRole = payload.role as 'user' | 'admin' | undefined;

    // --- CAPA 2: PROTECCIÓN POR ROL (Authorization) ---

    // Bloquear acceso de usuarios normales a zona Admin
    if (isAdminZone && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // --- CAPA 3: UX ---
    // Si ya está logueado, no tiene sentido que vea el Login.
    // Igual que en `AuthContext.handleAuthSuccess`, el `callbackUrl` manda y
    // el dashboard por rol es solo el destino por defecto: si abrió el link
    // de una acción protegida teniendo sesión en otra pestaña, tiene que
    // terminar en la acción, no en el panel.
    //
    // ⚠️ EXCEPCIÓN: si llega con `expired=1` es porque el frontend o el backend
    // ya determinaron que esta sesión no sirve. Rebotarlo al panel era
    // exactamente el bucle de la pantalla en blanco: se lo deja ver el login.
    if (isAuthPage && request.nextUrl.searchParams.get(EXPIRED_PARAM) !== '1') {
      const returnTo = request.nextUrl.searchParams.get(RETURN_PARAM);
      const dest = isSafeReturnPath(returnTo)
        ? returnTo
        : userRole === 'admin' ? '/dashboardAdmin' : '/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return finish(NextResponse.next());
}

// EL MATCHER: rutas donde corre el middleware.
// /dashboard/:path* NO matchea /dashboardAdmin (el matcher exige el segmento
// exacto "dashboard"), por eso /dashboardAdmin/:path* va aparte.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/dashboardAdmin/:path*',
    '/publicar/:path*',
    '/login',
    '/register'
  ],
};
