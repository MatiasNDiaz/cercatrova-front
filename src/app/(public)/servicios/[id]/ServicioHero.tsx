import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import { CtaButton } from '@/modules/landing/components/CtaButton';

/**
 * Banner de las páginas de detalle de servicio, con el MISMO lenguaje visual
 * que el hero de la landing.
 *
 * ⚠️ Por qué no se reusa `PropertySlider` directamente: ese componente no es un
 * "hero" genérico, es el hero DE LA LANDING — trae adentro el carrusel de 5
 * slides hardcodeados, los CTAs que dependen de la sesión (`useAuth`) y, además,
 * renderiza `<LinktreeBand />` y `<EstudiantesBand />` como hermanos. Montarlo
 * acá metería el carrusel completo de la home y esas dos franjas en cada página
 * de servicio.
 *
 * Lo que sí se reutiliza es todo lo reutilizable:
 *  - `CtaButton` (el mismo componente, mismas variantes `primary`/`outlineLight`)
 *  - el tratamiento de imagen del hero: `<Image fill>` + doble capa
 *    `bg-ink-950/25` y degradado, para que el texto blanco tenga contraste
 *    sobre cualquier foto
 *  - la misma escala tipográfica del `h1` (`text-4xl → md:text-6xl`, bold,
 *    tracking-tight y el mismo `drop-shadow`)
 *
 * Lo único propio es el velo extra y el acento por servicio: cada servicio tiene
 * su verde (`accent`), que acá aparece en la píldora del eyebrow y en el filete,
 * sin teñir la foto.
 */

interface ServicioHeroProps {
  image: string;
  imageAlt: string;
  /** Punto focal del recorte, ej. `'center 70%'`. */
  imagePosition?: string;
  eyebrow: string;
  titulo: string;
  tagline: string;
  /** Verde propio del servicio. */
  accent: string;
  /** Link de WhatsApp ya armado con el mensaje del servicio. */
  whatsappUrl: string;
}

export function ServicioHero({
  image,
  imageAlt,
  imagePosition = 'center',
  eyebrow,
  titulo,
  tagline,
  accent,
  whatsappUrl,
}: ServicioHeroProps) {
  return (
    <section className="relative h-140 w-full overflow-hidden bg-ink-950 md:h-160">
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: imagePosition }}
      />

      {/* Mismas dos capas del hero de la landing… */}
      <div className="absolute inset-0 bg-ink-950/25" />
      <div className="absolute inset-0 bg-linear-to-t from-ink-950/15 via-ink-950/25 to-ink-950/5" />
      {/* …más un refuerzo propio: acá el bloque de texto es más denso (eyebrow +
          título + bajada + dos botones) y las fotos de servicio son más claras
          que las del carrusel de la home. */}
      <div className="absolute inset-0 bg-linear-to-b from-ink-950/55 via-ink-950/35 to-ink-950/65" />

      {/* Volver a Servicios — fuera del bloque centrado, como en AuthShell. */}
      <Link
        href="/#servicios"
        className="group absolute top-8 left-1/2 z-20 inline-flex w-full max-w-6xl -translate-x-1/2 items-center gap-2 px-6 text-sm font-semibold text-white/80 transition-colors hover:text-white"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm transition-transform group-hover:-translate-x-0.5">
          <ArrowLeft size={14} />
        </span>
        Volver a Servicios
      </Link>

      <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
        <div className="w-full max-w-4xl text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-[0.22em] text-white uppercase shadow-lg"
            style={{ background: accent }}
          >
            {eyebrow}
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-5xl md:text-6xl">
            {titulo}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-lg">
            {tagline}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <CtaButton
              href={whatsappUrl}
              external
              variant="primary"
              icon={<MessageCircle size={18} />}
              className="w-full sm:w-auto"
            >
              Consultar por WhatsApp
            </CtaButton>

            <CtaButton
              href="/properties"
              variant="outlineLight"
              icon={<ArrowRight size={18} className="transition-transform duration-300 group-hover/cta:translate-x-1" />}
              className="w-full sm:w-auto"
            >
              Ver propiedades
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ServicioHero;
