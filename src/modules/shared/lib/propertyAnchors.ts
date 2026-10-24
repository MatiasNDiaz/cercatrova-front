/**
 * Anclas del detalle de una propiedad (`/properties/:id`).
 *
 * Las usan las notificaciones (la miniatura lleva directo al comentario o la
 * valoración que originó el aviso) y el propio detalle (scroll + resaltado al
 * llegar). Definidas en UN solo lugar para que el link y el `id` del elemento
 * no puedan divergir.
 */
export const COMMENTS_SECTION_ID = 'comentarios';
export const RATINGS_SECTION_ID = 'valoraciones';

export const commentAnchorId = (id: number) => `comentario-${id}`;
export const ratingAnchorId = (id: number) => `valoracion-${id}`;

export type PropertyLinkTarget =
  | { kind: 'comentario'; id?: number | null }
  | { kind: 'valoracion'; id?: number | null }
  | null;

/**
 * Link al detalle de la propiedad, a la sección que corresponda:
 *  - comentario → `#comentario-ID` (o `#comentarios` si la notificación es
 *    vieja y no guardó el ID),
 *  - valoración → `#valoracion-ID` (o `#valoraciones`),
 *  - el resto (favorito, propiedad nueva, baja de precio…) → al inicio.
 */
export function propertyHref(propertyId: number, target: PropertyLinkTarget = null): string {
  const base = `/properties/${propertyId}`;
  if (target?.kind === 'comentario') {
    return `${base}#${target.id ? commentAnchorId(target.id) : COMMENTS_SECTION_ID}`;
  }
  if (target?.kind === 'valoracion') {
    return `${base}#${target.id ? ratingAnchorId(target.id) : RATINGS_SECTION_ID}`;
  }
  return base;
}

/**
 * Qué hay que hacer al llegar al detalle con un hash:
 *  - `item`: el comentario/valoración puntual (se centra y se resalta),
 *  - `section`: la sección a la que caer si el ítem no está (borrado, oculto
 *    para este usuario) o si el hash ya era la sección.
 * `null` = hash que no es de esta sección.
 */
export function parsePropertyHash(
  rawHash: string,
): { item: string | null; section: string } | null {
  const hash = decodeURIComponent(rawHash.replace(/^#/, ''));
  if (/^comentario-\d+$/.test(hash)) return { item: hash, section: COMMENTS_SECTION_ID };
  if (/^valoracion-\d+$/.test(hash)) return { item: hash, section: RATINGS_SECTION_ID };
  if (hash === COMMENTS_SECTION_ID) return { item: null, section: COMMENTS_SECTION_ID };
  // `#valoracion` (singular) era el id viejo de la sección: los links que ya
  // circulan siguen funcionando.
  if (hash === RATINGS_SECTION_ID || hash === 'valoracion') return { item: null, section: RATINGS_SECTION_ID };
  return null;
}
