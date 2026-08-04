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
    /* `surface-mint` y no `surface-mint-deep`: el tono profundo pesaba
       demasiado detrás de una columna de tarjetas blancas grandes. Este es el
       mismo verde de sección que alternan la landing, el hero del catálogo y
       las páginas de servicio, así que la página se siente parte del sitio en
       vez de una zona aparte. */
    <main className="min-h-screen bg-surface-mint">
      {/* Encabezado con el MISMO tratamiento que el resto del sitio: eyebrow en
          pastilla verde sólida + h2 centrado. Es el patrón de `SectionHeading`
          de la landing; se replica acá en vez de importarlo porque este título
          va más compacto (`mb-10`, sin el `mb-14` que usan las secciones de la
          landing) y `SectionHeading` no expone ese ajuste. */}
      <div className="mx-auto max-w-3xl px-4 pt-28 pb-10 text-center">
        <span className="inline-block rounded-full bg-brand-700 px-4 py-1.5 text-xs font-bold tracking-[0.22em] text-white uppercase shadow-[0_4px_12px_-4px_rgba(11,122,75,0.6)]">
          Novedades
        </span>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Publicaciones
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-600">
          Oportunidades y propiedades destacadas. Dejanos tu comentario o
          consultanos por la que te interese.
        </p>
      </div>

      <PostsFeed initialPosts={initialPosts} />
    </main>
  );
}
