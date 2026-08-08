'use server';

import { revalidatePath } from 'next/cache';

/**
 * Invalida las cachés de Next.js de todas las páginas donde aparece una
 * propiedad, después de que el admin la crea, edita o elimina.
 *
 * ── El bug que resuelve ─────────────────────────────────────────────────────
 * Al guardar una edición, el formulario hacía `router.push()` y nada más. Next
 * no tiene forma de enterarse de que los datos cambiaron: el PATCH va por axios
 * a un backend externo (NestJS), no por una Server Action ni por el `fetch()`
 * instrumentado de Next. Resultado: el admin guardaba, navegaba al detalle y
 * seguía viendo los datos viejos hasta apretar F5.
 *
 * ── Qué caché invalida cada cosa (importa, porque son DOS distintas) ────────
 *
 * 1. **Full Route Cache (servidor).** Sólo afecta a rutas prerenderizadas. En
 *    este proyecto la única que lo está es la landing `/`, con
 *    `export const revalidate = 300`: sus "Destacadas" quedaban congeladas
 *    hasta 5 minutos **para todos los visitantes**, no sólo para el admin.
 *    `revalidatePath('/')` la purga al instante.
 *    `/properties` y `/properties/[id]` son dinámicas (`ƒ` en el build), así
 *    que del lado del servidor no había nada cacheado que invalidar.
 *
 * 2. **Router Cache (cliente).** Es la que explica el síntoma en las rutas
 *    dinámicas: Next guarda en memoria el payload RSC de las páginas ya
 *    visitadas y lo reutiliza al navegar dentro de la SPA (siempre, en las
 *    navegaciones con back/forward). Llamar a `revalidatePath` **desde una
 *    Server Action** hace que la respuesta de la acción le ordene al navegador
 *    purgar ese caché. Ese es el motivo real por el que esto es una Server
 *    Action y no un helper cualquiera: es el único mecanismo que llega hasta el
 *    caché del cliente.
 *
 * ── Por qué NO se usa `revalidateTag` ───────────────────────────────────────
 * Los tags son una funcionalidad del `fetch()` de Next. Este frontend no usa
 * `fetch()` en ningún lado (verificado por grep: cero coincidencias) — todo
 * pasa por la instancia única de axios de `shared/lib/axios.ts`. Sin `fetch`
 * no hay Data Cache que taggear, así que `revalidateTag` no tendría nada que
 * invalidar. Por la misma razón, poner `{ cache: 'no-store' }` en algún lado
 * tampoco habría cambiado nada: esa opción es de `fetch`.
 *
 * ── Sobre exponer esto como Server Action ───────────────────────────────────
 * Una Server Action es, por debajo, un endpoint POST alcanzable por cualquiera
 * que conozca su id ofuscado. Acá eso es aceptable y NO se le agrega un guard
 * de sesión: la acción no muta datos, no lee nada y no devuelve información —
 * lo único que hace es marcar páginas como "hay que volver a renderizarlas".
 * Su peor caso es que alguien fuerce un re-render, que es exactamente lo mismo
 * que consigue cualquiera pidiendo esas páginas públicas. Un guard basado en
 * `decodeJwt` (que es lo único que este frontend puede hacer sin el secreto,
 * igual que el middleware) daría una sensación de protección sin agregarla.
 *
 * @param propertyId Si se pasa, invalida además el detalle y la ficha de esa
 *   propiedad puntual. Se omite al eliminar una propiedad que ya no existe.
 */
export async function revalidatePropertyCaches(propertyId?: number) {
  // Landing: la única con ISR. Sus "Destacadas" son el caso más visible.
  revalidatePath('/');

  // Catálogo público. Hoy es dinámico, así que del lado del servidor es un
  // no-op; se deja igual porque lo que importa es el efecto sobre el Router
  // Cache del cliente, y porque si mañana alguien le pone `revalidate` esta
  // línea ya está en su lugar.
  revalidatePath('/properties');

  if (propertyId) {
    revalidatePath(`/properties/${propertyId}`);
    // La ficha compartible lee la MISMA propiedad por otra ruta. Es fácil de
    // olvidar: no está enlazada desde el sitio público, se comparte por
    // WhatsApp desde el panel.
    revalidatePath(`/ficha/${propertyId}`);
  }
}
