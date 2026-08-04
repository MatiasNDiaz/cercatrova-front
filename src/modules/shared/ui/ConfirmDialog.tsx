'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Diálogo de confirmación del sitio.
 *
 * ── Por qué ya NO usa sonner ────────────────────────────────────────────────
 * Antes se montaba con `toast.custom(...)`. Eso lo metía dentro del contenedor
 * de un toast, y cuando el `<Toaster>` global pasó a tener piel propia
 * (fondo blanco, borde, padding y sombra con `!important`), el diálogo quedó
 * DENTRO de esa caja: se veía un rectángulo blanco de más asomando por detrás
 * del modal. El `unstyled: true` que se pasaba no alcanzaba, porque solo
 * desactiva los estilos inline de sonner, no las clases con `!important`.
 *
 * Un modal de confirmación tampoco pertenece conceptualmente a la pila de
 * avisos: bloquea, exige una respuesta y no se apila con otros. Ahora se monta
 * en su propio portal sobre `<body>`, sin intermediarios. No hay contenedor
 * extra posible.
 *
 * ── Variantes ──────────────────────────────────────────────────────────────
 * Cada una define borde intenso + fondo muy claro del mismo color, según el
 * riesgo de la acción, y trae su propio ícono SVG animado.
 *
 *   danger  → rojo    · borrar / eliminar algo
 *   warning → ámbar   · acción riesgosa pero reversible
 *   info    → azul    · aviso importante que pide confirmación
 *   logout  → verde   · cerrar sesión
 *   default → verde   · confirmación genérica
 */

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'logout' | 'default';

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Define color, ícono y tono del diálogo. Ver la tabla de arriba. */
  variant?: ConfirmVariant;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

/* ── Íconos SVG animados ────────────────────────────────────────────────────
   Se dibujan a mano en vez de usar lucide para poder animar cada trazo por
   separado. El gesto es el mismo en los cuatro: los trazos se "escriben"
   (`pathLength` de 0 a 1) y después la pieza que da sentido al ícono entra con
   su propio movimiento — la tapa del tacho se levanta, la flecha sale por la
   puerta, el signo cae dentro del triángulo.

   `pathLength` es una prop que framer-motion traduce a `strokeDasharray` +
   `strokeDashoffset`, así que la animación corre en el compositor y no
   recalcula layout. */

const trazo = {
  fill: 'none' as const,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Curva y duración compartidas por todos los íconos. */
const dibujar = (delay = 0) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { pathLength: { duration: 0.45, delay, ease: 'easeInOut' as const }, opacity: { duration: 0.15, delay } },
});

/** Tacho de basura: la tapa se levanta y las rayas caen escalonadas. */
function IconoBorrar() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" {...trazo} aria-hidden>
      {/* Tapa: entra desde arriba y con una leve rotación, como si se abriera. */}
      <motion.g
        initial={{ y: -5, rotate: -14, opacity: 0 }}
        animate={{ y: 0, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.28 }}
        style={{ originX: '4px', originY: '6px' }}
      >
        <path d="M3 6h18" {...trazo} />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" {...trazo} />
      </motion.g>

      {/* Cuerpo del tacho */}
      <motion.path d="M5.5 6.5 6.5 20a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1l1-13.5" {...trazo} {...dibujar(0)} />

      {/* Rayas interiores */}
      <motion.path d="M10 11v6" {...trazo} {...dibujar(0.42)} />
      <motion.path d="M14 11v6" {...trazo} {...dibujar(0.52)} />
    </svg>
  );
}

/** Puerta con flecha: la flecha sale hacia afuera, en loop suave. */
function IconoSalir() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" {...trazo} aria-hidden>
      <motion.path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9" {...trazo} {...dibujar(0)} />
      {/* La flecha "sale": un vaivén corto que se repite, para reforzar la idea
          de salida sin volverse una animación molesta. */}
      <motion.g
        initial={{ x: -4, opacity: 0 }}
        animate={{ x: [0, 2.5, 0], opacity: 1 }}
        transition={{
          opacity: { duration: 0.2, delay: 0.35 },
          x: { duration: 1.6, delay: 0.45, repeat: Infinity, repeatDelay: 0.9, ease: 'easeInOut' },
        }}
      >
        <path d="M17 8l4 4-4 4" {...trazo} />
        <path d="M21 12H10" {...trazo} />
      </motion.g>
    </svg>
  );
}

/** Triángulo de advertencia: el signo cae adentro después del contorno. */
function IconoRiesgo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" {...trazo} aria-hidden>
      <motion.path
        d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
        {...trazo}
        {...dibujar(0)}
      />
      <motion.path
        d="M12 9v4"
        {...trazo}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.4 }}
      />
      <motion.circle
        cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 15, delay: 0.55 }}
      />
    </svg>
  );
}

