'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import Link from 'next/link';
import api from '@/modules/shared/lib/axios';
import {
  ClipboardList, MapPin, Plus, ChevronDown, ChevronUp,
  Clock, CheckCircle, XCircle, Eye, Calendar,
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

export default function MisSolicitudesPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Mis Solicitudes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Estado de tus propiedades enviadas al agente</p>
        </div>
        <Link href="/publicar"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
          <Plus size={15} /> Nueva solicitud
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 shrink-0" />
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
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center">
            <ClipboardList size={28} className="text-[#0b7a4b]" />
          </div>
          <div>
            <p className="font-bold text-gray-700">Todavía no enviaste solicitudes</p>
            <p className="text-sm text-gray-400 mt-1">Completá el formulario y un agente se va a contactar con vos</p>
          </div>
          <Link href="/dashboard/mis-solicitudes/nueva"
            className="mt-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
            Publicar mi propiedad
          </Link>
        </div>
      )}

      {/* Lista */}
      {!loading && requests.length > 0 && (
        <div className="flex flex-col gap-3">
          {requests.map(req => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.enviado;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === req.id;

            return (
              <div key={req.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all">

                {/* Fila principal */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">

                  {/* Ícono tipo propiedad */}
                  <div className="w-11 h-11 rounded-2xl bg-[#0b7a4b]/10 flex items-center justify-center shrink-0">
                    <ClipboardList size={18} className="text-[#0b7a4b]" />
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 line-clamp-1">
                      {req.tipoPropiedad} — {req.direccion}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
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
                  <span className="text-gray-300 shrink-0">
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
                        <div key={i} className="bg-gray-50 rounded-2xl p-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item!.label}</p>
                          <p className="text-sm font-bold text-gray-700 mt-0.5">{item!.value}</p>
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
                          <span key={i} className={`text-xs font-semibold px-3 py-1 rounded-full ${b.value ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            {b.value ? '✓' : '✗'} {b.label}
                          </span>
                        ))}
                      </div>

                      {/* Mensaje al agente */}
                      {req.mensajeAgente && (
                        <div className="col-span-2 sm:col-span-3 bg-[#0b7a4b]/5 rounded-2xl p-4">
                          <p className="text-[10px] font-semibold text-[#0b7a4b] uppercase tracking-wider mb-1">Mensaje al agente</p>
                          <p className="text-sm text-gray-600">{req.mensajeAgente}</p>
                        </div>
                      )}

                      {/* Fecha */}
                      <div className="col-span-2 sm:col-span-3 flex items-center gap-1.5 text-xs text-gray-400">
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

    </div>
  );
}