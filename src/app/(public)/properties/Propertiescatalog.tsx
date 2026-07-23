'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, SearchX } from 'lucide-react';
import { usePropertyFilters } from '@/modules/properties/hooks/usePropertyFilters';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { PropertyCard } from '@/modules/properties/components/PropertyCard';
import { PropertyRow } from '@/modules/properties/components/PropertyRow';
import { CatalogFilterBar } from '@/modules/properties/components/CatalogFilterBar';
import { FiltersModal } from '@/modules/properties/components/FiltersModal';
import { Property } from '@/modules/properties/interfaces/propertyInterface';

interface Props {
  initialItems: Property[];
  initialTotal: number;
}

type ViewMode = 'grid' | 'list';

// Cantidad por página (misma para ambas vistas). Antes la lista usaba 10 y el
// mosaico 12, y alternar la vista forzaba un refetch → parpadeo de skeleton +
// remonte de las tarjetas: ESE era el "cabeceo" (subían, bajaban y volvían a
// subir). Con un único límite el toggle es puro re-layout en el cliente, sin
// pegarle a la API, y la transición queda fluida (ver AnimatePresence abajo).
const PAGE_LIMIT = 12;

// Variantes de framer-motion. `exit` fundea el bloque saliente antes de montar
// el entrante (AnimatePresence mode="wait"); entrada con leve escala + slide
// para una sensación más premium (Airbnb/Zillow-like) sin llegar a ser un rebote.
const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' as const } },
};
const gridItem = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function PropertiesCatalog({ initialItems, initialTotal }: Props) {
  const { filters, setFilters } = usePropertyFilters();
  const [items, setItems] = useState<Property[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [nonce, setNonce] = useState(0); // fuerza el re-stagger en cada fetch
  // Mapa id→promedio de valoración. `GET /properties/filter` NO devuelve
  // `ratingAverage` (solo `GET /properties` y `/:id`), así que lo traemos una
  // vez de `getAll()` y lo cruzamos con la página filtrada que se muestra.
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const isFirstRender = useRef(true);

  // ── FETCH cuando cambian los filtros (la URL es la fuente de verdad) ──
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await propertiesService.getFilteredProperties(filters);
        setItems(response?.data || []);
        setTotal(response?.meta?.totalItems || 0);
        setNonce((n) => n + 1);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  // ── Valoraciones (una sola vez) ──
  useEffect(() => {
    propertiesService
      .getAll()
      .then((all) => {
        const map: Record<number, number> = {};
        all.forEach((p) => {
          if (typeof p.ratingAverage === 'number' && p.ratingAverage > 0) {
            map[p.id] = p.ratingAverage;
          }
        });
        setRatings(map);
      })
      .catch(() => {});
  }, []);

  // Items enriquecidos con su valoración para pasarla a las tarjetas.
  const itemsWithRatings = useMemo(
    () => items.map((p) => ({ ...p, ratingAverage: ratings[p.id] ?? p.ratingAverage })),
    [items, ratings]
  );

  const perPage = filters.limit || PAGE_LIMIT;
  const totalPages = Math.ceil(total / perPage);
  const currentPage = filters.page || 1;

  // Filtros activos DEL MODAL ("Más filtros") — para el badge. Excluye
  // paginación, búsqueda, operación y ordenamiento, que tienen su propio
  // control fuera del modal (fila de arriba / input de búsqueda).
  const activeFiltersCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([k, v]) =>
          !['page', 'limit', 'search', 'operationType', 'sortBy', 'order'].includes(k) &&
          v !== undefined && v !== null && v !== ''
      ).length,
    [filters]
  );

  const changeView = (mode: ViewMode) => {
    if (mode === viewMode) return;
    // Solo cambia el layout en el cliente — sin tocar la URL ni refetchear.
    // AnimatePresence hace el crossfade entre mosaico y lista.
    setViewMode(mode);
  };

  const goToPage = (page: number) => {
    setFilters({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          SECCIÓN 1 — Hero + Filtros. Fondo claro y limpio: la atención va
          al buscador, no compite con nada. Termina justo después del panel.
          ═══════════════════════════════════════════════════════════════ */}
      {/* `relative z-20` para que los menús desplegables del panel de filtros,
          cuando se desbordan hacia abajo, queden POR ENCIMA de la sección 2
          (cuyo contenido tiene `relative z-10`) en vez de pasar por detrás.
          OJO: nada de `overflow-hidden` acá — volvería a recortar los menús. */}
      <section className="relative z-20 bg-[#F8FAF8] pt-28 pb-14">

        {/* ── FONDO: fresco "Cerca Trova" (Vasari) ──
            Capa decorativa detrás del contenido. La imagen es muy detallada, así
            que va con un velo claro encima: se percibe la obra como textura pero
            el título y el buscador conservan todo su contraste. Los degradados
            de arriba/abajo la funden con el navbar y con la sección 2. */}
        <div aria-hidden className="absolute inset-0 z-0">
          <Image
            src="/antimano.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Velo principal — mantiene la sección "clara" y legible */}
          <div className="absolute inset-0 bg-black/45" />
          {/* Fundido superior (hacia el navbar) */}
          <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-[#1c221c] to-transparent" />
          {/* Fundido inferior (hacia la sección de resultados) */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-[#000000]" />
        </div>

        <div className="relative z-10 mx-auto max-w-350 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="mx-auto mb-8 max-w-2xl text-center">
              
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                Encontrá tu próxima <span className="text-black-700">propiedad</span>
              </h1>
              <p className="mt-4 text-base leading-relaxed text-white md:text-lg">
                Explorá el catálogo completo, filtrá por lo que buscás y encontrá tu lugar en Córdoba.
              </p>
            </div>

            <div className="mx-auto max-w-7xl">
              <CatalogFilterBar
                onOpenFilters={() => setShowFilters(true)}
                activeFiltersCount={activeFiltersCount}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECCIÓN 2 — Resultados. Corte de fondo MUY evidente: acá empieza
          "explorar", en verde suave con textura vegetal apenas perceptible.
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-200 min-h-[70vh] pt-10 pb-16">
        <div className="relative z-10 mx-auto max-w-350 px-4 sm:px-6">

          {/* ── TOOLBAR: resultados + switch de vista ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="mb-6 flex items-center justify-between gap-4"
          >
            <p className="text-sm font-medium text-ink-800">
              {loading ? (
                'Buscando...'
              ) : (
                <>
                  <span className="font-bold text-brand-700">{total}</span>{' '}
                  {total === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
                </>
              )}
            </p>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-ink-800 sm:inline">
                Página {currentPage} de {totalPages || 1}
              </span>
              <div className="flex items-center gap-1 rounded-full border border-ink-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => changeView('grid')}
                  aria-label="Vista mosaico"
                  className={`cursor-pointer rounded-full p-2 transition-all duration-200 ${
                    viewMode === 'grid' ? 'bg-brand-700 text-white shadow' : 'text-ink-400 hover:text-brand-700'
                  }`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => changeView('list')}
                  aria-label="Vista lista"
                  className={`cursor-pointer rounded-full p-2 transition-all duration-200 ${
                    viewMode === 'list' ? 'bg-brand-700 text-white shadow' : 'text-ink-400 hover:text-brand-700'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── RESULTADOS ── */}
          {loading ? (
            <SkeletonGrid viewMode={viewMode} />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-200/70 bg-white py-24 text-center">
              <SearchX size={48} className="mb-4 text-ink-300" />
              <h3 className="mb-2 text-xl font-bold text-ink-700">No encontramos propiedades</h3>
              <p className="max-w-sm text-sm text-ink-400">
                Probá ajustando los filtros o buscando con otros términos.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${viewMode}-${currentPage}-${nonce}`}
                variants={gridContainer}
                initial="hidden"
                animate="show"
                exit="exit"
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'flex flex-col gap-5'
                }
              >
                {itemsWithRatings.map((prop) => (
                  <motion.div key={prop.id} variants={gridItem}>
                    {viewMode === 'grid' ? (
                      <PropertyCard property={prop} />
                    ) : (
                      <PropertyRow property={prop} />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── PAGINACIÓN ── */}
          {totalPages > 1 && !loading && (
            <div className="mt-14 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="cursor-pointer rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-bold text-ink-600 shadow-sm transition-all hover:border-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-ink-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p as number)}
                      className={`h-10 w-10 cursor-pointer rounded-full text-sm font-bold transition-all duration-200 ${
                        currentPage === p
                          ? 'bg-brand-700 text-white shadow-md'
                          : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-600 hover:text-brand-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="cursor-pointer rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-bold text-ink-600 shadow-sm transition-all hover:border-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Siguiente →
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ── MODAL DE FILTROS ── */}
      <FiltersModal open={showFilters} onClose={() => setShowFilters(false)} />
    </>
  );
}

// ── SKELETON de carga ─────────────────────────────────────────────────────────
function SkeletonGrid({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-2xl border border-ink-100 bg-white/80 sm:h-56" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-96 animate-pulse rounded-2xl border border-ink-100 bg-white/80" />
      ))}
    </div>
  );
}
