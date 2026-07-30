'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Megaphone, Plus, Heart, MessageCircle, Trash2, Loader2,
  ChevronDown, Clock, CalendarClock,
} from 'lucide-react';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import { postsService } from '@/modules/posts/services/posts.service';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { useUrlFilter } from '@/modules/shared/hooks/useUrlFilter';
import type { Post } from '@/modules/shared/types/api';
import { CommentModeration } from './CommentModeration';

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
  // `?accion=moderar|eliminar` viene del sidebar. Las dos acciones aplican a
  // las mismas publicaciones, así que no filtra: pone la página en ese modo y
  // resalta el botón correspondiente.
  const [accion, setAccion] = useUrlFilter<'' | 'moderar' | 'eliminar'>('accion', '');

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
      icon: Trash2,
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
    <div className="mx-auto max-w-5xl">
      {/* ── HEADER ── */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0b7a4b]/10 text-[#0b7a4b]">
            <Megaphone size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Publicaciones</h1>
            <p className="text-sm text-gray-500">
              Se eliminan automáticamente a los {POST_TTL_DAYS} días de publicadas.
            </p>
          </div>
        </div>

        <Link
          href="/dashboardAdmin/publicaciones/nueva"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#0b7a4b] px-5 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0f8b57] active:scale-[0.98]"
        >
          <Plus size={17} />Nueva publicación
        </Link>
      </div>

      {/* Modo activo — deja claro por qué un botón está resaltado */}
      {accion && (
        <div className={`mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
          accion === 'eliminar'
            ? 'border-red-100 bg-red-50 text-red-700'
            : 'border-[#0b7a4b]/15 bg-[#0b7a4b]/8 text-[#0b7a4b]'
        }`}>
          <span className="font-semibold">
            {accion === 'eliminar'
              ? 'Modo eliminar: usá el botón Eliminar de la publicación que quieras dar de baja.'
              : 'Modo moderar: abrí "Moderar" en la publicación cuyos comentarios quieras revisar.'}
          </span>
          <button
            onClick={() => setAccion('')}
            className="shrink-0 cursor-pointer rounded-lg bg-white/70 px-3 py-1 text-xs font-bold transition-all hover:bg-white"
          >
            Salir del modo
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-gray-500">
          <Loader2 size={20} className="animate-spin" />Cargando publicaciones…
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
          <Megaphone size={38} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-bold text-gray-900">Todavía no hay publicaciones</p>
          <p className="mt-2 text-sm text-gray-500">
            Creá la primera con el botón &quot;Nueva publicación&quot;.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => {
            const left = daysLeft(post.createdAt);
            const isOpen = expanded === post.id;

            return (
              <li key={post.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 p-5 sm:flex-row">
                  {/* Miniatura */}
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-32 sm:w-44">
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
                      className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all sm:flex-none ${
                        accion === 'moderar'
                          ? 'border-[#0b7a4b] bg-[#0b7a4b] text-white hover:bg-[#0f8c58]'
                          : 'border-gray-200 text-gray-600 hover:border-[#0b7a4b]/40 hover:text-[#0b7a4b]'
                      }`}
                    >
                      <MessageCircle size={14} />Moderar
                      <ChevronDown size={13} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(post)}
                      className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all sm:flex-none ${
                        accion === 'eliminar'
                          ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                          : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
