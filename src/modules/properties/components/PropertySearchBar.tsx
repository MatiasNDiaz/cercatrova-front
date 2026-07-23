'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { usePropertyFilters } from '@/modules/properties/hooks/usePropertyFilters';

/**
 * Barra de búsqueda de texto libre del catálogo (fila inferior del contenedor
 * de controles, ver `CatalogFilterBar`).
 *
 * Solo el input: escribe `filters.search` en la URL con debounce de 600ms para
 * no disparar un fetch por tecla. El botón de filtros ("Más filtros") y el
 * toggle Venta/Alquiler ya NO viven acá — se movieron a la fila de arriba para
 * mejorar la UX (ver `CatalogFilterBar`).
 */
export function PropertySearchBar() {
  const { filters, setFilters } = usePropertyFilters();
  const [value, setValue] = useState(filters.search || '');
  const isFirstRender = useRef(true);

  // Debounce: no dispara un fetch por cada tecla.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (value === (filters.search || '')) return;

    const timer = setTimeout(() => setFilters({ search: value || undefined }), 600);
    return () => clearTimeout(timer);
  }, [value, setFilters, filters.search]);

  // Resincroniza si la URL cambia desde afuera (ej. al limpiar filtros).
  useEffect(() => {
    setValue(filters.search || '');
  }, [filters.search]);

  return (
    <div className="relative">
      <Search
        size={19}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-brand-700"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscá por zona, tipo de propiedad, 'con patio'..."
        className="h-14 w-full rounded-2xl border border-ink-200 bg-white pl-12 pr-11 text-sm text-ink-900 shadow-[0_2px_10px_-4px_rgba(10,12,11,0.12)] outline-none transition-all duration-200 placeholder:text-ink-400 hover:border-brand-700/40 focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer rounded-full p-1 text-ink-400 transition-colors hover:text-red-500"
        >
          <X size={17} />
        </button>
      )}
    </div>
  );
}

export default PropertySearchBar;
