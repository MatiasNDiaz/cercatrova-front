'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Clock, Flame, History, Loader2, Megaphone, MessageSquareText, Timer,
  LayoutGrid, Film, ImageIcon, Play, Images, Heart, MessageCircle, X,
} from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import { postsService } from '@/modules/posts/services/posts.service';
import { postMediaList, formatDuration } from '@/modules/posts/lib/postMedia';
import { CopyPostLinkButton } from '@/modules/posts/components/CopyPostLinkButton';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { whatsappLink } from '@/modules/shared/lib/contact';
import { fechaCorta } from '@/modules/shared/lib/fecha';
import type { Post, PostSortBy } from '@/modules/shared/types/api';
import { PostCard } from './PostCard';
import { ErrorState } from '@/modules/shared/ui/ErrorState';

const SORT_OPTIONS: { value: PostSortBy; label: string; icon: React.ElementType }[] = [
  { value: 'recent',    label: 'Más recientes', icon: Clock },
  { value: 'oldest',    label: 'Más antiguas',  icon: History },
  { value: 'mostLiked', label: 'Más me gusta',  icon: Flame },
];

type Kind = 'all' | 'videos' | 'posts';

/** Una publicación "es video" si tiene al menos un video entre sus medios. */
const hasVideo = (p: Post) => postMediaList(p).some((m) => m.type === 'video');

const CARD_SHADOW =
  'shadow-[0_2px_4px_-2px_rgba(10,12,11,0.06),0_14px_34px_-14px_rgba(10,12,11,0.20)]';

/**
 * Feed de Publicaciones — grilla tipo YouTube.
 *
 *  - Filtro "Todo · Videos | Publicaciones" y orden (recientes/antiguas/likes).
 *  - Cada publicación es una tarjeta con miniatura 16:9. Al tocarla, la MISMA
 *    tarjeta crece hasta ser una ventana modal con la publicación completa
 *    (`PostCard`: galería/video, likes, comentarios); al cerrarla se achica de
 *    vuelta a su lugar. Es un "shared layout" de Framer Motion (`layoutId`):
 *    la tarjeta y el modal son el mismo elemento para la animación.
 *  - `MotionConfig reducedMotion="user"`: con "reducir movimiento" activado el
 *    modal aparece sin el crecimiento.
 *
 * El enlace directo de cada publicación sigue siendo `/publicaciones/:id`
 * (botón "Copiar enlace" en la tarjeta y en el modal).
 */
