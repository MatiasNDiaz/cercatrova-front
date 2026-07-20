'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bed, Toilet, Maximize, MapPin, Star } from 'lucide-react';
import { Property } from '@/modules/shared/types/api';
import { FavoriteButton } from '@/modules/shared/ui/Favoritebutton';

/**
 * Tarjeta de propiedad para la sección "Destacadas" de la landing.
 *
 * Es un componente NUEVO y aparte de `PropertyCard` (catálogo) a propósito:
 *  - muestra el badge de valoración (`ratingAverage`), que la del catálogo no tiene;
 *  - usa el tipo canónico `Property` de shared/types/api (el del catálogo usa el
 *    tipo viejo del módulo properties, sin `ratingAverage`);
 *  - tiene más presencia visual (imagen más alta, precio en barra inferior).
 *
 * No se tocó `PropertyCard` para no alterar el catálogo en esta sesión.
 */

export function FeaturedPropertyCard({ property }: { property: Property }) {
  const {
    id, title, price, rooms, bathrooms, m2,
    localidad, barrio, images, typeOfProperty, operationType, ratingAverage,
  } = property;

  const cover =
    images?.find((img) => img.isCover)?.url ||
    images?.[0]?.url ||
    '/placeholder-house.jpg';

  const rating = typeof ratingAverage === 'number' && ratingAverage > 0
    ? ratingAverage
    : null;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_4px_24px_-8px_rgba(10,12,11,0.12)] ring-1 ring-ink-100 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-16px_rgba(11,122,75,0.35)] hover:ring-brand-700/30">
      <Link href={`/properties/${id}`} className="flex h-full flex-col">
        {/* ── IMAGEN ── */}
        <div className="relative h-56 w-full shrink-0 overflow-hidden">
          <Image
            src={cover}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink-950/75 via-ink-950/10 to-transparent" />

          {/* Operación */}
          <span className="absolute top-4 left-4 rounded-full bg-brand-700 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-white uppercase shadow-sm">
            {operationType}
          </span>

          {/* Valoración */}
          {rating && (
            <span className="absolute top-4 right-14 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink-900 shadow-sm backdrop-blur-sm">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </span>
          )}

          {/* Precio */}
          <p className="absolute bottom-3 left-4 text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {price.toLocaleString('es-AR')} USD
          </p>
        </div>

        {/* ── CONTENIDO ── */}
        <div className="flex grow flex-col p-5">
          <span className="text-[11px] font-bold tracking-[0.12em] text-brand-700 uppercase">
            {typeOfProperty?.name || 'Propiedad'}
          </span>

          <h3 className="mt-1.5 line-clamp-1 text-lg font-bold text-ink-900 transition-colors duration-300 group-hover:text-brand-700">
            {title}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
            <MapPin size={14} className="shrink-0 text-brand-700" />
            <span className="line-clamp-1">{localidad}{barrio ? `, ${barrio}` : ''}</span>
          </div>

          {/* Características */}
          <div className="mt-auto flex items-center gap-4 border-t border-ink-100 pt-4 text-sm text-ink-600">
            <span className="flex items-center gap-1.5">
              <Bed size={15} className="text-brand-700" />
              <span className="font-semibold">{rooms}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Toilet size={15} className="text-brand-700" />
              <span className="font-semibold">{bathrooms}</span>
            </span>
            {m2 != null && (
              <span className="flex items-center gap-1.5">
                <Maximize size={15} className="text-brand-700" />
                <span className="font-semibold">{m2} m²</span>
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Favorito fuera del Link para que no dispare la navegación */}
      <div className="absolute top-3.5 right-4 z-10">
        <FavoriteButton propertyId={id} variant="card" />
      </div>
    </article>
  );
}

export default FeaturedPropertyCard;
