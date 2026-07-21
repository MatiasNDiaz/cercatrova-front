'use client';

import { usePathname } from 'next/navigation';
import { FooterPublic } from '@/modules/landing/components/FooterPublic';

/**
 * Decide si el footer se renderiza, según la ruta (Bloque H).
 *
 * Espeja el patrón que ya usaba `NavbarSelector`. Hasta ahora `FooterPublic`
 * se montaba directo en el layout raíz, sin condición, así que el footer
 * completo (CTA + 3 columnas de links + mapa) aparecía también debajo de la
 * pantalla de login.
 *
 * Solo se excluyen `/login` y `/register`, que son pantallas de alto completo.
 * Los dashboards se dejaron como estaban a propósito: sacar el footer de ahí
 * también sería razonable, pero es un cambio que no se pidió en esta sesión.
 */

const HIDDEN_ON = ['/login', '/register'];

export function FooterSelector() {
  const pathname = usePathname();

  if (HIDDEN_ON.includes(pathname)) return null;

  return <FooterPublic />;
}

export default FooterSelector;
