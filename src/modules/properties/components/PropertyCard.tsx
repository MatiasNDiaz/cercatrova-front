'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bed, Toilet, Maximize, Hourglass, MapPin, ArrowRight, Star } from 'lucide-react';
import { Property, PropertyImage } from '../interfaces/propertyInterface';
import { FavoriteButton } from '@/modules/shared/ui/Favoritebutton';
import { BADGE_BASE, operationBadgeColor, propertyTypeBadgeColor } from '../lib/badgeStyles';
import { priceParts } from '@/modules/shared/lib/money';

/**
 * Tarjeta de propiedad del catálogo — vista MOSAICO (Bloque 3 del rediseño).
 *
 * Rediseñada para compartir ADN visual con `FeaturedPropertyCard` de la Landing:
 * `rounded-xl` (más serio), tokens `brand-*`/`ink-*` (cero hex hardcodeado),
 * sombra suave que se intensifica en hover, imagen que hace zoom sutil, y una
 * barra de gradiente de marca que crece en el borde inferior al pasar el mouse.
 *
 * Diferencia con `FeaturedPropertyCard`: ESTA sí incluye `FavoriteButton`
 * (la Landing lo omite a propósito) y no muestra badge de rating, porque el
 * endpoint del catálogo (`GET /properties/filter`) no devuelve `ratingAverage`.
 */
export const PropertyCard = ({ property }: { property: Property }) => {
  const {
    id, title, price, currency, rooms, bathrooms, supTotal, antiquity,
    localidad, barrio, images, typeOfProperty, operationType, ratingAverage,
  } = property;

  const precio = priceParts(price, currency);

  const cover =
    images?.find((img: PropertyImage) => img.isCover)?.url ||
    images?.[0]?.url ||
    '/placeholder-house.jpg';

  const rating =
    typeof ratingAverage === 'number' && ratingAverage > 0 ? ratingAverage : null;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(10,12,11,0.04),0_10px_28px_-14px_rgba(10,12,11,0.12)] transition-all duration-500 ease-out hover:-translate-y-2 hover:border-brand-600/50 hover:shadow-[0_36px_70px_-20px_rgba(6,57,35,0.28)]">
      <Link href={`/properties/${id}`} className="flex h-full flex-col">
        {/* ── IMAGEN ── */}
        <div className="relative h-60 w-full shrink-0 overflow-hidden">
          {/* `quality={95}`, mismo criterio que el detalle (PARTE 15):
              a partir de 95 next/image deja de recomprimir y, cuando el
              destino pedido es más chico que el original, el ahorro de
              artefactos de compresión se nota igual aunque SÍ haya
              reescalado real. Se mantiene `object-cover` a propósito —acá
              la grilla necesita el recorte uniforme, no la lógica de "foto
              completa" del detalle, que rompería la alineación del mosaico. */}
          <Image
            src={cover}
            alt={title}
            fill
            quality={95}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink-950/80 via-ink-950/10 to-transparent" />

          {/* Operación — color propio según venta/alquiler/temporal */}
          <span className={`absolute top-4 left-4 ${BADGE_BASE} ${operationBadgeColor(operationType)}`}>
            {operationType}
          </span>

          {/* Precio */}
          <div className="absolute bottom-4 left-5">
            <p className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
              {precio.amount}
              <span className="ml-1.5 text-sm font-semibold text-white/80">{precio.code}</span>
            </p>
          </div>

          {/* Valoración */}
          {rating && (
            <span className="absolute right-4 bottom-4 flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-bold text-ink-900 shadow-md backdrop-blur-sm">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* ── CONTENIDO ── */}
        <div className="flex grow flex-col p-6">
          {/* Tipo de propiedad — misma geometría que el badge de operación,
              con su propia gama (terreno=naranja, comercial=rojo, etc.) */}
          <span className={`w-fit ${BADGE_BASE} ${propertyTypeBadgeColor(typeOfProperty?.name)}`}>
            {typeOfProperty?.name || 'Propiedad'}
          </span>

          <h3 className="mt-2.5 line-clamp-1 text-lg font-bold text-ink-900 transition-colors duration-300 group-hover:text-brand-700">
            {title}
          </h3>

          <div className="mt-2.5 flex items-center gap-1.5 text-sm text-ink-500">
            <MapPin size={15} className="shrink-0 text-brand-700" />
            <span className="line-clamp-1">
              {localidad}
              {barrio ? `, ${barrio}` : ''}
            </span>
          </div>

          {/* Características — 4 datos en una sola fila: ambientes, baños,
              Sup. Total y antigüedad.
              Sup. Cubierta NO va acá a propósito: con 5 datos la fila se
              desalineaba y quedaba recargada en el mosaico (sí aparece en el
              detalle, en la vista lista `PropertyRow`, el form y los filtros).
              Sin labels visibles (no hay lugar), así que cada dato lleva ícono
              propio + `title` para identificarlo. */}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-100 pt-5 pb-0.5 text-sm text-ink-600">
            <span className="flex items-center gap-1.5 whitespace-nowrap" title={`${rooms} ambientes`}>
              <Bed size={16} className="shrink-0 text-brand-700" />
              <span className="font-semibold">{rooms}</span>
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap" title={`${bathrooms} baños`}>
              <Toilet size={16} className="shrink-0 text-brand-700" />
              <span className="font-semibold">{bathrooms}</span>
            </span>
            {supTotal != null && (
              <span className="flex items-center gap-1.5 whitespace-nowrap" title={`Sup. Total: ${supTotal} m²`}>
                <Maximize size={16} className="shrink-0 text-brand-700" />
                <span className="font-semibold">{supTotal} m²</span>
              </span>
            )}
            {antiquity != null && (
              <span className="flex items-center gap-1.5 whitespace-nowrap" title={`Antigüedad: ${antiquity} años`}>
                <Hourglass size={16} className="shrink-0 text-brand-700" />
                <span className="font-semibold">{antiquity} años</span>
              </span>
            )}
            <span className="flex shrink-0 items-center text-brand-700 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
              <ArrowRight size={18} />
            </span>
          </div>
        </div>
      </Link>

      {/* ── Favorito (FUERA del Link) ── */}
      <div className="absolute top-3.5 right-4 z-10">
        <FavoriteButton propertyId={id} variant="card" />
      </div>

      {/* Barra de gradiente de marca que crece en hover */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 ease-out group-hover:w-full"
        style={{ background: 'var(--gradient-brand)' }}
      />
    </div>
  );
};

export default PropertyCard;
