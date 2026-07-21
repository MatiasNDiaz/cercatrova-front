import Image from 'next/image';
import Link from 'next/link';
import { Bed, Toilet, Maximize, MapPin, Star, ArrowRight } from 'lucide-react';
import { Property } from '@/modules/shared/types/api';

/**
 * Tarjeta de propiedad para la sección "Destacadas" de la landing.
 *
 * Es un componente aparte de `PropertyCard` (catálogo) a propósito: muestra el
 * badge de valoración (`ratingAverage`), usa el tipo canónico de
 * shared/types/api y tiene más presencia visual. `PropertyCard` no se tocó.
 *
 * Rediseño (Bloque LANDING §7):
 *  - **Sin `FavoriteButton`.** Se quitó SOLO de esta sección: la landing es la
 *    puerta de entrada y el ícono empujaba a `/login` a quien todavía no tiene
 *    cuenta. Favoritos sigue funcionando igual en `/properties` y en el detalle.
 *  - Tono más empresarial: `rounded-xl` en vez de `rounded-3xl`, imagen más
 *    alta (h-64) y tarjeta más grande, para que la propiedad sea protagonista.
 *  - Precio con signo `$` y separador de miles en formato local.
 *  - La tarjeta es blanca sobre fondo `surface` gris, así que se despega del
 *    fondo sin depender solo de la sombra.
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

  const rating =
    typeof ratingAverage === 'number' && ratingAverage > 0 ? ratingAverage : null;

  return (
    <Link
      href={`/properties/${id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink-200/70 bg-white shadow-[0_2px_10px_-2px_rgba(10,12,11,0.08)] transition-all duration-400 hover:-translate-y-1.5 hover:border-brand-700/40 hover:shadow-[0_28px_55px_-18px_rgba(6,57,35,0.4)]"
    >
      {/* ── IMAGEN ── */}
      <div className="relative h-64 w-full shrink-0 overflow-hidden">
        <Image
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-ink-950/80 via-ink-950/10 to-transparent" />

        {/* Operación */}
        <span className="absolute top-4 left-4 rounded-md bg-brand-700 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-white uppercase shadow-md">
          {operationType}
        </span>

        {/* Valoración */}
        {rating && (
          <span className="absolute top-4 right-4 flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-bold text-ink-900 shadow-md backdrop-blur-sm">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </span>
        )}

        {/* Precio */}
        <div className="absolute bottom-4 left-5">
          <p className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
            ${price.toLocaleString('es-AR')}
            <span className="ml-1.5 text-base font-semibold text-white/80">USD</span>
          </p>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="flex grow flex-col p-6">
        <span className="text-[11px] font-bold tracking-[0.14em] text-brand-700 uppercase">
          {typeOfProperty?.name || 'Propiedad'}
        </span>

        <h3 className="mt-2 line-clamp-2 text-xl font-bold leading-snug text-ink-900 transition-colors duration-300 group-hover:text-brand-700">
          {title}
        </h3>

        <div className="mt-2.5 flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin size={15} className="shrink-0 text-brand-700" />
          <span className="line-clamp-1">
            {localidad}
            {barrio ? `, ${barrio}` : ''}
          </span>
        </div>

        {/* Características */}
        <div className="mt-auto flex items-center gap-5 border-t border-ink-100 pt-5 text-sm text-ink-600">
          <span className="flex items-center gap-1.5">
            <Bed size={16} className="text-brand-700" />
            <span className="font-semibold">{rooms}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Toilet size={16} className="text-brand-700" />
            <span className="font-semibold">{bathrooms}</span>
          </span>
          {m2 != null && (
            <span className="flex items-center gap-1.5">
              <Maximize size={16} className="text-brand-700" />
              <span className="font-semibold">{m2} m²</span>
            </span>
          )}

          <span className="ml-auto flex items-center text-brand-700 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
            <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default FeaturedPropertyCard;
