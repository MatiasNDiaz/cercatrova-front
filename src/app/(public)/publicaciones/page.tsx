import { Sparkles } from 'lucide-react';
import { postsService } from '@/modules/posts/services/posts.service';
import type { Post } from '@/modules/shared/types/api';
import { PostsFeed } from './PostsFeed';

/**
 * /publicaciones — feed público estilo red social.
 *
 * El admin sube una imagen ya editada (con precio, ambientes y ubicación
 * escritos adentro) más un texto corto. Los usuarios logueados pueden dar like
 * y comentar; el admin responde y modera desde el panel.
 *
 * Las publicaciones caducan a los 7 días (cron del backend).
 */

export const metadata = {
  title: 'Publicaciones | Cerca Trova',
  description: 'Las últimas novedades y propiedades destacadas de Cerca Trova.',
};

// El feed cambia seguido (likes, comentarios, publicaciones nuevas): sin esto,
// Next cachearía el fetch del servidor y mostraría datos viejos.
export const dynamic = 'force-dynamic';

export default async function PublicacionesPage() {
  // Fetch inicial en el servidor para que la primera pintura ya traiga
  // contenido. Va SIN sesión, así que `likedByMe` llega en false y lo corrige
  // el refetch del cliente (ver `PostsFeed`).
  let initialPosts: Post[] = [];
  try {
    initialPosts = await postsService.getAll('recent');
  } catch {
    // Si la API no responde, el feed se rehidrata solo desde el cliente.
    initialPosts = [];
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* ── ENCABEZADO ──
          Compacto y alineado a la izquierda: antes era un hero centrado con un
          título gigante que empujaba el feed más abajo del pliegue. */}
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3 px-4 pt-26 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-brand-700 uppercase">
              <Sparkles size={12} />Novedades
            </span>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900">
              Publicaciones
            </h1>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-ink-600">
            Oportunidades y propiedades destacadas. Dejanos tu comentario o
            consultanos por la que te interese.
          </p>
        </div>
      </section>

      <section className="pt-6">
        <PostsFeed initialPosts={initialPosts} />
      </section>
    </main>
  );
}
