'use client';

import { motion } from 'framer-motion';

/**
 * Encabezado de sección estándar para toda la landing (Bloque LANDING).
 * Reemplaza el patrón repetido "eyebrow + h2 + barra verde de 0.5px" que
 * tenían Featuredproperties/Servicios/Reseñas/Nosotros/RealEstateFAQ cada
 * uno por su cuenta. La barra se reemplaza por un eyebrow tipo "pill" —
 * más moderno y evita 5 copias de la misma línea decorativa.
 */

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ eyebrow, title, subtitle, className = '' }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`mx-auto mb-14 max-w-2xl text-center md:mb-16 ${className}`}
    >
      {/* Píldora sólida: antes era `bg-brand-50` (#eff9f4), casi invisible
          sobre blanco. Ahora es el verde de marca pleno con texto blanco —
          tiene presencia real sin competir con el h2, porque es chica. */}
      <span className="inline-block rounded-full bg-brand-700 px-4 py-1.5 text-xs font-bold tracking-[0.22em] text-white uppercase shadow-[0_4px_12px_-4px_rgba(11,122,75,0.6)]">
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-ink-500 md:text-lg">{subtitle}</p>
      )}
    </motion.div>
  );
}

export default SectionHeading;
