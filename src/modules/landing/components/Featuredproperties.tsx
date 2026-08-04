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
 * Regla de negocio: las mejor valoradas primero. El orden y el recorte los
 * resuelve el backend con `sortBy=rating&order=DESC&limit=4`
 * (`propertiesService.getFeatured`).
 *
 * Antes esta sección descargaba el catálogo COMPLETO con `GET /properties` y
 * ordenaba en memoria, porque era el único listado que incluía `ratingAverage`.
 * Ya no hace falta: `/properties/filter` devuelve ese campo, y encima filtra
 * por `status: 'disponible'`, así que nunca se destaca algo ya vendido.
 *
 * Fondo `surface` (gris) con tarjetas blancas: así las tarjetas se despegan del
 * fondo de verdad, no solo por la sombra.
 */
export default async function FeaturedProperties() {
  // Si el backend no está disponible (ej. durante el build) se renderiza el
  // estado vacío en vez de romper el prerender de la landing.
  let featured: Property[] = [];
  try {
    featured = await propertiesService.getFeatured(HOW_MANY);
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
          title={<>Las mejores valoradas por <span className="text-brand-700">nuestros clientes</span></>}
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
