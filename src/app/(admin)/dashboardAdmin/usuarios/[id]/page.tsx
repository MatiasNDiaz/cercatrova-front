'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { RequestStatus, VALID_REQUEST_TRANSITIONS } from '@/modules/shared/types/api';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  ArrowLeft, User, Mail, Phone, Calendar,
  FileText, CheckCircle, XCircle, Clock,
  RefreshCw, ChevronDown, ChevronUp, Trash2,
  MessageSquare, MapPin, Home, SlidersHorizontal,
  Bed, Bath, Ruler, DollarSign, Hourglass,
  FileCheck, Car, Trees, Bell,
} from 'lucide-react';

// ── TIPOS ─────────────────────────────────────────────────────────────────────
interface UserDetail {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  photo: string | null;
  role: string;
  profileIncomplete: boolean;
  createdAt: string;
}

interface SearchPreference {
  zone?: string;
  localidad?: string;
  barrio?: string;
  operationType?: string;
  typeOfProperty?: { id: number; name: string } | null;
  preferredPrice?: number;
  minRooms?: number;
  minBathrooms?: number;
  m2?: number;
  maxAntiquity?: number;
  property_deed?: boolean;
  garage?: boolean;
  patio?: boolean;
  notifyNewMatches?: boolean;
  notifyPriceDrops?: boolean;
}

interface PropertyRequest {
  id: number;
  localidad: string;
  barrio: string;
  direccion: string;
  pisoDepto?: string;
  tipoPropiedad: string;
  tipoOperacion: string;
  estadoConservacion: string;
  m2Totales: number;
  m2Cubiertos: number;
  habitaciones: number;
  baños: number;
  patio: boolean;
  garage: boolean;
  antiguedad: number;
  orientacion: string;
  escritura: boolean;
  impuestosAlDia: boolean;
  aptoCredito: boolean;
  precioEstimado: string;
  mensajeAgente: string;
  status: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  enviado:     { label: 'Enviado',     color: 'text-blue-600',   bg: 'bg-blue-100',      border: 'border-blue-100',      icon: Clock },
  en_revision: { label: 'En revisión', color: 'text-amber-600',  bg: 'bg-amber-100',     border: 'border-amber-100',     icon: RefreshCw },
  aceptado:    { label: 'Aceptado',    color: 'text-[#0b7a4b]',  bg: 'bg-[#0b7a4b]/13', border: 'border-[#0b7a4b]/15',  icon: CheckCircle },
  rechazado:   { label: 'Rechazado',   color: 'text-red-500',    bg: 'bg-red-100',       border: 'border-red-100',       icon: XCircle },
};

// El backend rechaza con 409 las transiciones ilegales — solo ofrecemos las válidas
// desde el estado actual (aceptado es terminal; rechazado solo puede volver a revisión).
const canTransition = (from: string, to: RequestStatus) =>
  (VALID_REQUEST_TRANSITIONS[from as RequestStatus] ?? []).includes(to);

const WhatsappIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function BoolBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${
      value ? 'bg-[#0b7a4b]/8 text-[#0b7a4b] border-[#0b7a4b]/15' : 'bg-gray-50 text-gray-400 border-gray-100'
    }`}>
      {value ? '✓' : '✗'} {label}
    </span>
  );
}

function DataField({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium text-gray-700 ${truncate ? 'truncate' : ''}`}>{value}</p>
    </div>
  );
}

