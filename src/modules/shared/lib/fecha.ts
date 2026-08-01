/**
 * Formateo de fechas DETERMINISTA — igual en el servidor y en el navegador.
 *
 * ── El problema ─────────────────────────────────────────────────────────────
 * `new Date(iso).toLocaleDateString('es-AR', { …, hour, minute })` producía
 * textos distintos de cada lado y rompía la hidratación:
 *
 *     servidor (Node):    "30 de julio a las 08:11 p. m."
 *     navegador (Chrome): "30 de julio, 08:11 p. m."
 *
 * Son dos causas encadenadas, y arreglar solo una no alcanza:
 *
 *  1. **El texto.** Cada implementación de ICU arma la plantilla a su manera
 *     ("a las" vs. coma). Se resuelve escribiendo el string a mano, con los
 *     nombres de mes en una constante propia.
 *
 *  2. **La hora.** `new Date()` interpreta el instante en el huso LOCAL. El
 *     servidor suele correr en UTC y el visitante está en −03, así que hasta
 *     con la misma plantilla saldrían dos horas distintas. Se resuelve fijando
 *     el huso de Argentina en los dos lados.
 *
 * `formatToParts` con `timeZone` explícito devuelve los números ya convertidos
 * a ese huso; el texto alrededor lo ponemos nosotros. Nada queda librado a la
 * implementación de ICU de cada entorno.
 */

const TZ = 'America/Argentina/Buenos_Aires';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

interface Partes {
  dia: number;
  mes: number;   // 1-12
  anio: number;
  hora: string;  // '00'-'23'
  min: string;   // '00'-'59'
}

function partes(fecha: string | Date): Partes | null {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;

  // `en-US` a propósito: solo se usan las partes NUMÉRICAS, y con este locale
  // vienen siempre en dígitos latinos sin adornos. El idioma lo ponemos abajo.
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, x) => {
      acc[x.type] = x.value;
      return acc;
    }, {});

  return {
    dia: Number(p.day),
    mes: Number(p.month),
    anio: Number(p.year),
    // Algunas versiones de ICU devuelven '24' para medianoche con hour12:false.
    hora: p.hour === '24' ? '00' : p.hour,
    min: p.minute,
  };
}

/** `30 de julio, 20:11` — para feeds y comentarios. */
export function fechaConHora(fecha: string | Date): string {
  const p = partes(fecha);
  if (!p) return '';
  return `${p.dia} de ${MESES[p.mes - 1]}, ${p.hora}:${p.min}`;
}

/** `30 jul, 20:11` — versión corta, para listas densas. */
export function fechaCortaConHora(fecha: string | Date): string {
  const p = partes(fecha);
  if (!p) return '';
  return `${p.dia} ${MESES_CORTOS[p.mes - 1]}, ${p.hora}:${p.min}`;
}

/** `30 de julio de 2026` — sin hora. */
export function fechaLarga(fecha: string | Date): string {
  const p = partes(fecha);
  if (!p) return '';
  return `${p.dia} de ${MESES[p.mes - 1]} de ${p.anio}`;
}

/** `30 jul 2026` — sin hora, compacta. */
export function fechaCorta(fecha: string | Date): string {
  const p = partes(fecha);
  if (!p) return '';
  return `${p.dia} ${MESES_CORTOS[p.mes - 1]} ${p.anio}`;
}
