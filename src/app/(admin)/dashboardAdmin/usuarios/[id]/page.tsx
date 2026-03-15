'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  ArrowLeft, User, Mail, Phone, Calendar,
  FileText, CheckCircle, XCircle, Clock,
  RefreshCw, ChevronDown, ChevronUp, Trash2,
  MessageSquare, MapPin, Home, Ruler, DollarSign,
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

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  enviado:     { label: 'Enviado',     color: 'text-blue-700',  bg: 'bg-blue-100',  icon: Clock },
  en_revision: { label: 'En revisión', color: 'text-amber-700', bg: 'bg-amber-100', icon: RefreshCw },
  aceptado:    { label: 'Aceptado',    color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  rechazado:   { label: 'Rechazado',   color: 'text-red-700',   bg: 'bg-red-100',   icon: XCircle },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const WhatsappIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function BoolBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
      value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {value ? '✓' : '✗'} {label}
    </span>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <p className="text-[11px] font-black text-[#0b7a4b] uppercase tracking-widest flex items-center gap-2 mb-4">
      <Icon size={13} />{label}
    </p>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleStatusChange = async (reqId: number, newStatus: string) => {
    setUpdatingId(reqId);
    try {
      await api.patch(`/property-requests/${reqId}/status`, { status: newStatus });
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
      toast.success(`Estado actualizado a "${STATUS_CONFIG[newStatus]?.label ?? newStatus}"`);
    } catch {
      toast.error('No se pudo actualizar el estado');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteRequest = (reqId: number) => {
    toast.custom((t) => (
      <div className="flex flex-col gap-4 bg-white rounded-3xl px-7 py-6 w-96 shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={20} className="text-red-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">¿Eliminar solicitud?</p>
            <p className="text-sm text-gray-500 mt-0.5">Solicitud #{reqId}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
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
            }}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all active:scale-95"
          >
            Sí, eliminar
          </button>
          <button onClick={() => toast.dismiss(t)}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
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

  // ── Loading ──
  if (loading) return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-3xl p-6 border border-gray-200 animate-pulse">
        <div className="flex gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gray-200 shrink-0" />
          <div className="flex-1 flex flex-col gap-3 justify-center">
            <div className="h-5 bg-gray-200 rounded-full w-1/3" />
            <div className="h-3 bg-gray-200 rounded-full w-1/2" />
            <div className="h-3 bg-gray-200 rounded-full w-1/4" />
          </div>
        </div>
      </div>
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-3xl p-4 border border-gray-200 animate-pulse flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
          <div className="flex-1 flex flex-col gap-2 justify-center">
            <div className="h-4 bg-gray-200 rounded-full w-1/3" />
            <div className="h-3 bg-gray-200 rounded-full w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!user) return (
    <div className="bg-white rounded-3xl p-12 border border-gray-200 flex flex-col items-center gap-4 text-center">
      <p className="font-bold text-gray-700">Usuario no encontrado</p>
      <button onClick={() => router.back()} className="text-sm font-bold text-[#0b7a4b] hover:underline">
        Volver
      </button>
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

      {/* Header */}
      <div className="flex items-center gap-4">
        <button aria-label='a' onClick={() => router.back()}
          className="p-2 rounded-full bg-white border border-gray-200 text-[#0b7a4b] hover:bg-gray-50 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Detalle del usuario</h1>
          <p className="text-sm font-medium text-gray-600 mt-0.5">
            {user.name} {user.surname} · ID #{user.id}
          </p>
        </div>
      </div>

      {/* ── PERFIL ── */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-20 bg-linear-to-r from-[#0b7a4b] to-[#14a366]" />
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-10 mb-4 w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 ring-4 ring-white shadow-md flex items-center justify-center">
            {user.photo ? (
              <Image src={user.photo} alt={user.name} width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              <User size={28} className="text-gray-400" />
            )}
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-[#0b7a4b]">{user.name} {user.surname}</h2>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Mail size={13} className="text-[#0b7a4b]" />{user.email}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone size={13} className="text-[#0b7a4b]" />{user.phone}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Calendar size={13} className="text-[#0b7a4b]" />
                  Miembro desde {new Date(user.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              {user.profileIncomplete && (
                <span className="inline-block mt-2 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                  Perfil incompleto
                </span>
              )}
            </div>

            {/* Acciones de contacto */}
            <div className="flex gap-2 flex-wrap">
              <a href={`https://wa.me/${user.phone?.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #25d366, #1ebe5d)' }}>
                <WhatsappIcon size={15} /> WhatsApp
              </a>
              <a href={gmailUrl(user.email, user.name)}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all active:scale-95">
                <Mail size={15} /> Gmail
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── RESUMEN DE SOLICITUDES ── */}
          <p className="text-xs font-black text-[#0b7a4b] uppercase tracking-wider">
            Resumen de solicitudes
          </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white rounded-2xl p-4 border border-gray-200">
        {[
          { label: 'Total',       value: counts.total,       color: 'text-gray-900',   bg: 'bg-gray-100',       icon: FileText },
          { label: 'Enviadas',    value: counts.enviado,     color: 'text-blue-700',   bg: 'bg-blue-100',     icon: Clock },
          { label: 'En revisión', value: counts.en_revision, color: 'text-amber-700',  bg: 'bg-amber-100',    icon: RefreshCw },
          { label: 'Aceptadas',   value: counts.aceptado,    color: 'text-green-700',  bg: 'bg-green-100',    icon: CheckCircle },
          { label: 'Rechazadas',  value: counts.rechazado,   color: 'text-red-700',    bg: 'bg-red-100',      icon: XCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-gray-200 flex items-center gap-3`}>
            <Icon size={18} className={color} />
            <div>
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-[11px] font-semibold text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SOLICITUDES ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[#0b7a4b]" />
          <p className="text-xs font-black text-[#0b7a4b] uppercase tracking-wider">
            Solicitudes de {user.name} ({requests.length})
          </p>
        </div>

        {requests.length === 0 && (
          <div className="bg-white rounded-3xl p-10 border border-gray-200 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center">
              <FileText size={24} className="text-[#0b7a4b]" />
            </div>
            <p className="font-bold text-gray-700">Este usuario no tiene solicitudes todavía</p>
          </div>
        )}

        {requests.map(r => {
          const isExpanded = expandedId === r.id;
          const isUpdating = updatingId === r.id;
          const isDeleting = deletingId === r.id;
          const cfg = STATUS_CONFIG[r.status] ?? { label: r.status, color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock };
          const StatusIcon = cfg.icon;

          return (
            <div key={r.id}
              className={`bg-white rounded-3xl border border-gray-200 overflow-hidden transition-all hover:shadow-md ${
                isDeleting ? 'opacity-50 pointer-events-none' : ''
              }`}>

              {/* Fila compacta */}
              <div className="flex items-center gap-4 p-4">
                {/* Ícono tipo propiedad */}
                <div className="w-12 h-12 rounded-2xl bg-[#0b7a4b]/10 flex items-center justify-center shrink-0">
                  <Home size={20} className="text-[#0b7a4b]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">
                      {r.tipoPropiedad} · {r.tipoOperacion}
                    </p>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon size={10} /> {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={11} className="text-gray-400" />
                    {r.localidad}{r.barrio ? `, ${r.barrio}` : ''}
                    {r.direccion ? ` — ${r.direccion}` : ''}
                    {r.pisoDepto ? ` ${r.pisoDepto}` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs font-bold text-[#0b7a4b]">
                      ${Number(r.precioEstimado).toLocaleString('es-AR')} estimado
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {r.habitaciones} hab · {r.baños} baños · {r.m2Totales} m²
                    </p>
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="flex items-center gap-2 shrink-0">
                  {r.status !== 'aceptado' && (
                    <button onClick={() => handleStatusChange(r.id, 'aceptado')} disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 transition-all active:scale-95 disabled:opacity-50">
                      <CheckCircle size={13} /> Aceptar
                    </button>
                  )}
                  {r.status !== 'rechazado' && (
                    <button onClick={() => handleStatusChange(r.id, 'rechazado')} disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50">
                      <XCircle size={13} /> Rechazar
                    </button>
                  )}
                  {r.status !== 'en_revision' && r.status !== 'aceptado' && r.status !== 'rechazado' && (
                    <button onClick={() => handleStatusChange(r.id, 'en_revision')} disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-all active:scale-95 disabled:opacity-50">
                      <RefreshCw size={13} /> Revisar
                    </button>
                  )}
                  <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button aria-label='a
                  ' onClick={() => handleDeleteRequest(r.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Detalle expandido */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-5 flex flex-col gap-5">

                  {/* Detalles propiedad */}
                  <div>
                    <SectionTitle icon={Home} label="Detalles de la propiedad" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo · Operación</p>
                        <p className="text-sm font-semibold text-gray-800">{r.tipoPropiedad} · {r.tipoOperacion}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ubicación</p>
                        <p className="text-sm font-semibold text-gray-800">{r.localidad}, {r.barrio}</p>
                        {r.direccion && <p className="text-xs text-gray-500">{r.direccion}{r.pisoDepto ? ` — ${r.pisoDepto}` : ''}</p>}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Precio estimado</p>
                        <p className="text-sm font-bold text-[#0b7a4b]">${Number(r.precioEstimado).toLocaleString('es-AR')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Superficie</p>
                        <p className="text-sm font-semibold text-gray-800">{r.m2Totales} m² totales · {r.m2Cubiertos} m² cubiertos</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ambientes</p>
                        <p className="text-sm font-semibold text-gray-800">{r.habitaciones} hab · {r.baños} baños</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Conservación · Orientación</p>
                        <p className="text-sm font-semibold text-gray-800">{r.estadoConservacion} · {r.orientacion}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <BoolBadge value={r.garage}         label="Garage" />
                      <BoolBadge value={r.patio}          label="Patio" />
                      <BoolBadge value={r.escritura}      label="Escritura" />
                      <BoolBadge value={r.impuestosAlDia} label="Impuestos al día" />
                      <BoolBadge value={r.aptoCredito}    label="Apto crédito" />
                    </div>
                  </div>

                  {/* Mensaje al agente */}
                  {r.mensajeAgente && (
                    <div>
                      <SectionTitle icon={MessageSquare} label="Mensaje del usuario" />
                      <div className="flex gap-3 p-4 rounded-2xl bg-white border border-gray-200">
                        <MessageSquare size={15} className="text-[#0b7a4b] shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 leading-relaxed">{r.mensajeAgente}</p>
                      </div>
                    </div>
                  )}

                  {/* Cambiar estado */}
                  <div>
                    <SectionTitle icon={RefreshCw} label="Cambiar estado" />
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(STATUS_CONFIG).map(([key, scfg]) => {
                        const SIcon = scfg.icon;
                        return (
                          <button key={key}
                            onClick={() => handleStatusChange(r.id, key)}
                            disabled={r.status === key || isUpdating}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border ${
                              r.status === key
                                ? `${scfg.bg} ${scfg.color} border-transparent`
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}>
                            <SIcon size={14} />
                            {scfg.label}
                            {r.status === key && <span className="text-[10px]">✓ actual</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Eliminar */}
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                    <p className="text-[11px] text-gray-400">
                      Solicitud #{r.id} · Enviada el {new Date(r.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <button onClick={() => handleDeleteRequest(r.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95">
                      <Trash2 size={14} /> Eliminar solicitud
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}