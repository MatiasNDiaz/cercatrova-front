'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * Lee y escribe UN filtro en la query string de la URL.
 *
 * Es la versión mínima del patrón que ya usa `usePropertyFilters` en el
 * catálogo: la URL es la fuente de verdad del filtro, así el estado sobrevive
 * al refresh, se puede compartir el link y los ítems del sidebar
 * (`?estado=aceptado`, `?rol=admin`, `?accion=editar`…) llevan directo a la
 * vista ya filtrada.
 *
 * @param key    nombre del parámetro, ej. 'estado'
 * @param fallback valor cuando el parámetro no está en la URL
 */
export function useUrlFilter<T extends string>(key: string, fallback: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = (searchParams.get(key) as T) || fallback;

  const setValue = useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams.toString());
      // El valor por defecto no ensucia la URL.
      if (!next || next === fallback) params.delete(key);
      else params.set(key, next);

      const qs = params.toString();
      // `scroll: false` para no saltar al tope al cambiar de pestaña.
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [key, fallback, pathname, router, searchParams],
  );

  return [value, setValue] as const;
}
