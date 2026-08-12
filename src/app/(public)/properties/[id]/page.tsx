import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { getErrorStatus } from '@/modules/shared/lib/apiError';
import { formatPriceInline } from '@/modules/shared/lib/money';
import PropertyDetail, { type PropertyFull } from './PropertyDetail';

interface PageProps {
  // En Next.js 15 `params` es una Promise: hay que await-earla antes de leer
  // sus propiedades (antes se accedía a `params.id` directo y tiraba warning).
  params: Promise<{ id: string }>;
}

/**
 * Búsqueda de la propiedad, memoizada por request con `cache()` de React.
 *
 * La llaman DOS veces por request —`generateMetadata` y el componente de
 * página— y `cache()` garantiza que el backend reciba una sola. Next hace esto
 * automáticamente con `fetch()`, pero acá el cliente HTTP es axios, así que la
 * deduplicación hay que pedirla explícitamente.
 *
 * Devuelve `null` en vez de propagar el error: un 404 del backend es un caso
 * esperado (propiedad borrada, id inventado), no una falla.
 *
 * Se tipa como `PropertyFull` —el shape que consume `PropertyDetail`— y no como
 * el `Property` canónico: el canónico describe la unión de TODOS los endpoints
 * (`agent` puede ser sólo `{ id }` en la respuesta de `POST /properties`),
 * mientras que `GET /properties/:id` siempre trae las relaciones completas.
 */
const getProperty = cache(async (id: number): Promise<PropertyFull | null> => {
  if (!Number.isFinite(id)) return null;
  try {
    return (await propertiesService.getOne(id)) ?? null;
  } catch (error) {
    // ⚠️ Sólo un 404 del backend significa "esta propiedad no existe".
    //
    // Un `catch` que se tragaba TODO era peor que el bug que vino a arreglar:
    // con el backend caído, un timeout o un 500 se traducían en `null` → 404, y
    // el sitio le respondía "no existe" a Google sobre propiedades que sí
    // existen. Una caída de unos minutos podía desindexar el catálogo entero.
    //
    // Cualquier otro error se vuelve a lanzar para que lo tome `app/error.tsx`,
    // que es lo correcto: "algo salió mal, reintentá" y un 500 honesto.
    if (getErrorStatus(error) === 404) return null;
    throw error;
  }
});

/**
 * ⚠️ Este `generateMetadata` hace DOS cosas, y la segunda no es obvia.
 *
 * 1. **Metadata por página.** Antes esta ruta —la más compartida del sitio y la
 *    que más tráfico orgánico debería captar— heredaba el title global
 *    "Cerca Trova - Inmobiliaria" y no tenía OpenGraph: pegar el link de una
 *    propiedad en WhatsApp mostraba el dominio pelado.
 *
 * 2. **Cortar temprano.** La búsqueda vive acá y no sólo en el componente para
 *    que un id inexistente se resuelva antes de renderizar nada.
 *
 * ── Nota sobre el 404 real (se verificó, no se supuso) ──────────────────────
 * Este archivo antes convivía con `src/app/(public)/loading.tsx`. Un
 * `loading.tsx` envuelve su segmento **y todos sus hijos** en un `<Suspense>`,
 * así que Next transmitía el shell —con la cabecera HTTP ya escrita, status
 * 200— antes de que la página resolviera, y `notFound()` llegaba tarde para
 * cambiar el código: el visitante (y Google) recibían **200 con la pantalla de
 * "no encontrado"**, un soft 404.
 *
 * Mover la búsqueda a `generateMetadata` **no alcanzó**: se probó y siguió
 * dando 200, porque el shell del `loading` sale antes que los metadatos. Lo
 * único que lo arregla es que no haya frontera de streaming por encima, así que
 * se eliminó ese `loading.tsx`.
 *
 * ⚠️ **NO volver a agregar un `loading.tsx` en `(public)/`** sin resolver antes
 * el soft 404: reintroduce exactamente este bug, y es silencioso — la pantalla
 * se ve bien, pero Google recibe 200 en propiedades que no existen. El
 * componente al que apuntaba esta nota (`Loadingpage.tsx`, el loader 3D) se
 * eliminó del repo por peso; si algún día se quiere un loader acá, tiene que
 * ser por ruta y no en el segmento `(public)` entero.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(Number(id));

  if (!property) notFound();

  const ubicacion = [property.barrio, property.localidad].filter(Boolean).join(', ');
  // Vía `formatPriceInline` y no un "USD" fijo: este string es el que ve quien
  // recibe el link por WhatsApp, así que una propiedad en pesos mostrada como
  // dólares es un error visible fuera del sitio y difícil de rastrear después.
  const precio = formatPriceInline(property.price, property.currency);
  const descripcion =
    `${property.typeOfProperty?.name ?? 'Propiedad'} en ${property.operationType} · ${precio}` +
    (ubicacion ? ` · ${ubicacion}` : '') +
    `. ${property.description ?? ''}`.slice(0, 200);

  const portada =
    property.images?.find((img) => img.isCover)?.url ?? property.images?.[0]?.url;

  return {
    title: `${property.title} | Cerca Trova`,
    description: descripcion,
    openGraph: {
      title: property.title,
      description: descripcion,
      type: 'website',
      ...(portada ? { images: [{ url: portada }] } : {}),
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getProperty(Number(id));

  // Red de seguridad: `generateMetadata` ya cortó antes de llegar acá. Se deja
  // porque es lo que le dice a TypeScript que abajo `property` no es null.
  if (!property) notFound();

  return <PropertyDetail property={property} />;
}
