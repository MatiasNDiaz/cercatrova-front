'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Trash2, CornerDownRight, Send, Loader2, MessageCircle, Shield, X,
} from 'lucide-react';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import { postsService } from '@/modules/posts/services/posts.service';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import type { PostComment } from '@/modules/shared/types/api';

/**
 * Moderación de los comentarios de una publicación (vista admin).
 *
 * Tres acciones por comentario: Responder (inline, la respuesta queda anidada),
 * Ocultar/Mostrar (toggle blando — el comentario no se borra, deja de verse
 * para los usuarios comunes) y Eliminar (borra también sus respuestas, por el
 * CASCADE de `parentComment`).
 */
export function CommentModeration({ postId }: { postId: number }) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    postsService
      .getComments(postId)
      .then((data) => { if (alive) setComments(data); })
      .catch((error) => { if (alive) toast.error(getErrorMessage(error)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [postId]);

  const reload = async () => {
    try {
      setComments(await postsService.getComments(postId));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleReply = async (commentId: number) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await postsService.replyComment(commentId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
      await reload();
      toast.success('Respuesta publicada ✓');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const handleToggleHide = async (commentId: number) => {
    try {
      const res = await postsService.toggleHideComment(commentId);
      await reload();
      toast.success(res.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = (comment: PostComment) => {
    const replies = comment.replies?.length ?? 0;
    confirmDialog({
      title: '¿Eliminar comentario?',
      message: replies > 0
        ? `Se va a eliminar el comentario y sus ${replies} respuesta${replies === 1 ? '' : 's'}. No se puede deshacer.`
        : 'El comentario se elimina definitivamente. No se puede deshacer.',
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      icon: Trash2,
      onConfirm: async () => {
        try {
          await postsService.removeComment(comment.id);
          await reload();
          toast.success('Comentario eliminado ✓');
        } catch (error) {
          toast.error(getErrorMessage(error));
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" />Cargando comentarios…
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-gray-500">
        <MessageCircle size={28} className="text-gray-400" />
        <p className="text-sm">Todavía no hay comentarios en esta publicación.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li
          key={comment.id}
          className={`rounded-xl border p-4 transition-colors ${
            comment.isHidden ? 'border-amber-200 bg-amber-50/60' : 'border-gray-200 bg-white'
          }`}
        >
          <CommentHeader comment={comment} />

          <p className={`mt-2 text-sm ${comment.isHidden ? 'text-gray-500 italic' : 'text-gray-700'}`}>
            {comment.content}
          </p>

          {/* Acciones del admin */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ActionButton
              icon={CornerDownRight}
              label="Responder"
              onClick={() => {
                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                setReplyText('');
              }}
            />
            <ActionButton
              icon={comment.isHidden ? Eye : EyeOff}
              label={comment.isHidden ? 'Mostrar' : 'Ocultar'}
              onClick={() => handleToggleHide(comment.id)}
            />
            <ActionButton icon={Trash2} label="Eliminar" danger onClick={() => handleDelete(comment)} />
          </div>

          {/* Input de respuesta inline */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#0b7a4b]/25 bg-[#0b7a4b]/5 p-3">
              <textarea
                autoFocus
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value.slice(0, 500))}
                placeholder="Escribí la respuesta…"
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#0b7a4b] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleReply(comment.id)}
                disabled={sending || !replyText.trim()}
                aria-label="Enviar respuesta"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#0b7a4b] text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
              <button
                type="button"
                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                aria-label="Cancelar respuesta"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-gray-400 shadow-sm transition-colors hover:text-red-500"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Respuestas anidadas */}
          {comment.replies && comment.replies.length > 0 && (
            <ul className="mt-3 space-y-2 border-l-2 border-[#0b7a4b]/20 pl-4">
              {comment.replies.map((reply) => (
                <li
                  key={reply.id}
                  className={`rounded-xl border p-3 ${
                    reply.isHidden ? 'border-amber-200 bg-amber-50/60' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <CommentHeader comment={reply} />
                  <p className={`mt-1.5 text-sm ${reply.isHidden ? 'text-gray-500 italic' : 'text-gray-700'}`}>
                    {reply.content}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ActionButton
                      icon={reply.isHidden ? Eye : EyeOff}
                      label={reply.isHidden ? 'Mostrar' : 'Ocultar'}
                      onClick={() => handleToggleHide(reply.id)}
                    />
                    <ActionButton icon={Trash2} label="Eliminar" danger onClick={() => handleDelete(reply)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function CommentHeader({ comment }: { comment: PostComment }) {
  const isAdmin = comment.user?.role === 'admin';
  return (
    <div className="flex flex-wrap items-center gap-2">
      {comment.user?.photo ? (
        <Image
          src={comment.user.photo}
          alt={comment.user.name}
          width={26}
          height={26}
          className="h-6.5 w-6.5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-[#0b7a4b]/10 text-[10px] font-bold text-[#0b7a4b]">
          {comment.user?.name?.[0]?.toUpperCase() ?? '?'}
        </span>
      )}
      <span className="text-sm font-bold text-gray-800">
        {comment.user?.name} {comment.user?.surname ?? ''}
      </span>
      {isAdmin && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#0b7a4b] px-2 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
          <Shield size={8} />Admin
        </span>
      )}
      {comment.isHidden && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
          <EyeOff size={8} />Oculto
        </span>
      )}
      <span className="text-xs text-gray-400">
        {new Date(comment.createdAt).toLocaleDateString('es-AR', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        })}
      </span>
    </div>
  );
}

function ActionButton({
  icon: Icon, label, onClick, danger = false,
}: {
  icon: React.ElementType; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
        danger
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-gray-200 bg-white text-gray-600 hover:border-[#0b7a4b]/40 hover:text-[#0b7a4b]'
      }`}
    >
      <Icon size={13} />{label}
    </button>
  );
}
