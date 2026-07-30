'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Star, Bed, Bath, Maximize } from 'lucide-react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import { myActivityService, type MyRating } from '@/modules/properties/services/myActivity.service';
import { getErrorMessage } from '@/modules/shared/lib/apiError';

/** Propiedades que el usuario valoró, con la puntuación que les puso. */
export default function ValoradasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [ratings, setRatings] = useState<MyRating[]>([]);
  const [loading, setLoading] = useState(true);

  // Sin sesión → al login, en vez de una pantalla vacía o un error crudo.
  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    myActivityService
      .getMyRatings()
      .then((data) => { if (alive) setRatings(data); })
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
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
          <Star size={20} className="fill-amber-400 text-amber-400" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propiedades que valoré</h1>
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando…' : `${ratings.length} ${ratings.length === 1 ? 'valoración' : 'valoraciones'}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-gray-500">
          <Loader2 size={20} className="animate-spin" />Cargando tus valoraciones…
        </div>
      ) : ratings.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
          <Star size={38} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-bold text-gray-900">Todavía no valoraste ninguna propiedad</p>
          <p className="mt-2 text-sm text-gray-500">
            Entrá a una propiedad del catálogo y dejá tu puntuación.
          </p>
          <Link
            href="/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#0b7a4b] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0f8b57]"
          >
            Ver el catálogo<ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ratings.map((rating) => {
            const p = rating.property;
            const cover = p?.images?.find((i) => i.isCover)?.url || p?.images?.[0]?.url;
            return (
              <li key={rating.id}>
                <Link
                  href={`/properties/${p?.id}`}
                  className="group flex gap-4 overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0b7a4b]/30 hover:shadow-md"
                >
                  <div className="relative h-28 w-32 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                    {cover && <Image src={cover} alt={p.title} fill sizes="128px" className="object-cover" />}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="line-clamp-1 font-bold text-gray-900 transition-colors group-hover:text-[#0b7a4b]">
                        {p?.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                        {p?.barrio}{p?.localidad ? `, ${p.localidad}` : ''}
                      </p>

                      {/* Puntuación que puso el usuario */}
                      <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= rating.score ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
                          />
                        ))}
                        <span className="ml-1 text-xs font-bold text-gray-600">{rating.score}/5</span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Bed size={12} />{p?.rooms}</span>
                      <span className="flex items-center gap-1"><Bath size={12} />{p?.bathrooms}</span>
                      {p?.supTotal != null && (
                        <span className="flex items-center gap-1"><Maximize size={12} />{p.supTotal} m²</span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
