// src/components/Navigation/NavbarSelector.tsx
'use client';

import { useAuth } from '@/modules/auth/hooks/useAuth';
import { NavbarPublic } from './NavbarPublic'; 
import { NavbarPrivate } from './NavbarPrivate';
import { usePathname } from 'next/navigation';

/** Rutas que renderizan su propia pantalla completa, sin navbar. */
const AUTH_ROUTES = ['/login', '/register'];

export function NavbarSelector() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // Los dashboards tienen su propio sidebar.
  if (pathname.startsWith('/dashboard')) return null;

  // Login y registro son pantallas de alto completo a dos columnas con su
  // propio "Volver al inicio". Además, el navbar público hace scroll a
  // secciones (#inicio, #nosotros, #faq) que solo existen en la landing, así
  // que ahí sus links no llevaban a ningún lado.
  if (AUTH_ROUTES.includes(pathname)) return null;

  // Mientras verifica la sesión, podés mostrar la pública o un esqueleto
  if (isLoading) return <NavbarPublic />; 

  // Si hay usuario, mostramos la privada; si no, la pública
  return user ? <NavbarPrivate/> : <NavbarPublic />;
}