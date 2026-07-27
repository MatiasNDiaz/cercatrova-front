'use client';

import { ArrowUpRight, MessageCircle, Share2 } from 'lucide-react';
import { Reveal } from './Reveal';

/**
 * Franja de Linktree (tanda de contenido §4).
 *
 * Va entre el Hero y la franja de estudiantes (ver `Slider.tsx`, donde se monta).
 * Es a propósito una franja BAJA y clara: queda entre el hero oscuro y la franja
 * verde profunda de estudiantes, así que hace de respiro entre las dos y no
 * compite con ninguna.
 *
 * El link abre en pestaña nueva. `rel="noopener noreferrer"` no es opcional con
 * `target="_blank"`: sin `noopener`, la página destino recibe `window.opener` y
 * puede redirigir la pestaña original (tabnabbing).
 */

const LINKTREE_URL = 'https://linktr.ee/inmobiliariacercatrova';

export default function LinktreeBand() {
  return (
    <section className="border-y border-ink-100 bg-white py-12 md:py-14">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal y={18}>
          <div className="group relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-ink-300 bg-brand-100/50 px-8 py-9 text-center shadow-[0_2px_10px_-4px_rgba(10,12,11,0.08)] transition-all duration-400 hover:border-brand-700/30 hover:shadow-[0_22px_50px_-22px_rgba(6,57,35,0.32)] sm:flex-row sm:justify-between sm:text-left md:px-12">

            {/* Marca de agua — mismo patrón que el resto de la Landing. */}
            <Share2
              aria-hidden
              size={190}
              strokeWidth={1.2}
              className="pointer-events-none absolute -top-12 -right-10 rotate-12 text-brand-700/5 transition-all duration-500 select-none group-hover:text-brand-700/8"
            />

            <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <span className="flex h-14 w-14 shrink-0 mr-5 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-10px_rgba(11,122,75,0.7)]"
                style={{ background: 'var(--gradient-brand)' }}
              >
                <Share2 size={24} />
              </span>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-ink-900 md:text-2xl">
                  Seguinos y enterate de todo
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500 md:text-base">
                  Nuevas propiedades, novedades del mercado y todos nuestros canales de contacto en un solo lugar.
                </p>
              </div>
            </div>

            {/* CTA propio en vez de `CtaButton`: este necesita `target="_blank"`
                + `rel`, y `CtaButton` con `external` no expone `rel`. */}
            <a
              href={LINKTREE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link relative inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-brand-700 bg-white px-7 py-3.5 text-sm font-bold text-brand-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-700 hover:text-white hover:shadow-[0_12px_28px_-10px_rgba(11,122,75,0.6)] active:scale-[0.98]"
            >
              <MessageCircle size={17} />
              Ver nuestro Linktree
              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
              />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
