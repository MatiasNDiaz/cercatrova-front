import Link from 'next/link';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { PropertyCard } from '@/modules/properties/components/PropertyCard';
import { StatusProperty } from '@/modules/shared/types/api';

/**
 * /publicaciones — feed de las últimas propiedades publicadas.
 *
 * Se diferencia de `/properties` (el catálogo) en el propósito: acá NO hay
 * filtros ni paginación, es una vista de novedades ordenada por fecha de
 * publicación para que el visitante vea "qué hay de nuevo" de un vistazo.
 * Para buscar con criterios está el catálogo, al que se linkea al final.
 */

export const metadata = {
  title: 'Publicaciones | Cerca Trova',
  description: 'Las últimas propiedades publicadas por Cerca Trova.',
};

const VISIBLES = 12;

export default async function PublicacionesPage() {
  // `date` + DESC = más recientes primero (ver `PropertySortBy` en el backend).
  const response = await propertiesService.getFilteredProperties({
    page: 1,
    limit: VISIBLES,
    sortBy: 'date',
    order: 'DESC',
    status: StatusProperty.DISPONIBLE,
  });

  const items = response?.data ?? [];
  const total = response?.meta?.totalItems ?? 0;

  return (
    <main className="min-h-screen bg-surface">
      {/* ── HERO ── */}
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-32 pb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-1.5 text-[11px] font-bold tracking-[0.22em] text-white uppercase shadow-[0_6px_16px_-8px_rgba(6,57,35,0.7)]">
            <Sparkles size={13} />
            Novedades
          </span>
          <h1 className="mt-5 text-4xl leading-tight font-bold tracking-tight text-ink-900 md:text-5xl">
            Últimas <span className="text-brand-700">publicaciones</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-600">
            Las propiedades que sumamos más recientemente. Si buscás algo puntual,
            usá el catálogo completo con filtros por zona, precio y superficie.
          </p>

          {total > 0 && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink-100 bg-surface px-4 py-2 text-sm font-semibold text-ink-600">
              <Clock size={15} className="text-brand-700" />
              {total} {total === 1 ? 'propiedad disponible' : 'propiedades disponibles'}
            </p>
          )}
        </div>
      </section>

      {/* ── GRILLA ── */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-ink-100 bg-white px-6 py-20 text-center shadow-[0_2px_4px_-2px_rgba(10,12,11,0.06),0_14px_34px_-14px_rgba(10,12,11,0.20)]">
            <p className="text-lg font-bold text-ink-900">Todavía no hay publicaciones</p>
            <p className="mt-2 text-sm text-ink-600">
              Estamos cargando nuevas propiedades. Volvé a pasar en unos días.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {/* ── CTA al catálogo ── */}
        <div className="mt-14 flex justify-center">
          <Link
            href="/properties"
            className="group inline-flex items-center gap-2.5 rounded-xl border-2 border-transparent bg-brand-700 px-8 py-4 font-bold text-white shadow-[0_10px_24px_-10px_rgba(6,57,35,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-800 active:scale-[0.98]"
          >
            Ver el catálogo completo
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </main>
  );
}
