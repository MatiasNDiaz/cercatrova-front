import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { PropertyFilters } from '../interfaces/property-filters.interface';
import { OperationType } from '../interfaces/operation-type'; 
import { StatusProperty } from '../interfaces/status-property';

export const usePropertyFilters = () => {
  // funciona como los Links de Nextjs, basicamente con router.push(/) te lleva a otra sección o pagina
  const router = useRouter();
  // lee los parametros de la URL
  const searchParams = useSearchParams();

  // 1. EL LECTOR (useMemo): Transforma la URL en un objeto tipado
  const filters = useMemo((): PropertyFilters => {
    // Función auxiliar para no repetir la lógica de conversión a número
    const getNum = (key: string) => {
      const val = searchParams.get(key);
      return val ? Number(val) : undefined;
    };

    // Función auxiliar para boletos ('true' -> true)
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
      search: searchParams.get('search') || '',
      title: searchParams.get('title') || '',
      status: searchParams.get('status') as StatusProperty || undefined,
      
      // Ubicación
      provincia: searchParams.get('provincia') || '',
      localidad: searchParams.get('localidad') || '',
      barrio: searchParams.get('barrio') || '',
      zone: searchParams.get('zone') || '',

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
    // typeOfProperty=casa
    const params = new URLSearchParams(searchParams.toString());


    Object.entries(newFilters).forEach(([key, value]) => {
      // Si el valor es null, undefined o vacío, eliminamos el parámetro para limpiar la URL
      if (value === undefined || value === '' || value === null) {
        params.delete(key);
      } else {
        // Guardamos todo como string
        params.set(key, String(value));
      }
    });

    // REGLA DE ORO: Si cambias cualquier filtro que no sea la página,
    // volvemos automáticamente a la página 1 para evitar resultados vacíos.
    if (newFilters.page === undefined) {
      params.set('page', '1');
    }

    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // 3. LIMPIEZA (Opcional pero útil): Para resetear todo de un golpe
  const clearFilters = useCallback(() => {
    router.push('?page=1&limit=10');
  }, [router]);

  return { filters, setFilters, clearFilters };
};