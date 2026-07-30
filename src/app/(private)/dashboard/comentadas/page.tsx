'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, MessageCircle, EyeOff, Clock } from 'lucide-react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import { myActivityService, type MyComment } from '@/modules/properties/services/myActivity.service';
import { getErrorMessage } from '@/modules/shared/lib/apiError';

/** Propiedades que el usuario comentó, con el texto de cada comentario. */
export default function ComentadasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Sin sesión → al login, en vez de una pantalla vacía o un error crudo.
  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    myActivityService
      .getMyComments()
      .then((data) => { if (alive) setComments(data); })
      .catch((error) => { if (alive) toast.error(getErrorMessage(error)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user]);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/dashboard"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#0b7a4b] transition-colors hover:text-[#0f8b57]"
      >
        <ArrowLeft size={16} />Volver al panel
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0b7a4b]/10 text-[#0b7a4b]">
          <MessageCircle size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propiedades que comenté</h1>
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando…' : `${comments.length} ${comments.length === 1 ? 'comentario' : 'comentarios'}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-gray-500">
          <Loader2 size={20} className="animate-spin" />Cargando tus comentarios…
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
          <MessageCircle size={38} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-bold text-gray-900">Todavía no comentaste ninguna propiedad</p>
          <p className="mt-2 text-sm text-gray-500">
            Entrá a una propiedad del catálogo y dejá tu comentario.
          </p>
          <Link
            href="/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#0b7a4b] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0f8b57]"
          >
            Ver el catálogo<ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => {
            const p = comment.property;
            const cover = p?.images?.find((i) => i.isCover)?.url || p?.images?.[0]?.url;
            return (
              <li
                key={comment.id}
                className={`overflow-hidden rounded-3xl border bg-white p-4 shadow-sm ${
                  comment.isHidden ? 'border-amber-200 bg-amber-50/60' : 'border-gray-200'
                }`}
              >
                <Link href={`/properties/${p?.id}`} className="group flex gap-4">
                  <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                    {cover && <Image src={cover} alt={p.title} fill sizes="112px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-bold text-gray-900 transition-colors group-hover:text-[#0b7a4b]">
                      {p?.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                      {p?.barrio}{p?.localidad ? `, ${p.localidad}` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} />
                        {new Date(comment.created_at).toLocaleDateString('es-AR', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      {/* El backend le devuelve al autor también sus comentarios
                          ocultos — se marca para que sepa que no se ven. */}
                      {comment.isHidden && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                          <EyeOff size={9} />Oculto por el admin
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="mt-3 rounded-2xl bg-gray-50 px-4 py-3">
                  <p className="text-sm leading-relaxed text-gray-700">{comment.message}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
