'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import { EffectFade, Keyboard, Navigation } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Download, Home, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AmpliarHint } from '@/modules/shared/ui/AmpliarHint';
import { crearZip } from '@/modules/shared/lib/zip';
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
 * ── Disposición: miniaturas en COLUMNA, a la izquierda ──────────────────────
 * En vez de la tira horizontal debajo de la foto. Dos motivos:
 *  1. La foto grande gana alto (`h-130` = 520px en escritorio contra los 420
 *     de antes) porque ya no tiene que dejarle un renglón abajo a las
 *     miniaturas.
 *  2. Con la columna al costado se ven de una todas las fotos disponibles sin
 *     scrollear lateralmente, que es lo que un colega hace primero: contar
 *     cuántas hay y saltar a la que le interesa.
 *
 * ⚠️ La columna aparece recién en `sm`. Por debajo de 640px, 88px de miniaturas
 * le comerían casi un cuarto del ancho a la foto principal, así que ahí se
 * mantiene la tira horizontal debajo — que además es el gesto natural en un
 * teléfono.
 */
export function FichaGallery({
  images, title, refId,
}: {
  images: FichaImage[];
  title: string;
  /** Id de la propiedad: nombra los archivos del ZIP. */
  refId: number;
}) {
  const [actual, setActual] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [bajando, setBajando] = useState<number | null>(null);
  const swiperRef = useRef<SwiperClass | null>(null);

  /**
   * Descarga TODAS las fotos en un único ZIP.
   *
   * ── Por qué un ZIP y no N descargas ─────────────────────────────────────
   * Se evaluó disparar un `<a download>` por foto. No sirve: los navegadores
   * bloquean las descargas múltiples automáticas y muestran un "¿Permitir que
   * el sitio descargue varios archivos?" — justo la fricción que este botón
   * viene a evitar. Un solo archivo es un solo click y una sola decisión.
   *
   * ⚠️ Se piden por `/_next/image`, no por la URL de Cloudinary. Es del mismo
   * origen, así que no depende de los headers CORS del CDN; y de paso las
   * entrega ya redimensionadas a 1920px, que es lo que un colega necesita para
   * republicar (el original puede pesar varios MB por foto).
   *
   * La extensión sale del `Content-Type` de la respuesta y no se asume `.jpg`:
   * el optimizador de Next devuelve WebP o AVIF según lo que negocie el
   * navegador, y un `.jpg` con bytes WebP adentro rompe en cualquier visor.
   */
  const descargarTodas = useCallback(async () => {
    if (!images.length) return;
    setBajando(0);
    try {
      const archivos = [];
      for (let i = 0; i < images.length; i++) {
        setBajando(i + 1);
        const url = `/_next/image?url=${encodeURIComponent(images[i].url)}&w=1920&q=90`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`falló la foto ${i + 1}`);
        const tipo = (res.headers.get('content-type') ?? 'image/jpeg').split(';')[0];
        const ext = tipo.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
        archivos.push({
          nombre: `propiedad-${refId}-foto-${String(i + 1).padStart(2, '0')}.${ext}`,
          datos: new Uint8Array(await res.arrayBuffer()),
        });
      }

      const blob = crearZip(archivos);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `propiedad-${refId}-fotos.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Se libera en el próximo tick: revocarlo de inmediato cancela la
      // descarga en algunos navegadores, que todavía no leyeron el blob.
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
      toast.success(`${archivos.length} ${archivos.length === 1 ? 'foto descargada' : 'fotos descargadas'}`);
    } catch {
      toast.error('No se pudieron descargar las fotos');
    } finally {
      setBajando(null);
    }
  }, [images, refId]);

  if (images.length === 0) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-ink-100 bg-white">
        <Home size={40} className="text-ink-500" />
      </div>
    );
  }

  const total = images.length;

  /** Miniatura — misma pieza en la columna de escritorio y en la tira mobile. */
  const Miniatura = ({ img, i }: { img: FichaImage; i: number }) => (
    <button
      type="button"
      onClick={() => swiperRef.current?.slideTo(i)}
      aria-label={`Ver foto ${i + 1}`}
      aria-current={i === actual}
      className={`relative aspect-4/3 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200 sm:w-full ${
        i === actual
          ? 'border-brand-700 opacity-100'
          : 'border-ink-200 opacity-60 hover:opacity-100'
      }`}
    >
      <Image src={img.url} alt="" aria-hidden fill sizes="88px" className="object-cover" />
    </button>
  );

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

      <div className="flex flex-col gap-3 sm:flex-row">

        {/* ── COLUMNA DE MINIATURAS (sm+) ──
            `max-h` + scroll propio: con 15 fotos la columna no puede estirar la
            fila y dejar la foto principal flotando arriba. */}
        {total > 1 && (
          <div className="scrollbar-none hidden max-h-130 w-22 shrink-0 flex-col gap-2 overflow-y-auto sm:flex">
            {images.map((img, i) => <Miniatura key={img.id} img={img} i={i} />)}
          </div>
        )}

        {/* ── VISOR PRINCIPAL ── */}
        <div className="group relative h-80 w-full min-w-0 overflow-hidden rounded-2xl border border-ink-100 bg-ink-950 shadow-[0_2px_4px_-2px_rgba(10,12,11,0.08),0_12px_28px_-16px_rgba(10,12,11,0.28)] sm:h-130">
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
                    sizes="(max-width: 640px) 100vw, 800px"
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
      </div>

      {/* ── TIRA DE MINIATURAS (sólo mobile) ── */}
      {total > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 sm:hidden">
          {images.map((img, i) => <Miniatura key={img.id} img={img} i={i} />)}
        </div>
      )}

      {/* ── DESCARGAR TODAS ── */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={descargarTodas}
          disabled={bajando !== null}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-700/30 bg-white px-3 py-2 text-[11px] font-bold tracking-wide text-brand-800 uppercase transition-colors duration-200 hover:border-brand-700 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-70"
        >
          {bajando !== null
            ? <><Loader2 size={14} className="animate-spin" />Preparando {bajando}/{total}…</>
            : <><Download size={14} />Descargar las {total} fotos</>}
        </button>
      </div>
    </div>
  );
}

export default FichaGallery;
