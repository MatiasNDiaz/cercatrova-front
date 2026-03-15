import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Definimos las zonas según tu estructura de carpetas
  const isPrivateZone = pathname.startsWith('/dashboard') || pathname.startsWith('/publicar');
  const isAdminZone = pathname.startsWith('/admin'); 
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
      const payload: any = decodeJwt(token);
      const userRole = payload.role;

      // --- CAPA 2: PROTECCIÓN POR ROL (Authorization) ---
      
      // Bloquear acceso de usuarios normales a zona Admin
      if (isAdminZone && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // (Opcional) Bloquear acceso de Admin a zona de usuario si querés que sean 100% separadas
      // if (isPrivateZone && userRole === 'admin') {
      //   return NextResponse.redirect(new URL('/admin', request.url));
      // }

      // --- CAPA 3: UX ---
      // Si ya está logueado, no tiene sentido que vea el Login
      if (isAuthPage) {
        const dest = userRole === 'admin' ? '/admin' : '/dashboard';
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

// 5. EL MATCHER: Aquí activamos el middleware para las rutas críticas
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/publicar/:path*', 
    '/admin/:path*', 
    '/login', 
    '/register'
  ],
};