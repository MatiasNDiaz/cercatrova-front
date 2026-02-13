'use client';

import Image from 'next/image';
import { Bed, Maximize, MapPin, Heart, Toilet, Hourglass } from 'lucide-react';
import { Property, PropertyImage } from '../interfaces/propertyInterface';

export const PropertyCard = ({ property }: { property: Property }) => {
  const { 
    title, price, rooms, bathrooms, m2, 
    localidad, barrio, images, typeOfProperty, operationType, antiquity, 
  } = property;

  const coverImage = images?.find((img: PropertyImage) => img.isCover)?.url || images?.[0]?.url || '/placeholder-house.jpg';

  return (
    /* Ajuste estructural: 'w-full' para que el padre controle el ancho, 
       y 'flex-1' para que todas las cards en una misma fila estiren igual 
    */
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden  border-green-100 flex flex-col h-full w-full">
      
      {/* Imagen: Contenedor con altura fija para mantener alineación horizontal */}
      <div className="relative h-56 w-full overflow-hidden shrink-0">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Badge */}
        <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow">
          {operationType}
        </div>

        {/* Favoritos */}
        <button
          aria-label="boton de favoritos"
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-green-700 hover:text-red-500 transition-colors shadow"
        >
          <Heart size={18} />
        </button>
      </div>

      {/* Contenido: grow permite que este bloque empuje los iconos hacia abajo */}
      <div className="p-5 flex flex-col grow">
        <div className="flex justify-between items-start mb-2">
          <span className="text-green-600 text-xs font-semibold uppercase tracking-wider">
            {typeOfProperty?.name || 'Propiedad'}
          </span>
          <p className="text-xl font-bold text-green-800">
            USD {price.toLocaleString()}
          </p>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 line-clamp-1 mb-1">
          {title}
        </h3>

        <div className="flex items-center text-gray-500 text-sm mb-4">
          <MapPin size={14} className="mr-1 text-green-600 shrink-0" />
          <span className="line-clamp-1">{barrio}, {localidad}</span>
        </div>

        {/* Características: mt-auto garantiza que siempre estén al fondo de la card */}
        <div className="mt-auto pt-4 border-t border-green-100 flex justify-between items-center text-green-700">
          <div className="flex items-center gap-1">
            <Bed size={16} />
            <span className="text-sm font-medium">{rooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Toilet size={16} />
            <span className="text-sm font-medium">{bathrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Hourglass size={16} />
            <span className="text-sm font-medium">{antiquity}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize size={16} />
            <span className="text-sm font-medium">{m2} m²</span>
          </div>
        </div>
      </div>
    </div>
  );
};