'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import {
  BellOff, Check, CheckCheck, Home, TrendingDown,
  Star, ClipboardList, Clock, ChevronDown, ChevronUp,
  ArrowLeft, Eye
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  propertyId?: number; // Nuevo campo vinculado a la BD
  createdAt: string;
}

const INITIAL_VISIBLE = 5;

function getConfig(title: string): { icon: React.ReactNode; bg: string; dot: string } {
  const t = title.toLowerCase();
  if (t.includes('precio') || t.includes('bajó'))
    return {
      icon: <TrendingDown size={17} className="text-amber-600" />,
      bg: 'bg-amber-100',
      dot: 'bg-amber-500',
    };
  if (t.includes('coincidencia') || t.includes('interesa'))
    return {
      icon: <Star size={17} className="text-purple-600" />,
      bg: 'bg-purple-100',
      dot: 'bg-purple-500',
    };
  if (t.includes('solicitud'))
    return {
      icon: <ClipboardList size={17} className="text-blue-600" />,
      bg: 'bg-blue-100',
      dot: 'bg-blue-500',
    };
  return {
    icon: <Home size={17} className="text-[#0b7a4b]" />,
    bg: 'bg-[#0b7a4b]/15',
    dot: 'bg-[#0b7a4b]',
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days < 7) return `Hace ${days} días`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NotificacionesPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const unreadCount = notifications.filter(n => !n.read).length;
  const visible = notifications.slice(0, visibleCount);
  const hasMore = visibleCount < notifications.length;
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

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
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
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="inline-flex bg-white rounded-2xl p-2 border border-gray-300 px-2 w-fit items-center gap-2 text-sm font-semibold text-[#0b7a4b] hover:text-[#0f8c58] group transition-colors">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform mt-0.5" />
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Notificaciones</h1>
          <p className={`text-sm font-semibold mt-0.5 ${unreadCount > 0 ? 'text-[#0b7a4b]' : 'text-gray-500'}`}>
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día ✓'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
            <CheckCheck size={15} />
            {markingAll ? 'Marcando...' : 'Marcar todas'}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-gray-200 animate-pulse flex gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <div className="h-4 bg-gray-200 rounded-full w-2/3" />
                <div className="h-3 bg-gray-200 rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="bg-white rounded-3xl p-12 border border-gray-200 shadow-sm flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center">
            <BellOff size={28} className="text-[#0b7a4b]" />
          </div>
          <div>
            <p className="font-bold text-gray-800">Sin notificaciones</p>
            <p className="text-sm text-gray-600 mt-1">
              Te avisaremos cuando haya novedades sobre propiedades o tus solicitudes
            </p>
          </div>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="flex flex-col gap-5">
          {visible.map(n => {
            const cfg = getConfig(n.title);
            return (
              <div key={n.id}
                className={`group flex items-start gap-4 p-4 rounded-3xl border transition-all ${
                  n.read
                    ? 'bg-[#0b7a4b]/5 border-gray-200'
                    : 'bg-white border-[#0b7a4b]/10 shadow-sm'
                }`}>

                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  {cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${cfg.dot}`} />
                    )}
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${n.read ? 'text-gray-500' : 'text-gray-700'}`}>
                    {n.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                      <Clock size={11} className="text-gray-600" />{timeAgo(n.createdAt)}
                    </span>

                    <div className="flex items-center gap-4">
                      {/* NUEVO: Botón Ver Propiedad */}
                      {n.propertyId && (
                        <Link 
                          href={`/properties/${n.propertyId}`}
                          onClick={() => !n.read && handleMarkAsRead(n.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#0b7a4b] hover:text-[#0f8c58] transition-colors"
                        >
                          <Eye size={12} /> Ver propiedad
                        </Link>
                      )}

                      {!n.read && (
                        <button onClick={() => handleMarkAsRead(n.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#0b7a4b] opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                          <Check size={11} /> Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {(hasMore || isExpanded) && (
            <div className="flex gap-2 mt-1">
              {hasMore && (
                <button
                  onClick={() => setVisibleCount(v => v + INITIAL_VISIBLE)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-[#0b7a4b] bg-[#0b7a4b]/8 hover:bg-[#0b7a4b]/15 rounded-2xl transition-colors">
                  <ChevronDown size={16} />
                  Ver más notificaciones ({notifications.length - visibleCount} restantes)
                </button>
              )}
              {isExpanded && (
                <button
                  onClick={() => setVisibleCount(INITIAL_VISIBLE)}
                  className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
                  <ChevronUp size={16} />
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