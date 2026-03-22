'use client';

import { useState, useEffect } from 'react';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import {
  BellOff, Check, CheckCheck, Home, TrendingDown,
  TrendingUp, Clock, ChevronDown, ChevronUp,
  ArrowLeft, Eye, UserPlus, ClipboardList,
  MessageSquare, Star, AlertTriangle, Bell,
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  propertyId?: number;
  createdAt: string;
}

const INITIAL_VISIBLE = 10;

// ── Tipos de notificación del admin ──────────────────────────────────────────
type NotifType =
  | 'nuevo_usuario'
  | 'nueva_solicitud'
  | 'reporte'
  | 'valoracion'
  | 'comentario'
  | 'alto_interes'
  | 'sin_actividad'
  | 'precio'
  | 'generica';

function getNotifType(title: string, message: string): NotifType {
  const t = (title + ' ' + message).toLowerCase();
  if (t.includes('usuario registrado') || t.includes('se registró'))   return 'nuevo_usuario';
  if (t.includes('solicitud de publicación') || t.includes('solicitud para')) return 'nueva_solicitud';
  if (t.includes('report') || t.includes('inapropiado'))               return 'reporte';
  if (t.includes('valoración') || t.includes('calificó') || t.includes('estrella')) return 'valoracion';
  if (t.includes('comentó') || t.includes('comentario'))               return 'comentario';
  if (t.includes('alto interés') || t.includes('muchos'))              return 'alto_interes';
  if (t.includes('sin actividad') || t.includes('días sin'))           return 'sin_actividad';
  if (t.includes('precio') || t.includes('bajó'))                      return 'precio';
  return 'generica';
}

interface NotifConfig {
  icon: React.ReactNode;
  bg: string;
  border: string;
  dot: string;
  label: string;
  priority: 'critica' | 'negocio' | 'info';
}

