'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, Users, CalendarDays, Star } from 'lucide-react';

/**
 * Contador de confianza (Bloque LANDING §6, rediseñado en §5).
 *
 * Los números suben cuando la sección entra en viewport, con `useInView` de
 * framer-motion + requestAnimationFrame. NO se agregó ninguna dependencia.
 *
 * Rediseño (tanda de ajustes): las 4 métricas ahora viven en tarjetas de fondo
 * BLANCO (antes eran "glass" translúcidas sobre el verde y se leían apagadas),
 * con sombra propia y hover que las eleva. Detrás de las tarjetas, sobre el
 * verde profundo, hay una marca de agua "CT" gigante como elemento decorativo
 * de marca. El fondo sigue siendo `.surface-brand-deep`, el mismo ancla visual
 * de la franja de estudiantes y el footer.
 *
 * ⚠️ Los valores son contenido de marketing, no datos de la base. Traer el
 * total real con GET /properties haría que la cifra baje al despublicar
 * propiedades. Si se quiere el número real, la fuente natural es GET /stats/*.
 */

const stats = [
  { value: 50, suffix: '+', label: 'Propiedades publicadas', Icon: Building2 },
  { value: 100, suffix: '+', label: 'Clientes satisfechos', Icon: Users },
  { value: 7, suffix: ' años', label: 'En el mercado cordobés', Icon: CalendarDays },
  { value: 4.9, suffix: '', label: 'Valoración promedio', Icon: Star, decimals: 1 },
];

const DURATION_MS = 1600;

function useCountUp(target: number, active: boolean, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    // Respeta a quien pidió menos movimiento en el sistema operativo.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }

    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Number((target * eased).toFixed(decimals)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, decimals]);

  return value;
}

function StatCard({
  stat,
  active,
  index,
}: {
  stat: (typeof stats)[number];
  active: boolean;
  index: number;
}) {
  const decimals = stat.decimals ?? 0;
  const value = useCountUp(stat.value, active, decimals);
  const Icon = stat.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
      className="group flex cursor-default flex-col items-center rounded-2xl border border-white/40 bg-white px-6 py-8 text-center shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] transition-all duration-400 hover:-translate-y-1.5 hover:shadow-[0_28px_55px_-18px_rgba(0,0,0,0.6)]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-all duration-400 group-hover:scale-110 group-hover:bg-brand-700 group-hover:text-white">
        <Icon size={24} strokeWidth={2} />
      </div>

      {/* Número en verde de marca (bien contrastado sobre blanco), label en gris:
          jerarquía clara entre el dato y su descripción. */}
      <p className="mt-6 text-4xl font-black tracking-tight text-brand-700 tabular-nums md:text-5xl">
        {value.toFixed(decimals)}
        <span className="text-3xl md:text-4xl">{stat.suffix}</span>
      </p>

      <p className="mt-2.5 text-sm font-semibold text-ink-500">{stat.label}</p>
    </motion.div>
  );
}

export default function Confianza() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="surface-brand-deep relative overflow-hidden py-24 md:py-28">
      {/* Marca de agua "CT" — decorativa, sobre el verde y detrás de las tarjetas
          (z-0). Verde más claro que el fondo para que se note apenas. En la
          fuente serif de marca (Playfair). Se recorta contra el borde derecho. */}
      <span
        aria-hidden
        style={{ fontFamily: 'var(--font-heading)' }}
        className="pointer-events-none absolute top-1/2 -right-8 z-0 -translate-y-1/2 text-[22rem] leading-none font-black text-white/6 select-none sm:right-4 md:text-[28rem]"
      >
        CT
      </span>

      <div ref={ref} className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <span className="inline-block rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-bold tracking-[0.22em] text-white uppercase backdrop-blur-sm">
            Nuestra trayectoria
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Números que respaldan cada operación
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
            Años de trabajo en Córdoba, medidos en familias que ya encontraron su lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} active={inView} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
