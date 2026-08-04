import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { postsService } from '@/modules/posts/services/posts.service';
import { getErrorStatus } from '@/modules/shared/lib/apiError';
import type { Post } from '@/modules/shared/types/api';
import { PostCard } from '../PostCard';

/**
 * /publicaciones/:id — una publicación sola, en su propia URL.
 *
 * Es lo que hace que el botón "Compartir" del feed sirva de algo: sin una ruta
 * propia, el link copiado llevaba al feed completo y quien lo abría tenía que
 * buscar de cuál publicación le estaban hablando.
 *
 * Reusa `PostCard`, el mismo componente del feed — likes, comentarios y
 * respuestas funcionan igual acá que allá, sin una segunda implementación que
 * pueda quedar desincronizada.
 */

export const dynamic = 'force-dynamic';

/**
 * Búsqueda memoizada por request: la usan `generateMetadata` y la página, y
 * `cache()` evita que el backend reciba la misma consulta dos veces (Next sólo
 * deduplica automáticamente `fetch()`, y acá el cliente es axios).
 */
const getPost = cache(async (id: number): Promise<Post | null> => {
  if (!Number.isFinite(id)) return null;
  try {
    return (await postsService.getOne(id)) ?? null;
  } catch (error) {
    // Sólo un 404 significa "esta publicación no existe" (caducó a los 7 días o
    // el id es inventado). Un timeout o un 500 con el backend caído NO son eso:
    // se relanzan para que `app/error.tsx` muestre "algo salió mal" en vez de
    // afirmarle a Google que la publicación no existe. Ver la nota equivalente
    // en `properties/[id]/page.tsx`.
    if (getErrorStatus(error) === 404) return null;
    throw error;
  }
});

/**
 * Metadatos para que el link se previsualice bien al pegarlo en WhatsApp,
 * Instagram o Facebook: imagen de la publicación + las primeras líneas del
 * texto. Sin esto, compartir muestra solo el dominio pelado.
 *
 * ⚠️ Además es acá donde se decide el **404 real**. `(public)/loading.tsx` hace
 * que este segmento transmita por streaming: el shell sale con status 200 antes
 * de que la página termine, así que un `notFound()` disparado más abajo llega
 * tarde para cambiar el código HTTP y produce un *soft 404* (200 + pantalla de
 * "no encontrado"). `generateMetadata` corre antes de que arranque la
 * transmisión, así que el `notFound()` de acá sí devuelve 404 de verdad.
 *
 * Importa especialmente en esta ruta: las publicaciones **caducan a los 7 días**,
 * así que cada link viejo que alguien comparta cae en este caso.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(Number(id));

  if (!post) notFound();

  const resumen = post.description.slice(0, 160);

  return {
    title: `${resumen.slice(0, 60)}… | Cerca Trova`,
    description: resumen,
    openGraph: {
      title: 'Publicación de Cerca Trova',
      description: resumen,
      images: [{ url: post.imageUrl }],
      type: 'article' as const,
    },
  };
}

export default async function PublicacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(Number(id));

  // Red de seguridad: `generateMetadata` ya cortó antes. Se conserva para que
  // TypeScript sepa que abajo `post` no es null.
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-surface-mint">
      <div className="mx-auto max-w-2xl px-4 pt-26 pb-20">
        <Link
          href="/publicaciones"
          className="group mb-5 inline-flex w-fit items-center gap-2.5 text-sm font-semibold text-brand-800 transition-colors duration-200 hover:text-brand-700"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white shadow-sm transition-transform duration-200 group-hover:-translate-x-0.5">
            <ArrowLeft size={14} />
          </span>
          Ver todas las publicaciones
        </Link>

        <PostCard post={post} />
      </div>
    </main>
  );
}