function getConfig(type: NotifType): NotifConfig {
  switch (type) {
    case 'nuevo_usuario':
      return {
        icon: <UserPlus size={15} className="text-[#0b7a4b]" />,
        bg: 'bg-[#0b7a4b]/8', border: 'border-[#0b7a4b]/15', dot: 'bg-[#0b7a4b]',
        label: 'Nuevo usuario', priority: 'critica',
      };
    case 'nueva_solicitud':
      return {
        icon: <ClipboardList size={15} className="text-blue-600" />,
        bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500',
        label: 'Solicitud', priority: 'critica',
      };
    case 'reporte':
      return {
        icon: <AlertTriangle size={15} className="text-red-500" />,
        bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500',
        label: 'Reporte', priority: 'critica',
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
    case 'alto_interes':
      return {
        icon: <TrendingUp size={15} className="text-[#0b7a4b]" />,
        bg: 'bg-[#0b7a4b]/8', border: 'border-[#0b7a4b]/15', dot: 'bg-[#0b7a4b]',
        label: 'Alto interés', priority: 'negocio',
      };
    case 'sin_actividad':
      return {
        icon: <TrendingDown size={15} className="text-orange-500" />,
        bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-500',
        label: 'Sin actividad', priority: 'negocio',
      };
    case 'precio':
      return {
        icon: <TrendingDown size={15} className="text-amber-600" />,
        bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500',
        label: 'Precio', priority: 'info',
      };
    default:
      return {
        icon: <Bell size={15} className="text-gray-400" />,
        bg: 'bg-gray-50', border: 'border-gray-100', dot: 'bg-gray-400',
        label: 'General', priority: 'info',
      };
  }
}

const PRIORITY_CONFIG = {
  critica: { label: 'Críticas', color: 'text-red-500',     bg: 'bg-red-50',    border: 'border-red-100' },
  negocio: { label: 'Negocio',  color: 'text-amber-600',   bg: 'bg-amber-50',  border: 'border-amber-100' },
  info:    { label: 'Info',     color: 'text-gray-500',    bg: 'bg-gray-50',   border: 'border-gray-100' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Ahora mismo';
  if (mins < 60)  return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days < 7)   return `Hace ${days} días`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── ITEM ─────────────────────────────────────────────────────────────────────
function NotifItem({ n, onRead }: { n: Notification; onRead: (id: number) => void }) {
  const type = getNotifType(n.title, n.message);
  const cfg  = getConfig(type);
  const prio = PRIORITY_CONFIG[cfg.priority];

  return (
    <div className={`group flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 ${
      n.read ? 'bg-white border-gray-100' : 'bg-white border-[#0b7a4b]/20 shadow-sm'
    }`}>

      {/* Ícono */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
        {cfg.icon}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>
              {n.title}
            </p>
            {/* Badge tipo */}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} text-gray-500`}>
              {cfg.label}
            </span>
            {/* Badge prioridad — solo si no leída */}
            {!n.read && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${prio.bg} ${prio.border} ${prio.color}`}>
                {prio.label}
              </span>
            )}
          </div>
          {!n.read && (
            <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dot}`} />
          )}
        </div>

        <p className={`text-xs mt-1 leading-relaxed ${n.read ? 'text-gray-400' : 'text-gray-600'}`}>
          {n.message}
        </p>

        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock size={10} /> {timeAgo(n.createdAt)}
          </span>
          <div className="flex items-center gap-3">
            {n.propertyId && (
              <Link
                href={`/dashboardAdmin/propiedades/${n.propertyId}`}
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

// ── PAGE PRINCIPAL ────────────────────────────────────────────────────────────
type FilterTab = 'todas' | 'sin leer' | 'críticas' | 'negocio';

export default function AdminNotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]       = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [filter, setFilter]         = useState<FilterTab>('todas');

  const unreadCount = notifications.filter(n => !n.read).length;

  // Notificaciones críticas sin leer — para el badge de urgencia
  const criticalUnread = notifications.filter(n => {
    if (n.read) return false;
    const type = getNotifType(n.title, n.message);
    return getConfig(type).priority === 'critica';
  }).length;

  const filtered = notifications.filter(n => {
    if (filter === 'sin leer')  return !n.read;
    if (filter === 'críticas') {
      const type = getNotifType(n.title, n.message);
      return getConfig(type).priority === 'critica';
    }
    if (filter === 'negocio') {
      const type = getNotifType(n.title, n.message);
      return getConfig(type).priority === 'negocio';
    }
    return true;
  });

  const visible    = filtered.slice(0, visibleCount);
  const hasMore    = visibleCount < filtered.length;
  const isExpanded = visibleCount > INITIAL_VISIBLE;

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/notifications');
        const sorted = [...data].sort((a: Notification, b: Notification) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          // Dentro de no leídas, críticas primero
          const aType = getNotifType(a.title, a.message);
          const bType = getNotifType(b.title, b.message);
          const aPrio = getConfig(aType).priority;
          const bPrio = getConfig(bType).priority;
          const prioOrder = { critica: 0, negocio: 1, info: 2 };
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
    fetch();
  }, []);

  useEffect(() => { setVisibleCount(INITIAL_VISIBLE); }, [filter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
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
      toast.success('Todas marcadas como leídas');
    } catch {
      toast.error('No se pudo actualizar');
    } finally {
      setMarkingAll(false);
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'todas',     label: 'Todas' },
    { key: 'sin leer',  label: 'Sin leer' },
    { key: 'críticas',  label: '🔥 Críticas' },
    { key: 'negocio',   label: '⚡ Negocio' },
  ];

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
            {criticalUnread > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                <AlertTriangle size={11} />
                {criticalUnread} crítica{criticalUnread > 1 ? 's' : ''}
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

      {/* Resumen rápido */}
      {!loading && notifications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Total',     value: notifications.length,                                                      color: 'text-gray-600',  bg: 'bg-white',         border: 'border-gray-100',     icon: Bell },
            { label: 'Sin leer',  value: unreadCount,                                                               color: 'text-[#0b7a4b]', bg: 'bg-[#0b7a4b]/8',  border: 'border-[#0b7a4b]/15', icon: BellOff },
            { label: 'Críticas',  value: notifications.filter(n => getConfig(getNotifType(n.title, n.message)).priority === 'critica').length,  color: 'text-red-500',   bg: 'bg-red-50',        border: 'border-red-100',      icon: AlertTriangle },
            { label: 'Negocio',   value: notifications.filter(n => getConfig(getNotifType(n.title, n.message)).priority === 'negocio').length,  color: 'text-amber-600', bg: 'bg-amber-50',      border: 'border-amber-100',    icon: TrendingUp },
          ].map(({ label, value, color, bg, border, icon: Icon }) => (
            <div key={label} className={`${bg} rounded-xl px-4 py-3 border ${border} flex items-center gap-3`}>
              <Icon size={15} className={color} />
              <div>
                <p className={`text-lg font-semibold ${color}`}>{value}</p>
                <p className="text-[11px] text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros tabs */}
      <div className="flex gap-1.5 bg-white border border-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              filter === key
                ? 'bg-[#0b7a4b] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {key === 'sin leer' && unreadCount > 0 && (
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === key ? 'bg-white/20 text-white' : 'bg-[#0b7a4b]/10 text-[#0b7a4b]'
              }`}>
                {unreadCount}
              </span>
            )}
            {key === 'críticas' && criticalUnread > 0 && (
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === key ? 'bg-white/20 text-white' : 'bg-red-100 text-red-500'
              }`}>
                {criticalUnread}
              </span>
            )}
          </button>
        ))}
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
              {filter === 'sin leer'  ? 'No hay notificaciones sin leer' :
               filter === 'críticas'  ? 'No hay notificaciones críticas' :
               filter === 'negocio'   ? 'No hay notificaciones de negocio' :
               'No hay notificaciones todavía'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
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