'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Reveal from '@/modules/landing/components/Reveal';
import { ServiceSection, type ServiceTone } from './ServiceBlocks';

/**
 * BLOQUE 6 — Preguntas frecuentes (acordeón).
 *
 * Va en su propio archivo porque necesita estado (`'use client'`); el resto de
 * los bloques son componentes de servidor y no deberían arrastrar JS al cliente
 * solo por convivir con este.
 *
 * Apertura de a una: abrir la siguiente cierra la anterior. Con 3–5 preguntas
 * cortas, tener varias abiertas a la vez solo alarga la página sin aportar.
 *
 * La transición usa `grid-rows-[0fr→1fr]`, el mismo recurso que los submenús
 * del sidebar: anima el alto real sin tener que medirlo en JS.
 */
export function ServiceFaq({
  title,
  items,
  tone = 'white',
}: {
  title: string;
  items: { p: string; r: string }[];
  tone?: ServiceTone;
}) {
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <ServiceSection tone={tone}>
      <Reveal>
        <h2 className="mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl lg:text-4xl">
          {title}
        </h2>
      </Reveal>

      <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
        {items.map((item, i) => {
          const open = abierta === i;
          return (
            <Reveal key={item.p} delay={0.05 * i}>
              <div
                className={`overflow-hidden rounded-xl border bg-white transition-colors duration-200 ${
                  open ? 'border-brand-700/30' : 'border-ink-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setAbierta(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-brand-50/60"
                >
                  <span
                    className={`flex-1 text-[15px] font-bold transition-colors duration-200 ${
                      open ? 'text-brand-800' : 'text-ink-900'
                    }`}
                  >
                    {item.p}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-300 ${
                      open ? 'rotate-180 text-brand-700' : 'text-ink-400'
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-ink-600">{item.r}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </ServiceSection>
  );
}

export default ServiceFaq;
