import { Property, StatusProperty } from '@/modules/shared/types/api';

/**
 * Etiquetas promocionales del catálogo (solo presentación — no cambia ninguna
 * lógica de negocio, ni el orden, ni los filtros, ni la paginación).
 *
 * Son un elemento EDITORIAL, no una métrica: ninguna simula actividad
 * ("X personas la vieron", "visitas agendadas"…). Cada una sale de una de dos
 * fuentes, nunca de un sorteo en el render:
 *
 *  · `new` (INGRESO RECIENTE) → AUTOMÁTICA, del `created_at` real. Aparece sola
 *    durante los primeros `RECENT_WINDOW_DAYS` días y se apaga sola después.
 *    No se puede asignar a mano a propósito: así nunca dice "reciente" de algo
 *    que no lo es.
 *  · `featured` / `visits` / `opportunity` → SELECCIÓN EDITORIAL por id, en
 *    `EDITORIAL_PROMO_BADGES`. Es estable entre recargas y navegación porque
 *    depende del id, no de la posición en la página ni del filtro activo.
 *
 * ¿Por qué un mapa en el frontend y no un campo en la base? Porque el backend
 * no tiene hoy ningún campo para destacar propiedades, y la tarea era de
 * interfaz pura. Si algún día se agrega (p. ej. `promoBadge` en `property`),
 * `getPromoBadge` es el único lugar a cambiar: las tarjetas no se enteran.
 */
export type PropertyBadgeType = 'featured' | 'visits' | 'new' | 'opportunity';

/** Días que dura la etiqueta INGRESO RECIENTE desde la publicación. */
export const RECENT_WINDOW_DAYS = 7;

/**
 * Selección editorial — `id de propiedad → etiqueta`.
 *
 * Criterio de la selección inicial (catálogo público de 2026-10-19, 18
 * propiedades, ids 2–22, ordenado por más recientes):
 *  - Priorizar las publicaciones nuevas, pero repartidas a lo largo del
 *    catálogo (posiciones 3, 6, 8, 10, 12 y 13) para que no se amontonen en la
 *    primera fila. La #22 (posición 1) ya lleva INGRESO RECIENTE automática.
 *  - OPORTUNIDAD solo donde la publicación misma declara un motivo comercial:
 *    #12 (locales frente a la plaza, quedan dos) y #7 (facilidades de pago).
 *  - VISITAS DISPONIBLES solo en propiedades disponibles (lo garantiza
 *    `getPromoBadge`): #19 y #8, departamentos listos para recorrer.
 *  - DESTACADA: #15 y #10, por presentación y potencial.
 *
 * Para actualizarla: agregar, quitar o cambiar líneas. Un id con `null` apaga
 * TODA etiqueta en esa propiedad, incluida la automática de INGRESO RECIENTE.
 * Un id que ya no exista simplemente no se usa.
 */
export const EDITORIAL_PROMO_BADGES: Readonly<
  Record<number, Exclude<PropertyBadgeType, 'new'> | null>
> = {
  19: 'visits',
  15: 'featured',
  12: 'opportunity',
  10: 'featured',
  8: 'visits',
  7: 'opportunity',
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** `true` si la fecha es válida y cae dentro de la ventana de ingreso reciente. */
function isRecent(createdAt: string | undefined, now: number): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return now - created < RECENT_WINDOW_DAYS * DAY_MS;
}

/**
 * Etiqueta promocional de una propiedad, o `null` si no lleva ninguna.
 * Siempre UNA como máximo: la editorial gana sobre la automática.
 *
 * ⚠️ `new` depende de la hora: en el borde exacto de los 7 días el servidor y
 * el cliente podrían diferir por los segundos que median entre el SSR y la
 * hidratación. Es un caso de una ventana de segundos por propiedad por semana;
 * se acepta antes que mostrar la etiqueta solo después de montar (parpadeo en
 * todas las cargas).
 */
export function getPromoBadge(
  property: Pick<Property, 'id' | 'status' | 'created_at'>,
  now: number = Date.now(),
): PropertyBadgeType | null {
  // Nada de promos sobre algo vendido, alquilado o pausado. El catálogo ya
  // filtra por disponibles, pero las tarjetas también se usan en otros lugares.
  // Si el `status` no viniera en la respuesta, no se asume nada en contra.
  if (property.status && property.status !== StatusProperty.DISPONIBLE) return null;

  if (Object.prototype.hasOwnProperty.call(EDITORIAL_PROMO_BADGES, property.id)) {
    return EDITORIAL_PROMO_BADGES[property.id];
  }

  return isRecent(property.created_at, now) ? 'new' : null;
}
