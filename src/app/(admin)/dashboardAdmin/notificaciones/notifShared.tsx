'use client';

import Link from 'next/link';
import {
  Check, Clock, Eye, UserPlus, ClipboardList,
  MessageSquare, Star, Bell, Heart,
} from 'lucide-react';
import { NotificationType } from '@/modules/shared/types/api';

/**
 * Piezas compartidas de las notificaciones del admin.
 *
 * Viven acá porque las usan seis pantallas: la vista general ("Todas") y las
 * cinco páginas por categoría (usuarios, solicitudes, comentarios,
 * valoraciones y favoritos). Antes estaban embebidas en la página general.
 */

export interface AdminNotification {
  id: number;
  title: string;
  relatedUserId?: number;
  message: string;
  read: boolean;
  propertyId?: number;
  /** Campo real del backend. Ver `NotificationType` en shared/types/api. */
  type?: NotificationType;
  createdAt: string;
}

/**
 * Categoría de la UI del panel. NO es el enum del backend: el panel agrupa en
 * cinco secciones (que son las cinco páginas del sidebar) y el backend tiene
 * seis tipos de admin — `admin_nuevo_comentario` y
 * `admin_comentario_publicacion` caen los dos en "comentario".
 */
export type NotifType =
  | 'nuevo_usuario'
  | 'nueva_solicitud'
  | 'valoracion'
  | 'comentario'
  | 'favorito'
  | 'generica';

/** Mapeo directo backend → categoría de la UI. Sin adivinar nada. */
const TYPE_TO_CATEGORY: Partial<Record<NotificationType, NotifType>> = {
  [NotificationType.ADMIN_NUEVO_USUARIO]: 'nuevo_usuario',
  [NotificationType.ADMIN_NUEVA_SOLICITUD]: 'nueva_solicitud',
  [NotificationType.ADMIN_NUEVA_VALORACION]: 'valoracion',
  [NotificationType.ADMIN_NUEVO_COMENTARIO]: 'comentario',
  [NotificationType.ADMIN_COMENTARIO_PUBLICACION]: 'comentario',
  [NotificationType.ADMIN_NUEVO_FAVORITO]: 'favorito',
};

/**
 * Heurística por texto — **sólo para filas anteriores a la migración**.
 *
 * El backend agregó `type` con default `generica`, así que las notificaciones
 * viejas que el backfill no haya podido clasificar llegan sin categoría real.
 * Sin este fallback, todo el historial previo aparecería como "General" y los
 * contadores del sidebar arrancarían en cero.
 *
 * ⚠️ TRANSITORIO: una vez confirmado que el backfill clasificó el histórico,
 * borrar esta función y dejar sólo `TYPE_TO_CATEGORY`. Es exactamente el
 * mecanismo frágil que `type` vino a reemplazar — vive acá acotado a un caso.
 */
function inferCategoryFromText(title: string, message: string): NotifType {
  const t = (title + ' ' + message).toLowerCase();
  if (t.includes('usuario registrado') || t.includes('se registró'))                 return 'nuevo_usuario';
  if (t.includes('solicitud de publicación') || t.includes('solicitud para'))        return 'nueva_solicitud';
  if (t.includes('valoración') || t.includes('calificó') || t.includes('estrella'))  return 'valoracion';
  if (t.includes('comentó') || t.includes('comentario'))                             return 'comentario';
  if (t.includes('favorito') || t.includes('guardó'))                                return 'favorito';
  return 'generica';
}

/**
 * Categoría de una notificación del panel.
 *
 * Prioridad: el campo `type` del backend; si no vino o es `generica` (fila
 * vieja), se cae a la heurística de texto.
 */
export function getNotifType(n: Pick<AdminNotification, 'type' | 'title' | 'message'>): NotifType {
  const mapped = n.type ? TYPE_TO_CATEGORY[n.type] : undefined;
  if (mapped) return mapped;
  return inferCategoryFromText(n.title, n.message);
}

