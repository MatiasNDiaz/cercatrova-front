import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { postsService } from '@/modules/posts/services/posts.service';
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
 * Metadatos para que el link se previsualice bien al pegarlo en WhatsApp,
 * Instagram o Facebook: imagen de la publicación + las primeras líneas del
 * texto. Sin esto, compartir muestra solo el dominio pelado.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const post = await postsService.getOne(Number(id));
    const resumen = post.description.slice(0, 160);

    return {
      title: `${resumen.slice(0, 60)}… | Cerca Trova`,
      description: resumen,
      openGraph: {
        title: 'Publicación de Cerca Trova',
        description: resumen,
        images: [{ url: post.imageUrl }],
        type: 'article',
      },
    };
  } catch {
    return { title: 'Publicación | Cerca Trova' };
  }
}

export default async function PublicacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let post: Post;
  try {
    post = await postsService.getOne(Number(id));
  } catch {
    // Las publicaciones caducan a los 7 días: un link viejo termina acá.
    notFound();
  }

  return (
    <main className="min-h-screen bg-surface-mint-deep">
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
