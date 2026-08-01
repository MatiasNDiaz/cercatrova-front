'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import Link from 'next/link';
import api from '@/modules/shared/lib/axios';
import { useUrlFilter } from '@/modules/shared/hooks/useUrlFilter';
import { DashboardBackLink } from '@/modules/shared/ui/DashboardBackLink';
import { DashboardPage } from '@/modules/shared/ui/DashboardPage';
import {
  ClipboardList, MapPin, Plus, ChevronDown, ChevronUp,
  Clock, CheckCircle, XCircle, Eye, Calendar, Search, SearchX,
} from 'lucide-react';

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
  orientacion?: string;
  escritura: boolean;
  impuestosAlDia: boolean;
  aptoCredito: boolean;
  precioEstimado: number;
  mensajeAgente?: string;
  status: 'enviado' | 'en_revision' | 'aceptado' | 'rechazado';
  createdAt: string;
}

const STATUS_CONFIG = {
  enviado:     { label: 'Enviado',     color: 'text-blue-600 bg-blue-50',    icon: Clock },
  en_revision: { label: 'En revisión', color: 'text-amber-600 bg-amber-50',  icon: Eye },
  aceptado:    { label: 'Aceptado',    color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle },
  rechazado:   { label: 'Rechazado',   color: 'text-red-600 bg-red-50',      icon: XCircle },
};

type SortBy = 'recientes' | 'antiguas';

