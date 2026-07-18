'use client';

import { useState, useEffect } from 'react';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import {
  BellOff, Check, CheckCheck, TrendingDown,
  TrendingUp, Clock, ChevronDown, ChevronUp,
  ArrowLeft, Eye, UserPlus, ClipboardList,
  MessageSquare, Star, AlertTriangle, Bell,
  Heart,
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: number;
  title: string;
  relatedUserId?: number; // 👈
  message: string;
  read: boolean;
  propertyId?: number;
  createdAt: string;
}

const INITIAL_VISIBLE = 10;

// ── Tipos de notificación ─────────────────────────────────────────────────────
type NotifType =
  | 'nuevo_usuario'
  | 'nueva_solicitud'
  | 'valoracion'
  | 'comentario'
  | 'favorito'
  | 'generica';

function getNotifType(title: string, message: string): NotifType {
  const t = (title + ' ' + message).toLowerCase();
  if (t.includes('usuario registrado') || t.includes('se registró'))            return 'nuevo_usuario';
  if (t.includes('solicitud de publicación') || t.includes('solicitud para'))   return 'nueva_solicitud';
  if (t.includes('valoración') || t.includes('calificó') || t.includes('estrella')) return 'valoracion';
  if (t.includes('comentó') || t.includes('comentario'))                        return 'comentario';
  if (t.includes('favorito') || t.includes('guardó'))                           return 'favorito';
  return 'generica';
}

interface NotifConfig {
  icon: React.ReactNode;
  bg: string;
  border: string;
  dot: string;
  label: string;
  priority: 'importante' | 'negocio' | 'info';
}

function getConfig(type: NotifType): NotifConfig {
  switch (type) {
    case 'nuevo_usuario':
      return {
        icon: <UserPlus size={15} className="text-[#0b7a4b]" />,
        bg: 'bg-[#0b7a4b]/8', border: 'border-[#0b7a4b]/15', dot: 'bg-[#0b7a4b]',
        label: 'Nuevo usuario', priority: 'importante',
      };
    case 'nueva_solicitud':
      return {
        icon: <ClipboardList size={15} className="text-blue-600" />,
        bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500',
        label: 'Solicitud', priority: 'importante',
      };
    case 'valoracion':
      return {
        icon: <Star size={15} className="text-amber-500" />,
        bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500',
        label: 'Valoración', priority: 'negocio',
      };
    case 'comentario':
      return {
        icon: <MessageSquare size={15} className="text-purple-600" />,
        bg: 'bg-purple-50', border: 'border-purple-100', dot: 'bg-purple-500',
        label: 'Comentario', priority: 'negocio',
      };
    case 'favorito':
      return {
        icon: <Heart size={15} className="text-pink-500" />,
        bg: 'bg-pink-50', border: 'border-pink-100', dot: 'bg-pink-500',
        label: 'Favorito', priority: 'info',
      };
    default:
      return {
        icon: <Bell size={15} className="text-gray-500" />,
        bg: 'bg-gray-50', border: 'border-gray-100', dot: 'bg-gray-400',
        label: 'General', priority: 'info',
      };
  }
}

const PRIORITY_CONFIG = {
  importante: { label: 'Crítica',  color: 'text-red-500',     bg: 'bg-red-50',   border: 'border-red-100' },
  negocio: { label: 'Negocio',  color: 'text-amber-600',   bg: 'bg-amber-50', border: 'border-amber-100' },
  info:    { label: 'Info',     color: 'text-gray-500',    bg: 'bg-gray-50',  border: 'border-gray-100' },
};

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

// ── AVATAR con inicial coloreada ──────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-violet-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500',
  'bg-amber-500',  'bg-lime-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500',   'bg-sky-500',  'bg-blue-500', 'bg-indigo-500',
  'bg-fuchsia-500','bg-purple-500','bg-red-500',  'bg-green-500',
];

