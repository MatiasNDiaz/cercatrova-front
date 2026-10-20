import { Property, StatusProperty } from '@/modules/shared/types/api';

/**
 * Etiquetas promocionales de las tarjetas (solo presentación — no cambia el
 * orden, los filtros ni la paginación del catálogo).
 *
 * ── Quién lleva etiqueta ─────────────────────────────────────────────────────
 * Las `PROMO_TOP_N` (10) propiedades MÁS RECIENTES del catálogo, una etiqueta
 * cada una. Las demás, ninguna. El ranking sale de `GET /properties/filter`
 * con su orden por defecto (`created_at DESC`), el mismo que ve el visitante
 * al entrar al catálogo — ver `promoBadges.server.ts`.
 *
 * Como depende del id y no de la posición en pantalla, una propiedad lleva la
 * MISMA etiqueta en cualquier página, filtro u orden, y en la landing.
 *
 * ── Qué etiqueta, en orden de prioridad ─────────────────────────────────────
 *  1. `views` — VISTA POR X PERSONAS. Dato REAL: personas distintas que
 *     abrieron la ficha en los últimos 7 días (backend,
 *     `GET /tracking/properties/weekly-visitors`). Solo las `VIEWS_BADGE_MAX`
 *     más vistas del top y con al menos `VIEWS_BADGE_MIN_VISITORS` personas:
 *     "Vista por 1 persona" no promociona nada.
 *  2. `new` — INGRESO RECIENTE. Del `created_at` real: solo los primeros
 *     `RECENT_WINDOW_DAYS` días. Nunca se asigna a mano.
 *  3. Selección editorial (`EDITORIAL_PROMO_BADGES`), si la propiedad figura.
 *  4. Rotación estable por id entre DESTACADA / VISITAS DISPONIBLES /
 *     OPORTUNIDAD, para que las 10 tengan etiqueta y se repartan los colores.
 *
 * Ninguna etiqueta inventa actividad: la única con un número es `views`, y ese
 * número es una medición.
 */
export type PropertyBadgeType = 'featured' | 'visits' | 'new' | 'opportunity' | 'views';

/** Etiqueta asignada. `count` solo existe en `views` (personas en 7 días). */
export interface PromoBadge {
  type: PropertyBadgeType;
  count?: number;
}

/** Cuántas de las más recientes llevan etiqueta. */
export const PROMO_TOP_N = 10;

/** Días que dura INGRESO RECIENTE desde la publicación. */
export const RECENT_WINDOW_DAYS = 7;

/** Como mucho cuántas propiedades muestran VISTA POR X PERSONAS a la vez. */
export const VIEWS_BADGE_MAX = 2;

/** Mínimo de personas distintas en 7 días para mostrar VISTA POR X PERSONAS. */
export const VIEWS_BADGE_MIN_VISITORS = 5;

/**
 * Selección editorial — `id → etiqueta` (dentro del top 10, gana sobre la
 * rotación automática). Elegidas el 2026-10-19 por lo que dice cada
 * publicación: #12 locales frente a la plaza (oportunidad), #19 depto listo
 * para recorrer (visitas), #15 y #10 por presentación y potencial (destacada).
 *
 * `null` apaga la etiqueta de esa propiedad aunque esté en el top 10.
 * No acepta `new` ni `views`: esas dos salen de datos medidos, no de una elección.
 */
export const EDITORIAL_PROMO_BADGES: Readonly<
  Record<number, Exclude<PropertyBadgeType, 'new' | 'views'> | null>
> = {
  19: 'visits',
  15: 'featured',
  12: 'opportunity',
  10: 'featured',
};

/** Rotación de las etiquetas editoriales para el resto del top. */
const ROTATION: Exclude<PropertyBadgeType, 'new' | 'views'>[] = ['featured', 'visits', 'opportunity'];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Lo mínimo que hace falta de una propiedad para decidir su etiqueta. */
export type BadgeCandidate = Pick<Property, 'id' | 'created_at'> & { status?: Property['status'] };

