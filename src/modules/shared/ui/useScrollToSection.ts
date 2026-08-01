'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Navega a una sección de la landing desde cualquier parte del sitio.
 *
 * ── El bug que arregla ──────────────────────────────────────────────────────
 * Las dos navbars tenían su propia copia de esta lógica, y las dos hacían:
 *
 *     router.push('/');
 *     setTimeout(scrollToEl, 600);
 *
 * Es una carrera contra el reloj: si a los 600ms la landing todavía no montó
 * la sección, `getElementById` devuelve null, el scroll no pasa y te quedás
 * arriba de todo. Desde `/servicios/:id` (que carga datos en el servidor)
 * pasaba casi siempre — apretabas "Consultas" y llegabas al inicio, no al FAQ.
 *
 * ── Cómo lo resuelve ────────────────────────────────────────────────────────
 * En vez de adivinar cuánto tarda, REINTENTA hasta que el elemento exista,
 * mirando una vez por frame con `requestAnimationFrame`. Apenas aparece,
 * scrollea y corta. Si pasa el tope de tiempo (la navegación falló, o la
 * sección ya no existe) abandona en silencio en vez de quedar reintentando.
 *
 * Funciona igual si la navegación tarda 50ms o 2s, así que no hay que
 * recalibrar nada si mañana la landing carga más lento.
 */

/** Cuánto se reintenta antes de rendirse. */
const TIMEOUT_MS = 4000;

export function useScrollToSection() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (sectionId: string, closeMenu?: () => void) => {
      closeMenu?.();

      const scrollToEl = () => {
        const el = document.getElementById(sectionId);
        if (!el) return false;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      };

      // Ya estamos en la landing: la sección está montada, scrolleamos y listo.
      if (pathname === '/') {
        scrollToEl();
        return;
      }

      // El hash queda en la URL a propósito: si el usuario recarga o comparte
      // el link, el navegador lo lleva a la misma sección sin depender de este
      // hook. `scroll: false` evita que Next salte al tope antes de que
      // podamos scrollear nosotros.
      router.push(`/#${sectionId}`, { scroll: false });

      const desde = performance.now();
      const intentar = () => {
        if (scrollToEl()) return;
        if (performance.now() - desde > TIMEOUT_MS) return;
        requestAnimationFrame(intentar);
      };
      requestAnimationFrame(intentar);
    },
    [router, pathname],
  );
}

export default useScrollToSection;
