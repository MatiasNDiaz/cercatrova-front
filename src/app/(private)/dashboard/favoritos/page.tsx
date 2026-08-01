'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { toast } from 'sonner';
import { DashboardPage, DashboardHeader, ListReveal } from '@/modules/shared/ui/DashboardPage';
import { ListToolbar, ListSearch, ListSelect, NoMatches } from '@/modules/shared/ui/ListToolbar';
import {
  Heart, MapPin, Bed, Bath, Maximize, Trash2, Home, ArrowRight, ArrowUpDown,
} from 'lucide-react';

type SortBy = 'recientes' | 'precio_asc' | 'precio_desc' | 'alfabetico';

// Shape reducido: solo los campos de `Property` que esta pantalla renderiza.
// Los nombres deben coincidir con el tipo canónico (`shared/types/api.ts`).
interface FavoriteProperty {
  user_id: number;
  property_id: number;
  property: {
    id: number;
    title: string;
    localidad: string;
    barrio: string;
    price: number;
    operationType: string;
    status: string;
    supTotal: number | null;
    rooms: number;
    bathrooms: number;
    images?: { url: string; isCover?: boolean }[];
    typeOfProperty?: { name: string };
  };
}

export default function FavoritosPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recientes');

  // Filtrado de presentación sobre lo ya traído por `GET /favorites`.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? favorites.filter(({ property: pr }) =>
          pr.title?.toLowerCase().includes(q) ||
          pr.barrio?.toLowerCase().includes(q) ||
          pr.localidad?.toLowerCase().includes(q) ||
          pr.typeOfProperty?.name?.toLowerCase().includes(q))
      : favorites;

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'precio_asc':  return (a.property.price ?? 0) - (b.property.price ?? 0);
        case 'precio_desc': return (b.property.price ?? 0) - (a.property.price ?? 0);
        case 'alfabetico':  return (a.property.title ?? '').localeCompare(b.property.title ?? '', 'es');
        // `GET /favorites` no trae fecha de guardado: se respeta el orden en que
        // vino del backend, que es el más reciente primero.
        default: return 0;
      }
    });
  }, [favorites, search, sortBy]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // El userId sale del token en el backend — GET /favorites, sin id en la URL
        const { data } = await api.get('/favorites');
        // Guard defensivo: si el admin borró una propiedad que estaba en
        // favoritos y el backend no cascadeó la fila, `property` puede venir
        // null/undefined. Filtramos esos casos ANTES de renderizar para evitar
        // el TypeError al acceder a property.images/title/price (ver auditoría).
        setFavorites(Array.isArray(data) ? data.filter((f: FavoriteProperty) => Boolean(f?.property)) : []);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchFavorites();
  }, [user]);

  const handleRemove = async (propertyId: number) => {
    setRemovingId(propertyId);
    try {
      await api.delete(`/favorites/${propertyId}`);
      setFavorites(prev => prev.filter(f => f.property_id !== propertyId));
      toast.success('Eliminado de favoritos');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <DashboardPage>
      <DashboardHeader
        icon={Heart}
        title="Favoritos"
        subtitle={
          loading
            ? 'Cargando…'
            : search
              ? `${visible.length} de ${favorites.length} propiedades guardadas`
              : 'Las propiedades que guardaste'
        }
        actions={!loading && favorites.length > 0 ? (
          <span className="rounded-full bg-[#0b7a4b]/10 px-3 py-1.5 text-xs font-bold text-[#0b7a4b]">
            {favorites.length} {favorites.length === 1 ? 'propiedad' : 'propiedades'}
          </span>
        ) : undefined}
      />

      {!loading && favorites.length > 0 && (
        <ListToolbar>
          <ListSearch value={search} onChange={setSearch} placeholder="Buscar por título, barrio, localidad o tipo..." />
          <ListSelect value={sortBy} onChange={(v) => setSortBy(v as SortBy)} label="Ordenar favoritos" icon={ArrowUpDown}>
            <option value="recientes">Guardadas primero</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
            <option value="alfabetico">Alfabético (A-Z)</option>
          </ListSelect>
        </ListToolbar>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-40 bg-gray-100" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                <div className="h-5 bg-gray-100 rounded-full w-1/3 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && favorites.length === 0 && (
        <div className="bg-white rounded-xl p-12 border border-gray-100 shadow-sm flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <Heart size={28} className="text-red-300" />
          </div>
          <div>
            <p className="font-bold text-gray-700">No tenés favoritos todavía</p>
            <p className="text-sm text-gray-400 mt-1">Guardá propiedades que te interesen para verlas acá</p>
          </div>
          <Link href="/properties"
            className="mt-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
            Ver propiedades
          </Link>
        </div>
      )}

      {/* Sin coincidencias — distinto de "no tenés favoritos". */}
      {!loading && favorites.length > 0 && visible.length === 0 && (
        <NoMatches onClear={() => setSearch('')} message="Ninguno de tus favoritos coincide con esa búsqueda." />
      )}

      {/* Grid de cards */}
      {!loading && visible.length > 0 && (
        <ListReveal className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map(({ property, property_id }) => {
            const coverImage = property.images?.find(i => i.isCover)?.url ?? property.images?.[0]?.url;
            return (
              <ListReveal.Item key={property_id}
                className="group bg-white rounded-xl overflow-hidden border border-ink-100 shadow-[0_1px_2px_rgba(10,12,11,0.04),0_8px_24px_-12px_rgba(10,12,11,0.12)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-brand-700/25 hover:shadow-[0_2px_4px_rgba(10,12,11,0.05),0_18px_40px_-16px_rgba(6,57,35,0.28)]">

                {/* ── Imagen — SIN Link, para que el botón eliminar no navegue ── */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  {/* El zoom de la imagen usa 700ms + ease-out: el mismo que
                      `PropertyCard` y `FeaturedPropertyCard`. Estaba en 500, así
                      que la misma tarjeta de propiedad se movía distinto según
                      si la mirabas en el catálogo o acá. */}
                  <Link href={`/properties/${property_id}`} className="block w-full h-full">
                    {coverImage ? (
                      <Image src={coverImage} alt={property.title} fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home size={32} className="text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-white bg-[#0b7a4b] px-2.5 py-1 rounded-full">
                      {property.operationType}
                    </span>
                    <p className="absolute bottom-3 left-4 text-lg font-black text-white drop-shadow-lg">
                      USD {property.price.toLocaleString('es-AR')}
                    </p>
                  </Link>

                  {/* ← Botón FUERA del Link, no navega */}
                  <button
                    onClick={() => handleRemove(property_id)}
                    disabled={removingId === property_id}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 shadow-sm z-10">
                    {removingId === property_id
                      ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <Link href={`/properties/${property_id}`}>
                    <p className="font-bold text-[#0b7a4b] transition-colors line-clamp-1 mb-1">
                      {property.title}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                    <MapPin size={11} className="text-[#0b7a4b] shrink-0" />
                    {property.barrio}, {property.localidad}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Bed size={11} /> {property.rooms}</span>
                      <span className="flex items-center gap-1"><Bath size={11} /> {property.bathrooms}</span>
                      {property.supTotal != null && (
                        <span className="flex items-center gap-1"><Maximize size={11} /> {property.supTotal} m²</span>
                      )}
                    </div>
                    <Link href={`/properties/${property_id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-[#0b7a4b] hover:gap-2 transition-all">
                      Ver <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </ListReveal.Item>
            );
          })}
        </ListReveal>
      )}

    </DashboardPage>
  );
}