/** Círculo de información: el trazo se dibuja y la "i" aparece. */
function IconoAviso() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" {...trazo} aria-hidden>
      <motion.circle cx="12" cy="12" r="9.5" {...trazo} {...dibujar(0)} />
      <motion.path
        d="M12 11v5"
        {...trazo}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.4 }}
        style={{ originY: '16px' }}
      />
      <motion.circle
        cx="12" cy="7.8" r="0.6" fill="currentColor" stroke="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 15, delay: 0.5 }}
      />
    </svg>
  );
}

/* ── Paleta por variante ────────────────────────────────────────────────────
   Regla que pidió el diseño: el BORDE es el tono intenso y el FONDO es el
   mismo color pero muy claro, para que el nivel de riesgo se lea antes que el
   texto. La pastilla del ícono va blanca, como en el resto del sitio. */
const VARIANTES: Record<
  ConfirmVariant,
  { caja: string; pastilla: string; icono: string; confirmar: string; Icono: () => React.ReactElement }
> = {
  danger: {
    caja: 'border-red-400 bg-red-50',
    pastilla: 'bg-white ring-1 ring-red-200',
    icono: 'text-red-600',
    confirmar: 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600',
    Icono: IconoBorrar,
  },
  warning: {
    caja: 'border-amber-400 bg-amber-50',
    pastilla: 'bg-white ring-1 ring-amber-200',
    icono: 'text-amber-600',
    confirmar: 'bg-amber-500 hover:bg-amber-600 focus-visible:outline-amber-500',
    Icono: IconoRiesgo,
  },
  info: {
    caja: 'border-blue-400 bg-blue-50',
    pastilla: 'bg-white ring-1 ring-blue-200',
    icono: 'text-blue-600',
    confirmar: 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600',
    Icono: IconoAviso,
  },
  logout: {
    caja: 'border-brand-400 bg-brand-50',
    pastilla: 'bg-white ring-1 ring-brand-200',
    icono: 'text-brand-700',
    confirmar: 'bg-brand-700 hover:bg-brand-800 focus-visible:outline-brand-700',
    Icono: IconoSalir,
  },
  default: {
    caja: 'border-brand-400 bg-brand-50',
    pastilla: 'bg-white ring-1 ring-brand-200',
    icono: 'text-brand-700',
    confirmar: 'bg-brand-700 hover:bg-brand-800 focus-visible:outline-brand-700',
    Icono: IconoAviso,
  },
};

function ConfirmDialogContent({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
  onClose,
}: ConfirmDialogOptions & { onClose: () => void }) {
  const [abierto, setAbierto] = useState(true);
  const [cargando, setCargando] = useState(false);

  const v = VARIANTES[variant];
  const Icono = v.Icono;

  /** Cierra con animación; `onClose` desmonta cuando `AnimatePresence` termina. */
  const cerrar = useCallback(() => setAbierto(false), []);

  const cancelar = useCallback(() => {
    if (cargando) return;
    onCancel?.();
    cerrar();
  }, [cargando, onCancel, cerrar]);

  const confirmar = useCallback(async () => {
    if (cargando) return;
    try {
      setCargando(true);
      await onConfirm();
    } finally {
      // Se cierra también si `onConfirm` falló: quien llama muestra su propio
      // toast de error, no tiene sentido dejar el modal abierto.
      setCargando(false);
      cerrar();
    }
  }, [cargando, onConfirm, cerrar]);

  // Escape para cancelar + bloqueo del scroll de fondo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelar(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [cancelar]);

  return createPortal(
    <AnimatePresence onExitComplete={onClose}>
      {abierto && (
        <div className="fixed inset-0 z-200 flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={cancelar}
            className="fixed inset-0 bg-ink-950/45 backdrop-blur-[3px]"
            aria-hidden
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
            className={`relative z-10 w-105 max-w-[calc(100vw-2rem)] rounded-2xl border-2 p-6 shadow-[0_28px_70px_-14px_rgba(10,12,11,0.45)] ${v.caja}`}
          >
            <div className="flex items-start gap-4">
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 20, delay: 0.04 }}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${v.pastilla} ${v.icono}`}
              >
                <Icono />
              </motion.span>

              <div className="min-w-0 pt-0.5">
                <h2 className="text-base font-bold tracking-tight text-ink-900">{title}</h2>
                {message && (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{message}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={cancelar}
                disabled={cargando}
                className="cursor-pointer rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition-all duration-200 hover:border-ink-400 hover:bg-ink-50 active:scale-[0.98] disabled:opacity-50"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={confirmar}
                disabled={cargando}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 ${v.confirmar}`}
              >
                {cargando && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Abre el diálogo. Monta su propio árbol de React sobre `<body>` y lo desmonta
 * al cerrarse, así no depende de que exista ningún contenedor en el layout.
 */
export function confirmDialog(options: ConfirmDialogOptions) {
  if (typeof document === 'undefined') return;

  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  const destruir = () => {
    // `setTimeout` de 0: desmontar una raíz desde adentro de su propio ciclo de
    // render lanza un warning de React. Sale de la pila primero.
    setTimeout(() => {
      root.unmount();
      host.remove();
    }, 0);
  };

  root.render(<ConfirmDialogContent {...options} onClose={destruir} />);
}

export default confirmDialog;
