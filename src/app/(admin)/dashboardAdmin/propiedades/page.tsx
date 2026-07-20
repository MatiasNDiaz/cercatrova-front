'use client';

import { useState, useEffect } from 'react';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import Link from 'next/link';
import { toast } from 'sonner';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import {
  Plus, Pencil, Trash2, Building2, Search,
  Home, DollarSign, Tag, ImageOff,
  ArrowLeft,
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

export default function PropiedadesAdminPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data } = await api.get('/properties');
      setProperties(data);
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

  const filtered = properties.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.localidad?.toLowerCase().includes(search.toLowerCase()) ||
    p.barrio?.toLowerCase().includes(search.toLowerCase())
  );

  const coverOf = (p: Property) => p.images?.find(i => i.isCover)?.url || p.images?.[0]?.url;

  return (
    <div className="flex flex-col gap-6">
 <Link
        href="/dashboardAdmin"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#0b7a4b] hover:text-[#0f8c58] group transition-colors w-fit"
      >
        <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
          <ArrowLeft size={14} />
        </span>
      </Link>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Propiedades</h1>
          <p className="text-sm font-medium text-gray-600 mt-0.5">
            {properties.length} propiedades en total
          </p>
        </div>
        <Link href="/dashboardAdmin/propiedades/nueva"
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all active:scale-95 shadow-sm hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
          <Plus size={16} />
          Nueva propiedad
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título, localidad o barrio..."
          className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-[#0b7a4b] transition-all"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-gray-200 animate-pulse flex gap-4">
              <div className="w-24 h-20 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <div className="h-4 bg-gray-200 rounded-full w-1/2" />
                <div className="h-3 bg-gray-200 rounded-full w-1/3" />
                <div className="h-3 bg-gray-200 rounded-full w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-3xl p-12 border border-gray-200 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center">
            <Building2 size={28} className="text-[#0b7a4b]" />
          </div>
          <div>
            <p className="font-bold text-gray-800">
              {search ? 'Sin resultados' : 'No hay propiedades todavía'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {search ? 'Probá con otro término' : 'Publicá la primera propiedad'}
            </p>
          </div>
          {!search && (
            <Link href="/dashboardAdmin/propiedades/nueva"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl"
              style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
              <Plus size={15} /> Nueva propiedad
            </Link>
          )}
        </div>
      )}

      {/* Lista */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(p => {
            const cover = coverOf(p);
            const status = STATUS_LABELS[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-600' };
            const op = OP_LABELS[p.operationType] ?? { label: p.operationType, color: 'bg-gray-100 text-gray-600' };

            return (
              <div key={p.id}
                className={`bg-white rounded-3xl  border border-gray-200 p-4 flex items-center gap-4 transition-all hover:shadow-md ${deletingId === p.id ? 'opacity-50 pointer-events-none' : ''}`}>

                {/* Imagen */}
                <div className="w-28 h-22 rounded-2xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff size={22} className="text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 transition-all hover:text-[#0b7a4b] truncate">{p.title}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${op.color}`}>
                      {op.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
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
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/dashboardAdmin/propiedades/${p.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0b7a4b] bg-[#0b7a4b]/10 hover:bg-[#0b7a4b]/20 rounded-xl transition-all">
                    <Pencil size={13} /> Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
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