function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function parseNameFromMessage(message: string): string | null {
  // "Carmen (carmencita@gmail.com) se registró..."  → "Carmen"
  const match = message.match(/^([^\s(]+)/);
  return match ? match[1] : null;
}

function parseNameFromSolicitudMessage(message: string): string | null {
  // "Juan Pérez solicitó publicar..." → "Juan Pérez"
  const match = message.match(/^(.+?)\s+solicitó/);
  return match ? match[1] : null;
}

// ── ITEM ─────────────────────────────────────────────────────────────────────
function NotifItem({ n, onRead }: { n: Notification; onRead: (id: number) => void }) {
  const type = getNotifType(n.title, n.message);
  const cfg  = getConfig(type);
  const prio = PRIORITY_CONFIG[cfg.priority];

  // Extraer nombre según tipo
  const personName =
    type === 'nuevo_usuario'  ? parseNameFromMessage(n.message) :
    type === 'nueva_solicitud' ? parseNameFromSolicitudMessage(n.message) :
    null;

  const showAvatar = !!personName;
  const avatarColor = personName ? getAvatarColor(personName) : '';
  const avatarInitial = personName ? personName.charAt(0).toUpperCase() : '';

  return (
    <div className={`group flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 ${
      n.read ? 'bg-white border-gray-100' : 'bg-white border-[#0b7a4b]/20 shadow-sm'
    }`}>

      {/* Ícono o Avatar */}
      {showAvatar ? (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${avatarColor}`}>
          <span className="text-sm font-bold text-white uppercase">{avatarInitial}</span>
        </div>
      ) : (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
          {cfg.icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>
              {n.title}
            </p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} text-gray-500`}>
              {cfg.label}
            </span>
            {!n.read && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${prio.bg} ${prio.border} ${prio.color}`}>
                {prio.label}
              </span>
            )}
          </div>
          {!n.read && <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dot}`} />}
        </div>

        {/* Nombre destacado para usuario/solicitud */}
        {personName && (
          <p className="text-xs font-bold text-gray-800 mt-1">{personName}</p>
        )}

        <p className={`text-xs mt-0.5 leading-relaxed ${n.read ? 'text-gray-500' : 'text-gray-600'}`}>
          {n.message}
        </p>
 
        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <Clock size={10} /> {timeAgo(n.createdAt)}
          </span>
          <div className="flex items-center gap-3">
            {n.relatedUserId && (
  <Link
    href={`/dashboardAdmin/usuarios/${n.relatedUserId}`}
    onClick={() => {
      if (!n.read) {
        onRead(n.id);
        window.dispatchEvent(new Event('notif-updated')); // 👈
      }
    }}
    className="flex items-center gap-1 text-[11px] font-semibold text-[#0b7a4b] hover:text-[#0f8c58] transition-colors"
  >
    <Eye size={11} /> Ver usuario
  </Link>
)}
            {n.propertyId && (
  <Link
    href={`/properties/${n.propertyId}`}
    onClick={() => {
      if (!n.read) {
        onRead(n.id);
        window.dispatchEvent(new Event('notif-updated')); // 👈
      }
    }}
    className="flex items-center gap-1 text-[11px] font-semibold text-[#0b7a4b] hover:text-[#0f8c58] transition-colors"
  >
    <Eye size={11} /> Ver propiedad
  </Link>
)}
            {!n.read && (
  <button
    onClick={() => {
      onRead(n.id);
      window.dispatchEvent(new Event('notif-updated')); // 👈
    }}
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
  favoritos:    'bg-pink-500 text-white',
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
  const importantelUnread = notifications.filter(n => {
    if (n.read) return false;
    const type = getNotifType(n.title, n.message);
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
          const aPrio = getConfig(getNotifType(a.title, a.message)).priority;
          const bPrio = getConfig(getNotifType(b.title, b.message)).priority;
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
    if (filter === 'usuarios')     return getNotifType(n.title, n.message) === 'nuevo_usuario';
    if (filter === 'solicitudes')  return getNotifType(n.title, n.message) === 'nueva_solicitud';
    if (filter === 'comentarios')  return getNotifType(n.title, n.message) === 'comentario';
    if (filter === 'valoraciones') return getNotifType(n.title, n.message) === 'valoracion';
    if (filter === 'favoritos')    return getNotifType(n.title, n.message) === 'favorito';
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
    return notifications.filter(n => getNotifType(n.title, n.message) === card.type).length;
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Back */}
      <Link
        href="/dashboardAdmin"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#0b7a4b] hover:text-[#0f8c58] group transition-colors w-fit"
      >
        <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
          <ArrowLeft size={14} />
        </span>
      </Link>

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

      {/* Filtros tabs */}
      <div className="flex gap-1.5 bg-white border border-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {FILTER_TABS.map(({ key, label, icon }) => {
          const isActive = filter === key;
          const count = key === 'sin_leer' ? unreadCount
            : key === 'usuarios'     ? notifications.filter(n => getNotifType(n.title, n.message) === 'nuevo_usuario').length
            : key === 'solicitudes'  ? notifications.filter(n => getNotifType(n.title, n.message) === 'nueva_solicitud').length
            : key === 'comentarios'  ? notifications.filter(n => getNotifType(n.title, n.message) === 'comentario').length
            : key === 'valoraciones' ? notifications.filter(n => getNotifType(n.title, n.message) === 'valoracion').length
            : key === 'favoritos'    ? notifications.filter(n => getNotifType(n.title, n.message) === 'favorito').length
            : null;

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
              {count !== null && count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse flex gap-4">
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
        <div className="bg-white rounded-2xl p-12 border border-gray-100 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0b7a4b]/8 flex items-center justify-center">
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

    </div>
  );
}