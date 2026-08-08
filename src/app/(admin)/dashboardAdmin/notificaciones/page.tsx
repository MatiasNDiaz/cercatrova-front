'use client';

import { useState, useEffect } from 'react';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import {
  BellOff, CheckCheck, ChevronDown, ChevronUp, UserPlus, ClipboardList,
  MessageSquare, Star, AlertTriangle, Bell,
  Heart
} from 'lucide-react';
import { DashboardBackLink } from '@/modules/shared/ui/DashboardBackLink';
import { DashboardPage } from '@/modules/shared/ui/DashboardPage';
import {
  NotifItem, getNotifType, getConfig,
  type AdminNotification as Notification, } from './notifShared';
import { NotifCountBadge } from '@/modules/shared/ui/notifIndicators';

const INITIAL_VISIBLE = 10;

// Los helpers y el item viven en `notifShared` porque los comparten esta
// vista general y las cinco páginas por categoría.

// ── FILTROS ───────────────────────────────────────────────────────────────────
type FilterTab = 'todas' | 'sin_leer' | 'usuarios' | 'solicitudes' | 'comentarios' | 'valoraciones' | 'favoritos';

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: 'todas',        label: 'Todas',        icon: <Bell size={12} /> },
  { key: 'sin_leer',     label: 'Sin leer',     icon: <BellOff size={12} /> },
  { key: 'usuarios',     label: 'Usuarios',     icon: <UserPlus size={12} /> },
  { key: 'solicitudes',  label: 'Solicitudes',  icon: <ClipboardList size={12} /> },
  { key: 'comentarios',  label: 'Comentarios',  icon: <MessageSquare size={12} /> },
  { key: 'valoraciones', label: 'Valoraciones', icon: <Star size={12} /> },
  { key: 'favoritos',    label: 'Favoritos',    icon: <Heart size={12} /> },
];

const FILTER_COLOR: Record<FilterTab, string> = {
  todas:        'bg-[#0b7a4b] text-white',
  sin_leer:     'bg-[#0b7a4b] text-white',
  usuarios:     'bg-[#0b7a4b] text-white',
  solicitudes:  'bg-blue-500 text-white',
  comentarios:  'bg-purple-500 text-white',
  valoraciones: 'bg-amber-500 text-white',
  favoritos:    'bg-pink-500 text-white'
};

