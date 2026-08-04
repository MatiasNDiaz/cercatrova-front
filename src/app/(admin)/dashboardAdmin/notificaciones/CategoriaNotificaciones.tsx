'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCheck, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { DashboardPage, DashboardHeader } from '@/modules/shared/ui/DashboardPage';
import { ListChips } from '@/modules/shared/ui/ListToolbar';
import {
  NotifItem, getNotifType, type AdminNotification, type NotifType
} from './notifShared';

type ReadFilter = 'todas' | 'sin_leer' | 'leidas';

const INITIAL_VISIBLE = 10;

/**
 * Pantalla de UNA categoría de notificaciones del admin.
 *
 * Cada categoría (usuarios, solicitudes, comentarios, valoraciones, favoritos)
 * tiene su propia ruta y su propia página, en vez de una única vista con
 * filtros: así el ítem del sidebar lleva directo al listado que corresponde.
 *
 * Todas comparten este componente; lo único que cambia es el `tipo` y los
 * textos. El endpoint es el mismo (`GET /notifications/admin`) y el filtrado
 * se hace en el cliente, igual que en la vista general.
 */
export function CategoriaNotificaciones({
  tipo, titulo, descripcion, icono, colorFondo
}: {
  tipo: NotifType;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  colorFondo: string;
}) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  // Filtro por estado de lectura. Es el único que aporta acá: la categoría ya
  // acota el tipo, y un buscador de texto sobre notificaciones de una línea
  // (todas con la misma plantilla de título) no agregaría nada.
  const [readFilter, setReadFilter] = useState<ReadFilter>('todas');

  useEffect(() => {
    let alive = true;
    api
      .get('/notifications/admin')
      .then(({ data }) => {
        if (!alive) return;
        const propias = (data as AdminNotification[])
          .filter((n) => getNotifType(n) === tipo)
          // Sin leer primero, y dentro de cada grupo las más recientes arriba.
          .sort((a, b) => {
            if (a.read !== b.read) return a.read ? 1 : -1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        setNotifications(propias);
      })
      .catch((error) => { if (alive) toast.error(getErrorMessage(error)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tipo]);

  const unread = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (readFilter === 'sin_leer') return notifications.filter((n) => !n.read);
    if (readFilter === 'leidas')   return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, readFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const isExpanded = visibleCount > INITIAL_VISIBLE;

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  /**
   * Marca como leídas SOLO las de esta categoría (una por una), no todas las
   * del panel: el endpoint `read-all` del admin no distingue por tipo y desde
   * una pantalla de categoría sería una sorpresa desagradable.
   */
  const handleMarkCategory = async () => {
    const pendientes = notifications.filter((n) => !n.read);
    if (pendientes.length === 0) return;

    setMarkingAll(true);
    try {
      await Promise.allSettled(pendientes.map((n) => api.patch(`/notifications/${n.id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new Event('notif-updated'));
      toast.success('Notificaciones marcadas como leídas ✓');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    // Antes: `max-w-4xl` propio (un cuarto ancho distinto en el panel) y el link
    // de volver reimplementado inline con su propio estilo.
    <DashboardPage>
      <DashboardHeader
        back={{ href: '/dashboardAdmin/notificaciones', label: 'Todas las notificaciones' }}
        iconNode={icono}
        iconClassName={colorFondo}
        title={titulo}
        subtitle={
          loading
            ? 'Cargando…'
            : `${notifications.length} en total${unread > 0 ? ` · ${unread} sin leer` : ''}`
        }
        actions={unread > 0 ? (
          <button
            onClick={handleMarkCategory}
            disabled={markingAll}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition-all duration-200 hover:border-[#0b7a4b]/40 hover:text-[#0b7a4b] disabled:opacity-60"
          >
            {markingAll ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
            Marcar todas como leídas
          </button>
        ) : undefined}
      />

      {!loading && notifications.length > 0 && (
        <ListChips<ReadFilter>
          value={readFilter}
          onChange={(v) => { setReadFilter(v); setVisibleCount(INITIAL_VISIBLE); }}
          options={[
            { value: 'todas',    label: 'Todas',    count: notifications.length },
            { value: 'sin_leer', label: 'Sin leer', count: unread },
            { value: 'leidas',   label: 'Leídas',   count: notifications.length - unread },
          ]}
        />
      )}

      <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">{descripcion}</p>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
          <Loader2 size={20} className="animate-spin" />Cargando…
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
          <span className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${colorFondo}`}>
            {icono}
          </span>
          <p className="text-lg font-bold text-gray-900">No hay notificaciones de este tipo</p>
          <p className="mt-2 text-sm text-gray-500">Cuando ocurra algo nuevo va a aparecer acá.</p>
        </div>
      ) : filtered.length === 0 ? (
        /* Hay notificaciones, pero ninguna en el estado de lectura elegido
           (ej. "Leídas" cuando están todas sin leer). */
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="font-bold text-gray-700">
            {readFilter === 'sin_leer' ? 'No te queda ninguna sin leer' : 'Todavía no leíste ninguna'}
          </p>
          <button
            type="button"
            onClick={() => setReadFilter('todas')}
            className="mt-4 cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-[#0b7a4b] transition-all duration-200 hover:border-[#0b7a4b]/40 hover:bg-[#0b7a4b]/8"
          >
            Ver todas
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map((n) => (
              <NotifItem key={n.id} n={n} onRead={handleMarkAsRead} />
            ))}
          </div>

          {(hasMore || isExpanded) && (
            <button
              onClick={() => setVisibleCount(hasMore ? filtered.length : INITIAL_VISIBLE)}
              className="mx-auto inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition-all hover:border-[#0b7a4b]/40 hover:text-[#0b7a4b]"
            >
              {hasMore
                ? <>Ver todas ({filtered.length - visibleCount} más)<ChevronDown size={15} /></>
                : <>Ver menos<ChevronUp size={15} /></>}
            </button>
          )}
        </>
      )}
    </DashboardPage>
  );
}
