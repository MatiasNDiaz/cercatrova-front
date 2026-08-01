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
    /* Fondo verde de sección (`surface-mint-deep`, el mismo de los resultados
       del catálogo) en vez del gris. Se sacó la franja blanca que separaba el
       encabezado del feed: ahora el título vive sobre el mismo fondo y la
       página se lee como una sola pieza. */
    <main className="min-h-screen bg-surface-mint-deep">
      {/* Sin encabezado: el feed arranca directo, debajo de la navbar.
          `pt-26` deja el aire que antes ocupaba la franja blanca. */}
      <div className="pt-26" />

      <PostsFeed initialPosts={initialPosts} />
    </main>
  );
}