// ── BLOQUE DE PREFERENCIAS ────────────────────────────────────────────────────
function PreferencesBlock({ prefs, userName }: { prefs: SearchPreference | null; userName: string }) {

  const activeBadges = prefs ? [
    prefs.property_deed && { label: 'escritura', icon: FileCheck },
    prefs.garage        && { label: 'garage',    icon: Car },
    prefs.patio         && { label: 'patio',     icon: Trees },
  ].filter(Boolean) as { label: string; icon: React.ElementType }[] : [];

  const hasAnyData = prefs && (
    prefs.localidad || prefs.barrio || prefs.zone || prefs.operationType ||
    prefs.typeOfProperty || prefs.preferredPrice || prefs.minRooms ||
    prefs.minBathrooms || prefs.m2 || prefs.maxAntiquity ||
    prefs.property_deed || prefs.garage || prefs.patio
  );

  const buildStory = (): React.ReactNode[] => {
    if (!prefs) return [];
    const parts: React.ReactNode[] = [];
    const hi = (text: string, key: string) => (
      <span key={key} className="text-[#0b7a4b] font-semibold">{text}</span>
    );

    const opLabel =
      prefs.operationType === 'venta' ? 'comprar' :
      prefs.operationType === 'alquiler' ? 'alquilar' :
      prefs.operationType === 'alquiler temporal' ? 'alquilar temporalmente' : null;

    const typeName = prefs.typeOfProperty?.name;
    const typeArticle =
      typeName === 'Casa' ? 'una casa' :
      typeName === 'Departamento' ? 'un departamento' :
      typeName ? `una ${typeName.toLowerCase()}` : 'una propiedad';

    if (opLabel) parts.push('Quiere ', hi(opLabel, 'op'), ' ', hi(typeArticle, 'type'));
    else parts.push('Está buscando ', hi(typeArticle, 'type'));

    const locParts = [prefs.localidad, prefs.barrio].filter(Boolean).join(', ');
const zonePart = prefs.zone ? `zona ${prefs.zone}` : '';
const fullLoc  = [locParts, zonePart].filter(Boolean).join(' · ');
if (fullLoc) parts.push(' en ', hi(fullLoc, 'loc'));

    const chars: React.ReactNode[] = [];
    if (prefs.minRooms)     chars.push(hi(`${prefs.minRooms} habitación${prefs.minRooms > 1 ? 'es' : ''}`, 'rooms'));
    if (prefs.minBathrooms) chars.push(hi(`${prefs.minBathrooms} baño${prefs.minBathrooms > 1 ? 's' : ''}`, 'baths'));
    if (prefs.m2)           chars.push(hi(`${prefs.m2} m²`, 'm2'));

    if (chars.length > 0) {
      parts.push(', con al menos ');
      chars.forEach((c, i) => {
        parts.push(c);
        if (i < chars.length - 2) parts.push(', ');
        else if (i === chars.length - 2) parts.push(' y ');
      });
    }

    if (prefs.maxAntiquity)  parts.push(' y no más de ', hi(`${prefs.maxAntiquity} años`, 'ant'), ' de antigüedad');
    if (prefs.preferredPrice) parts.push('. Presupuesto máximo: ', hi(`USD ${Number(prefs.preferredPrice).toLocaleString('es-AR')}`, 'price'));

    if (activeBadges.length > 0) {
      const labels = activeBadges.map(b => b.label);
      const last = labels.pop()!;
      parts.push('. Prefiere que tenga ', hi(labels.length > 0 ? `${labels.join(', ')} y ${last}` : last, 'extras'));
    }
    parts.push('.');
    return parts;
  };

  return (
    <div className="pt-5 border-t  border-[#0b7a4b]/25 ">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={13} className="text-[#0b7a4b]" />
        <p className="text-xs font-semibold text-[#0b7a4b] uppercase tracking-wider">
          Preferencias de búsqueda
        </p>
      </div>

      {!hasAnyData ? (
        <p className="text-xs text-gray-400">{userName} no configuró sus preferencias todavía.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Historia narrativa */}
          <p className="text-sm text-gray-600 leading-relaxed">{buildStory()}</p>

          {/* Mini stats numéricas */}
          {prefs && (prefs.minRooms || prefs.minBathrooms || prefs.m2 || prefs.maxAntiquity || prefs.preferredPrice) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {prefs.minRooms && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Habitaciones</p>
                  <div className="flex items-center gap-1.5">
                    <Bed size={12} className="text-[#0b7a4b]" />
                    <p className="text-xs font-semibold text-gray-700">Mín. {prefs.minRooms}</p>
                  </div>
                </div>
              )}
              {prefs.minBathrooms && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Baños</p>
                  <div className="flex items-center gap-1.5">
                    <Bath size={12} className="text-[#0b7a4b]" />
                    <p className="text-xs font-semibold text-gray-700">Mín. {prefs.minBathrooms}</p>
                  </div>
                </div>
              )}
              {prefs.m2 && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Superficie</p>
                  <div className="flex items-center gap-1.5">
                    <Ruler size={12} className="text-[#0b7a4b]" />
                    <p className="text-xs font-semibold text-gray-700">{prefs.m2} m²</p>
                  </div>
                </div>
              )}
              {prefs.maxAntiquity && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Antigüedad máx.</p>
                  <div className="flex items-center gap-1.5">
                    <Hourglass size={12} className="text-[#0b7a4b]" />
                    <p className="text-xs font-semibold text-gray-700">{prefs.maxAntiquity} años</p>
                  </div>
                </div>
              )}
              {prefs.preferredPrice && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Presupuesto máx.</p>
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={12} className="text-[#0b7a4b]" />
                    <p className="text-xs font-semibold text-gray-700">USD {Number(prefs.preferredPrice).toLocaleString('es-AR')}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Badges extras */}
          {activeBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {activeBadges.map(({ label, icon: Icon }) => (
                <span key={label} className="flex items-center gap-1.5 text-[11px] font-medium text-[#0b7a4b] bg-[#0b7a4b]/8 border border-[#0b7a4b]/15 px-2.5 py-1 rounded-lg capitalize">
                  <Icon size={11} /> {label}
                </span>
              ))}
            </div>
          )}

          {/* Notificaciones */}
          {prefs && (
            <div className="flex items-center gap-2 border-t border-[#0b7a4b]/25 pt-5">
              <Bell size={11} className="text-[#0b7a4b] shrink-0" />
              <p className="text-[11px] text-[#0b7a4b]">
                {prefs.notifyNewMatches && prefs.notifyPriceDrops
                  ? 'Notificaciones activas: nuevas propiedades y bajas de precio'
                  : prefs.notifyNewMatches
                  ? 'Notificaciones activas: nuevas propiedades'
                  : prefs.notifyPriceDrops
                  ? 'Notificaciones activas: bajas de precio'
                  : 'Notificaciones desactivadas'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser]         = useState<UserDetail | null>(null);
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [prefs, setPrefs]       = useState<SearchPreference | null>(null);
  const [loading, setLoading]   = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userRes, reqRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/property-requests/user/${id}`),
        ]);
        setUser(userRes.data);
        setRequests(reqRes.data ?? []);
      } catch {
        toast.error('No se pudo cargar la información del usuario');
      }

      // Preferencias — no bloquea si el endpoint no existe aún
      try {
        const prefsRes = await api.get(`/search-preferences/user/${id}`);
        setPrefs(prefsRes.data ?? null);
      } catch {
        setPrefs(null);
      }

      setLoading(false);
    };
    fetchAll();
  }, [id]);

  const handleStatusChange = async (reqId: number, newStatus: string) => {
    setUpdatingId(reqId);
    try {
      await api.patch(`/property-requests/${reqId}/status`, { status: newStatus });
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
      toast.success(`Estado actualizado a "${STATUS_CONFIG[newStatus]?.label ?? newStatus}"`);
    } catch (error) {
      // ej. 409 "No se puede pasar la solicitud de 'X' a 'Y'"
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteRequest = (reqId: number) => {
    toast.custom((t) => (
      <div className="flex flex-col gap-4 bg-white rounded-2xl px-6 py-5 w-80 shadow-[0_16px_40px_rgba(0,0,0,0.10)] border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">¿Eliminar solicitud?</p>
            <p className="text-xs text-gray-400 mt-0.5">Solicitud #{reqId}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button onClick={async () => {
            toast.dismiss(t);
            setDeletingId(reqId);
            try {
              await api.delete(`/property-requests/${reqId}`);
              setRequests(prev => prev.filter(r => r.id !== reqId));
              toast.success('Solicitud eliminada');
            } catch {
              toast.error('No se pudo eliminar');
            } finally {
              setDeletingId(null);
            }
          }} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all active:scale-95">
            Eliminar
          </button>
          <button onClick={() => toast.dismiss(t)}
            className="flex-1 py-2.5 text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
            Cancelar
          </button>
        </div>
      </div>
    ), { position: 'top-center', duration: 10000, unstyled: true, style: { background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 } });
  };

  const gmailUrl = (email: string, name: string) => {
    const subject = encodeURIComponent(`Cerca Trova — Consulta para ${name}`);
    return `https://mail.google.com/mail/?view=cm&to=${email}&su=${subject}`;
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
        <div className="flex gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 shrink-0" />
          <div className="flex-1 flex flex-col gap-3 justify-center">
            <div className="h-4 bg-gray-100 rounded-full w-1/3" />
            <div className="h-3 bg-gray-100 rounded-full w-1/2" />
            <div className="h-3 bg-gray-100 rounded-full w-1/4" />
          </div>
        </div>
      </div>
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse flex gap-4">
          <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
          <div className="flex-1 flex flex-col gap-2 justify-center">
            <div className="h-3.5 bg-gray-100 rounded-full w-1/3" />
            <div className="h-3 bg-gray-100 rounded-full w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!user) return (
    <div className="bg-white rounded-2xl p-12 border border-gray-100 flex flex-col items-center gap-4 text-center">
      <p className="font-medium text-gray-600 text-sm">Usuario no encontrado</p>
      <button onClick={() => router.back()} className="text-sm font-medium text-[#0b7a4b] hover:underline">Volver</button>
    </div>
  );

  const counts = {
    total:       requests.length,
    enviado:     requests.filter(r => r.status === 'enviado').length,
    en_revision: requests.filter(r => r.status === 'en_revision').length,
    aceptado:    requests.filter(r => r.status === 'aceptado').length,
    rechazado:   requests.filter(r => r.status === 'rechazado').length,
  };

  return (
    <div className="flex flex-col gap-6">

        <button aria-label="Volver" onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#0b7a4b] hover:bg-gray-50 transition-all shrink-0">
          <ArrowLeft size={14} />
        </button>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#0b7a4b]">Detalle del usuario</h1>
          <p className="text-xs text-gray-600 mt-0.5">{user.name} {user.surname} · ID #{user.id}</p>
        </div>
      </div>

      {/* ── PERFIL + PREFERENCIAS en la misma card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-6 flex flex-col gap-5">

        {/* Fila: avatar + datos + acciones */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center shrink-0">
              {user.photo
                ? <Image src={user.photo} alt={user.name} width={64} height={64} className="object-cover w-full h-full" />
                : <User size={22} className="text-gray-300" />
              }
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0b7a4b]">{user.name} {user.surname}</h2>
              <div className="flex flex-wrap gap-4 mt-1.5">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail size={12} className="text-[#0b7a4b]/60" />{user.email}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone size={12} className="text-[#0b7a4b]/60" />{user.phone}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={12} className="text-[#0b7a4b]/60" />
                  Desde {new Date(user.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              {user.profileIncomplete && (
                <span className="inline-block mt-2 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                  Perfil incompleto
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <a href={`https://wa.me/${user.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #25d366, #1ebe5d)' }}>
              <WhatsappIcon size={14} /> WhatsApp
            </a>
            <a href={gmailUrl(user.email, user.name)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0b7a4b] bg-[#0b7a4b]/10 hover:bg-[#0b7a4b]/16 transition-all active:scale-95">
              <Mail size={14} /> Gmail
            </a>
          </div>
        </div>

        {/* Preferencias debajo del perfil, separadas por borde */}
        <PreferencesBlock prefs={prefs} userName={user.name} />
      </div>

      {/* ── RESUMEN SOLICITUDES ── */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-[#0b7a4b] uppercase tracking-wider px-1">
          Resumen de solicitudes de {user.name}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Total',       value: counts.total,       color: 'text-gray-600',  bg: 'bg-white',         border: 'border-gray-100',     icon: FileText },
            { label: 'Enviadas',    value: counts.enviado,     color: 'text-blue-600',  bg: 'bg-blue-50',       border: 'border-blue-100',     icon: Clock },
            { label: 'En revisión', value: counts.en_revision, color: 'text-amber-600', bg: 'bg-amber-50',      border: 'border-amber-100',    icon: RefreshCw },
            { label: 'Aceptadas',   value: counts.aceptado,    color: 'text-[#0b7a4b]', bg: 'bg-[#0b7a4b]/8',  border: 'border-[#0b7a4b]/15', icon: CheckCircle },
            { label: 'Rechazadas',  value: counts.rechazado,   color: 'text-red-500',   bg: 'bg-red-50',        border: 'border-red-100',      icon: XCircle },
          ].map(({ label, value, color, bg, border, icon: Icon }) => (
            <div key={label} className={`${bg} rounded-xl px-4 py-3.5 border ${border} flex items-center gap-3`}>
              <Icon size={16} className={color} />
              <div>
                <p className={`text-lg font-semibold ${color}`}>{value}</p>
                <p className="text-[11px] text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SOLICITUDES ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <FileText size={13} className="text-[#0b7a4b]" />
          <p className="text-xs font-semibold text-[#0b7a4b] uppercase tracking-wider">
            Solicitudes de {user.name} ({requests.length})
          </p>
        </div>

        {requests.length === 0 && (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#0b7a4b]/8 flex items-center justify-center">
              <FileText size={20} className="text-[#0b7a4b]" />
            </div>
            <p className="font-medium text-gray-600 text-sm">Este usuario no tiene solicitudes todavía</p>
          </div>
        )}

        {requests.map(r => {
          const isExpanded = expandedId === r.id;
          const isUpdating = updatingId === r.id;
          const isDeleting = deletingId === r.id;
          const cfg = STATUS_CONFIG[r.status] ?? { label: r.status, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100', icon: Clock };
          const StatusIcon = cfg.icon;

          return (
            <div key={r.id}
              className={`bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all hover:border-gray-200 hover:shadow-sm ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}>

              <div className="flex items-center gap-5 px-5 py-4">
                <div className="w-11 h-11 rounded-xl bg-[#0b7a4b]/16 flex items-center justify-center shrink-0">
                  <Home size={18} className="text-[#0b7a4b]" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm">{r.tipoPropiedad} · {r.tipoOperacion}</p>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      <StatusIcon size={10} /> {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <MapPin size={10} className="text-gray-600" />
                    {r.localidad}{r.barrio ? `, ${r.barrio}` : ''}{r.direccion ? ` — ${r.direccion}` : ''}{r.pisoDepto ? ` ${r.pisoDepto}` : ''}
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold text-[#0b7a4b]">${Number(r.precioEstimado).toLocaleString('es-AR')}</p>
                    <p className="text-[11px] text-gray-500">{r.habitaciones} hab · {r.baños} baños · {r.m2Totales} m²</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canTransition(r.status, RequestStatus.ACEPTADO) && (
                    <button onClick={() => handleStatusChange(r.id, 'aceptado')} disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0b7a4b] bg-[#0b7a4b]/10 hover:bg-[#0b7a4b]/16 transition-all active:scale-95 disabled:opacity-40">
                      <CheckCircle size={13} /> Aceptar
                    </button>
                  )}
                  {canTransition(r.status, RequestStatus.RECHAZADO) && (
                    <button onClick={() => handleStatusChange(r.id, 'rechazado')} disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-40">
                      <XCircle size={13} /> Rechazar
                    </button>
                  )}
                  {canTransition(r.status, RequestStatus.REVISION) && (
                    <button onClick={() => handleStatusChange(r.id, 'en_revision')} disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all active:scale-95 disabled:opacity-40">
                      <RefreshCw size={13} /> Revisar
                    </button>
                  )}
                  <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button aria-label="Eliminar solicitud" onClick={() => handleDeleteRequest(r.id)}
                    className="flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-50 hover:bg-red-100 transition-all active:scale-95">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="border-t border-gray-50 bg-gray-50/60 px-6 py-5 flex flex-col gap-6">
                    <div>
                      <p className="text-[11px] font-semibold text-[#0b7a4b] uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Home size={12} /> Detalles de la propiedad
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <DataField label="Tipo · Operación" value={`${r.tipoPropiedad} · ${r.tipoOperacion}`} />
                        <DataField label="Ubicación" value={`${r.localidad}, ${r.barrio}`} />
                        <DataField label="Precio estimado" value={`$${Number(r.precioEstimado).toLocaleString('es-AR')}`} />
                        <DataField label="Superficie" value={`${r.m2Totales} m² totales · ${r.m2Cubiertos} m² cubiertos`} />
                        <DataField label="Ambientes" value={`${r.habitaciones} hab · ${r.baños} baños`} />
                        <DataField label="Conservación · Orientación" value={`${r.estadoConservacion} · ${r.orientacion}`} />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <BoolBadge value={r.garage}         label="Garage" />
                        <BoolBadge value={r.patio}          label="Patio" />
                        <BoolBadge value={r.escritura}      label="Escritura" />
                        <BoolBadge value={r.impuestosAlDia} label="Impuestos al día" />
                        <BoolBadge value={r.aptoCredito}    label="Apto crédito" />
                      </div>
                    </div>

                    {r.mensajeAgente && (
                      <div>
                        <p className="text-[11px] font-semibold text-[#0b7a4b] uppercase tracking-widest flex items-center gap-2 mb-3">
                          <MessageSquare size={12} /> Mensaje del usuario
                        </p>
                        <div className="flex gap-3 p-4 rounded-xl bg-white border border-gray-100">
                          <MessageSquare size={14} className="text-[#0b7a4b]/50 shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600 leading-relaxed">{r.mensajeAgente}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[11px] font-semibold text-[#0b7a4b] uppercase tracking-widest flex items-center gap-2 mb-3">
                        <RefreshCw size={12} /> Cambiar estado
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {/* Solo el estado actual + las transiciones válidas desde él */}
                        {Object.entries(STATUS_CONFIG)
                          .filter(([key]) => r.status === key || canTransition(r.status, key as RequestStatus))
                          .map(([key, scfg]) => {
                          const SIcon = scfg.icon;
                          const isCurrent = r.status === key;
                          return (
                            <button key={key} onClick={() => handleStatusChange(r.id, key)}
                              disabled={isCurrent || isUpdating}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:cursor-default border ${
                                isCurrent ? `${scfg.bg} ${scfg.color} ${scfg.border}` : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 disabled:opacity-40'
                              }`}>
                              <SIcon size={13} />
                              {scfg.label}
                              {isCurrent && <span className="text-[10px] opacity-60">· actual</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                      <p className="text-[11px] text-gray-600">
                        Solicitud #{r.id} · {new Date(r.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <button onClick={() => handleDeleteRequest(r.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-all active:scale-95">
                        <Trash2 size={13} /> Eliminar solicitud
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}