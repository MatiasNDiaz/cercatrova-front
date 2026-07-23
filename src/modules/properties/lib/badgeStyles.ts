/**
 * Paleta de badges del catálogo (solo presentación — no cambia ninguna lógica).
 *
 * Criterio visual: el borde es MUCHO más intenso que el fondo (ej. `border-orange-800`
 * sobre `bg-orange-400`). Ese contraste da volumen y hace que el badge se lea moderno.
 * Todos comparten geometría/tipografía (ver `BADGE_BASE`); lo único que cambia es la
 * gama cromática según el tipo.
 *
 * Las dos familias (operación / tipo de propiedad) usan gamas SIN superposición para
 * que un vistazo rápido a la tarjeta distinga de inmediato "qué es" (tipo) de
 * "qué se hace con eso" (operación): venta=verde, alquiler=azul, temporal=ámbar
 * (operación) vs terreno=naranja, emprendimiento=violeta, comercial=rojo,
 * departamento=celeste, casa=esmeralda (tipo).
 */

/** Geometría y tipografía comunes a TODOS los badges. */
export const BADGE_BASE =
  'inline-flex items-center rounded-md border-2 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase shadow-sm';

/** Color según el tipo de operación (venta / alquiler / temporal). */
export function operationBadgeColor(operationType?: string): string {
  switch ((operationType ?? '').toLowerCase()) {
    case 'venta':
      return 'border-green-800 bg-green-700 text-white';
    case 'alquiler':
      return 'border-blue-800 bg-blue-600 text-white';
    case 'temporal':
      return 'border-amber-800 bg-amber-600 text-white';
    default:
      return 'border-green-800 bg-green-600 text-white';
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
