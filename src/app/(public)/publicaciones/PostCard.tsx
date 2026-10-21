'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Heart, MessageCircle, Send, Loader2, Shield, ChevronDown,
  CornerDownRight, X, Share2, Check, EyeOff, UserRound,
} from 'lucide-react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import { postsService } from '@/modules/posts/services/posts.service';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { authorNameOf, isGuestComment, COMMENT_MAX } from '@/modules/shared/lib/interaction';
import { GuestNameField } from '@/modules/shared/ui/GuestNameField';
import type { Post, PostComment } from '@/modules/shared/types/api';
import { PostMediaGallery } from '@/modules/posts/components/PostMediaGallery';
import { CopyPostLinkButton } from '@/modules/posts/components/CopyPostLinkButton';
import { fechaConHora, fechaCortaConHora } from '@/modules/shared/lib/fecha';

/**
 * Tarjeta de una publicación en el feed público.
 *
 * "Me gusta", comentar y responder están abiertos a TODOS, con o sin sesión.
 * Con sesión todo queda en la cuenta, como antes; sin sesión, el backend lo
 * ata a la cookie anónima del visitante (no hay que mandar nada extra) y el
 * comentario lleva el nombre opcional que deje (o "Visitante").
 */
export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();

  // Solo sin sesión: nombre opcional del visitante + honeypot anti-bots.
  const [guestName, setGuestName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const guest = user ? undefined : { guestName, website: honeypot };

  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [liking, setLiking] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  // Respuesta inline: `replyingTo` guarda el id del comentario al que se está
  // respondiendo (null = ninguno).
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [copiado, setCopiado] = useState(false);

  /**
   * Compartir la publicación.
   *
   * Usa el diálogo nativo del sistema cuando existe (mobile: manda a WhatsApp,
   * Instagram, etc.). En escritorio casi nunca está, así que cae a copiar el
   * link al portapapeles y avisa con un check de 2s.
   *
   * La URL se arma con `window.location.origin` y no con una constante: así
   * funciona igual en local, en preview y en producción sin configurar nada.
   */
  const handleShare = async () => {
    const url = `${window.location.origin}/publicaciones/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Publicación de Cerca Trova', text: post.description.slice(0, 100), url });
        return;
      } catch {
        // El usuario canceló el diálogo: no es un error que haya que mostrar.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success('Link copiado');
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('No se pudo copiar el link');
    }
  };

  const handleLike = async () => {
    if (liking) return;

    // Optimista: se revierte si el backend falla.
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevCount + (prevLiked ? -1 : 1));
    setLiking(true);

    try {
      const res = await postsService.toggleLike(post.id);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch (error) {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(getErrorMessage(error));
    } finally {
      setLiking(false);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      setComments(await postsService.getComments(post.id));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) loadComments();
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    setSending(true);
    try {
      await postsService.addComment(post.id, newComment.trim(), guest);
      setNewComment('');
      await loadComments();
      toast.success('Comentario publicado ✓');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const openReply = (commentId: number) => {
    setReplyingTo((prev) => (prev === commentId ? null : commentId));
    setReplyText('');
  };

  const handleReply = async (commentId: number) => {
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      // El backend cuelga la respuesta del comentario RAÍZ aunque se responda
      // a otra respuesta: la conversación se mantiene en un solo nivel.
      await postsService.replyComment(commentId, replyText.trim(), guest);
      setReplyText('');
      setReplyingTo(null);
      await loadComments();
      toast.success('Respuesta publicada ✓');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSendingReply(false);
    }
  };

  const commentCount = comments?.length ?? post.commentsCount ?? 0;

  return (
    <article className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-[0_2px_4px_-2px_rgba(10,12,11,0.06),0_14px_34px_-14px_rgba(10,12,11,0.20)]">
      {/* ── AUTOR ── */}
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700/10">
          {post.agent?.photo
            ? <Image src={post.agent.photo} alt={post.agent.name} width={40} height={40} className="h-10 w-10 object-cover" />
            : <span className="text-sm font-bold text-brand-700">{post.agent?.name?.[0]?.toUpperCase() ?? 'C'}</span>}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
            {post.agent?.name ?? 'Cerca Trova'}
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
              <Shield size={8} />Admin
            </span>
          </p>
          {/* La fecha es el permalink, como en cualquier red social. */}
          <Link
            href={`/publicaciones/${post.id}`}
            className="text-xs text-ink-500 transition-colors hover:text-brand-700 hover:underline"
          >
            {fechaConHora(post.createdAt)}
          </Link>
        </div>

        {/* Enlace directo a ESTA publicación, arriba a la derecha: para que el
            admin/agente lo copie y se lo mande a sus clientes. */}
        <CopyPostLinkButton postId={post.id} withLabel className="ml-auto" />
      </div>

      {/* ── MEDIOS (imágenes y videos) ──
          `object-contain` sobre fondo oscuro: la imagen viene diseñada por
          fuera (Canva) con texto adentro, recortarla perdería información.
          Con un solo medio se ve igual que la imagen única de antes. */}
      <PostMediaGallery post={post} />

      {/* ── ACCIONES ── */}
      <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3">
        <button
          type="button"
          onClick={handleLike}
          aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
          aria-pressed={liked}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-90 ${
            liked ? 'bg-rose-50 text-rose-600' : 'text-ink-600 hover:bg-rose-50 hover:text-rose-600'
          }`}
        >
          <Heart size={18} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
          {likesCount}
        </button>

        <button
          type="button"
          onClick={toggleComments}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold text-ink-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-800 active:scale-90"
        >
          <MessageCircle size={18} />
          {commentCount}
          <ChevronDown size={14} className={`transition-transform duration-300 ${showComments ? 'rotate-180' : ''}`} />
        </button>

        {/* Compartir — `ml-auto` lo manda al extremo derecho, separado de las
            acciones de interacción. */}
        <button
          type="button"
          onClick={handleShare}
          aria-label="Compartir publicación"
          className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold text-ink-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-800 active:scale-90"
        >
          {copiado ? <Check size={18} className="text-brand-700" /> : <Share2 size={18} />}
          <span className="hidden sm:inline">{copiado ? 'Copiado' : 'Compartir'}</span>
        </button>
      </div>

      {/* ── DESCRIPCIÓN ── */}
      <p className="px-5 py-4 leading-relaxed whitespace-pre-line text-ink-700">{post.description}</p>

      {/* ── COMENTARIOS ── */}
      {showComments && (
        <div className="border-t border-ink-100 bg-surface px-5 py-4">
          {/* Caja de nuevo comentario — para todos. Sin sesión suma el nombre
              opcional (y el honeypot invisible). */}
          <div className="relative mb-4 flex flex-col gap-2">
            {!user && (
              <GuestNameField
                name={guestName}
                onNameChange={setGuestName}
                honeypot={honeypot}
                onHoneypotChange={setHoneypot}
              />
            )}
            <div className="flex items-start gap-2">
              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value.slice(0, COMMENT_MAX))}
                placeholder="Escribí un comentario…"
                aria-label="Tu comentario"
                className="flex-1 resize-none rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-700 placeholder:text-ink-500 focus:border-brand-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleComment}
                disabled={sending || !newComment.trim()}
                aria-label="Enviar comentario"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-700 text-white transition-transform duration-200 hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>

          {loadingComments ? (
            <p className="flex items-center gap-2 py-3 text-sm text-ink-500">
              <Loader2 size={15} className="animate-spin" />Cargando comentarios…
            </p>
          ) : comments && comments.length > 0 ? (
            <ul className="space-y-3">
              {comments.map((comment) => (
                <li key={comment.id}>
                  <CommentBubble comment={comment} onReply={() => openReply(comment.id)} />

                  {/* Respuestas — un solo nivel: las respuestas a una respuesta
                      también cuelgan del comentario raíz (lo resuelve el backend). */}
                  {comment.replies && comment.replies.length > 0 && (
                    <ul className="mt-2 space-y-2 border-l-2 border-ink-200 pl-4">
                      {comment.replies.map((reply) => (
                        <li key={reply.id}>
                          <CommentBubble comment={reply} isReply onReply={() => openReply(comment.id)} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Input de respuesta inline */}
                  {replyingTo === comment.id && !user && (
                    <div className="relative mt-2 ml-4 border-l-2 border-brand-700/30 pl-4">
                      <GuestNameField
                        compact
                        name={guestName}
                        onNameChange={setGuestName}
                        honeypot={honeypot}
                        onHoneypotChange={setHoneypot}
                      />
                    </div>
                  )}
                  {replyingTo === comment.id && (
                    <div className="mt-2 ml-4 flex items-start gap-2 border-l-2 border-brand-700/30 pl-4">
                      <textarea
                        autoFocus
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value.slice(0, COMMENT_MAX))}
                        placeholder={`Respondiendo a ${authorNameOf(comment)}…`}
                        className="flex-1 resize-none rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-700 placeholder:text-ink-500 focus:border-brand-700 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleReply(comment.id)}
                        disabled={sendingReply || !replyText.trim()}
                        aria-label="Enviar respuesta"
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-700 text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sendingReply ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        aria-label="Cancelar respuesta"
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-ink-500 shadow-sm transition-colors hover:text-red-500"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-center text-sm text-ink-500">
              Todavía no hay comentarios. Sé el primero.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function CommentBubble({
  comment, isReply = false, onReply,
}: {
  comment: PostComment; isReply?: boolean; onReply?: () => void;
}) {
  const isAdmin = comment.user?.role === 'admin';
  const isGuest = isGuestComment(comment);
  const name = authorNameOf(comment);

  /**
   * Un comentario oculto sólo llega hasta acá si quien mira es ADMIN: el
   * backend los filtra para todos los demás (`OptionalJwtAuthGuard` en
   * `GET /posts/:id/comments` puebla `req.user` y decide según el rol).
   *
   * Antes ese guard no estaba y esta rama era inalcanzable. Ahora que sí llega,
   * hay que marcarlo: sin esto, un admin que oculta un comentario lo sigue
   * viendo idéntico en el feed público y parece que la moderación no funcionó.
   */
  const isHidden = comment.isHidden === true;

  return (
    <div
      className={`rounded-2xl border p-3.5 ${
        isHidden
          ? 'border-amber-300 bg-amber-50/70'
          : isAdmin
            ? 'border-brand-700/25 bg-brand-50'
            : 'border-ink-100 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {comment.user?.photo ? (
          <Image
            src={comment.user.photo}
            alt={name}
            width={26}
            height={26}
            className="h-6.5 w-6.5 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-brand-700/10 text-[10px] font-bold text-brand-700">
            {isGuest ? <UserRound size={13} /> : name[0]?.toUpperCase()}
          </span>
        )}
        <span className="text-sm font-bold text-ink-900">{name}</span>
        {isGuest && (
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[9px] font-bold tracking-wider text-ink-500 uppercase">
            Visitante
          </span>
        )}
        {isAdmin && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
            <Shield size={8} />{isReply ? 'Respuesta del equipo' : 'Admin'}
          </span>
        )}
        {isHidden && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
            <EyeOff size={8} />Oculto
          </span>
        )}
        <span className="text-xs text-ink-500">
          {fechaCortaConHora(comment.createdAt)}
        </span>
      </div>
      <p className={`mt-1.5 text-sm leading-relaxed ${isHidden ? 'text-ink-500 italic' : 'text-ink-700'}`}>
        {comment.content}
      </p>
      {isHidden && (
        <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
          Sólo vos ves este comentario. Para el resto está oculto — podés volver a mostrarlo desde
          Publicaciones, en el panel.
        </p>
      )}

      {/* Responder está disponible para todos: usuarios logueados y
          visitantes sin sesión. */}
      {onReply && (
        <button
          type="button"
          onClick={onReply}
          className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-ink-500 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700"
        >
          <CornerDownRight size={13} />
          {isReply ? 'Responder al hilo' : 'Responder'}
        </button>
      )}
    </div>
  );
}