// ── SUMMARY CARDS CONFIG ──────────────────────────────────────────────────────
const SUMMARY_CARDS = [
  { label: 'Total',        type: null,             color: 'text-gray-600',    bg: 'bg-white',        border: 'border-gray-100',      icon: Bell },
  { label: 'Sin leer',     type: null,             color: 'text-[#0b7a4b]',   bg: 'bg-[#0b7a4b]/8', border: 'border-[#0b7a4b]/15',  icon: BellOff, isUnread: true },
  { label: 'Usuarios',     type: 'nuevo_usuario',  color: 'text-[#0b7a4b]',   bg: 'bg-[#0b7a4b]/8', border: 'border-[#0b7a4b]/15',  icon: UserPlus },
  { label: 'Solicitudes',  type: 'nueva_solicitud',color: 'text-blue-600',    bg: 'bg-blue-50',      border: 'border-blue-100',      icon: ClipboardList },
  { label: 'Comentarios',  type: 'comentario',     color: 'text-purple-600',  bg: 'bg-purple-50',    border: 'border-purple-100',    icon: MessageSquare },
  { label: 'Valoraciones', type: 'valoracion',     color: 'text-amber-500',   bg: 'bg-amber-50',     border: 'border-amber-100',     icon: Star },
  { label: 'Favoritos',    type: 'favorito',       color: 'text-pink-500',    bg: 'bg-pink-50',      border: 'border-pink-100',      icon: Heart },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function AdminNotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [markingAll, setMarkingAll]       = useState(false);
  const [visibleCount, setVisibleCount]   = useState(INITIAL_VISIBLE);
  const [filter, setFilter]               = useState<FilterTab>('todas');

  const unreadCount    = notifications.filter(n => !n.read).length;

  /**
   * No leídas por categoría, para los badges de los tabs.
   *
   * Se calcula con el mismo `getNotifType` que usa el sidebar
   * (`dashboardAdmin/layout.tsx`), así el badge del menú y el del tab no pueden
   * decir números distintos — que es exactamente el bug que motivó extraer
   * `notifShared` en su momento.
   */
  const sinLeerPorTab: Partial<Record<FilterTab, number>> = (() => {
    const sinLeer = notifications.filter(n => !n.read);
    const por = (t: string) => sinLeer.filter(n => getNotifType(n) === t).length;
    return {
      usuarios:     por('nuevo_usuario'),
      solicitudes:  por('nueva_solicitud'),
      comentarios:  por('comentario'),
      valoraciones: por('valoracion'),
      favoritos:    por('favorito'),
    };
  })();

  const importantelUnread = notifications.filter(n => {
    if (n.read) return false;
    const type = getNotifType(n);
    return getConfig(type).priority === 'importante';
  }).length;

  // ── Fetch — endpoint del admin ──────────────────────────────────────────────
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/notifications/admin'); // 👈 endpoint admin
        const sorted = [...data].sort((a: Notification, b: Notification) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          const prioOrder = { importante: 0, negocio: 1, info: 2 };
          const aPrio = getConfig(getNotifType(a)).priority;
          const bPrio = getConfig(getNotifType(b)).priority;
          if (aPrio !== bPrio) return prioOrder[aPrio] - prioOrder[bPrio];
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setNotifications(sorted);
      } catch {
        toast.error('No se pudieron cargar las notificaciones');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  useEffect(() => { setVisibleCount(INITIAL_VISIBLE); }, [filter]);

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const filtered = notifications.filter(n => {
    if (filter === 'sin_leer')     return !n.read;
    if (filter === 'usuarios')     return getNotifType(n) === 'nuevo_usuario';
    if (filter === 'solicitudes')  return getNotifType(n) === 'nueva_solicitud';
    if (filter === 'comentarios')  return getNotifType(n) === 'comentario';
    if (filter === 'valoraciones') return getNotifType(n) === 'valoracion';
    if (filter === 'favoritos')    return getNotifType(n) === 'favorito';
    return true;
  });

  const visible    = filtered.slice(0, visibleCount);
  const hasMore    = visibleCount < filtered.length;
  const isExpanded = visibleCount > INITIAL_VISIBLE;

  // ── Acciones ────────────────────────────────────────────────────────────────
const handleMarkAsRead = async (id: number) => {
  try {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    window.dispatchEvent(new Event('notif-updated')); // 👈
  } catch {
    toast.error('No se pudo marcar como leída');
  }
};

const handleMarkAllAsRead = async () => {
  if (unreadCount === 0) return;
  setMarkingAll(true);
  try {
    await api.patch('/notifications/admin/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('Todas marcadas como leídas');
    window.dispatchEvent(new Event('notif-updated')); // 👈
  } catch {
    toast.error('No se pudo actualizar');
  } finally {
    setMarkingAll(false);
  }
};

  // ── Conteos para summary cards ───────────────────────────────────────────────
  const getCount = (card: typeof SUMMARY_CARDS[0]) => {
    if (card.isUnread) return unreadCount;
    if (!card.type)    return notifications.length;
    return notifications.filter(n => getNotifType(n) === card.type).length;
  };

  return (
    <DashboardPage>

      {/* Back */}
      <DashboardBackLink href="/dashboardAdmin" label="Volver al panel" />

      {/* Header */}
      <div className="flex mt-1 items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0b7a4b]">Notificaciones</h1>
            {importantelUnread > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                <AlertTriangle size={11} />
                {importantelUnread} crítica{importantelUnread > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className={`text-sm mt-0.5 font-semibold ${unreadCount > 0 ? 'text-[#0b7a4b]' : 'text-gray-600'}`}>
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día ✓'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}
          >
            <CheckCheck size={14} />
            {markingAll ? 'Marcando...' : 'Marcar todas como leídas'}
          </button>
        )}
      </div>

      {/* Summary cards */}
      {!loading && notifications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {SUMMARY_CARDS.map((card) => {
            const Icon  = card.icon;
            const count = getCount(card);
            return (
              <button
                key={card.label}
                onClick={() => {
                  if (card.isUnread)         setFilter('sin_leer');
                  else if (!card.type)       setFilter('todas');
                  else if (card.type === 'nuevo_usuario')   setFilter('usuarios');
                  else if (card.type === 'nueva_solicitud') setFilter('solicitudes');
                  else if (card.type === 'comentario')      setFilter('comentarios');
                  else if (card.type === 'valoracion')      setFilter('valoraciones');
                  else if (card.type === 'favorito')        setFilter('favoritos');
                }}
                className={`${card.bg} rounded-xl px-3 py-3 border ${card.border} flex items-center gap-2.5 hover:brightness-95 transition-all text-left`}
              >
                <Icon size={14} className={card.color} />
                <div>
                  <p className={`text-base font-bold ${card.color}`}>{count}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{card.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── FILTROS ──
          Cada tab muestra cuántas SIN LEER tiene su categoría. Antes el número
          era el total de la categoría (leídas incluidas), así que no bajaba
          nunca al ir leyendo y no servía para saber qué falta mirar.

          "Todas" es el único sin badge: su número sería el mismo que el de la
          campanita del sidebar, repetido al lado y sin agregar información. */}
      <div className="flex gap-1.5 bg-white border border-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {FILTER_TABS.map(({ key, label, icon }) => {
          const isActive = filter === key;
          const count = key === 'sin_leer' ? unreadCount : (sinLeerPorTab[key] ?? 0);

          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                isActive ? FILTER_COLOR[key] : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {icon}
              {label}
              {/* `onDark` cuando el tab está activo: su fondo ya es de color y
                  un badge verde encima sería ilegible. */}
              <NotifCountBadge count={count} variant="tab" onDark={isActive} />
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <div className="h-3.5 bg-gray-100 rounded-full w-2/3" />
                <div className="h-3 bg-gray-100 rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl p-12 border border-gray-100 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-xl bg-[#0b7a4b]/8 flex items-center justify-center">
            <BellOff size={24} className="text-[#0b7a4b]" />
          </div>
          <div>
            <p className="font-medium text-gray-700 text-sm">
              {filter === 'sin_leer'     ? 'No hay notificaciones sin leer' :
               filter === 'usuarios'     ? 'No hay notificaciones de nuevos usuarios' :
               filter === 'solicitudes'  ? 'No hay solicitudes de publicación' :
               filter === 'comentarios'  ? 'No hay comentarios nuevos' :
               filter === 'valoraciones' ? 'No hay valoraciones nuevas' :
               filter === 'favoritos'    ? 'No hay propiedades guardadas como favorito' :
               'No hay notificaciones todavía'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Aquí aparecerán nuevos usuarios, solicitudes, valoraciones y más
            </p>
          </div>
        </div>
      )}

      {/* Lista */}
      {!loading && visible.length > 0 && (
        <div className="flex flex-col gap-2">
          {visible.map(n => (
            <NotifItem key={n.id} n={n} onRead={handleMarkAsRead} />
          ))}

          {(hasMore || isExpanded) && (
            <div className="flex gap-2 mt-1">
              {hasMore && (
                <button
                  onClick={() => setVisibleCount(v => v + INITIAL_VISIBLE)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold text-[#0b7a4b] bg-[#0b7a4b]/6 hover:bg-[#0b7a4b]/12 rounded-xl transition-colors"
                >
                  <ChevronDown size={14} />
                  Ver más ({filtered.length - visibleCount} restantes)
                </button>
              )}
              {isExpanded && (
                <button
                  onClick={() => setVisibleCount(INITIAL_VISIBLE)}
                  className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronUp size={14} />
                  Contraer
                </button>
              )}
            </div>
          )}
        </div>
      )}

    </DashboardPage>
  );
}