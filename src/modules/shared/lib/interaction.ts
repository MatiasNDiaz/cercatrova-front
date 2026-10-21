/**
 * Interacciones sin iniciar sesión — helpers compartidos del frontend.
 *
 * Comentar, dar "me gusta" y calificar están abiertos a visitantes. El
 * backend identifica al visitante con la cookie anónima `ct_vid` (httpOnly,
 * la pone él mismo y viaja sola en cada request de axios): el frontend no
 * tiene que generar ni mandar ningún id.
 */

/** Nombre a mostrar de un comentario: usuario > nombre del visitante > "Visitante". */
export function authorNameOf(c: {
  authorName?: string;
  guestName?: string | null;
  user?: { name?: string | null; surname?: string | null } | null;
}): string {
  if (c.user?.name) return `${c.user.name}${c.user.surname ? ` ${c.user.surname}` : ''}`;
  return c.authorName || c.guestName?.trim() || 'Visitante';
}

/** `true` si el comentario es de un visitante sin sesión. */
export const isGuestComment = (c: { isAnonymous?: boolean; userId?: number | null; user?: unknown }) =>
  c.isAnonymous ?? (c.userId === null || !c.user);

/** Largos máximos — los mismos que valida el backend. */
export const COMMENT_MAX = 1000;
export const GUEST_NAME_MAX = 50;
