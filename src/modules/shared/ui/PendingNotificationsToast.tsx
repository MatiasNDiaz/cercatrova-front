'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios';
import { PENDING_TOAST_KEY_PREFIX } from '@/modules/shared/lib/pendingNotifSession';

/**
 * Toast de notificaciones pendientes al iniciar sesión (canal 3 de 4).
 *
 * Los otros tres canales son la sección de notificaciones de la dashboard, la
 * campanita de la navbar y el email. Este cubre el aviso inmediato: apenas
 * entrás, te dice qué te quedó sin leer.
 *
 * Reglas de comportamiento:
 *  - **No se auto-cierra.** `duration: Infinity` — se cierra solo con la "X".
 *    Es a propósito: el `<Toaster>` global tiene `duration={3000}`, que sirve
 *    para un "guardado con éxito" pero haría desaparecer esto mientras se lee.
 *  - **Una vez por sesión**, no por navegación. Se marca en `sessionStorage`,
 *    porque `user` pasa de `null` a cargado tanto al loguearse como en cada
 *    refresh de página: sin la marca, el toast reaparecería en cada F5.
 *    `AuthContext.logout()` borra la marca, así que volver a entrar lo muestra
 *    de nuevo.
 *  - Sirve para usuario y admin: el endpoint de la lista depende del rol.
 */

interface NotificacionMinima {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const MAX_EN_TOAST = 4;

export function PendingNotificationsToast() {
  const { user, isLoading } = useAuth();
  // Evita que un doble render (StrictMode en dev) dispare dos toasts.
  const yaDisparado = useRef(false);

  useEffect(() => {
    if (isLoading || !user || yaDisparado.current) return;

    const clave = `${PENDING_TOAST_KEY_PREFIX}${user.id}`;
    if (sessionStorage.getItem(clave)) return;

    yaDisparado.current = true;
    sessionStorage.setItem(clave, '1');

    const esAdmin = user.role === 'admin';
    const endpoint = esAdmin ? '/notifications/admin' : '/notifications';
    const destino = esAdmin
      ? '/dashboardAdmin/notificaciones'
      : '/dashboard/notificaciones';

    (async () => {
      let pendientes: NotificacionMinima[] = [];
      try {
        const { data } = await api.get<NotificacionMinima[]>(endpoint);
        pendientes = data.filter((n) => !n.read);
      } catch {
        // Silencioso: si falla, el usuario igual tiene la campanita y el panel.
        return;
      }

      if (pendientes.length === 0) return;

      const visibles = pendientes.slice(0, MAX_EN_TOAST);
      const resto = pendientes.length - visibles.length;

      toast.custom(
        (t) => (
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-[0_14px_40px_-12px_rgba(10,12,11,0.28)]">
            {/* Encabezado */}
            <div className="flex items-start gap-3 border-b border-ink-100 px-4 py-3">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Bell size={17} />
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white">
                  {pendientes.length > 99 ? '99+' : pendientes.length}
                </span>
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink-900">
                  {pendientes.length === 1
                    ? 'Tenés 1 notificación sin leer'
                    : `Tenés ${pendientes.length} notificaciones sin leer`}
                </p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {esAdmin ? 'Actividad de la plataforma' : 'Mientras no estabas'}
                </p>
              </div>

              {/* Único modo de cerrarlo: este botón. */}
              <button
                type="button"
                onClick={() => toast.dismiss(t)}
                aria-label="Cerrar aviso"
                className="-mt-0.5 shrink-0 cursor-pointer rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-surface hover:text-ink-700"
              >
                <X size={15} />
              </button>
            </div>

            {/* Listado */}
            <ul className="divide-y divide-ink-100">
              {visibles.map((n) => (
                <li key={n.id} className="px-4 py-2.5">
                  <p className="truncate text-[13px] font-semibold text-ink-800">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                    {n.message}
                  </p>
                </li>
              ))}
            </ul>

            {/* Pie */}
            <div className="flex items-center justify-between gap-3 bg-surface px-4 py-2.5">
              <span className="text-[11px] font-medium text-ink-500">
                {resto > 0 ? `y ${resto} más` : ' '}
              </span>
              <Link
                href={destino}
                onClick={() => toast.dismiss(t)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-brand-800"
              >
                Ver todas <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ),
        {
          // Sin auto-cierre: se va solo con la X (o al tocar "Ver todas").
          duration: Infinity,
          // El toast trae su propio contenedor blanco; el estilo global del
          // `<Toaster>` (fondo, borde, padding) acá estorbaría.
          unstyled: true,
          className: 'w-full',
        },
      );
    })();
  }, [user, isLoading]);

  return null;
}

export default PendingNotificationsToast;
