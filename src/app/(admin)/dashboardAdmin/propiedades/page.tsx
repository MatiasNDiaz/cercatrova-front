'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/modules/shared/lib/axios';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import { DashboardBackLink } from '@/modules/shared/ui/DashboardBackLink';
import { DashboardPage } from '@/modules/shared/ui/DashboardPage';
import {
  Plus, Pencil, Trash2, Building2, Search,
  Home, DollarSign, Tag, ImageOff,
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
  supTotal: number | null;
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

  // `GET /properties` ahora está paginado (`{ data, meta }`, default 10 por
  // página): con un `api.get('/properties')` pelado el panel mostraba sólo las
  // 10 más recientes y parecía que faltaban propiedades. Esta pantalla filtra y
  // ordena en cliente sobre el catálogo entero, así que se recorren todas las
  // páginas (de a 100, el máximo del backend).
  const fetchProperties = async () => {
    try {
      setProperties(await propertiesService.getEveryProperty());
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
    <DashboardPage>
      <DashboardBackLink href="/dashboardAdmin" />

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
            <div key={i} className="flex animate-pulse gap-4 rounded-xl border border-gray-100 bg-white p-4">
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
        <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-100 bg-white p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white ring-1 ring-ink-100 shadow-sm">
            <Building2 size={28} className="text-brand-700 " />
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
              /* Mobile: columna (imagen → texto → acciones). A partir de `sm`
                 vuelve a la fila de siempre.

                 En una sola fila a 390px no entraba nada: la imagen se lleva
                 112px, los dos botones ~170px, y a la info le quedaban ~60px
                 — por eso "Córdoba Capital, Nueva Córdoba" terminaba pisando
                 el botón Editar. */
              <div key={p.id}
                className={`flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:border-[#0b7a4b]/30 hover:shadow-md sm:flex-row sm:items-center sm:hover:-translate-y-0.5 ${deletingId === p.id ? 'pointer-events-none opacity-50' : ''}`}>

                {/* Imagen — ancho completo en mobile, miniatura desde `sm`. */}
                <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:h-22 sm:w-28">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff size={22} className="text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-2">
                    {/* `w-full sm:w-auto`: en mobile el título ocupa su propia
                        línea y los badges caen abajo, en vez de empujarse
                        entre sí y quedar todos cortados. */}
                    <h3 className="w-full truncate font-bold text-gray-900 transition-colors hover:text-[#0b7a4b] sm:w-auto">{p.title}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.color}`}>
                      {status.label}
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${op.color}`}>
                      {op.label}
                    </span>
                  </div>

                  {/* Bloque de info propio: en mobile va sobre fondo gris y en
                      2 columnas, así se lee como una ficha y no como texto
                      suelto compitiendo con los botones. Desde `sm` vuelve a
                      ser una fila corrida, sin fondo. */}
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-gray-50 p-3 sm:flex sm:flex-wrap sm:gap-y-1 sm:bg-transparent sm:p-0">
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
                      {p.rooms} hab · {p.bathrooms} baños{p.supTotal != null ? ` · ${p.supTotal} m²` : ''}
                    </span>
                  </div>
                </div>

                {/* Acciones. Estilo fijo: ya no hay un "modo" del sidebar que
                    resalte una u otra — las dos están siempre disponibles.

                    En mobile ocupan su propia fila, cada botón a mitad de
                    ancho y con 44px de alto; antes flotaban al costado del
                    texto y quedaban encimadas con la ubicación. */}
                <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 pt-3 sm:border-0 sm:pt-0">
                  <Link href={`/dashboardAdmin/propiedades/${p.id}`}
                    className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0b7a4b]/10 px-4 text-xs font-bold text-[#0b7a4b] transition-all hover:bg-[#0b7a4b]/20 sm:min-h-0 sm:flex-none sm:py-2">
                    <Pencil size={13} /> Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-50 px-4 text-xs font-bold text-red-600 transition-all hover:bg-red-100 sm:min-h-0 sm:flex-none sm:py-2"
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </DashboardPage>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────────────────────

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
