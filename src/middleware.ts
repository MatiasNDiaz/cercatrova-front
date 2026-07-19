import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

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
    loginUrl.searchParams.set('callbackUrl', pathname);
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
      // Si ya está logueado, no tiene sentido que vea el Login
      if (isAuthPage) {
        const dest = userRole === 'admin' ? '/dashboardAdmin' : '/dashboard';
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
