'use client';

import { useEffect, useState } from 'react';

/**
 * `true` si la media query matchea. Para los casos donde el breakpoint tiene
 * que decidir un VALOR de JavaScript y no una clase de CSS.
 *
 * Casi todo el responsive del proyecto se resuelve con las utilidades de
 * Tailwind (`sm:`/`lg:`), que es lo preferible: no cuestan JS ni provocan
 * re-render. Este hook es para lo que Tailwind no alcanza — por ejemplo el
 * `width` del eje Y de Recharts, que es una prop numérica de un componente de
 * canvas, no una clase.
 *
 * Arranca en `false` y se corrige en el efecto: durante el render del servidor
 * no hay `window`, y devolver siempre el valor de desktop evita un desajuste
 * de hidratación (el primer paint en el cliente coincide con el del servidor y
 * recién después se ajusta).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Atajo para el breakpoint `sm` de Tailwind (640px). */
export function useIsNarrow(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

export default useMediaQuery;
