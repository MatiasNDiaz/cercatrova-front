'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Megaphone, Plus, Heart, MessageCircle, Trash2, Loader2,
  ChevronDown, Clock, CalendarClock, ArrowUpDown,
} from 'lucide-react';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import { postsService } from '@/modules/posts/services/posts.service';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import type { Post } from '@/modules/shared/types/api';
import { DashboardPage, DashboardHeader, CARD, ListReveal } from '@/modules/shared/ui/DashboardPage';
import { ListToolbar, ListSearch, ListSelect, NoMatches } from '@/modules/shared/ui/ListToolbar';
import { CommentModeration } from './CommentModeration';

type SortBy = 'recientes' | 'antiguas' | 'vencen' | 'likes' | 'comentarios';

/** Días que vive una publicación — igual que `POST_TTL_DAYS` en el backend. */
const POST_TTL_DAYS = 7;

/** Días restantes antes de que el cron la borre (0 = vence hoy). */
function daysLeft(createdAt: string): number {
  const expiry = new Date(createdAt).getTime() + POST_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function PublicacionesAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recientes');

  // Filtrado y orden en cliente, sobre lo que ya trajo `getAll('recent')`.
  // No cambia el fetch ni agrega llamadas.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? posts.filter((p) => p.description?.toLowerCase().includes(q))
      : posts;

    const time = (s: string) => new Date(s).getTime();
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'antiguas':    return time(a.createdAt) - time(b.createdAt);
        // "Vencen primero" = las más viejas primero, porque el TTL se cuenta
        // desde `createdAt`. Es el mismo orden que `antiguas`, pero el nombre
        // dice lo que al admin le importa: cuál se le va a borrar antes.
        case 'vencen':      return time(a.createdAt) - time(b.createdAt);
        case 'likes':       return (b.likesCount ?? 0) - (a.likesCount ?? 0);
        case 'comentarios': return (b.commentsCount ?? 0) - (a.commentsCount ?? 0);
        default:            return time(b.createdAt) - time(a.createdAt);
      }
    });
  }, [posts, search, sortBy]);

  const load = async () => {
    try {
      setPosts(await postsService.getAll('recent'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (post: Post) => {
    confirmDialog({
      title: '¿Eliminar publicación?',
      message: 'Se eliminan también sus likes, sus comentarios y la imagen. No se puede deshacer.',
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await postsService.remove(post.id);
          setPosts((prev) => prev.filter((p) => p.id !== post.id));
          toast.success('Publicación eliminada ✓');
        } catch (error) {
          toast.error(getErrorMessage(error));
        }
      },
    });
  };

  return (
    // Antes esta página se pisaba el ancho con `max-w-5xl`, mientras el listado
    // de Propiedades usaba el `max-w-7xl` del layout: dos listados del mismo
    // panel con anchos distintos. Ahora las dos son `DashboardPage` width=list.
    <DashboardPage>
      <DashboardHeader
        back={{ href: '/dashboardAdmin' }}
        icon={Megaphone}
        iconTone="publicacion"
        title="Publicaciones"
        subtitle={
          loading
            ? 'Cargando…'
            : `${visible.length} de ${posts.length} · se eliminan solas a los ${POST_TTL_DAYS} días`
        }
        actions={
          <Link
            href="/dashboardAdmin/publicaciones/nueva"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b7a4b] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(11,122,75,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0f8b57] active:scale-[0.98]"
          >
            <Plus size={17} />Nueva publicación
          </Link>
        }
      />

      {/* Filtros: esta pantalla no tenía ninguno. Con publicaciones que vencen
          a los 7 días, poder ordenar por "vencen primero" es lo más útil. */}
      {!loading && posts.length > 0 && (
        <ListToolbar>
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar en el texto de la publicación..."
          />
          <ListSelect value={sortBy} onChange={(v) => setSortBy(v as SortBy)} label="Ordenar publicaciones" icon={ArrowUpDown}>
            <option value="recientes">Más recientes</option>
            <option value="antiguas">Más antiguas</option>
            <option value="vencen">Vencen primero</option>
            <option value="likes">Más likes</option>
            <option value="comentarios">Más comentadas</option>
          </ListSelect>
        </ListToolbar>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-gray-500">
          <Loader2 size={20} className="animate-spin" />Cargando publicaciones…
        </div>
      ) : posts.length === 0 ? (
        <div className={`${CARD} px-6 py-20 text-center`}>
          <Megaphone size={38} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-bold text-gray-900">Todavía no hay publicaciones</p>
          <p className="mt-2 text-sm text-gray-500">
            Creá la primera con el botón &quot;Nueva publicación&quot;.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <NoMatches onClear={() => setSearch('')} message="Ninguna publicación contiene ese texto." />
      ) : (
        <ListReveal as="ul" className="space-y-4">
          {visible.map((post) => {
            const left = daysLeft(post.createdAt);
            const isOpen = expanded === post.id;

            return (
              <ListReveal.Item as="li" key={post.id} className={`${CARD} overflow-hidden`}>
                <div className="flex flex-col gap-4 p-5 sm:flex-row">
                  {/* Miniatura */}
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-32 sm:w-44">
                    <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="176px" />
                  </div>

                  {/* Datos */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <p className="line-clamp-3 text-sm leading-relaxed text-gray-700">{post.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 font-semibold text-gray-600">
                        <Clock size={12} />
                        {new Date(post.createdAt).toLocaleDateString('es-AR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 font-semibold text-rose-600">
                        <Heart size={12} />{post.likesCount} me gusta
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 font-semibold text-sky-700">
                        <MessageCircle size={12} />{post.commentsCount ?? 0} comentarios
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold ${
                          left <= 1 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <CalendarClock size={12} />
                        {left === 0 ? 'Vence hoy' : `${left} día${left === 1 ? '' : 's'} restantes`}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : post.id)}
                      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition-all hover:border-[#0b7a4b]/40 hover:text-[#0b7a4b] sm:flex-none"
                    >
                      <MessageCircle size={14} />Moderar
                      <ChevronDown size={13} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(post)}
                      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100 sm:flex-none"
                    >
                      <Trash2 size={14} />Eliminar
                    </button>
                  </div>
                </div>

                {/* Moderación de comentarios — se monta recién al abrir, para no
                    pedir los comentarios de todas las publicaciones de una. */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50/70 p-5">
                    <p className="mb-3 text-[11px] font-bold tracking-widest text-[#0b7a4b] uppercase">
                      Moderación de comentarios
                    </p>
                    <CommentModeration postId={post.id} />
                  </div>
                )}
              </ListReveal.Item>
            );
          })}
        </ListReveal>
      )}
    </DashboardPage>
  );
}
