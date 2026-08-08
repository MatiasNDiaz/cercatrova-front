'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import {
  BellOff, Check, CheckCheck, Home, TrendingDown,
  ClipboardList, Clock, ChevronDown, ChevronUp, Eye, Sparkles, Bell, Megaphone, MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useUrlFilter } from '@/modules/shared/hooks/useUrlFilter';

import { DashboardBackLink } from '@/modules/shared/ui/DashboardBackLink';
import { DashboardPage } from '@/modules/shared/ui/DashboardPage';
import { PulseDot, NotifCountBadge } from '@/modules/shared/ui/notifIndicators';

/**
 * La clasificación (tipos + `getNotifType` + `contarSinLeer`) se mudó a
 * `notifShared.ts`. El sidebar necesita contar por categoría exactamente igual
 * que esta pantalla filtra; con dos copias, el badge decía "3" y al entrar
 * aparecían 2. Acá quedan sólo los íconos y colores, que nadie más usa.
 */
import {
  getNotifType,
  contarSinLeer,
  type UserNotification as Notification,
} from './notifShared';

const INITIAL_VISIBLE = 8;

/**
 * Paleta por tipo de notificación.
 *
 * ── Qué cambió ──────────────────────────────────────────────────────────────
 * Antes cada tipo tenía su color en el ícono y en el punto, pero la etiqueta
 * salía siempre en `text-gray-600` y el borde de la tarjeta era verde de marca
 * para TODAS las no leídas. Resultado: en una lista con seis tipos distintos
 * todo se veía igual de verde-gris y el color no ayudaba a barrer con la vista.
 *
 * Ahora cada tipo aporta también el color del texto de su etiqueta y el de la
 * barra de acento lateral de las no leídas, así el tipo se reconoce de un
 * vistazo sin leer. Se subió un paso la saturación de los `-600` a `-700` en
 * los textos para que pasen contraste AA sobre el fondo `-50`.
 */