export function PostsFeed({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [sortBy, setSortBy] = useState<PostSortBy>('recent');
  const [kind, setKind] = useState<Kind>('all');
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  // El fetch del servidor va sin sesión, así que `likedByMe` viene siempre en
  // false. Este refetch del cliente (con la cookie) lo corrige al montar.
  const [hydrated, setHydrated] = useState(false);
  /** El toast se va a los segundos; esto deja el motivo a la vista. */
  const [fetchError, setFetchError] = useState(false);

  const load = useCallback(async (silent = false) => {
    // No mostrar el spinner en la hidratación inicial: ya hay contenido.
    if (hydrated && !silent) setLoading(true);
    setFetchError(false);
    try {
      const data = await postsService.getAll(sortBy);
      setPosts(data);
    } catch (error) {
      if (!silent) toast.error(getErrorMessage(error));
      setFetchError(true);
    } finally {
      setLoading(false);
      setHydrated(true);
    }
    // `hydrated` a propósito fuera de las deps: sólo decide si se ve el
    // spinner, y meterlo dispararía un refetch extra apenas se pone en true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const videos = posts.filter(hasVideo).length;
    return { all: posts.length, videos, posts: posts.length - videos };
  }, [posts]);

  const visible = useMemo(
    () => (kind === 'all' ? posts : posts.filter((p) => (kind === 'videos' ? hasVideo(p) : !hasVideo(p)))),
    [posts, kind],
  );

  const openPost = posts.find((p) => p.id === openId) ?? null;

  const close = () => {
    setOpenId(null);
    // Likes y comentarios hechos en el modal: se refrescan los contadores de
    // la grilla sin spinner.
    load(true);
  };

  // Escape para cerrar y scroll del fondo bloqueado mientras el modal está abierto.
  useEffect(() => {
    if (openId === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          {/* ── Barra: tipo + orden ── */}
          <div className={`mb-8 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-2 sm:flex-row sm:items-center sm:justify-between ${CARD_SHADOW}`}>
            <div className="flex items-center gap-1" role="tablist" aria-label="Filtrar por tipo">
              <KindTab active={kind === 'all'} onClick={() => setKind('all')} icon={LayoutGrid} label="Todo" count={counts.all} />
              <span aria-hidden className="mx-1 h-5 w-px bg-ink-200" />
              <KindTab active={kind === 'videos'} onClick={() => setKind('videos')} icon={Film} label="Videos" count={counts.videos} />
              {/* La barra vertical que separa Videos | Publicaciones */}
              <span aria-hidden className="mx-1 h-5 w-px bg-ink-300" />
              <KindTab active={kind === 'posts'} onClick={() => setKind('posts')} icon={ImageIcon} label="Publicaciones" count={counts.posts} />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {SORT_OPTIONS.map(({ value, label, icon: Icon }) => {
                const active = sortBy === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSortBy(value)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                      active ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-brand-50 hover:text-brand-800'
                    }`}
                  >
                    <Icon size={13} />{label}
                  </button>
                );
              })}
              {loading && <Loader2 size={15} className="mx-2 animate-spin text-brand-700" />}
            </div>
          </div>

          {/* ── Grilla ── "Falló" le gana a "está vacío". */}
          {fetchError && posts.length === 0 ? (
            <ErrorState
              message="No pudimos cargar las publicaciones. Puede ser un problema momentáneo de conexión."
              onRetry={() => load()}
            />
          ) : visible.length === 0 ? (
            <div className={`rounded-3xl border border-ink-100 bg-white px-6 py-20 text-center ${CARD_SHADOW}`}>
              <Megaphone size={38} className="mx-auto mb-4 text-ink-400" />
              <p className="text-lg font-bold text-ink-900">
                {posts.length === 0
                  ? 'Todavía no hay publicaciones'
                  : kind === 'videos' ? 'No hay videos por ahora' : 'No hay publicaciones con imágenes por ahora'}
              </p>
              <p className="mt-2 text-sm text-ink-600">Volvé a pasar pronto: subimos novedades seguido.</p>
            </div>
          ) : (
            <motion.ul
              key={`${kind}-${sortBy}`}
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {visible.map((post) => (
                <motion.li
                  key={post.id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  <PostTile post={post} hidden={openId === post.id} onOpen={() => setOpenId(post.id)} />
                </motion.li>
              ))}
            </motion.ul>
          )}

          {/* ── Info secundaria (antes columna lateral) ── */}
          <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className={`overflow-hidden rounded-3xl border border-ink-100 bg-white ${CARD_SHADOW}`}>
              <div className="h-1.5 w-full" style={{ background: 'var(--gradient-brand)' }} />
              <div className="p-6">
                <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-brand-700 uppercase">¿Te interesó alguna?</p>
                <p className="text-sm leading-relaxed text-ink-600">
                  Escribinos y te pasamos todos los detalles de la propiedad que viste en la publicación.
                </p>
                <a
                  href={whatsappLink('¡Hola! Vi una publicación en la web y quería más información.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(6,57,35,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-800 active:scale-[0.98]"
                >
                  <BsWhatsapp size={17} />Consultar por WhatsApp
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
                <Timer size={16} />Publicaciones temporales
              </p>
              <p className="mt-2 text-sm leading-relaxed text-amber-700">
                Las publicaciones se eliminan automáticamente a los <strong>7 días</strong>.
                Si te interesa alguna, consultanos antes de que caduque.
              </p>
            </div>

            <div className={`rounded-3xl border border-ink-100 bg-white p-6 ${CARD_SHADOW}`}>
              <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <MessageSquareText size={16} className="text-brand-700" />¿Buscás algo puntual?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                En el catálogo podés filtrar por zona, precio, superficie y más.
              </p>
              <Link
                href="/properties"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-700 py-3 text-sm font-bold text-brand-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-700 hover:text-white"
              >
                Ver el catálogo
              </Link>
            </div>
          </div>
        </div>

        {/* ── Modal: la tarjeta crecida ── */}
        <AnimatePresence>
          {openPost && (
            <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-6">
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={close}
                className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm"
              />
              <motion.div
                layoutId={`post-${openPost.id}`}
                role="dialog"
                aria-modal="true"
                aria-label="Publicación"
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_40px_90px_-20px_rgba(0,0,0,0.6)]"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <PostCard post={openPost} />
                </motion.div>
              </motion.div>
              {/* Cerrar: en la esquina de la pantalla, fuera del panel, para no
                  tapar el botón "Copiar enlace" del encabezado de la publicación. */}
              <motion.button
                type="button"
                onClick={close}
                aria-label="Cerrar publicación"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-4 right-4 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
              >
                <X size={20} />
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </MotionConfig>
  );
}

function KindTab({
  active, onClick, icon: Icon, label, count,
}: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string; count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-300 ${
        active
          ? 'bg-brand-700 text-white shadow-[0_6px_16px_-8px_rgba(6,57,35,0.8)]'
          : 'text-ink-600 hover:bg-brand-50 hover:text-brand-800'
      }`}
    >
      <Icon size={15} />
      <span>{label}</span>
      <span className={`rounded-full px-1.5 text-[11px] font-bold ${active ? 'bg-white/20' : 'bg-ink-100 text-ink-500'}`}>{count}</span>
    </button>
  );
}

// ── Tarjeta de la grilla ─────────────────────────────────────────────────────
function PostTile({ post, hidden, onOpen }: { post: Post; hidden: boolean; onOpen: () => void }) {
  const media = postMediaList(post);
  const first = media[0];
  const isVideo = first.type === 'video';
  const cover = isVideo ? (first.posterUrl ?? post.imageUrl) : first.url;
  const duration = isVideo ? formatDuration(first.duration) : null;
  const alt = post.description.slice(0, 100) || 'Publicación de Cerca Trova';

  return (
    // `layoutId` compartido con el modal: esta caja es la que "crece".
    // Mientras el modal está abierto, la tarjeta se oculta (su lugar queda
    // reservado) para que no haya dos copias a la vez.
    <motion.div
      layoutId={`post-${post.id}`}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      style={{ visibility: hidden ? 'hidden' : 'visible' }}
      className="group relative overflow-hidden rounded-2xl"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir publicación: ${alt}`}
        className="block w-full cursor-pointer text-left"
      >
        {/* Miniatura 16:9 — el contenido entero (object-contain) sobre su
            propia versión desenfocada: sin recortes y sin franjas negras. */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-ink-950 shadow-[0_10px_28px_-14px_rgba(10,12,11,0.35)] transition-shadow duration-300 group-hover:shadow-[0_22px_44px_-18px_rgba(6,57,35,0.45)]">
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="scale-110 object-cover opacity-60 blur-xl"
          />
          <Image
            src={cover}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />

          {isVideo && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                <Play size={20} className="ml-0.5 fill-current" />
              </span>
            </span>
          )}

          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            {media.length > 1 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-white">
                <Images size={12} />{media.length}
              </span>
            )}
          </div>
          {duration && (
            <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums">
              {duration}
            </span>
          )}
        </div>

        {/* Datos, estilo YouTube: avatar + texto + meta */}
        <div className="mt-3 flex gap-3 px-0.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700/10">
            {post.agent?.photo ? (
              <Image src={post.agent.photo} alt="" width={36} height={36} className="h-9 w-9 object-cover" />
            ) : (
              <span className="text-xs font-bold text-brand-700">{post.agent?.name?.[0]?.toUpperCase() ?? 'C'}</span>
            )}
          </span>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm leading-snug font-semibold text-ink-900 transition-colors group-hover:text-brand-800">
              {post.description}
            </p>
            <p className="mt-1 text-xs text-ink-500">{post.agent?.name ?? 'Cerca Trova'}</p>
            <p className="mt-0.5 flex items-center gap-2.5 text-xs text-ink-500">
              <span>{fechaCorta(post.createdAt)}</span>
              <span className="inline-flex items-center gap-1"><Heart size={11} />{post.likesCount}</span>
              <span className="inline-flex items-center gap-1"><MessageCircle size={11} />{post.commentsCount ?? 0}</span>
            </p>
          </div>
        </div>
      </button>

      {/* Copiar el enlace directo, arriba a la derecha de la miniatura. */}
      <div className="absolute top-2 right-2">
        <CopyPostLinkButton postId={post.id} variant="overlay" />
      </div>
    </motion.div>
  );
}
