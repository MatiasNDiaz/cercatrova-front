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
 * Se excluyen `/login` y `/register` (pantallas de alto completo) y TODA la
 * zona de dashboards (`/dashboard` y `/dashboardAdmin`, ambas empiezan con
 * `/dashboard`): son layouts SaaS de pantalla completa con su propio sidebar y
 * scroll interno, donde el footer público (CTA + links + mapa) no tiene sentido.
 */

const HIDDEN_ON = ['/login', '/register'];

export function FooterSelector() {
  const pathname = usePathname();

  if (HIDDEN_ON.includes(pathname)) return null;
  if (pathname.startsWith('/dashboard')) return null;

  return <FooterPublic />;
}

export default FooterSelector;
