'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, Users, CalendarDays, Star } from 'lucide-react';

/**
 * Contador de confianza (Bloque LANDING §6) — sección NUEVA.
 *
 * Los números suben cuando la sección entra en viewport. Se usa `useInView` de
 * framer-motion (ya instalado) + requestAnimationFrame; NO se agregó ninguna
 * dependencia nueva para esto.
 *
 * ⚠️ Los valores son contenido de marketing, no datos de la base. Se decidió
 * a propósito no traer el total real con GET /properties: la cifra bajaría si
 * se despublican propiedades y quedaría raro ("120 propiedades" un día y "90"
 * al siguiente), además de sumar una request bloqueante a la landing. Si más
 * adelante se quiere el número real, la fuente natural es `GET /stats/*`, que
 * el backend ya expone y el frontend todavía no consume.
 */

const stats = [
  { value: 250, suffix: '+', label: 'Propiedades publicadas', Icon: Building2 },
  { value: 480, suffix: '+', label: 'Clientes satisfechos', Icon: Users },
  { value: 7,   suffix: ' años', label: 'En el mercado cordobés', Icon: CalendarDays },
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
      // easeOutCubic: arranca rápido y desacelera al final.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((target * eased).toFixed(decimals)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, decimals]);

  return value;
}

function StatItem({
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
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
      className="flex flex-col items-center text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-sm">
        <Icon size={24} strokeWidth={2} />
      </div>

      <p className="mt-5 text-4xl font-black tracking-tight text-white tabular-nums md:text-5xl">
        {value.toFixed(decimals)}
        <span className="text-3xl md:text-4xl">{stat.suffix}</span>
      </p>

      <p className="mt-2 text-sm font-medium text-white/80">{stat.label}</p>
    </motion.div>
  );
}

export default function Confianza() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative overflow-hidden py-24 md:py-28" style={{ background: 'var(--gradient-brand)' }}>
      {/* Círculos decorativos, mismo lenguaje que /servicios/:id */}
      <span className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5" />
      <span className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5" />

      <div ref={ref} className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.25em] text-white uppercase backdrop-blur-sm">
            Nuestra trayectoria
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Números que respaldan cada operación
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <StatItem key={stat.label} stat={stat} active={inView} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
