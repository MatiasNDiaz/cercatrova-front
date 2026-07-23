// Server Component — no necesita "use client"
import { ArrowRight } from 'lucide-react';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { Property } from '@/modules/shared/types/api';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { FeaturedPropertyCard } from './FeaturedPropertyCard';
import { CtaButton } from './CtaButton';

const HOW_MANY = 4;

/**
 * Propiedades destacadas (Bloque LANDING §2 y §7).
 *
 * Regla de negocio: las mejor valoradas primero. Se usa GET /properties
 * (vía `propertiesService.getAll`) porque es el único listado que incluye
 * `ratingAverage`; GET /properties/filter no lo trae.
 *
 * Orden: ratingAverage desc → created_at desc. Ese segundo criterio hace que,
 * si hay empates o pocas propiedades valoradas, la lista se complete sola con
 * las más recientes hasta llegar a 4, sin lógica extra.
 *
 * Fondo `surface` (gris) con tarjetas blancas: así las tarjetas se despegan del
 * fondo de verdad, no solo por la sombra.
 */
function pickFeatured(all: Property[]): Property[] {
  return [...all]
    .sort((a, b) => {
      const ra = a.ratingAverage ?? 0;
      const rb = b.ratingAverage ?? 0;
      if (rb !== ra) return rb - ra;
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
      {/* Contenedor más ancho que el resto (1400 vs 1280) para que las 4
          tarjetas tengan cuerpo y la propiedad sea protagonista. */}
      <div className="mx-auto max-w-350 px-6">
        <SectionHeading
          eyebrow="Propiedades destacadas"
          title={<>Las mejor valoradas por <span className="text-brand-700">nuestros clientes</span></>}
          subtitle="Una selección de propiedades elegidas por su ubicación, calidad y potencial de inversión."
        />

        {featured.length === 0 ? (
          <p className="rounded-xl border border-ink-200/70 bg-white py-16 text-center text-ink-500">
            No hay propiedades disponibles en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((property, i) => (
              <Reveal key={property.id} delay={i * 0.08} className="h-full">
                <FeaturedPropertyCard property={property} />
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delay={0.1}>
          <div className="mt-16 flex justify-center">
            <CtaButton
              href="/properties"
              variant="primary"
              icon={<ArrowRight size={18} className="transition-transform duration-300 group-hover/cta:translate-x-1" />}
            >
              Ver todas las propiedades
            </CtaButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
