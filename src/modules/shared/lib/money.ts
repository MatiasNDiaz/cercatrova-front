import { Currency } from '@/modules/shared/types/api';

/**
 * Formateo de precios de propiedad — punto ÚNICO de la verdad.
 *
 * ## Por qué existe este archivo
 *
 * El precio se muestra en 9 lugares distintos (tarjeta de destacadas, las dos
 * vistas del catálogo, el detalle, la ficha compartible, dos `generateMetadata`
 * de OpenGraph, favoritos y el listado del admin), y en TODOS estaba escrito a
 * mano como `` `$${price.toLocaleString('es-AR')}` `` seguido de un `<span>USD</span>`
 * literal. Con `Property.currency` como campo real, dejar ese "USD" hardcodeado
 * en cualquiera de los 9 significa mentir sobre el precio de una propiedad en
 * pesos — y en los dos `generateMetadata` la mentira viaja en el preview del
 * link que se comparte por WhatsApp.
 *
 * Centralizarlo también evita que las 9 vistas se desincronicen entre sí: el
 * separador de miles, el símbolo y el sufijo se deciden acá una sola vez.
 *
 * ## Por qué `currency` es opcional en las firmas
 *
 * El backend la declara `NOT NULL DEFAULT 'USD'`, así que en teoría siempre
 * llega. Pero varias pantallas (favoritos, el listado del admin) tipan la
 * propiedad con una interfaz local recortada, y una respuesta cacheada de antes
 * del deploy tampoco la trae. `USD` como fallback es el valor correcto para
 * todo el catálogo histórico, que es exactamente lo que esas respuestas viejas
 * contienen.
 */

/** Símbolo que precede al monto. `US$` desambigua contra el `$` de los pesos. */
const SYMBOL: Record<Currency, string> = {
  [Currency.ARS]: '$',
  [Currency.USD]: 'US$',
};

/**
 * Sufijo corto que acompaña al monto.
 *
 * Se usan los códigos ISO (`ARS`/`USD`) y no "Pesos"/"Dólares" por dos motivos:
 * son simétricos entre sí (uno no queda más largo que el otro y descoloca la
 * tarjeta), y coinciden con las etiquetas de los checkboxes del formulario
 * ("Pesos (ARS)" / "Dólares (USD)"), así el admin ve el mismo código que eligió.
 */
const CODE: Record<Currency, string> = {
  [Currency.ARS]: 'ARS',
  [Currency.USD]: 'USD',
};

/** Normaliza cualquier valor que llegue del backend a un `Currency` válido. */
export function toCurrency(value?: string | null): Currency {
  return value === Currency.ARS ? Currency.ARS : Currency.USD;
}

/**
 * Piezas sueltas del precio, para los componentes que las maquetan por separado
 * (monto grande + sufijo chico en otro `<span>`), que es como están hechas las
 * 6 vistas visuales.
 *
 * `amount` ya viene con el símbolo pegado: `"US$ 85.000"` / `"$ 45.000.000"`.
 */
export function priceParts(price?: number | null, currency?: string | null) {
  const c = toCurrency(currency);
  return {
    /** `"US$ 85.000"` — símbolo + monto, listo para el texto grande. */
    amount: `${SYMBOL[c]} ${(price ?? 0).toLocaleString('es-AR')}`,
    /** `"USD"` — para el `<span>` chico que va al lado. */
    code: CODE[c],
    currency: c,
  };
}

/**
 * Precio en una sola línea de texto plano: `"USD 85.000"`.
 *
 * Para contextos donde no hay JSX que maquetar — los `generateMetadata` de
 * OpenGraph y cualquier string suelto. El código va ADELANTE (no el símbolo)
 * porque es como ya venía armado el copy de esas descripciones, y en un preview
 * de WhatsApp el código desambigua mejor que un `$` suelto.
 */
export function formatPriceInline(price?: number | null, currency?: string | null): string {
  return `${CODE[toCurrency(currency)]} ${(price ?? 0).toLocaleString('es-AR')}`;
}

/**
 * Expensas — SIEMPRE en pesos, sin importar la moneda del precio.
 *
 * No es un olvido ni una simplificación: en el mercado local el inmueble se
 * publica en dólares y las expensas se cobran en pesos. Una casa de USD 85.000
 * no tiene expensas de USD 45.000. Por eso `expensas` es un número pelado en la
 * entidad, sin columna de moneda propia.
 *
 * Devuelve `null` cuando no hay valor cargado, para que quien llama pueda no
 * renderizar la fila en vez de mostrar "Expensas: —".
 */
export function formatExpensas(expensas?: number | null): string | null {
  if (expensas == null) return null;
  return `$ ${expensas.toLocaleString('es-AR')}`;
}