/**
 * Contexto ya calculado (serializable: viaja del servidor a los componentes).
 *  - `badges`: etiqueta de cada propiedad del top 10, por id.
 *  - `visitors`: personas distintas en 7 días por id (para la landing, que
 *    puede mostrar propiedades fuera del top).
 */
export interface PromoBadgeContext {
  badges: Record<string, PromoBadge>;
  visitors: Record<string, number>;
}

export const EMPTY_PROMO_CONTEXT: PromoBadgeContext = { badges: {}, visitors: {} };

function isRecent(createdAt: string | undefined, now: number): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  return Number.isFinite(created) && now - created < RECENT_WINDOW_DAYS * DAY_MS;
}

const isAvailable = (p: BadgeCandidate) => !p.status || p.status === StatusProperty.DISPONIBLE;

/** Etiqueta sin dato de vistas: reciente > editorial > rotación por id. */
function baseBadge(p: BadgeCandidate, now: number): PromoBadge | null {
  if (isRecent(p.created_at, now)) return { type: 'new' };
  if (Object.prototype.hasOwnProperty.call(EDITORIAL_PROMO_BADGES, p.id)) {
    const editorial = EDITORIAL_PROMO_BADGES[p.id];
    return editorial ? { type: editorial } : null;
  }
  return { type: ROTATION[Math.abs(p.id) % ROTATION.length] };
}

/**
 * Arma el contexto a partir de las más recientes (en orden, la primera es la
 * más nueva) y de los visitantes semanales medidos.
 */
export function buildPromoBadgeContext(
  newest: BadgeCandidate[],
  weeklyVisitors: { propertyId: number; visitors: number }[],
  now: number = Date.now(),
): PromoBadgeContext {
  const visitors: Record<string, number> = {};
  for (const v of weeklyVisitors) visitors[v.propertyId] = v.visitors;

  const top = newest.filter(isAvailable).slice(0, PROMO_TOP_N);
  const badges: Record<string, PromoBadge> = {};

  // 1. VISTA POR X PERSONAS — las más vistas del top (respetando un `null`
  //    editorial, que apaga toda etiqueta).
  const mostViewed = top
    .filter((p) => EDITORIAL_PROMO_BADGES[p.id] !== null)
    .map((p) => ({ id: p.id, count: visitors[p.id] ?? 0 }))
    .filter((v) => v.count >= VIEWS_BADGE_MIN_VISITORS)
    .sort((a, b) => b.count - a.count || b.id - a.id)
    .slice(0, VIEWS_BADGE_MAX);
  for (const v of mostViewed) badges[v.id] = { type: 'views', count: v.count };

  // 2-4. El resto del top.
  for (const p of top) {
    if (badges[p.id]) continue;
    const b = baseBadge(p, now);
    if (b) badges[p.id] = b;
  }

  return { badges, visitors };
}

/** Etiqueta de una propiedad según el contexto, o `null` (catálogo y similares). */
export function promoBadgeFor(ctx: PromoBadgeContext, id: number): PromoBadge | null {
  return ctx.badges[id] ?? null;
}

/**
 * Etiqueta GARANTIZADA — para "Propiedades destacadas" de la landing, donde
 * todas las tarjetas llevan una. Si la propiedad está en el top 10 usa la
 * misma etiqueta que en el catálogo; si no, la regla base (con vistas reales
 * si alcanzan el mínimo). Un `null` editorial cae a DESTACADA, que en esa
 * sección es literalmente cierto.
 */
export function guaranteedPromoBadge(
  ctx: PromoBadgeContext,
  p: BadgeCandidate,
  now: number = Date.now(),
): PromoBadge {
  const fromTop = ctx.badges[p.id];
  if (fromTop) return fromTop;

  const count = ctx.visitors[p.id] ?? 0;
  if (count >= VIEWS_BADGE_MIN_VISITORS) return { type: 'views', count };

  return baseBadge(p, now) ?? { type: 'featured' };
}
