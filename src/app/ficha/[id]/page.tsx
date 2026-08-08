import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { getErrorStatus } from '@/modules/shared/lib/apiError';
import { formatPriceInline } from '@/modules/shared/lib/money';
import { FichaContent } from './FichaContent';
import type { FichaProperty } from './types';

/**
 * `/ficha/:id` — hoja de datos pública y compartible de una propiedad.
 *
 * ── Por qué la URL usa el id real y no un token no adivinable ───────────────
 * Se evaluaron las dos opciones. Se eligió el id directo porque el token NO
 * agregaría privacidad real hoy: `GET /properties/:id` es un endpoint
 * **público** en el backend y **no filtra por `status`**, y la ruta
 * `/properties/:id` del sitio ya es igual de enumerable. Cualquiera puede
 * recorrer ids y ver las mismas propiedades desde antes de que esta página
 * existiera — así que sumar un UUID acá sería seguridad de fachada, con el
 * costo de una columna nueva y una migración del backend.
 *
 * Para que un token sirviera de verdad habría que hacer las DOS cosas juntas:
 * agregar `publicToken` a la entidad **y** cerrar/gatear el endpoint público.
 * Eso es trabajo de backend y una decisión de producto aparte; queda anotado
 * como la vía si más adelante se quieren fichas realmente no enumerables.
 *
 * ── 404 real, no soft 404 ──────────────────────────────────────────────────
 * La búsqueda vive en `generateMetadata` además de en la página. En este
 * segmento no hay `loading.tsx`, así que Next puede fijar el status antes de
 * transmitir; se replica el patrón ya usado en `properties/[id]` para que un
 * id inexistente devuelva 404 de verdad en los headers.
 */

const getProperty = cache(async (id: number): Promise<FichaProperty | null> => {
  if (!Number.isFinite(id)) return null;
  try {
    return (await propertiesService.getOne(id)) ?? null;
  } catch (error) {
    // Sólo un 404 del backend significa "no existe". Un timeout o un 500 se
    // relanzan para que los tome `app/error.tsx` con un 500 honesto, en vez de
    // afirmar que la propiedad no existe durante una caída.
    if (getErrorStatus(error) === 404) return null;
    throw error;
  }
});

/**
 * Metadata de compartición.
 *
 * Es la razón de ser de esta ruta: el link se manda por WhatsApp a un colega o
 * a un cliente, y tiene que llegar como una tarjeta con foto y datos, no como
 * una URL pelada. Se declara OpenGraph completo (título, descripción, imagen de
 * portada con dimensiones) y Twitter `summary_large_image`, que es la variante
 * con foto grande arriba.
 *
 * `robots: noindex` a propósito: la ficha es para compartir de forma directa,
 * no para competir en el buscador con la página real de la propiedad en el
 * sitio. `follow` queda en true para no cortar el rastreo de sus links.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await getProperty(Number(id));

  if (!p) notFound();

  const ubicacion = [p.barrio, p.localidad].filter(Boolean).join(', ');
  // Mismo motivo que en el detalle público: este string encabeza la
  // previsualización del link en WhatsApp, donde un "USD" equivocado no tiene
  // vuelta atrás una vez enviado.
  const precio = formatPriceInline(p.price, p.currency);
  const ficha = [
    p.typeOfProperty?.name,
    `${p.rooms} amb.`,
    `${p.bathrooms} baños`,
    p.supTotal != null ? `${p.supTotal} m²` : null,
  ].filter(Boolean).join(' · ');

  // Primeras líneas de la descripción real, más los datos duros por delante:
  // en la previsualización de WhatsApp se ven ~2 renglones, así que lo
  // concreto (precio, tipo, ambientes) tiene que entrar primero.
  const descripcion = `${precio}${ubicacion ? ` · ${ubicacion}` : ''}${ficha ? ` · ${ficha}` : ''}. ${p.description ?? ''}`
    .slice(0, 200)
    .trim();

  const portada = p.images?.find((i) => i.isCover)?.url ?? p.images?.[0]?.url;

  return {
    title: p.title,
    description: descripcion,
    robots: { index: false, follow: true },
    openGraph: {
      type: 'website',
      title: p.title,
      description: descripcion,
      ...(portada
        ? { images: [{ url: portada, width: 1200, height: 630, alt: p.title }] }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: p.title,
      description: descripcion,
      ...(portada ? { images: [portada] } : {}),
    },
  };
}

export default async function FichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProperty(Number(id));

  // Red de seguridad: `generateMetadata` ya cortó antes. Se conserva para que
  // TypeScript sepa que abajo `p` no es null.
  if (!p) notFound();

  return <FichaContent p={p} />;
}
