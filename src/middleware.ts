import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Definimos qué rutas pertenecen a quién (lo que está dentro de tus carpetas)
  const userRoutes = ['/perfil', '/favoritos', '/publicar', '/mis-solicitudes'];
  const adminRoutes = ['/admin-stats', '/aprobar-propiedades', '/usuarios-registrados'];

  const isUserPage = userRoutes.some(route => pathname.startsWith(route));
  const isAdminPage = adminRoutes.some(route => pathname.startsWith(route));

  // 2. PROTECCIÓN TOTAL: Si no hay token y quiere entrar a cualquier ruta privada
  if (!token && (isUserPage || isAdminPage)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    try {
      const payload: any = decodeJwt(token);
      const userRole = payload.role;

      // 3. SEGURIDAD CRUZADA: Un 'user' no puede entrar a rutas de 'admin'
      if (isAdminPage && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url)); // Lo mandamos al inicio
      }

      // 4. Redirección si ya está logueado (UX)
      if (pathname === '/login' || pathname === '/register') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // Si el token es inválido o expiró, limpiamos y al login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('access_token');
      return response;
    }
  }

  return NextResponse.next();
}

// 5. EL MATCHER: Aquí es donde "prendés" la seguridad para cada ruta
export const config = {
  matcher: [
    '/perfil/:path*', 
    '/favoritos/:path*', 
    '/publicar/:path*', 
    '/admin-stats/:path*', 
    '/login', 
    '/register'
  ],
};