export default function MisSolicitudesPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ── Filtros ───────────────────────────────────────────────────────────────
  // Mismo criterio que el admin en su propia pantalla de Solicitudes: el estado
  // vive en la URL (`?estado=`) para que sobreviva al refresh y el link se pueda
  // compartir, y el orden es estado local porque no hay ningún acceso directo
  // que necesite apuntar a un orden concreto.
  //
  // Todo el filtrado es de PRESENTACIÓN, sobre la lista que ya se trajo: no
  // cambia el fetch (`GET /property-requests/my-requests`, sin parámetros) ni
  // agrega llamadas nuevas.
  const [filterStatus, setFilterStatus] = useUrlFilter<string>('estado', '');
  const [sortBy, setSortBy] = useState<SortBy>('recientes');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/property-requests/my-requests');
        setRequests(data);
      } catch {
        // Si no hay solicitudes el backend tira 404, no es error real
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetch();
  }, [user]);

  // Conteo por estado — se calcula sobre TODAS las solicitudes, no sobre las
  // visibles: si no, al filtrar por "Aceptado" los otros contadores caerían a 0.
  const counts = useMemo(
    () => ({
      enviado:     requests.filter(r => r.status === 'enviado').length,
      en_revision: requests.filter(r => r.status === 'en_revision').length,
      aceptado:    requests.filter(r => r.status === 'aceptado').length,
      rechazado:   requests.filter(r => r.status === 'rechazado').length,
    }),
    [requests],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = requests.filter(r => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (!q) return true;
      return (
        r.direccion?.toLowerCase().includes(q) ||
        r.barrio?.toLowerCase().includes(q) ||
        r.localidad?.toLowerCase().includes(q) ||
        r.tipoPropiedad?.toLowerCase().includes(q)
      );
    });

    const time = (s: string) => new Date(s).getTime();
    return [...list].sort((a, b) =>
      sortBy === 'recientes'
        ? time(b.createdAt) - time(a.createdAt)
        : time(a.createdAt) - time(b.createdAt),
    );
  }, [requests, filterStatus, search, sortBy]);

  const hasFilters = Boolean(filterStatus || search.trim());

  return (
    <DashboardPage>
      <DashboardBackLink />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Mis Solicitudes</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {loading
              ? 'Cargando…'
              : hasFilters
                ? `${visible.length} de ${requests.length} solicitudes`
                : 'Estado de tus propiedades enviadas al agente'}
          </p>
        </div>
        <Link href="/publicar"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all active:scale-95 shrink-0"
          style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
          <Plus size={15} /> Nueva solicitud
        </Link>
      </div>

      {/* ── FILTROS ──
          Mismo layout que la pantalla de Solicitudes del admin: tarjetas de
          estado clickeables arriba (actúan como filtro y como resumen a la vez)
          y buscador debajo, más el orden a la derecha. */}
      {!loading && requests.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.entries(STATUS_CONFIG) as [keyof typeof counts, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const active = filterStatus === key;
              return (
                <button key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilterStatus(active ? '' : key)}
                  className={`flex cursor-pointer items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-[#0b7a4b] bg-white shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-400'
                  }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-[#0b7a4b]">{counts[key]}</p>
                    <p className="text-[11px] font-semibold text-gray-500 truncate">{cfg.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por dirección, barrio, localidad o tipo..."
                aria-label="Buscar en mis solicitudes"
                className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-white transition-all focus:border-[#0b7a4b] focus:outline-none"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              aria-label="Ordenar solicitudes"
              className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition-all focus:border-[#0b7a4b] focus:outline-none sm:w-56"
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguas">Más antiguas</option>
            </select>
          </div>
        </>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                <div className="h-3 bg-gray-100 rounded-full w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && requests.length === 0 && (
        <div className="bg-white rounded-xl p-12 border border-gray-100 shadow-sm flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center">
            <ClipboardList size={28} className="text-[#0b7a4b]" />
          </div>
          <div>
            <p className="font-bold text-gray-700">Todavía no enviaste solicitudes</p>
            <p className="text-sm text-gray-400 mt-1">Completá el formulario y un agente se va a contactar con vos</p>
          </div>
          <Link href="/publicar/"
            className="mt-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
            Publicar mi propiedad
          </Link>
        </div>
      )}

      {/* Sin coincidencias — distinto de "todavía no enviaste solicitudes":
          acá sí hay solicitudes, pero ninguna pasa el filtro activo. */}
      {!loading && requests.length > 0 && visible.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0b7a4b]/10">
            <SearchX size={28} className="text-[#0b7a4b]" />
          </div>
          <div>
            <p className="font-bold text-gray-700">Ninguna solicitud coincide</p>
            <p className="mt-1 text-sm text-gray-400">Probá con otro estado o cambiá el texto de búsqueda.</p>
          </div>
          <button
            type="button"
            onClick={() => { setFilterStatus(''); setSearch(''); }}
            className="mt-1 cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-[#0b7a4b] transition-all hover:bg-[#0b7a4b]/8"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Lista */}
      {!loading && visible.length > 0 && (
        <div className="flex flex-col gap-3">
          {visible.map(req => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.enviado;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === req.id;

            return (
              <div key={req.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                {/* Fila principal */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-green-50 transition-colors">

                  {/* Ícono tipo propiedad */}
                  <div className="w-11 h-11 rounded-xl bg-[#0b7a4b]/10 flex items-center justify-center shrink-0">
                    <ClipboardList size={18} className="text-[#0b7a4b]" />
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0b7a4b] line-clamp-1">
                      {req.tipoPropiedad} — {req.direccion}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <MapPin size={10} className="text-[#0b7a4b]" />
                      {req.barrio}, {req.localidad}
                    </div>
                  </div>

                  {/* Badge status */}
                  <span className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${cfg.color}`}>
                    <StatusIcon size={12} />
                    {cfg.label}
                  </span>

                  {/* Chevron */}
                  <span className="text-gray-400 shrink-0">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {/* Detalle expandible */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">

                      {[
                        { label: 'Tipo operación',  value: req.tipoOperacion },
                        { label: 'Precio estimado', value: `USD ${Number(req.precioEstimado).toLocaleString('es-AR')}` },
                        { label: 'Estado',          value: req.estadoConservacion },
                        { label: 'M² totales',      value: `${req.m2Totales} m²` },
                        { label: 'M² cubiertos',    value: `${req.m2Cubiertos} m²` },
                        { label: 'Habitaciones',    value: req.habitaciones },
                        { label: 'Baños',           value: req.baños },
                        { label: 'Antigüedad',      value: `${req.antiguedad} años` },
                        req.orientacion ? { label: 'Orientación', value: req.orientacion } : null,
                        req.pisoDepto   ? { label: 'Piso/Depto',  value: req.pisoDepto }  : null,
                      ].filter(Boolean).map((item, i) => (
                        <div key={i} className="bg-[#0b7a4b]/11 rounded-xl p-3">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{item!.label}</p>
                          <p className="text-sm font-bold text-[#0b7a4b] mt-0.5">{item!.value}</p>
                        </div>
                      ))}

                      {/* Booleans */}
                      <div className="col-span-2 sm:col-span-3 flex flex-wrap gap-2 mt-1">
                        {[
                          { label: 'Patio',           value: req.patio },
                          { label: 'Garage',          value: req.garage },
                          { label: 'Escritura',       value: req.escritura },
                          { label: 'Impuestos al día',value: req.impuestosAlDia },
                          { label: 'Apto crédito',    value: req.aptoCredito },
                        ].map((b, i) => (
                          <span key={i} className={`text-xs font-semibold px-3 py-1 rounded-full ${b.value ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                            {b.value ? '✓' : '✗'} {b.label}
                          </span>
                        ))}
                      </div>

                      {/* Mensaje al agente */}
                      {req.mensajeAgente && (
                        <div className="col-span-2 sm:col-span-3 bg-[#0b7a4b]/5 rounded-xl p-4">
                          <p className="text-[10px] font-semibold text-[#0b7a4b] uppercase tracking-wider mb-1">Mensaje al agente</p>
                          <p className="text-sm text-gray-600">{req.mensajeAgente}</p>
                        </div>
                      )}

                      {/* Fecha */}
                      <div className="col-span-2 sm:col-span-3 flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={11} />
                        Enviado el {new Date(req.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </DashboardPage>
  );
}