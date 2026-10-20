import { unstable_cache } from 'next/cache';
import api from '@/modules/shared/lib/axios';
import { propertiesService } from '../services/properties.service';
import {
  buildPromoBadgeContext, EMPTY_PROMO_CONTEXT, PROMO_TOP_N, type PromoBadgeContext,
} from './promoBadges';

/**
 * Contexto de etiquetas promocionales — SOLO servidor (catálogo, detalle y
 * landing lo piden en su Server Component y lo bajan por props).
 *
 * Dos lecturas al backend, en paralelo:
 *  - las `PROMO_TOP_N` más recientes: `GET /properties/filter` sin filtros,
 *    cuyo orden por defecto es `created_at DESC` (el mismo del catálogo);
 *  - personas distintas por propiedad en 7 días:
 *    `GET /tracking/properties/weekly-visitors`.
 *
 * ── Por qué con caché (5 minutos) ───────────────────────────────────────────
 * Todo el SSR sale de las IPs de Vercel, y el backend limita a 100 requests
 * por minuto POR IP. Sin caché, cada visita al catálogo sumaría dos requests a
 * ese cupo compartido. Las etiquetas no necesitan frescura al segundo: una
 * propiedad nueva o un cambio en las vistas aparecen en ≤5 min, el mismo
 * criterio que el ISR de la landing.
 */
const loadContext = unstable_cache(
  async (): Promise<PromoBadgeContext> => {
    const [newest, weekly] = await Promise.all([
      propertiesService.getFilteredProperties({ page: 1, limit: PROMO_TOP_N }),
      // Sin vistas, la etiqueta VISTA POR X PERSONAS no aparece; el resto sí.
      api
        .get<{ items?: { propertyId: number; visitors: number }[] }>('/tracking/properties/weekly-visitors')
        .then((r) => r.data?.items ?? [])
        .catch(() => []),
    ]);
    return buildPromoBadgeContext(newest?.data ?? [], weekly);
  },
  ['promo-badge-context-v1'],
  { revalidate: 300 },
);

/**
 * Nunca rompe la página que la pide: si el backend no responde, no hay
 * etiquetas y todo lo demás se renderiza igual. (Un error no queda cacheado:
 * la próxima request vuelve a intentar.)
 */
export async function getPromoBadgeContext(): Promise<PromoBadgeContext> {
  try {
    return await loadContext();
  } catch {
    return EMPTY_PROMO_CONTEXT;
  }
}
