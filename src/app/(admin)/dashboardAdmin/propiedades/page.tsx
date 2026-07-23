'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import {
  Plus, Pencil, Trash2, Building2, Search,
  Home, DollarSign, Tag, ImageOff, ArrowLeft,
  ArrowUpDown, SlidersHorizontal, ChevronDown,
} from 'lucide-react';

interface PropertyImage {
  id: number;
  url: string;
  isCover: boolean;
}

interface Property {
  id: number;
  title: string;
  price: number;
  status: string;
  operationType: string;
  localidad: string;
  barrio: string;
  rooms: number;
  bathrooms: number;
  m2: number;
  images: PropertyImage[];
  typeOfProperty: { id: number; name: string };
  created_at?: string;
  updated_at?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  disponible: { label: 'Disponible',  color: 'bg-green-100 text-green-700' },
  pendiente:  { label: 'Pendiente',   color: 'bg-amber-100 text-amber-700' },
  vendida:    { label: 'Vendida',     color: 'bg-blue-100 text-blue-700' },
  alquilada:  { label: 'Alquilada',   color: 'bg-purple-100 text-purple-700' },
  'en pausa': { label: 'En pausa',    color: 'bg-gray-100 text-gray-600' },
  eliminado:  { label: 'Eliminado',   color: 'bg-red-100 text-red-600' },
};

const OP_LABELS: Record<string, { label: string; color: string }> = {
  venta:    { label: 'Venta',    color: 'bg-[#0b7a4b]/10 text-[#0b7a4b]' },
  alquiler: { label: 'Alquiler', color: 'bg-blue-50 text-blue-600' },
  temporal: { label: 'Temporal', color: 'bg-orange-50 text-orange-600' },
};

type SortBy = 'recent' | 'oldest' | 'updated' | 'price_desc' | 'price_asc';
type StatusFilter = 'all' | 'disponible' | 'vendida' | 'alquilada' | 'pausa_pendiente';

const dateVal = (s?: string) => (s ? new Date(s).getTime() : 0);

