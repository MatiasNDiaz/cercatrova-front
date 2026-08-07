'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Star, Bed, Bath, Maximize, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import { myActivityService, type MyRating } from '@/modules/properties/services/myActivity.service';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { loginUrlFromHere } from '@/modules/shared/lib/returnTo';

import { DashboardPage, DashboardHeader, CARD_INTERACTIVE, ListReveal } from '@/modules/shared/ui/DashboardPage';
import { ListToolbar, ListSearch, ListSelect, NoMatches } from '@/modules/shared/ui/ListToolbar';

type SortBy = 'recientes' | 'mejor' | 'peor';
/** Propiedades que el usuario valoró, con la puntuación que les puso. */
export default function ValoradasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [ratings, setRatings] = useState<MyRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recientes');

  // Filtrado de presentación sobre lo ya traído por `getMyRatings()`.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? ratings.filter((r) =>
          r.property?.title?.toLowerCase().includes(q) ||
          r.property?.barrio?.toLowerCase().includes(q) ||
          r.property?.localidad?.toLowerCase().includes(q))
      : ratings;

    return [...list].sort((a, b) => {
      if (sortBy === 'mejor') return b.score - a.score;
      if (sortBy === 'peor')  return a.score - b.score;
      return b.id - a.id; // sin fecha en `MyRating`: el id mayor es el más nuevo
    });
  }, [ratings, search, sortBy]);

  // Sin sesión → al login, en vez de una pantalla vacía o un error crudo.
  // `loginUrlFromHere` recuerda esta pantalla para volver acá tras el login.
  useEffect(() => {
    if (!isLoading && !user) router.push(loginUrlFromHere());
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
    <DashboardPage>
      <DashboardHeader
        icon={Star}
        iconTone="valoracion"
        title="Propiedades que valoré"
        subtitle={
          loading
            ? 'Cargando…'
            : search
              ? `${visible.length} de ${ratings.length} valoraciones`
              : `${ratings.length} ${ratings.length === 1 ? 'valoración' : 'valoraciones'}`
        }
      />

      {!loading && ratings.length > 0 && (
        <ListToolbar>
          <ListSearch value={search} onChange={setSearch} placeholder="Buscar por propiedad, barrio o localidad..." />
          <ListSelect value={sortBy} onChange={(v) => setSortBy(v as SortBy)} label="Ordenar valoraciones" icon={ArrowUpDown}>
            <option value="recientes">Más recientes</option>
            <option value="mejor">Mejor puntuadas</option>
            <option value="peor">Peor puntuadas</option>
          </ListSelect>
        </ListToolbar>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-gray-500">
          <Loader2 size={20} className="animate-spin" />Cargando tus valoraciones…
        </div>
      ) : ratings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
          <Star size={38} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-bold text-gray-900">Todavía no valoraste ninguna propiedad</p>
          <p className="mt-2 text-sm text-gray-500">
            Entrá a una propiedad del catálogo y dejá tu puntuación.
          </p>
          <Link
            href="/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0b7a4b] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0f8b57]"
          >
            Ver el catálogo<ArrowRight size={16} />
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <NoMatches onClear={() => setSearch('')} message="Ninguna propiedad valorada coincide con esa búsqueda." />
      ) : (
        <ListReveal className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((rating) => {
            const p = rating.property;
            const cover = p?.images?.find((i) => i.isCover)?.url || p?.images?.[0]?.url;
            return (
              <ListReveal.Item key={rating.id}>
                <Link
                  href={`/properties/${p?.id}`}
                  className={`group flex gap-4 overflow-hidden p-4 ${CARD_INTERACTIVE}`}
                >
                  <div className="relative h-28 w-32 shrink-0 overflow-hidden rounded-xl bg-gray-100">
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
              </ListReveal.Item>
            );
          })}
        </ListReveal>
      )}
    </DashboardPage>
  );
}
