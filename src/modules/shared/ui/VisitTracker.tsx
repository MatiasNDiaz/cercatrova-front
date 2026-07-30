'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { recordVisit, sendDuration } from '../lib/tracking';

/**
 * Mide visitas y tiempo en página (Fase 0 de Estadísticas).
 *
 * Se monta una sola vez en el layout raíz y reacciona a los cambios de ruta.
 * Por cada página:
 *   1. Registra la visita y guarda el `visitId` que devuelve el backend.
 *   2. Cuenta el tiempo REAL de lectura: el cronómetro se pausa cuando la
 *      pestaña deja de estar visible y se reanuda al volver. Sin esto, una
 *      pestaña olvidada en segundo plano inflaría el promedio.
 *   3. Manda la duración al salir de la página o al cerrar/ocultar la pestaña.
 *
 * No renderiza nada.
 *
 * Nota: no filtra al admin acá — lo hace el backend, que es quien sabe el rol
 * de verdad (el front podría ser manipulado).
 */
export function VisitTracker() {
  const pathname = usePathname();

  const visitIdRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);          // ms acumulados con la pestaña visible
  const lastResumeRef = useRef<number | null>(null); // cuándo se volvió visible
  const sentRef = useRef(false);             // evita mandar la duración dos veces

  useEffect(() => {
    let cancelled = false;

    // ── Arranca la medición de esta página ──
    accumulatedRef.current = 0;
    lastResumeRef.current = document.visibilityState === 'visible' ? Date.now() : null;
    sentRef.current = false;
    visitIdRef.current = null;

    recordVisit(pathname).then((id) => {
      if (!cancelled) visitIdRef.current = id;
    });

    /** Suma el tramo visible que venía corriendo y lo cierra. */
    const pause = () => {
      if (lastResumeRef.current !== null) {
        accumulatedRef.current += Date.now() - lastResumeRef.current;
        lastResumeRef.current = null;
      }
    };

    const resume = () => {
      if (lastResumeRef.current === null) lastResumeRef.current = Date.now();
    };

    const flush = () => {
      if (sentRef.current) return;
      pause();
      const id = visitIdRef.current;
      if (id && accumulatedRef.current > 0) {
        sentRef.current = true;
        sendDuration(id, accumulatedRef.current);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // `hidden` es el único momento garantizado en móviles: ahí se manda.
        flush();
      } else {
        // Si vuelve a la misma página, se reanuda el conteo para el próximo envío.
        sentRef.current = false;
        resume();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    // `pagehide` cubre el cierre de pestaña y la navegación hacia afuera.
    window.addEventListener('pagehide', flush);

    return () => {
      cancelled = true;
      // Cambio de ruta dentro de la SPA: se cierra la visita anterior.
      flush();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', flush);
    };
  }, [pathname]);

  return null;
}
