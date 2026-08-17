'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { loginUrlWithReturn, currentPathWithQuery } from '@/modules/shared/lib/returnTo';

interface FavoriteButtonProps {
  propertyId: number;
  variant?: 'card' | 'default';
}

export function FavoriteButton({ propertyId, variant = 'default' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Favoritos es exclusivo de los usuarios comunes: TODAS las rutas de
  // `/favorites` llevan `@Roles(Role.USER)` con `RolesGuard`, así que un admin
  // logueado recibe 403 en el GET de chequeo y en el toggle. Mostrarle un
  // corazón que siempre falla es peor que no mostrarlo.
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user || isAdmin) { setLoading(false); return; }
    const check = async () => {
      try {
        // El userId sale del token en el backend — GET /favorites, sin id en la URL
        const { data } = await api.get('/favorites');
        setIsFavorite(data.some((f: { property_id: number }) => f.property_id === propertyId));
      } catch {}
      finally { setLoading(false); }
    };
    check();
  }, [user, isAdmin, propertyId]);

  if (isAdmin) return null;

  const handleToggle = async () => {
    if (!user) {
      // Vuelve a ESTA propiedad después de loguearse, en vez de aterrizar en
      // el dashboard y tener que buscarla de nuevo.
      router.push(loginUrlWithReturn(currentPathWithQuery() ?? '/'));
      return;
    }
    setLoading(true);
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${propertyId}`);
        setIsFavorite(false);
        toast.success('Eliminado de favoritos');
      } else {
        await api.post(`/favorites/${propertyId}`);
        setIsFavorite(true);
        toast.success('Agregado a favoritos ❤️');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
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
        className="cursor-pointer rounded-full bg-white/90 p-3 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-90 disabled:opacity-50">
        <Heart
          size={18}
          className={`transition-all duration-300 ${isFavorite ? 'scale-110 fill-red-500 text-red-500' : 'text-[#0b7a4b] hover:text-red-500'}`}
        />
      </button>
    );
  }

  // ── Variante default — botón con texto ──
  //
  // ⚠️ Solo la usa la barra de accesos rápidos del detalle de propiedad, así que
  // se maqueta para encajar en ESA fila:
  //
  //  · **Mobile**: `w-full` + `justify-center`. Es una celda más de la grilla
  //    2x3 de accesos rápidos, y tiene que llenarla igual que los otros cinco
  //    (si no, quedaba un botón angosto y descentrado en la última fila).
  //    `rounded-xl` + `py-2.5` + `text-xs` para que coincida exactamente con
  //    `QUICK_LINK_BASE`; a partir de `sm` vuelve a su geometría propia.
  //
  //  · **Gris base más oscuro**: era `border-gray-200 text-gray-500` sobre
  //    blanco — contra la tarjeta blanca de la barra el borde casi no existía y
  //    el texto se leía como deshabilitado, cuando es el único botón con acción
  //    real de toda la fila. Ahora usa la escala `ink` del sistema
  //    (`border-ink-300` / `text-ink-700`), que es el mismo peso visual que los
  //    íconos de los accesos rápidos de al lado.
  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 sm:w-auto sm:rounded-2xl sm:text-sm
        ${isFavorite
          ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
          : 'bg-white border-ink-300 text-ink-700 hover:border-red-300 hover:text-red-500'
        }`}>
      <Heart
        size={16}
        className={`shrink-0 transition-all duration-300 ${isFavorite ? 'scale-110 fill-red-500 text-red-500' : ''}`}
      />
      {loading ? 'Cargando...' : isFavorite ? 'En favoritos' : 'Guardar'}
    </button>
  );
}