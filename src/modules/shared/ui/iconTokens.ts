/**
 * PALETA SEMÁNTICA DE ÍCONOS — dashboards de admin y de usuario.
 *
 * ── El problema ─────────────────────────────────────────────────────────────
 * El mismo concepto salía de un color distinto según la pantalla: los
 * comentarios eran violeta en un lado y púrpura en otro, el corazón de
 * favoritos `red-300` en una lista y `pink-500` en otra, y casi todo lo demás
 * era verde de marca por defecto — con lo cual el color dejaba de significar
 * nada.
 *
 * ── La regla ────────────────────────────────────────────────────────────────
 * Fondo SIEMPRE blanco (con un aro sutil para que se recorte contra las
 * tarjetas, que también son blancas) y el color puesto en el ÍCONO, elegido
 * por lo que representa:
 *
 *   propiedad   → verde de marca   (es el objeto central del negocio)
 *   valoracion  → ámbar RELLENO    (la estrella vacía se lee como "sin puntuar")
 *   favorito    → rosa             (convención universal del corazón)
 *   comentario  → azul             (convención de "conversación")
 *   solicitud   → ámbar oscuro     (algo pendiente de resolver)
 *   usuario     → índigo           (personas, distinto de propiedades)
 *   notificacion→ violeta          (avisos)
 *   publicacion → celeste          (difusión)
 *   eliminar    → rojo             (destructivo)
 *   exito       → esmeralda
 *
 * Verde queda reservado para propiedad: si todo es verde, el color no informa.
 */

export type IconTone =
  | 'propiedad'
  | 'valoracion'
  | 'favorito'
  | 'comentario'
  | 'solicitud'
  | 'usuario'
  | 'notificacion'
  | 'publicacion'
  | 'eliminar'
  | 'exito'
  | 'neutro';

interface ToneClasses {
  /** Clases del contenedor (la "pastilla"). */
  tile: string;
  /** Clases del ícono. Incluye `fill-*` donde la forma sólida importa. */
  icon: string;
}

/** Fondo blanco + aro: la pastilla se distingue aun sobre una tarjeta blanca. */
const TILE = 'bg-white ring-1 ring-ink-100 shadow-sm';

export const ICON_TONES: Record<IconTone, ToneClasses> = {
  propiedad:    { tile: TILE, icon: 'text-brand-700' },
  // `fill-amber-400`: estrella sólida. Sin relleno se confunde con el estado
  // "todavía no valorado" que usan los selectores de puntuación.
  valoracion:   { tile: TILE, icon: 'text-amber-400 fill-amber-400' },
  favorito:     { tile: TILE, icon: 'text-rose-500' },
  comentario:   { tile: TILE, icon: 'text-blue-600' },
  solicitud:    { tile: TILE, icon: 'text-amber-600' },
  usuario:      { tile: TILE, icon: 'text-indigo-600' },
  notificacion: { tile: TILE, icon: 'text-violet-600' },
  publicacion:  { tile: TILE, icon: 'text-sky-600' },
  eliminar:     { tile: TILE, icon: 'text-red-600' },
  exito:        { tile: TILE, icon: 'text-emerald-600' },
  neutro:       { tile: TILE, icon: 'text-ink-500' },
};

/** Tamaños de pastilla usados en el proyecto. */
export const TILE_SIZE = {
  sm: 'h-9 w-9 rounded-lg',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-14 w-14 rounded-xl',
} as const;

export type TileSize = keyof typeof TILE_SIZE;

/** Clases completas de la pastilla, listas para un `<span>`. */
export function iconTile(tone: IconTone, size: TileSize = 'md'): string {
  return `inline-flex shrink-0 items-center justify-center ${TILE_SIZE[size]} ${ICON_TONES[tone].tile}`;
}

/** Clases del ícono que va adentro. */
export function iconColor(tone: IconTone): string {
  return ICON_TONES[tone].icon;
}
