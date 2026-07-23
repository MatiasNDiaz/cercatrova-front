'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bed, Toilet, Maximize, Hourglass, MapPin, Star } from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import { Property } from '../interfaces/propertyInterface';
import { FavoriteButton } from '@/modules/shared/ui/Favoritebutton';
import { whatsappLink } from '@/modules/shared/lib/contact';
import { BADGE_BASE, operationBadgeColor, propertyTypeBadgeColor } from '../lib/badgeStyles';

/**
 * Tarjeta de propiedad del catálogo — vista LISTA (Bloque 3 del rediseño).
 *
 * Fila ancha: imagen a la izquierda, datos al medio, precio + contacto a la
 * derecha. Reemplaza al `PropertyCardList` que estaba embebido en
 * `Propertiescatalog.tsx`, con dos correcciones:
 *  - Tokens `brand-*`/`ink-*` en vez de hex hardcodeado.
 *  - **El botón de favorito ahora funciona de verdad** (`FavoriteButton`): la
 *    versión anterior tenía un ícono de corazón decorativo, sin `onClick` ni
 *    `propertyId`, que daba la impresión de que favoritos andaba en esta vista.
 */
export function PropertyRow({ property }: { property: Property }) {
  const {
    id, title, price, rooms, bathrooms, m2, antiquity,
    localidad, barrio, description, images, typeOfProperty, operationType, ratingAverage,
  } = property;

  const rating =
    typeof ratingAverage === 'number' && ratingAverage > 0 ? ratingAverage : null;

  const cover =
    images?.find((img) => img.isCover)?.url ||
    images?.[0]?.url ||
    '/placeholder-house.jpg';

  const wa = whatsappLink(
    `¡Hola! Estoy interesado en la propiedad "${title}" (ID: ${id}). ¿Podrían darme más información?`
  );

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(10,12,11,0.04),0_10px_28px_-14px_rgba(10,12,11,0.12)] transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-brand-600/50 hover:shadow-[0_32px_65px_-18px_rgba(6,57,35,0.25)] sm:flex-row">
      {/* ── IMAGEN ── */}
      <Link href={`/properties/${id}`} className="relative h-52 w-full shrink-0 overflow-hidden sm:h-auto sm:w-72">
        <Image
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, 288px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <span className={`absolute top-4 left-4 ${BADGE_BASE} ${operationBadgeColor(operationType)}`}>
          {operationType}
        </span>
      </Link>

      {/* ── CONTENIDO ── */}
      <Link href={`/properties/${id}`} className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 p-6">
        <div className="flex items-center gap-2.5">
          <span className={`${BADGE_BASE} ${propertyTypeBadgeColor(typeOfProperty?.name)}`}>
            {typeOfProperty?.name || 'Propiedad'}
          </span>
          {rating && (
            <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-ink-900">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        <h3 className="line-clamp-1 text-xl font-bold text-ink-900 transition-colors duration-300 group-hover:text-brand-700">
          {title}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin size={15} className="shrink-0 text-brand-700" />
          <span className="line-clamp-1">
            {localidad}
            {barrio ? `, ${barrio}` : ''}
          </span>
        </div>

        {description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-500">{description}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {[
            { icon: Bed, value: rooms, label: 'Hab.' },
            { icon: Toilet, value: bathrooms, label: 'Baños' },
            { icon: Hourglass, value: antiquity, label: 'Años' },
            { icon: Maximize, value: `${m2} m²`, label: 'Sup.' },
          ].map(({ icon: Icon, value, label }, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs">
              <Icon size={14} className="text-brand-700" />
              <span className="font-bold text-brand-700">{value}</span>
              <span className="font-medium text-ink-400 uppercase">{label}</span>
            </span>
          ))}
        </div>
      </Link>

      {/* ── PRECIO + CONTACTO ── */}
      <div className="flex shrink-0 flex-col items-start justify-between gap-4 border-t border-ink-100 p-6 sm:w-56 sm:items-end sm:border-t-0 sm:border-l sm:text-right">
        <div className="sm:text-right">
          <p className="text-[11px] font-bold tracking-widest text-ink-400 uppercase">Precio</p>
          <p className="text-2xl font-black text-brand-700">
            ${price.toLocaleString('es-AR')}
            <span className="ml-1 text-sm font-semibold text-ink-500">USD</span>
          </p>
        </div>

        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(6,57,35,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-800 active:scale-[0.98] sm:w-auto"
        >
          <BsWhatsapp size={15} />
          Contactar
        </a>
      </div>

      {/* ── Favorito (FUERA de los Links) ── */}
      <div className="absolute top-3.5 right-3.5 z-10 sm:right-[14.5rem]">
        <FavoriteButton propertyId={id} variant="card" />
      </div>
    </div>
  );
}

export default PropertyRow;
