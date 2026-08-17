'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import { EffectFade, Keyboard, Navigation } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { AmpliarHint } from '@/modules/shared/ui/AmpliarHint';
import type { FichaImage } from './types';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

/**
 * Visor a pantalla completa, bajo demanda — mismo criterio que el detalle de
 * propiedad: Swiper + el módulo Zoom pesan ~37 kB y sólo hacen falta cuando
 * alguien realmente amplía una foto.
 *
 * ⚠️ Es EL MISMO componente que usa `properties/[id]`, no una copia: la ficha
 * tiene que ofrecer exactamente la misma experiencia de zoom y arrastre. La
 * única diferencia es `allowCopy`, que acá va en `true`.
 */
const ImageLightbox = dynamic(
  () => import('@/modules/shared/ui/ImageLightbox').then((m) => m.ImageLightbox),
  { ssr: false },
);

/**
 * Galería de la ficha compartible.
 *
 * ── Qué reemplaza ──────────────────────────────────────────────────────────
 * Antes eran dos bloques estáticos: una portada grande y, debajo, una grilla de
 * miniaturas que no hacían nada. Ver una foto al tamaño real era imposible.
 *
 * Ahora es un carrusel deslizable (flechas + arrastre + teclado) con las
 * miniaturas actuando de índice, y cualquier foto abre el visor con zoom.
 *
 * ── Por qué `EffectFade` y no el deslizamiento por defecto ─────────────────
 * Es la misma transición que usa el hero de la landing (`Slider.tsx`), así que
 * las dos galerías del sitio se sienten iguales. Además, con fotos de
 * proporciones distintas —muy común acá: fachadas apaisadas mezcladas con
 * ambientes verticales— el desplazamiento lateral hace "saltar" el encuadre,
 * mientras que el fundido cambia la imagen sin mover nada.
 */
export function FichaGallery({ images, title }: { images: FichaImage[]; title: string }) {
  const [actual, setActual] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const swiperRef = useRef<SwiperClass | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Home size={40} className="text-white/25" />
      </div>
    );
  }

  const total = images.length;

  return (
    <div className="flex flex-col gap-3">
      {lightbox !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightbox}
          title={title}
          onClose={() => setLightbox(null)}
          /* Copiar la foto: quien recibe la ficha suele ser otro martillero que
             la necesita para su propia publicación. */
          allowCopy
        />
      )}

      {/* ── VISOR PRINCIPAL ── */}
      <div className="group relative h-72 w-full overflow-hidden rounded-2xl border border-white/12 bg-ink-950 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)] sm:h-105">
        <Swiper
          modules={[EffectFade, Navigation, Keyboard]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={450}
          keyboard={{ enabled: true }}
          navigation={{ prevEl: '.fg-prev', nextEl: '.fg-next' }}
          onSwiper={(s) => { swiperRef.current = s; }}
          onSlideChange={(s) => setActual(s.activeIndex)}
          className="h-full w-full [&_.swiper-slide]:h-full [&_.swiper-wrapper]:h-full"
        >
          {images.map((img, i) => (
            <SwiperSlide key={img.id}>
              {/* El slide entero es el botón que abre el visor: es el objetivo
                  más grande posible y no compite con las flechas, que van por
                  encima y más adelante en el DOM. */}
              <button
                type="button"
                onClick={() => setLightbox(i)}
                aria-label={`Ampliar foto ${i + 1} de ${total}`}
                className="relative block h-full w-full cursor-zoom-in"
              >
                <Image
                  src={img.url}
                  alt={`${title} — foto ${i + 1} de ${total}`}
                  fill
                  sizes="(max-width: 896px) 100vw, 896px"
                  quality={90}
                  className="object-cover"
                  priority={i === 0}
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>

        <AmpliarHint className="absolute top-4 right-4 z-10" />

        {total > 1 && (
          <>
            <button
              className="fg-prev absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-ink-950/55 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-brand-600"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="fg-next absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-ink-950/55 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-brand-600"
              aria-label="Foto siguiente"
            >
              <ChevronRight size={20} />
            </button>
            <span className="pointer-events-none absolute right-4 bottom-4 z-10 rounded-full bg-ink-950/70 px-3 py-1.5 text-xs font-bold text-white tabular-nums backdrop-blur-sm">
              {actual + 1} / {total}
            </span>
          </>
        )}
      </div>

      {/* ── MINIATURAS ──
          Hacen de índice del carrusel: no abren el visor, cambian la foto
          grande. La activa se marca con el verde de marca. */}
      {total > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => swiperRef.current?.slideTo(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === actual}
              className={`relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                i === actual
                  ? 'border-brand-400 opacity-100'
                  : 'border-transparent opacity-55 hover:opacity-90'
              }`}
            >
              <Image
                src={img.url}
                alt=""
                aria-hidden
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FichaGallery;
