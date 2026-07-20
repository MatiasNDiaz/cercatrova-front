'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { AlertTriangle, HelpCircle, type LucideIcon } from 'lucide-react';

/**
 * Diálogo de confirmación compartido.
 *
 * Reemplaza el patrón `toast.custom(...)` que hoy está reimplementado 8 veces
 * en el proyecto (3 de logout + 5 de borrado), cada copia con sus propias
 * clases. Ver FRONTEND_CHANGES.md para la lista de usos a migrar.
 *
 * Uso:
 *   confirmDialog({
 *     title: '¿Eliminar propiedad?',
 *     message: 'Esta acción no se puede deshacer.',
 *     confirmLabel: 'Eliminar',
 *     variant: 'danger',
 *     onConfirm: async () => { await api.delete(...); },
 *   });
 *
 * Diferencias de comportamiento respecto de las copias actuales:
 *  - No se auto-cierra (`duration: Infinity`). Las copias de hoy usan 5-10s,
 *    así que el modal desaparece solo mientras el usuario lo está leyendo.
 *  - `onConfirm` puede ser async: el botón queda en estado "cargando" y el
 *    diálogo se cierra recién cuando la promesa resuelve.
 *  - Se cierra con Escape o clickeando el fondo.
 */

export type ConfirmVariant = 'danger' | 'default';

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' para acciones destructivas (rojo), 'default' para el resto (verde de marca). */
  variant?: ConfirmVariant;
  /** Ícono de lucide-react. Si no se pasa, se usa uno según el variant. */
  icon?: LucideIcon;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

const VARIANT_STYLES: Record<
  ConfirmVariant,
  { iconWrap: string; icon: string; confirm: string; confirmStyle?: React.CSSProperties }
> = {
  danger: {
    iconWrap: 'bg-red-50 ring-1 ring-red-100',
    icon: 'text-red-600',
    confirm: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md',
  },
  default: {
    iconWrap: 'bg-brand-50 ring-1 ring-brand-100',
    icon: 'text-brand-700',
    confirm: 'text-white shadow-sm hover:shadow-md hover:brightness-110',
    confirmStyle: { background: 'var(--gradient-brand)' },
  },
};

/** Duración de la animación de salida antes de desmontar el toast. */
const EXIT_MS = 160;

function Backdrop({ closing, onClick }: { closing: boolean; onClick: () => void }) {
  // Se portalea a <body> a propósito: sonner aplica `transform` al contenedor
  // del toast, y un ancestro con transform convierte `position: fixed` en
  // relativo a ese ancestro — el fondo quedaría encerrado dentro del modal.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: closing ? EXIT_MS / 1000 : 0.2, ease: 'easeOut' }}
      onClick={onClick}
      className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-[3px]"
    />,
    document.body
  );
}

function ConfirmDialogContent({
  toastId,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogOptions & { toastId: string | number }) {
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = VARIANT_STYLES[variant];
  const Icon = icon ?? (variant === 'danger' ? AlertTriangle : HelpCircle);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => toast.dismiss(toastId), EXIT_MS);
  }, [toastId]);

  const handleCancel = useCallback(() => {
    if (loading) return;
    onCancel?.();
    close();
  }, [loading, onCancel, close]);

  const handleConfirm = useCallback(async () => {
    if (loading) return;
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      // Se cierra también si onConfirm falló: quien llama muestra su propio
      // toast de error (getErrorMessage), no tiene sentido dejar el modal.
      setLoading(false);
      close();
    }
  }, [loading, onConfirm, close]);

  // Escape para cancelar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCancel]);

  return (
    <>
      <Backdrop closing={closing} onClick={handleCancel} />

      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={
          closing
            ? { opacity: 0, y: 6, scale: 0.98 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={
          closing
            ? { duration: EXIT_MS / 1000, ease: 'easeIn' }
            : { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }
        }
        className="relative z-50 w-105 max-w-[calc(100vw-2rem)] rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_24px_60px_-12px_rgba(10,12,11,0.35)]"
      >
        {/* Ícono + texto */}
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.06 }}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}
          >
            <Icon size={20} className={styles.icon} strokeWidth={2.2} />
          </motion.div>

          <div className="min-w-0 pt-0.5">
            <h2 className="text-base font-semibold tracking-tight text-ink-900">
              {title}
            </h2>
            {message && (
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{message}</p>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="cursor-pointer rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-ink-700 transition-all duration-200 hover:bg-ink-200 active:scale-[0.98] disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={styles.confirmStyle}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-70 ${styles.confirm}`}
          >
            {loading && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </>
  );
}

export function confirmDialog(options: ConfirmDialogOptions) {
  return toast.custom(
    (id) => <ConfirmDialogContent toastId={id} {...options} />,
    {
      duration: Infinity, // un modal de confirmación no debe auto-cerrarse
      position: 'top-center',
      unstyled: true,
      style: { background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 },
    }
  );
}

export default confirmDialog;
