'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import {
  BellOff, Check, CheckCheck, Home, TrendingDown,
  ClipboardList, Clock, ChevronDown, ChevronUp,
  ArrowLeft, Eye, Sparkles, Bell,
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

const INITIAL_VISIBLE = 8;

// ── Detecta el tipo de notificación por el título/mensaje ──────────────────
function getConfig(title: string, message: string): {
  icon: React.ReactNode;
  bg: string;
  border: string;
  dot: string;
  label: string;
} {
  const t = (title + ' ' + message).toLowerCase();

  if (t.includes('precio') || t.includes('bajó') || t.includes('bajo'))
    return {
      icon: <TrendingDown size={16} className="text-amber-600" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      dot: 'bg-amber-500',
      label: 'Precio',
    };

  if (t.includes('interesa') || t.includes('coincid') || t.includes('cumple') || t.includes('preferencia'))
    return {
      icon: <Sparkles size={16} className="text-purple-600" />,
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      dot: 'bg-purple-500',
      label: 'Coincidencia',
    };

  if (t.includes('solicitud') || t.includes('revisión') || t.includes('aceptad') || t.includes('rechazad'))
    return {
      icon: <ClipboardList size={16} className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      dot: 'bg-blue-500',
      label: 'Solicitud',
    };

  if (t.includes('nueva propiedad') || t.includes('publicad'))
    return {
      icon: <Home size={16} className="text-[#0b7a4b]" />,
      bg: 'bg-[#0b7a4b]/8',
      border: 'border-[#0b7a4b]/15',
      dot: 'bg-[#0b7a4b]',
      label: 'Propiedad',
    };

  return {
    icon: <Bell size={16} className="text-gray-500" />,
    bg: 'bg-gray-50',
    border: 'border-gray-100',
    dot: 'bg-gray-400',
    label: 'Notificación',
  };
}

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

// ── ITEM DE NOTIFICACIÓN ──────────────────────────────────────────────────────
function NotifItem({ n, onRead }: { n: Notification; onRead: (id: number) => void }) {
  const cfg = getConfig(n.title, n.message);

  return (
    <div className={`group flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 ${
      n.read
        ? 'bg-white border-gray-100'
        : `bg-white border-[#0b7a4b]/20 shadow-sm`
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
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${
              n.read ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {cfg.label}
            </span>
          </div>
          {/* Dot no leído */}
          {!n.read && (
            <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dot}`} />
          )}
        </div>

        <p className={`text-xs mt-1 leading-relaxed ${n.read ? 'text-gray-400' : 'text-gray-600'}`}>
          {n.message}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock size={10} />
            {timeAgo(n.createdAt)}
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

// ── PAGE PRINCIPAL ────────────────────────────────────────────────────────────
export default function NotificacionesPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]     = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [filter, setFilter] = useState<'todas' | 'sin leer' | 'leídas'>('todas');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (filter === 'sin leer') return !n.read;
    if (filter === 'leídas')   return n.read;
    return true;
  });

  const visible  = filtered.slice(0, visibleCount);
  const hasMore  = visibleCount < filtered.length;
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

  // Resetear visible al cambiar filtro
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

  return (
    <div className="flex flex-col gap-5">

      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#0b7a4b] hover:text-[#0f8c58] group transition-colors w-fit"
      >
        <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
          <ArrowLeft size={14} />
        </span>
      </Link>

      {/* Header */}
      <div className="mt-1 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Notificaciones</h1>
          <p className={`text-sm mt-0.5 ${unreadCount > 0 ? 'text-gray-600' : 'text-gray-600'}`}>
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

      {/* Filtros de tab */}
      <div className="flex gap-2 bg-white border border-gray-100 p-1 rounded-xl w-fit">
        {(['todas', 'sin leer', 'leídas'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
              filter === f
                ? 'bg-[#0b7a4b] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f}
            {f === 'sin leer' && unreadCount > 0 && (
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === f ? 'bg-white/20 text-white' : 'bg-[#0b7a4b]/10 text-[#0b7a4b]'
              }`}>
                {unreadCount}
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

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0b7a4b]/8 flex items-center justify-center">
            <BellOff size={24} className="text-[#0b7a4b]" />
          </div>
          <div>
            <p className="font-medium text-gray-700 text-sm">
              {filter === 'sin leer' ? 'No tenés notificaciones sin leer' :
               filter === 'leídas'   ? 'No tenés notificaciones leídas' :
               'No tenés notificaciones todavía'}
            </p>
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

          {/* Ver más / contraer */}
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