// Server Component — no necesita "use client"
import { ArrowRight } from 'lucide-react';
import { postsService } from '@/modules/posts/services/posts.service';
import { postMediaList } from '@/modules/posts/lib/postMedia';
import { fechaCorta } from '@/modules/shared/lib/fecha';
import type { Post } from '@/modules/shared/types/api';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { CtaButton } from './CtaButton';
import { ReelsCarousel, ReelsCarouselSkeleton, type ReelItem } from './ReelsCarousel';

/**
 * "Cerca-Reels" — carrusel de las publicaciones (imágenes y videos).
 *
 * Va entre el hero y "Vida universitaria", donde antes estaba el Linktree
 * (que pasó debajo de Preguntas frecuentes). Lo monta `Slider.tsx` por el slot
 * `afterHero`, envuelto en un `<Suspense>` con `CercaReelsSkeleton`.
 *
 * Datos: el MISMO `GET /posts` del feed de Publicaciones (`postsService.getAll`),
 * de más reciente a más antigua. Una card por publicación con su PRIMER medio
 * (la portada que eligió el admin); si tiene más, la card muestra cuántos.
 *
 * ⚠️ Las publicaciones duran 7 días. Si no hay ninguna vigente la sección no se
 * renderiza (ni encabezado ni hueco).
 */
export default async function CercaReels() {
  let posts: Post[] = [];
  try {
    posts = await postsService.getAll('recent');
  } catch {
    // Backend caído (o en el build): sin sección, la landing sale igual.
    posts = [];
  }
  if (posts.length === 0) return null;

  const items: ReelItem[] = posts.map((post) => {
    const media = postMediaList(post);
    const first = media[0];
    const isVideo = first.type === 'video';
    return {
      id: post.id,
      type: first.type,
      // Para un video, el fotograma inicial que genera Cloudinary
      // (`posterUrl`, ya limitado a 1080px de ancho): la card no descarga el
      // video hasta que queda en el centro.
      cover: isVideo ? (first.posterUrl ?? post.imageUrl) : first.url,
      videoUrl: isVideo ? first.url : null,
      description: post.description,
      date: fechaCorta(post.createdAt),
      mediaCount: media.length,
    };
  });

  return (
    <ReelsSection>
      <Reveal y={20}>
        <ReelsCarousel items={items} />
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mt-12 flex justify-center">
          <CtaButton
            href="/publicaciones"
            variant="outlineDark"
            icon={<ArrowRight size={18} className="transition-transform duration-300 group-hover/cta:translate-x-1" />}
          >
            Ver todas las publicaciones
          </CtaButton>
        </div>
      </Reveal>
    </ReelsSection>
  );
}

/** Mismo marco y encabezado para la sección real y para su skeleton. */
function ReelsSection({ children }: { children: React.ReactNode }) {
  return (
    <section id="cerca-reels" className="overflow-hidden bg-white py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Reels de Cercatrova"
          title="Cerca-Reels"
          subtitle="Recorridos, novedades y oportunidades: lo último que compartimos, en formato corto."
        />
        {children}
      </div>
    </section>
  );
}

/** Fallback del `<Suspense>`: mismo layout de 3 columnas, sin huecos en blanco. */
export function CercaReelsSkeleton() {
  return (
    <ReelsSection>
      <ReelsCarouselSkeleton />
    </ReelsSection>
  );
}
