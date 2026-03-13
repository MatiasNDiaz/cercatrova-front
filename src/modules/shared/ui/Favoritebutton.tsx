'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  propertyId: number;
  variant?: 'card' | 'default';
}

export function FavoriteButton({ propertyId, variant = 'default' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const check = async () => {
      try {
        const { data } = await api.get(`/favorites/${user.id}`);
        setIsFavorite(data.some((f: { property_id: number }) => f.property_id === propertyId));
      } catch {}
      finally { setLoading(false); }
    };
    check();
  }, [user, propertyId]);

  const handleToggle = async () => {
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${user.id}/${propertyId}`);
        setIsFavorite(false);
        toast.success('Eliminado de favoritos');
      } else {
        await api.post(`/favorites/${propertyId}`);
        setIsFavorite(true);
        toast.success('Agregado a favoritos ❤️');
      }
    } catch {
      toast.error('No se pudo actualizar favoritos');
    } finally {
      setLoading(false);
    }
  };

  // ── Variante card — círculo blanco sobre la imagen ──
  if (variant === 'card') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg disabled:opacity-50">
        <Heart
          size={18}
          className={`transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-[#0b7a4b] hover:text-red-500'}`}
        />
      </button>
    );
  }

  // ── Variante default — botón con texto ──
  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-all duration-300 disabled:opacity-50
        ${isFavorite
          ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
          : 'bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-400'
        }`}>
      <Heart
        size={16}
        className={`transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
      />
      {loading ? 'Cargando...' : isFavorite ? 'En favoritos' : 'Guardar'}
    </button>
  );
}