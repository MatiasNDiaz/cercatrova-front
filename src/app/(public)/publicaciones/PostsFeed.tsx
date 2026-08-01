'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Clock, Flame, History, Loader2, Megaphone, MessageSquareText, Timer,
} from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import { postsService } from '@/modules/posts/services/posts.service';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { whatsappLink } from '@/modules/shared/lib/contact';
import type { Post, PostSortBy } from '@/modules/shared/types/api';
import { PostCard } from './PostCard';

/* Variantes de entrada del feed. Duración y curva alineadas con `ListReveal`
   del dashboard y con la grilla del catálogo — un solo ritmo en todo el sitio. */
const feedContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const feedItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

const SORT_OPTIONS: { value: PostSortBy; label: string; icon: React.ElementType }[] = [
  { value: 'recent',    label: 'Más recientes', icon: Clock },
  { value: 'oldest',    label: 'Más antiguas',  icon: History },
  { value: 'mostLiked', label: 'Más me gusta',  icon: Flame },
];

export function PostsFeed({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [sortBy, setSortBy] = useState<PostSortBy>('recent');
  const [loading, setLoading] = useState(false);
  // El fetch del servidor va sin sesión, así que `likedByMe` viene siempre en
  // false. Este refetch del cliente (con la cookie) lo corrige al montar.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      // No mostrar el spinner en la hidratación inicial: ya hay contenido.
      if (hydrated) setLoading(true);
      try {
        const data = await postsService.getAll(sortBy);
        if (alive) setPosts(data);
      } catch (error) {
        if (alive) toast.error(getErrorMessage(error));
      } finally {
        if (alive) { setLoading(false); setHydrated(true); }
      }
    };
    load();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  return (
    /* Columna única y angosta, como un feed de red social: la lectura baja
       en línea recta y la imagen manda. Antes eran dos columnas (feed +
       barra lateral fija), que en una página de este tipo compiten. */
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-20">
        {/* Controles de orden */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink-100 bg-white p-2 shadow-[0_2px_4px_-2px_rgba(10,12,11,0.06),0_14px_34px_-14px_rgba(10,12,11,0.20)]">
          {SORT_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = sortBy === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSortBy(value)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  active
                    ? 'bg-brand-700 text-white shadow-[0_6px_16px_-8px_rgba(6,57,35,0.8)]'
                    : 'text-ink-600 hover:bg-brand-50 hover:text-brand-800'
                }`}
              >
                <Icon size={15} />{label}
              </button>
            );
          })}
          {loading && <Loader2 size={16} className="ml-auto mr-2 animate-spin text-brand-700" />}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-ink-100 bg-white px-6 py-20 text-center shadow-[0_2px_4px_-2px_rgba(10,12,11,0.06),0_14px_34px_-14px_rgba(10,12,11,0.20)]">
            <Megaphone size={38} className="mx-auto mb-4 text-ink-400" />
            <p className="text-lg font-bold text-ink-900">Todavía no hay publicaciones</p>
            <p className="mt-2 text-sm text-ink-600">
              Volvé a pasar pronto: subimos novedades seguido.
            </p>
          </div>
        ) : (
          /* Entrada escalonada del feed — el mismo fade+slide corto que usan el
             catálogo y las listas del dashboard, para que las tres secciones se
             sientan igual de rápidas. `key={sortBy}` re-dispara la animación al
             cambiar el orden, así el reordenamiento se percibe. */
          <motion.div
            key={sortBy}
            variants={feedContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6"
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={feedItem}>
                <PostCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        )}

      {/* ══ INFO SECUNDARIA ══
          Al pie del feed, no en una columna aparte: en una sola columna no
          hay dónde fijarla, y acá aparece justo cuando terminaste de mirar
          las publicaciones. */}
      <aside className="mt-2">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Contacto */}
          <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_2px_4px_-2px_rgba(10,12,11,0.06),0_14px_34px_-14px_rgba(10,12,11,0.20)]">
            <div className="h-1.5 w-full" style={{ background: 'var(--gradient-brand)' }} />
            <div className="p-6">
              <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-brand-700 uppercase">
                ¿Te interesó alguna?
              </p>
              <p className="text-sm leading-relaxed text-ink-600">
                Escribinos y te pasamos todos los detalles de la propiedad que viste
                en la publicación.
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

          {/* Aviso de caducidad */}
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
              <Timer size={16} />Publicaciones temporales
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-700">
              Las publicaciones se eliminan automáticamente a los <strong>7 días</strong>.
              Si te interesa alguna, consultanos antes de que caduque.
            </p>
          </div>

          {/* Link al catálogo */}
          <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-[0_2px_4px_-2px_rgba(10,12,11,0.06),0_14px_34px_-14px_rgba(10,12,11,0.20)]">
            <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <MessageSquareText size={16} className="text-brand-700" />
              ¿Buscás algo puntual?
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
      </aside>
    </div>
  );
}
