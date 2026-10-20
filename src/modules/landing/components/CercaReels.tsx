// Server Component — no necesita "use client"
import Image from 'next/image';
import { ArrowRight, Clapperboard, Heart, MessageCircle, Shield } from 'lucide-react';
import { postsService } from '@/modules/posts/services/posts.service';
import { mediaAspectRatio, formatDuration } from '@/modules/posts/lib/postMedia';
import { fechaConHora } from '@/modules/shared/lib/fecha';
import type { Post } from '@/modules/shared/types/api';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { CtaButton } from './CtaButton';

/**
 * "Cerca-Reels (Reels de CercaTrova)" — el último video publicado.
 *
 * Va justo debajo del Linktree (lo monta `Slider.tsx` por el slot
 * `afterLinktree`). Muestra UNA sola publicación: la más reciente que tenga
 * al menos un video, con su descripción completa, fecha, likes y comentarios.
 * Si esa publicación tiene varios medios, acá va solo su primer video; el resto
 * se ve en `/publicaciones/:id`.
 *
 * ⚠️ Las publicaciones duran 7 días (el backend las borra con un cron). Si no
 * se subió ningún video en esa ventana, la sección NO se renderiza: mejor que
 * un bloque vacío en la puerta de entrada del sitio.
 *
 * Rendimiento: el video tiene `preload="none"` y un `poster` (fotograma
 * inicial, una imagen liviana). La landing no descarga ni un byte del video
 * hasta que el visitante aprieta play, y nunca arranca solo ni con sonido.
 */
export default async function CercaReels() {
  let post: Post | null = null;
  try {
    post = await postsService.getLatestWithVideo();
  } catch {
    // Backend caído (o en el build): sin sección, la landing sale igual.
    post = null;
  }

  const video = post?.media?.find((m) => m.type === 'video');
  if (!post || !video) return null;

  const duracion = formatDuration(video.duration);

  return (
    <section id="cerca-reels" className="bg-surface py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Último video"
          title={<>Cerca-Reels <span className="text-brand-700">(Reels de CercaTrova)</span></>}
          subtitle="Lo último que subimos: recorridos, novedades y oportunidades en video."
        />

        <Reveal y={20}>
          <article className="grid items-center gap-10 md:grid-cols-[minmax(0,380px)_1fr] md:gap-14">
            {/* ── Video ── marco tipo "reel": vertical por defecto, pero toma
                la proporción real del archivo si se conoce (un video
                horizontal no se recorta ni se estira). */}
            <div className="relative mx-auto w-full max-w-[380px] overflow-hidden rounded-3xl bg-ink-950 shadow-[0_30px_60px_-24px_rgba(6,57,35,0.45)] ring-1 ring-ink-900/10">
              <video
                src={video.url}
                poster={video.posterUrl ?? undefined}
                controls
                playsInline
                preload="none"
                aria-label={`Video: ${post.description.slice(0, 80)}`}
                className="block max-h-[78vh] w-full bg-ink-950"
                style={{ aspectRatio: mediaAspectRatio(video) ?? '9 / 16' }}
              />
              {duracion && (
                <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  <Clapperboard size={12} />{duracion}
                </span>
              )}
            </div>

            {/* ── Texto de la publicación ── */}
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700/10">
                  {post.agent?.photo ? (
                    <Image src={post.agent.photo} alt={post.agent.name} width={44} height={44} className="h-11 w-11 object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-brand-700">{post.agent?.name?.[0]?.toUpperCase() ?? 'C'}</span>
                  )}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
                    {post.agent?.name ?? 'Cerca Trova'}
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
                      <Shield size={8} />Admin
                    </span>
                  </p>
                  {/* `fechaConHora` es determinista (misma salida en server y
                      cliente) — ver shared/lib/fecha.ts. */}
                  <p className="text-xs text-ink-500">{fechaConHora(post.createdAt)}</p>
                </div>
              </div>

              <p className="mt-6 text-base leading-relaxed whitespace-pre-line text-ink-700 md:text-lg">
                {post.description}
              </p>

              <div className="mt-6 flex items-center gap-3 text-sm font-bold text-ink-600">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-rose-600">
                  <Heart size={15} />{post.likesCount}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-brand-800">
                  <MessageCircle size={15} />{post.commentsCount ?? 0}
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CtaButton
                  href={`/publicaciones/${post.id}`}
                  variant="primary"
                  icon={<ArrowRight size={18} className="transition-transform duration-300 group-hover/cta:translate-x-1" />}
                >
                  Ver publicación
                </CtaButton>
                <CtaButton href="/publicaciones" variant="outlineDark">
                  Ver todas las publicaciones
                </CtaButton>
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