export default function PropiedadesAdminPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data } = await api.get('/properties');
      setProperties(Array.isArray(data) ? data : data?.properties ?? []);
    } catch {
      toast.error('No se pudieron cargar las propiedades');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, title: string) => {
    confirmDialog({
      title: '¿Eliminar propiedad?',
      message: `Se va a eliminar "${title}", incluidas todas sus imágenes de Cloudinary. Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      variant: 'danger',
      icon: Trash2,
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await api.delete(`/properties/${id}`);
          setProperties(prev => prev.filter(p => p.id !== id));
          toast.success('Propiedad eliminada');
        } catch (error) {
          toast.error(getErrorMessage(error));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  // ── Filtrado + ordenamiento (memoizado) ──
  const visible = useMemo(() => {
    const q = search.toLowerCase();
    let list = properties.filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.localidad?.toLowerCase().includes(q) ||
        p.barrio?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (statusFilter === 'disponible') return p.status === 'disponible';
      if (statusFilter === 'vendida') return p.status === 'vendida';
      if (statusFilter === 'alquilada') return p.status === 'alquilada';
      if (statusFilter === 'pausa_pendiente') return p.status === 'pendiente' || p.status === 'en pausa';
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'recent':     return dateVal(b.created_at) - dateVal(a.created_at);
        case 'oldest':     return dateVal(a.created_at) - dateVal(b.created_at);
        case 'updated':    return dateVal(b.updated_at) - dateVal(a.updated_at);
        case 'price_desc': return (b.price ?? 0) - (a.price ?? 0);
        case 'price_asc':  return (a.price ?? 0) - (b.price ?? 0);
        default:           return 0;
      }
    });
    return list;
  }, [properties, search, sortBy, statusFilter]);

  const coverOf = (p: Property) => p.images?.find(i => i.isCover)?.url || p.images?.[0]?.url;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Propiedades</h1>
          <p className="mt-0.5 text-sm font-medium text-gray-600">
            {loading ? 'Cargando…' : `${visible.length} de ${properties.length} propiedades`}
          </p>
        </div>
        <Link href="/dashboardAdmin/propiedades/nueva"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
          <Plus size={16} />
          Nueva propiedad
        </Link>
      </div>

      {/* Toolbar: búsqueda + orden + estado */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, localidad o barrio..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm transition-all focus:border-[#0b7a4b] focus:outline-none focus:ring-2 focus:ring-[#0b7a4b]/10"
          />
        </div>
        <FilterSelect icon={ArrowUpDown} value={sortBy} onChange={v => setSortBy(v as SortBy)} ariaLabel="Ordenar por">
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguas</option>
          <option value="updated">Última edición</option>
          <option value="price_desc">Precio: mayor a menor</option>
          <option value="price_asc">Precio: menor a mayor</option>
        </FilterSelect>
        <FilterSelect icon={SlidersHorizontal} value={statusFilter} onChange={v => setStatusFilter(v as StatusFilter)} ariaLabel="Filtrar por estado">
          <option value="all">Todos los estados</option>
          <option value="disponible">Disponibles</option>
          <option value="vendida">Vendidas</option>
          <option value="alquilada">Alquiladas</option>
          <option value="pausa_pendiente">En pausa / Pendientes</option>
        </FilterSelect>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex animate-pulse gap-4 rounded-2xl border border-gray-100 bg-white p-4">
              <div className="h-20 w-24 shrink-0 rounded-xl bg-gray-200" />
              <div className="flex flex-1 flex-col justify-center gap-2">
                <div className="h-4 w-1/2 rounded-full bg-gray-200" />
                <div className="h-3 w-1/3 rounded-full bg-gray-200" />
                <div className="h-3 w-1/4 rounded-full bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && visible.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0b7a4b]/10">
            <Building2 size={28} className="text-[#0b7a4b]" />
          </div>
          <div>
            <p className="font-bold text-gray-800">
              {search || statusFilter !== 'all' ? 'Sin resultados' : 'No hay propiedades todavía'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {search || statusFilter !== 'all' ? 'Probá ajustando la búsqueda o el filtro' : 'Publicá la primera propiedad'}
            </p>
          </div>
          {!search && statusFilter === 'all' && (
            <Link href="/dashboardAdmin/propiedades/nueva"
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
              <Plus size={15} /> Nueva propiedad
            </Link>
          )}
        </div>
      )}

      {/* Lista */}
      {!loading && visible.length > 0 && (
        <div className="flex flex-col gap-3">
          {visible.map(p => {
            const cover = coverOf(p);
            const status = STATUS_LABELS[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-600' };
            const op = OP_LABELS[p.operationType] ?? { label: p.operationType, color: 'bg-gray-100 text-gray-600' };

            return (
              <div key={p.id}
                className={`flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0b7a4b]/30 hover:shadow-md ${deletingId === p.id ? 'pointer-events-none opacity-50' : ''}`}>

                {/* Imagen */}
                <div className="flex h-22 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff size={22} className="text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-2">
                    <h3 className="truncate font-bold text-gray-900 transition-colors hover:text-[#0b7a4b]">{p.title}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.color}`}>
                      {status.label}
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${op.color}`}>
                      {op.label}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Home size={12} className="text-[#0b7a4b]" />
                      {p.typeOfProperty?.name ?? '—'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Tag size={12} className="text-gray-400" />
                      {p.localidad}{p.barrio ? `, ${p.barrio}` : ''}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-800">
                      <DollarSign size={12} className="text-[#0b7a4b]" />
                      {p.price?.toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {p.rooms} hab · {p.bathrooms} baños · {p.m2} m²
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/dashboardAdmin/propiedades/${p.id}`}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0b7a4b]/10 px-4 py-2 text-xs font-bold text-[#0b7a4b] transition-all hover:bg-[#0b7a4b]/20">
                    <Pencil size={13} /> Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100"
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────────────────────
function BackLink() {
  return (
    <Link
      href="/dashboardAdmin"
      className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-[#0b7a4b] transition-colors hover:text-[#0f8c58]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white transition-transform group-hover:-translate-x-0.5">
        <ArrowLeft size={14} />
      </span>
    </Link>
  );
}

function FilterSelect({
  icon: Icon, value, onChange, ariaLabel, children,
}: {
  icon: React.ElementType; value: string; onChange: (v: string) => void; ariaLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="relative shrink-0">
      <Icon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0b7a4b]" />
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-9 text-sm font-semibold text-gray-700 transition-all focus:border-[#0b7a4b] focus:outline-none focus:ring-2 focus:ring-[#0b7a4b]/10 lg:w-56"
      >
        {children}
      </select>
    </div>
  );
}
