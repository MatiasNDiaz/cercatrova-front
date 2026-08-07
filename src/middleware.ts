import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';
// Mismas constantes/validación que usa el cliente: el nombre del parámetro y la
// definición de "ruta interna segura" tienen que ser UNA sola en todo el
// proyecto. Son funciones puras, así que corren igual en el runtime del edge.
import { RETURN_PARAM, isSafeReturnPath } from '@/modules/shared/lib/returnTo';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

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
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    try {
      // Nota: decodeJwt solo DECODIFICA, no verifica la firma. La verificación
      // real la hace el backend en cada request — esto es solo UX/redirección.
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
      if (isAuthPage) {
        const returnTo = request.nextUrl.searchParams.get(RETURN_PARAM);
        const dest = isSafeReturnPath(returnTo)
          ? returnTo
          : userRole === 'admin' ? '/dashboardAdmin' : '/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
      }

    } catch (error) {
      // Token inválido, expirado o malformado
      console.log(error);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('access_token');
      return response;
    }
  }

  return NextResponse.next();
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
