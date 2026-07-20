// Server Component — no necesita "use client"
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { Property } from '@/modules/shared/types/api';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { FeaturedPropertyCard } from './FeaturedPropertyCard';

const HOW_MANY = 4;

/**
 * Propiedades destacadas (Bloque LANDING §2).
 *
 * Regla de negocio: las mejor valoradas primero. Se usa GET /properties
 * (vía `propertiesService.getAll`) porque es el único listado que incluye
 * `ratingAverage`; GET /properties/filter, que usaba la versión anterior, no lo trae.
 *
 * El orden es: ratingAverage desc → created_at desc. Ese segundo criterio hace
 * que, si hay empates o pocas propiedades valoradas, la lista se complete sola
 * con las más recientes hasta llegar a 4, sin lógica extra.
 */
function pickFeatured(all: Property[]): Property[] {
  return [...all]
    .sort((a, b) => {
      const ra = a.ratingAverage ?? 0;
      const rb = b.ratingAverage ?? 0;
      if (rb !== ra) return rb - ra;
      // Desempate: más reciente primero.
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, HOW_MANY);
}

export default async function FeaturedProperties() {
  // Si el backend no está disponible (ej. durante el build) se renderiza el
  // estado vacío en vez de romper el prerender de la landing.
  let featured: Property[] = [];
  try {
    featured = pickFeatured(await propertiesService.getAll());
  } catch {
    featured = [];
  }

  return (
    <section id="propiedades" className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Propiedades destacadas"
          title={<>Las mejor valoradas por <span className="text-brand-700">nuestros clientes</span></>}
          subtitle="Una selección de propiedades elegidas por su ubicación, calidad y potencial de inversión."
        />

        {featured.length === 0 ? (
          <p className="rounded-3xl bg-surface py-16 text-center text-ink-500">
            No hay propiedades disponibles en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((property, i) => (
              <Reveal key={property.id} delay={i * 0.08} className="h-full">
                <FeaturedPropertyCard property={property} />
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delay={0.1}>
          <div className="mt-14 flex justify-center">
            <Link
              href="/properties"
              style={{ background: 'var(--gradient-brand)' }}
              className="group flex items-center gap-2.5 rounded-2xl px-9 py-4 text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(11,122,75,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(11,122,75,0.8)] hover:brightness-110 active:scale-[0.98]"
            >
              Ver todas las propiedades
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
