'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart, X } from 'lucide-react';

/**
 * Aviso fijo de la actualización "interacciones sin iniciar sesión".
 *
 * Montado en el layout RAÍZ: aparece en todas las páginas, en cada carga, sin
 * fecha de vencimiento. La ✕ lo oculta solo hasta la próxima carga completa
 * (estado en memoria, a propósito NADA en localStorage: el aviso tiene que
 * volver a aparecer siempre).
 *
 * Ubicación: abajo a la IZQUIERDA. La derecha ya está ocupada por el botón de
 * "ir arriba", los avisos de sonner y el toast de notificaciones pendientes.
 *
 * `z-50`: por encima del contenido, pero DEBAJO del menú lateral de celulares
 * (z-60/70) y de los modales (z-100 en adelante), para no taparlos.
 *
 * No se muestra en los paneles (`/dashboard`, `/dashboardAdmin`): ahí no
 * aplica y, abajo a la izquierda, tapaba el botón "Cerrar sesión" del menú.
 */
export function UpdateNotice() {
  const [open, setOpen] = useState(true);
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const inPanel = pathname?.startsWith('/dashboard') ?? false;

  return (
    <AnimatePresence>
      {open && !inPanel && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : 0.6 }}
          className="fixed bottom-4 left-4 z-50 w-[calc(100%-32px)] max-w-[290px] rounded-2xl border border-brand-700/15 bg-white/95 p-4 pr-10 shadow-[0_18px_40px_-16px_rgba(6,57,35,0.45)] backdrop-blur-sm sm:bottom-5 sm:left-5"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_8px_18px_-8px_rgba(11,122,75,0.7)]"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <Heart size={17} className="fill-current" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">¡Cerca Trova se actualizó! 🎉</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-600">
                Ahora cualquier persona puede comentar y dar &quot;me gusta&quot; a nuestras
                propiedades y publicaciones, sin necesidad de iniciar sesión. ¡Queremos leerte!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar aviso"
            className="absolute top-2.5 right-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800 focus-visible:ring-2 focus-visible:ring-brand-700/50 focus-visible:outline-none"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UpdateNotice;
