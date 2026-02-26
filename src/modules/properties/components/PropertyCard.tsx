'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bed, Maximize, MapPin, Heart, Toilet, Hourglass } from 'lucide-react';
import { Property, PropertyImage } from '../interfaces/propertyInterface';

export const PropertyCard = ({ property }: { property: Property }) => {
  const {
    id,
    title,
    price,
    rooms,
    bathrooms,
    m2,
    localidad,
    barrio,
    images,
    typeOfProperty,
    operationType,
    antiquity,
  } = property;

  const coverImage =
    images?.find((img: PropertyImage) => img.isCover)?.url ||
    images?.[0]?.url ||
    '/placeholder-house.jpg';

  return (
    <div className="w-[95%] mx-auto py-3">
      <div className="group relative rounded-3xl overflow-hidden bg-white hover:border border-[#0b7a4b]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(11,122,75,0.2)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 flex flex-col h-full">

        {/* ── LINK que envuelve toda la card ── */}
        <Link href={`/properties/${id}`} className="flex flex-col grow">

          {/* IMAGE */}
          <div className="relative h-60 sm:h-72 w-full overflow-hidden">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-1200 ease-out group-hover:scale-105"
            />

            {/* Dark gradient */}
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/20 to-transparent" />

            {/* Operation badge */}
            <div className="absolute top-5 left-5">
              <span className="bg-[#179144] text-white text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-[0.15em] shadow-md">
                {operationType}
              </span>
            </div>

            {/* Price over image */}
            <div className="absolute inset-0 flex items-end mb-3 justify-center">
              <p className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg tracking-tight [text-shadow:2px_2px_8px_rgba(0,0,0,1)]">
                {price.toLocaleString()} USD
              </p>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6 flex flex-col grow">

            {/* Type */}
            <span className="text-[#0b7a4b] text-xs font-semibold uppercase tracking-[0.12em] mb-1.5">
              tipo: {typeOfProperty?.name || 'Propiedad'}
            </span>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-800 line-clamp-1 mb-2 group-hover:text-[#0b7a4b] transition-colors duration-300">
              {title}
            </h3>

            {/* Location */}
            <div className="flex items-center text-gray-600 text-sm mb-4">
              <MapPin size={16} className="mr-2 text-[#0b7a4b] shrink-0" />
              <span className="line-clamp-1">{localidad}, {barrio}</span>
            </div>

            {/* Feature Cards */}
            <div className="mt-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Bed,      value: rooms,        label: 'Hab.' },
                { icon: Toilet,   value: bathrooms,    label: 'Baños' },
                { icon: Hourglass,value: antiquity,    label: 'Años.' },
                { icon: Maximize, value: `${m2} m²`,  label: 'Superficie' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center bg-[#0b7a4b]/10 rounded-2xl py-3 transition-all duration-300 hover:bg-[#0b7a4b]/20 hover:shadow-md"
                  >
                    <Icon size={18} className="text-[#0b7a4b] mb-1" />
                    <span className="text-sm font-semibold text-[#0b7a4b]">{item.value}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Link>

        {/* ── Favorite button FUERA del Link para evitar navegación al clickearlo ── */}
        <button
          aria-label="boton de favoritos"
          className="absolute top-3.5 right-5 p-3 bg-white/90 backdrop-blur-sm rounded-full text-[#0b7a4b] shadow-md transition-all duration-300 hover:scale-110 hover:text-red-500 hover:shadow-lg z-10"
        >
          <Heart size={18} />
        </button>

        {/* Animated bottom line */}
        <div className="absolute bottom-0 left-0 h-0.75 w-0 bg-[#0b7a4b] group-hover:w-full transition-all duration-1000 ease-out" />
      </div>
    </div>
  );
};