// src/components/Navigation/NavbarSelector.tsx
'use client';

import { useAuth } from '@/modules/auth/hooks/useAuth';
import { NavbarPublic } from './NavbarPublic'; 
import { NavbarPrivate } from './NavbarPrivate';
import { usePathname } from 'next/navigation';

export function NavbarSelector() {
  const { user, isLoading } = useAuth();
   const pathname = usePathname();

if (pathname.startsWith('/dashboard')) return null;

  // Mientras verifica la sesión, podés mostrar la pública o un esqueleto
  if (isLoading) return <NavbarPublic />; 

  // Si hay usuario, mostramos la privada; si no, la pública
  return user ? <NavbarPrivate/> : <NavbarPublic />;
}