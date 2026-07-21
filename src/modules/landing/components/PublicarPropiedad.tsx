'use client';

import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Reveal } from './Reveal';
import { CtaButton } from './CtaButton';

const badges = [
  'Publicación rápida',
  'Revisión profesional',
  'Mayor visibilidad',
];

export default function PublicarPropiedad() {
  return (
    <section className="overflow-hidden bg-brand-50 py-28">
      <div className="mx-auto max-w-7xl px-6">

        {/* Badge superior */}
        <div className="mb-18 flex justify-center">
          <span className="rounded-full bg-brand-700 px-6 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white shadow-[0_10px_25px_-10px_rgba(11,122,75,.45)]">
            ¿TENÉS UNA PROPIEDAD?
          </span>
        </div>

        <div className="grid items-center gap-38 lg:grid-cols-2">

          {/* ==================== IMAGEN ==================== */}

          <Reveal>
            <div className="relative mx-auto w-full max-w-xl">

              <div className="relative h-[500px] overflow-hidden rounded-[36px] shadow-[0_35px_80px_-30px_rgba(0,0,0,.28)]">
                <Image
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1600&auto=format&fit=crop"
                  alt="Publicar propiedad"
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px)100vw,50vw"
                />
              </div>

              {/* Badges flotantes */}

              <div className="absolute right-[-96px] top-1/2 flex -translate-y-1/2 flex-col gap-7">

                {badges.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-1.5 rounded-full bg-white px-2 py-3 shadow-[0_20px_45px_-20px_rgba(0,0,0,.25)]"
                  >
                    <CheckCircle2
                      size={22}
                      className="text-brand-700 shrink-0"
                    />

                    <span className="font-semibold text-brand-700 whitespace-nowrap">
                      {item}
                    </span>
                  </div>
                ))}

              </div>

            </div>
          </Reveal>

          {/* ==================== TEXTO ==================== */}

          <Reveal delay={0.1}>
            <div className="max-w-xl">

              <h2 className="text-5xl font-bold leading-[1.08] tracking-tight text-ink-900">

                Publicá tu propiedad para

                <br />

                <span className="text-brand-700">
                  alquiler o venta
                </span>

              </h2>

              <p className="mt-8 text-xl leading-relaxed text-ink-600">
                Publicala en pocos minutos. Nosotros revisamos el aviso y lo
                mostramos a compradores e inquilinos reales para aumentar sus
                posibilidades de venta o alquiler.
              </p>

              <div className="mt-10">
                <CtaButton
                  href="/publicar"
                  variant="primary"
                  icon={
                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover/cta:translate-x-1"
                    />
                  }
                >
                  Publicar mi propiedad
                </CtaButton>
              </div>

            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}