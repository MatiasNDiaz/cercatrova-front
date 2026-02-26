import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { PropertyFilters } from '../interfaces/property-filters.interface';
import { OperationType } from '../interfaces/operation-type'; 
import { StatusProperty } from '../interfaces/status-property';

const FILTERS_THAT_RESET_PAGE = [
  'search', 'operationType', 'typeOfPropertyId', 'localidad', 'barrio',
  'zone', 'provincia', 'rooms', 'bathrooms', 'minPrice', 'maxPrice',
  'minM2', 'maxM2', 'maxAntiquity', 'garage', 'patio', 'property_deed', 'title', 'status'
];

export const usePropertyFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. EL LECTOR (useMemo): Transforma la URL en un objeto tipado
  const filters = useMemo((): PropertyFilters => {
    const getNum = (key: string) => {
      const val = searchParams.get(key);
      return val ? Number(val) : undefined;
    };

    const getBool = (key: string) => {
      const val = searchParams.get(key);
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    };

    return {
      // Paginación
      page: getNum('page') || 1,
      limit: getNum('limit') || 10,

      // Texto e Inteligencia
      search: searchParams.get('search') || undefined,
      title: searchParams.get('title') || undefined,
      status: searchParams.get('status') as StatusProperty || undefined,
      
      // Ubicación
      provincia: searchParams.get('provincia') || undefined,
      localidad: searchParams.get('localidad') || undefined,
      barrio: searchParams.get('barrio') || undefined,
      zone: searchParams.get('zone') || undefined,

      // Números exactos e IDs
      rooms: getNum('rooms'),
      bathrooms: getNum('bathrooms'),
      typeOfPropertyId: getNum('typeOfPropertyId'),

      // Rangos
      minPrice: getNum('minPrice'),
      maxPrice: getNum('maxPrice'),
      minM2: getNum('minM2'),
      maxM2: getNum('maxM2'),
      maxAntiquity: getNum('maxAntiquity'),

      // Booleanos
      garage: getBool('garage'),
      patio: getBool('patio'),
      property_deed: getBool('property_deed'),

      // Enums
      operationType: searchParams.get('operationType') as OperationType || undefined,
    };
  }, [searchParams]);

  // 2. EL ESCRITOR (useCallback): Actualiza la URL manteniendo los filtros existentes
  const setFilters = useCallback((newFilters: Partial<PropertyFilters>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    // REGLA DE ORO INTELIGENTE: solo resetea a página 1 si el filtro
    // que cambió tiene un valor real (no undefined/null/vacío)
    if (newFilters.page === undefined) {
      const shouldResetPage = Object.entries(newFilters).some(
        ([key, value]) =>
          FILTERS_THAT_RESET_PAGE.includes(key) &&
          value !== undefined &&
          value !== null &&
          value !== ''
      );

      if (shouldResetPage) {
        params.set('page', '1');
      }
    }

    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // 3. LIMPIEZA: Para resetear todo de un golpe
  const clearFilters = useCallback(() => {
    router.push('?page=1&limit=10');
  }, [router]);

  return { filters, setFilters, clearFilters };
};