export interface NotifConfig {
  icon: React.ReactNode;
  bg: string;
  border: string;
  dot: string;
  label: string;
  priority: 'importante' | 'negocio' | 'info';
}

export function getConfig(type: NotifType): NotifConfig {
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

export const PRIORITY_CONFIG = {
  importante: { label: 'Crítica', color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-100' },
  negocio:    { label: 'Negocio', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  info:       { label: 'Info',    color: 'text-gray-500',  bg: 'bg-gray-50',  border: 'border-gray-100' },
};

export function timeAgo(dateStr: string): string {
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

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500',
  'bg-amber-500',  'bg-lime-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500',   'bg-sky-500',  'bg-blue-500', 'bg-indigo-500',
  'bg-fuchsia-500','bg-purple-500','bg-red-500',  'bg-green-500',
];

export function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/** "Carmen (carmen@gmail.com) se registró…" → "Carmen" */
function parseNameFromMessage(message: string): string | null {
  const match = message.match(/^([^\s(]+)/);
  return match ? match[1] : null;
}

/** "Juan Pérez solicitó publicar…" → "Juan Pérez" */
function parseNameFromSolicitudMessage(message: string): string | null {
  const match = message.match(/^(.+?)\s+solicitó/);
  return match ? match[1] : null;
}

// ── ITEM ─────────────────────────────────────────────────────────────────────
export function NotifItem({
  n, onRead,
}: {
  n: AdminNotification;
  onRead: (id: number) => void;
}) {
  const type = getNotifType(n);
  const cfg  = getConfig(type);
  const prio = PRIORITY_CONFIG[cfg.priority];

  const personName =
    type === 'nuevo_usuario'   ? parseNameFromMessage(n.message) :
    type === 'nueva_solicitud' ? parseNameFromSolicitudMessage(n.message) :
    null;

  const avatarColor   = personName ? getAvatarColor(personName) : '';
  const avatarInitial = personName ? personName.charAt(0).toUpperCase() : '';

  return (
    <div className={`group flex items-start gap-4 rounded-xl border px-5 py-4 transition-all duration-200 ${
      n.read ? 'border-gray-100 bg-white' : 'border-[#0b7a4b]/20 bg-white shadow-sm'
    }`}>
      {personName ? (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${avatarColor}`}>
          <span className="text-sm font-bold text-white uppercase">{avatarInitial}</span>
        </div>
      ) : (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cfg.bg} ${cfg.border}`}>
          {cfg.icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-semibold ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold text-gray-500 ${cfg.bg} ${cfg.border}`}>
              {cfg.label}
            </span>
            {!n.read && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${prio.bg} ${prio.border} ${prio.color}`}>
                {prio.label}
              </span>
            )}
          </div>
          {!n.read && <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />}
        </div>

        {personName && <p className="mt-1 text-xs font-bold text-gray-800">{personName}</p>}

        <p className={`mt-0.5 text-xs leading-relaxed ${n.read ? 'text-gray-500' : 'text-gray-600'}`}>
          {n.message}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <Clock size={10} /> {timeAgo(n.createdAt)}
          </span>
          <div className="flex items-center gap-3">
            {n.relatedUserId && (
              <Link
                href={`/dashboardAdmin/usuarios/${n.relatedUserId}`}
                onClick={() => { if (!n.read) { onRead(n.id); window.dispatchEvent(new Event('notif-updated')); } }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0b7a4b] transition-colors hover:text-[#0f8c58]"
              >
                <Eye size={11} /> Ver usuario
              </Link>
            )}
            {n.propertyId && (
              <Link
                href={`/properties/${n.propertyId}`}
                onClick={() => { if (!n.read) { onRead(n.id); window.dispatchEvent(new Event('notif-updated')); } }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0b7a4b] transition-colors hover:text-[#0f8c58]"
              >
                <Eye size={11} /> Ver propiedad
              </Link>
            )}
            {!n.read && (
              <button
                onClick={() => { onRead(n.id); window.dispatchEvent(new Event('notif-updated')); }}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:text-[#0b7a4b]"
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
