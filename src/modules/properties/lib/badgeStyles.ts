/**
 * Paleta de badges del catálogo (solo presentación — no cambia ninguna lógica).
 *
 * Hay TRES familias de badges que pueden aparecer juntas en la misma fila
 * (detalle de propiedad) y antes se confundían entre sí. Ahora cada una tiene su
 * propio TRATAMIENTO además de su propia gama, así se distinguen de un vistazo
 * incluso sin leerlas:
 *
 *  1. OPERACIÓN (venta / alquiler / temporal) → sólido OSCURO.
 *     Es el dato que más se repite (va sobre la foto de cada card), así que se
 *     lleva el peso visual más fuerte. Gamas: índigo / teal / fucsia.
 *  2. TIPO DE PROPIEDAD (casa, terreno, depto…) → sólido CLARO y saturado
 *     (fills en `-400` con borde `-800`). Gamas: naranja / violeta / rojo /
 *     celeste / esmeralda. Sin cambios respecto a la versión anterior.
 *  3. ESTADO (disponible, vendida…) → chip SUAVE (fondo `-50`, texto `-700`)
 *     con un punto de color. Es el patrón convencional de "status", y al no ser
 *     un sólido no compite con los otros dos.
 *
 * Ninguna gama se repite entre las tres familias.
 */

/** Geometría y tipografía comunes a TODOS los badges. */
export const BADGE_BASE =
  'inline-flex items-center rounded-md border-2 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase shadow-sm';

/**
 * Color según el tipo de operación (venta / alquiler / temporal).
 *
 * Es el badge que más se repite (va sobre la foto de cada card), así que lleva
 * el tratamiento más llamativo: GRADIENTE vivo, sin borde y con sombra propia.
 *
 * La lógica cromática es de temperatura opuesta para que Venta y Alquiler —los
 * dos que el usuario compara de un vistazo— no se confundan nunca:
 *   · Venta    → cálido (naranja → rosa), tipo "atardecer"
 *   · Alquiler → frío (cian → azul)
 *   · Temporal → violeta → fucsia
 *
 * Se distinguen del badge de TIPO (que también usa naranja/rojo/violeta) porque
 * aquéllos son sólidos planos y pastel (`-400`), mientras estos son gradientes
 * saturados y oscuros: distinto peso visual, no solo distinto tono.
 */
export function operationBadgeColor(operationType?: string): string {
  switch ((operationType ?? '').toLowerCase()) {
    case 'venta':
      return 'border-transparent bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-[0_4px_12px_-4px_rgba(225,29,72,0.55)]';
    case 'alquiler':
      return 'border-transparent bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-[0_4px_12px_-4px_rgba(29,78,216,0.55)]';
    case 'temporal':
      return 'border-transparent bg-gradient-to-br from-violet-500 to-fuchsia-700 text-white shadow-[0_4px_12px_-4px_rgba(162,28,175,0.55)]';
    default:
      return 'border-transparent bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-[0_4px_12px_-4px_rgba(225,29,72,0.55)]';
  }
}

/**
 * Color según el estado de la publicación.
 *
 * Chip suave + punto de color (ver `STATUS_DOT`), semántico: verde = se puede
 * comprar, ámbar = en trámite, pizarra/azul = operación cerrada, piedra = fuera
 * de circulación temporalmente, rosa = dada de baja.
 *
 * Los valores vienen del enum `StatusProperty` del backend: 'disponible',
 * 'pendiente', 'vendida', 'alquilada', 'en pausa', 'eliminado'.
 */
export function statusBadgeColor(status?: string): string {
  switch ((status ?? '').toLowerCase()) {
    case 'disponible':
      return 'border-green-200 bg-green-50 text-green-700';
    case 'pendiente':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'vendida':
      return 'border-slate-300 bg-slate-100 text-slate-700';
    case 'alquilada':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'en pausa':
      return 'border-stone-300 bg-stone-100 text-stone-600';
    case 'eliminado':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-stone-300 bg-stone-100 text-stone-600';
  }
}

/** Color del puntito que acompaña al badge de estado. */
export function statusDotColor(status?: string): string {
  switch ((status ?? '').toLowerCase()) {
    case 'disponible':
      return 'bg-green-500';
    case 'pendiente':
      return 'bg-amber-500';
    case 'vendida':
      return 'bg-slate-500';
    case 'alquilada':
      return 'bg-blue-500';
    case 'en pausa':
      return 'bg-stone-400';
    case 'eliminado':
      return 'bg-rose-500';
    default:
      return 'bg-stone-400';
  }
}

/**
 * Color según la categoría/tipo de propiedad. Se matchea por palabra clave porque
 * `typeOfProperty.name` es texto libre cargado por el admin (no un enum fijo).
 */
export function propertyTypeBadgeColor(typeName?: string): string {
  const n = (typeName ?? '').toLowerCase();

  if (n.includes('terreno') || n.includes('lote') || n.includes('baldio') || n.includes('baldío'))
    return 'border-orange-800 bg-orange-400 text-white';

  if (n.includes('emprendimiento') || n.includes('pozo'))
    return 'border-violet-800 bg-violet-400 text-white';

  if (n.includes('local') || n.includes('comercial') || n.includes('oficina') || n.includes('galpon') || n.includes('galpón'))
    return 'border-red-800 bg-red-400 text-white';

  if (n.includes('departamento') || n.includes('depto'))
    return 'border-sky-800 bg-sky-400 text-white';

  if (n.includes('duplex') || n.includes('duplex'))
    return 'border-violet-800 bg-violet-400 text-white';

  // Casa, quinta y cualquier otro tipo residencial — esmeralda, distinto del
  // verde de "Venta" (operación) para que no se confundan a primera vista.
  return 'border-emerald-800 bg-emerald-400 text-white';
}