function getConfig(n: Pick<Notification, 'type' | 'title' | 'message'>) {
  const type = getNotifType(n);
  switch (type) {
    case 'precio':
      return { icon: <TrendingDown size={16} className="text-amber-700" />, bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-800', accent: 'bg-amber-400', label: 'Bajó el precio' };
    case 'coincidencia':
      return { icon: <Sparkles size={16} className="text-purple-700" />, bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500', text: 'text-purple-800', accent: 'bg-purple-400', label: 'Según tus preferencias' };
    case 'solicitud_aceptada':
      return { icon: <ClipboardList size={16} className="text-emerald-700" />, bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-800', accent: 'bg-emerald-400', label: 'Solicitud aceptada' };
    case 'solicitud_rechazada':
      return { icon: <ClipboardList size={16} className="text-red-700" />, bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-800', accent: 'bg-red-400', label: 'Solicitud rechazada' };
    case 'solicitud_revision':
      return { icon: <ClipboardList size={16} className="text-amber-700" />, bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-800', accent: 'bg-amber-400', label: 'En revisión' };
    case 'solicitud_recibida':
      return { icon: <ClipboardList size={16} className="text-blue-700" />, bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', text: 'text-blue-800', accent: 'bg-blue-400', label: 'Solicitud recibida' };
    case 'propiedad_nueva':
      return { icon: <Home size={16} className="text-brand-700" />, bg: 'bg-brand-50', border: 'border-brand-200', dot: 'bg-brand-600', text: 'text-brand-800', accent: 'bg-brand-500', label: 'Nueva propiedad' };
    case 'publicacion_nueva':
      return { icon: <Megaphone size={16} className="text-sky-700" />, bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-500', text: 'text-sky-800', accent: 'bg-sky-400', label: 'Nueva publicación' };
    case 'respuesta_comentario':
      return { icon: <MessageCircle size={16} className="text-violet-700" />, bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', text: 'text-violet-800', accent: 'bg-violet-400', label: 'Respondieron tu comentario' };
    default:
      return { icon: <Bell size={16} className="text-ink-500" />, bg: 'bg-ink-50', border: 'border-ink-200', dot: 'bg-ink-400', text: 'text-ink-600', accent: 'bg-ink-300', label: 'Notificación' };
  }
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Ahora mismo';
  if (mins < 60)  return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days < 7)   return `Hace ${days} días`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── ITEM ──────────────────────────────────────────────────────────────────────
function NotifItem({ n, onRead }: { n: Notification; onRead: (id: number) => void }) {
  const cfg = getConfig(n);
  return (
    /* `relative` + `overflow-hidden` por la barra de acento lateral: es la
       señal de "sin leer" que además dice DE QUÉ TIPO es, sin tener que leer.
       Las leídas no la llevan y bajan a fondo/borde neutro. */
    <div className={`group relative flex items-start gap-4 overflow-hidden rounded-xl border px-5 py-4 pl-6 transition-all duration-200 ${
      n.read
        ? 'border-ink-100 bg-white'
        : `bg-white ${cfg.border} shadow-[0_1px_2px_rgba(10,12,11,0.04),0_8px_20px_-14px_rgba(10,12,11,0.18)]`
    }`}>
      {!n.read && <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${cfg.accent}`} />}

      {/* Punto verde titilante en la ESQUINA de la tarjeta.
          Reemplaza al punto estático que estaba dentro del bloque de texto (a
          la derecha del título) y que tomaba el color de la categoría: en una
          tarjeta rosa de "Favorito" el punto rosa se confundía con el resto de
          la decoración y no se leía como "sin leer".
          Va posicionado dentro de los límites del contenedor (`top-3 right-3`)
          porque la tarjeta tiene `overflow-hidden` por la barra de acento
          lateral — cualquier cosa que asome fuera del borde se recorta. */}
      {!n.read && <PulseDot className="absolute top-3 right-3" />}

      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          {/* `pr-4` reserva el lugar del punto de la esquina para que un título
              largo no le pase por debajo. */}
          <div className="flex items-center gap-2 flex-wrap pr-4">
            <p className={`text-sm font-semibold ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              n.read
                ? 'border-ink-200 bg-ink-50 text-ink-400'
                : `${cfg.bg} ${cfg.border} ${cfg.text}`
            }`}>
              {cfg.label}
            </span>
          </div>
        </div>
        <p className={`text-xs mt-1 leading-relaxed ${n.read ? 'text-gray-400' : 'text-gray-600'}`}>{n.message}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock size={10} /> {timeAgo(n.createdAt)}
          </span>
          <div className="flex items-center gap-3">
            {n.propertyId && (
              <Link
                href={`/properties/${n.propertyId}`}
                onClick={() => !n.read && onRead(n.id)}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0b7a4b] hover:text-[#0f8c58] transition-colors"
              >
                <Eye size={11} /> Ver propiedad
              </Link>
            )}
            {!n.read && (
              <button
                onClick={() => onRead(n.id)}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 opacity-0 group-hover:opacity-100 hover:text-[#0b7a4b] transition-all"
              >
                <Check size={11} /> Leída
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FILTROS ───────────────────────────────────────────────────────────────────
type FilterTab =
  | 'todas' | 'sin_leer' | 'leidas'
  | 'propiedades_nuevas' | 'coincidencias' | 'precios'
  | 'publicaciones' | 'respuestas'
  | 'solicitudes_aceptadas' | 'solicitudes_rechazadas' | 'solicitudes_revision';

/**
 * Orden de la fila de filtros.
 *
 * Espeja el desplegable "Notificaciones" del sidebar, para que la misma
 * categoría no aparezca en dos lugares con dos órdenes distintos:
 *   1. Estado de lectura — Todas / Sin leer / Leídas. Es otro eje (no una
 *      categoría) y por eso va agrupado adelante.
 *   2. Categorías, en el orden del sidebar: lo que se publica primero
 *      (propiedades, publicaciones), después lo personalizado (preferencias),
 *      después los avisos de cambio (precio) y las respuestas.
 *   3. Solicitudes al final — Aceptadas / Rechazadas / En revisión.
 *
 * Los colores activos ahora salen del mismo mapa que usa cada notificación
 * (`getConfig`), así el chip del filtro y el ícono de la lista comparten gama.
 */
const FILTER_TABS: { key: FilterTab; label: string; color: string }[] = [
  { key: 'todas',                  label: 'Todas',              color: 'bg-brand-700 text-white' },
  { key: 'sin_leer',               label: 'Sin leer',           color: 'bg-brand-700 text-white' },
  { key: 'leidas',                 label: 'Leídas',             color: 'bg-ink-500 text-white' },
  { key: 'propiedades_nuevas',     label: 'Propiedades nuevas', color: 'bg-brand-700 text-white' },
  { key: 'publicaciones',          label: 'Publicaciones',      color: 'bg-sky-600 text-white' },
  { key: 'coincidencias',          label: 'Mis preferencias',   color: 'bg-purple-600 text-white' },
  { key: 'precios',                label: 'Bajaron de precio',  color: 'bg-amber-600 text-white' },
  { key: 'respuestas',             label: 'Respuestas',         color: 'bg-violet-600 text-white' },
  { key: 'solicitudes_aceptadas',  label: 'Aceptadas',          color: 'bg-emerald-600 text-white' },
  { key: 'solicitudes_rechazadas', label: 'Rechazadas',         color: 'bg-red-600 text-white' },
  { key: 'solicitudes_revision',   label: 'En revisión',        color: 'bg-amber-600 text-white' },
];

const EMPTY_MESSAGES: Record<FilterTab, string> = {
  todas:                  'No tenés notificaciones todavía',
  sin_leer:               'No tenés notificaciones sin leer',
  leidas:                 'No tenés notificaciones leídas',
  propiedades_nuevas:     'No hay notificaciones de nuevas propiedades',
  coincidencias:          'No hay propiedades que coincidan con tus preferencias',
  precios:                'No hay notificaciones de bajadas de precio',
  publicaciones:          'No hay publicaciones nuevas',
  respuestas:             'Todavía no respondieron ningún comentario tuyo',
  solicitudes_aceptadas:  'No tenés solicitudes aceptadas',
  solicitudes_rechazadas: 'No tenés solicitudes rechazadas',
  solicitudes_revision:   'No tenés solicitudes en revisión',
};

// ── SUMMARY CARDS ─────────────────────────────────────────────────────────────
const SUMMARY_CARDS = [
  { label: 'Total',        filter: 'todas'                  as FilterTab, color: 'text-gray-600',   bg: 'bg-white',        border: 'border-gray-100',      icon: Bell },
  { label: 'Sin leer',     filter: 'sin_leer'               as FilterTab, color: 'text-[#0b7a4b]',  bg: 'bg-[#0b7a4b]/8', border: 'border-[#0b7a4b]/15',  icon: BellOff,       isUnread: true },
  { label: 'Propiedades',  filter: 'propiedades_nuevas'     as FilterTab, color: 'text-[#0b7a4b]',  bg: 'bg-[#0b7a4b]/8', border: 'border-[#0b7a4b]/15',  icon: Home },
  { label: 'Preferencias', filter: 'coincidencias'          as FilterTab, color: 'text-purple-600', bg: 'bg-purple-50',   border: 'border-purple-100',    icon: Sparkles },
  { label: 'Precios',      filter: 'precios'                as FilterTab, color: 'text-amber-600',  bg: 'bg-amber-50',    border: 'border-amber-100',     icon: TrendingDown },
  { label: 'Solicitudes',  filter: 'solicitudes_aceptadas'  as FilterTab, color: 'text-blue-600',   bg: 'bg-blue-50',     border: 'border-blue-100',      icon: ClipboardList, isSolicitudes: true },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function NotificacionesPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]       = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  // El filtro vive en la URL (`?tipo=`) para que el sidebar linkee directo
  // a la categoría y el estado sobreviva al refresh.
  const [filter, setFilter] = useUrlFilter<FilterTab>('tipo', 'todas');

  const unreadCount = notifications.filter(n => !n.read).length;

  /**
   * No leídas por categoría. Mismo helper que usa el sidebar, así el badge del
   * menú y el del tab no pueden decir números distintos.
   *
   * `SIN_LEER_POR_TAB` traduce las claves de `contarSinLeer` a las de
   * `FilterTab`. Las que no están en el mapa (`todas`, `leidas`) quedan sin
   * badge, que es justamente lo que se quiere.
   */
  const sinLeer = contarSinLeer(notifications);
  const SIN_LEER_POR_TAB: Partial<Record<FilterTab, number>> = {
    propiedades_nuevas:     sinLeer.propiedades_nuevas,
    publicaciones:          sinLeer.publicaciones,
    coincidencias:          sinLeer.coincidencias,
    precios:                sinLeer.precios,
    respuestas:             sinLeer.respuestas,
    solicitudes_aceptadas:  sinLeer.solicitudes_aceptadas,
    solicitudes_rechazadas: sinLeer.solicitudes_rechazadas,
    solicitudes_revision:   sinLeer.solicitudes_revision,
  };

  const filtered = notifications.filter(n => {
    const type = getNotifType(n);
    switch (filter) {
      case 'sin_leer':               return !n.read;
      case 'leidas':                 return n.read;
      case 'propiedades_nuevas':     return type === 'propiedad_nueva';
      case 'coincidencias':          return type === 'coincidencia';
      case 'precios':                return type === 'precio';
      case 'publicaciones':          return type === 'publicacion_nueva';
      case 'respuestas':             return type === 'respuesta_comentario';
      case 'solicitudes_aceptadas':  return type === 'solicitud_aceptada';
      case 'solicitudes_rechazadas': return type === 'solicitud_rechazada';
      case 'solicitudes_revision':   return type === 'solicitud_revision' || type === 'solicitud_recibida';
      default:                       return true;
    }
  });

  const visible    = filtered.slice(0, visibleCount);
  const hasMore    = visibleCount < filtered.length;
  const isExpanded = visibleCount > INITIAL_VISIBLE;

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/notifications');
        const sorted = [...data].sort((a: Notification, b: Notification) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setNotifications(sorted);
      } catch {
        toast.error('No se pudieron cargar las notificaciones');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchNotifs();
  }, [user]);

  useEffect(() => { setVisibleCount(INITIAL_VISIBLE); }, [filter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      // Refresca el badge de la campanita sin esperar su tick de 60s.
      window.dispatchEvent(new Event('notif-updated'));
    } catch {
      toast.error('No se pudo marcar como leída');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new Event('notif-updated'));
      toast.success('Todas marcadas como leídas');
    } catch {
      toast.error('No se pudo actualizar');
    } finally {
      setMarkingAll(false);
    }
  };

  // Conteos para las cards
  const getCount = (card: typeof SUMMARY_CARDS[0]) => {
    if (card.isUnread)     return unreadCount;
    if (card.isSolicitudes) return notifications.filter(n => {
      const t = getNotifType(n);
      return t === 'solicitud_aceptada' || t === 'solicitud_rechazada' || t === 'solicitud_revision' || t === 'solicitud_recibida';
    }).length;
    if (card.filter === 'todas')            return notifications.length;
    if (card.filter === 'propiedades_nuevas') return notifications.filter(n => getNotifType(n) === 'propiedad_nueva').length;
    if (card.filter === 'coincidencias')    return notifications.filter(n => getNotifType(n) === 'coincidencia').length;
    if (card.filter === 'precios')          return notifications.filter(n => getNotifType(n) === 'precio').length;
    return 0;
  };

  return (
    <DashboardPage>

      {/* Back */}
      <DashboardBackLink />

      {/* Header */}
      <div className="mt-1 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Notificaciones</h1>
          <p className="text-sm mt-0.5 text-gray-600">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día ✓'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
            <CheckCheck size={14} />
            {markingAll ? 'Marcando...' : 'Marcar todas como leídas'}
          </button>
        )}
      </div>

      {/* Summary cards */}
      {!loading && notifications.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SUMMARY_CARDS.map((card) => {
            const Icon  = card.icon;
            const count = getCount(card);
            return (
              <button key={card.label} onClick={() => setFilter(card.filter)}
                className={`${card.bg} rounded-xl px-3 py-3 border ${card.border} flex items-center gap-2.5 hover:brightness-95 transition-all text-left`}>
                <Icon size={14} className={card.color} />
                <div>
                  <p className={`text-base font-bold ${card.color}`}>{count}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{card.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── FILTROS ──
          Cada tab muestra cuántas SIN LEER tiene su categoría. Antes el número
          era el total de la categoría (leídas incluidas), así que el badge no
          bajaba nunca al ir leyendo y no servía para saber qué falta mirar.
          Ahora es un contador de pendientes de verdad, y a 0 desaparece
          (`NotifCountBadge` devuelve `null`).

          "Todas" y "Leídas" son los dos únicos sin badge, y por motivos
          distintos: "Todas" porque es el estado por defecto —su número sería el
          mismo que el de la campanita del sidebar, repetido al lado— y "Leídas"
          porque un contador de "pendientes leídos" no significa nada. */}
      <div className="flex gap-1.5 bg-white border border-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {FILTER_TABS.map(({ key, label, color }) => {
          const isActive = filter === key;
          const count = key === 'sin_leer' ? sinLeer.total : (SIN_LEER_POR_TAB[key] ?? 0);

          return (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                isActive ? color : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
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
            <p className="font-medium text-gray-700 text-sm">{EMPTY_MESSAGES[filter]}</p>
            <p className="text-xs text-gray-400 mt-1">
              Te avisaremos cuando haya novedades sobre propiedades o tus solicitudes
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
                <button onClick={() => setVisibleCount(v => v + INITIAL_VISIBLE)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold text-[#0b7a4b] bg-[#0b7a4b]/6 hover:bg-[#0b7a4b]/12 rounded-xl transition-colors">
                  <ChevronDown size={14} />
                  Ver más ({filtered.length - visibleCount} restantes)
                </button>
              )}
              {isExpanded && (
                <button onClick={() => setVisibleCount(INITIAL_VISIBLE)}
                  className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
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