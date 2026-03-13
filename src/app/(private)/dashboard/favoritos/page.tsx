'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import {
  Heart, MapPin, Bed, Bath, Maximize, Trash2, Home, ArrowRight,
} from 'lucide-react';

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
    m2: number;
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

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data } = await api.get(`/favorites/${user!.id}`);
        setFavorites(data);
      } catch {
        toast.error('No se pudieron cargar los favoritos');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchFavorites();
  }, [user]);

  const handleRemove = async (propertyId: number) => {
    setRemovingId(propertyId);
    try {
      // ← Fix: orden correcto userId/propertyId
      await api.delete(`/favorites/${user!.id}/${propertyId}`);
      setFavorites(prev => prev.filter(f => f.property_id !== propertyId));
      toast.success('Eliminado de favoritos');
    } catch {
      toast.error('No se pudo eliminar el favorito');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Favoritos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Las propiedades que guardaste</p>
        </div>
        {!loading && favorites.length > 0 && (
          <span className="text-xs font-bold text-[#0b7a4b] bg-[#0b7a4b]/10 px-3 py-1.5 rounded-full">
            {favorites.length} {favorites.length === 1 ? 'propiedad' : 'propiedades'}
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
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
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm flex flex-col items-center gap-4 text-center">
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

      {/* Grid de cards */}
      {!loading && favorites.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map(({ property, property_id }) => {
            const coverImage = property.images?.find(i => i.isCover)?.url ?? property.images?.[0]?.url;
            return (
              <div key={property_id}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

                {/* ── Imagen — SIN Link, para que el botón eliminar no navegue ── */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  <Link href={`/properties/${property_id}`} className="block w-full h-full">
                    {coverImage ? (
                      <Image src={coverImage} alt={property.title} fill className="object-cover text-[#0b7a4b] group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home size={32} className="text-gray-300" />
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
                      <span className="flex items-center gap-1"><Maximize size={11} /> {property.m2} m²</span>
                    </div>
                    <Link href={`/properties/${property_id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-[#0b7a4b] hover:gap-2 transition-all">
                      Ver <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}