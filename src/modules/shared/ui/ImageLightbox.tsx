'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import { Keyboard, Navigation, Zoom } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Copy, X, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/zoom';

/**
 * Visor de imágenes a pantalla completa, con zoom y arrastre.
 *
 * ── Compartido a propósito ──────────────────────────────────────────────────
 * Lo usan el detalle público de la propiedad (`properties/[id]`) y la ficha
 * compartible (`ficha/[id]`). Son dos páginas con diseños muy distintos —una
 * con el chrome del sitio, la otra sin marca y sobre fondo oscuro— pero la
 * experiencia de "ver la foto grande" tiene que ser la misma en las dos, y
 * duplicarla habría garantizado que se separaran a la primera corrección.
 *
 * Por eso vive en `shared/ui` y no en `properties/` ni en `ficha/`: es el mismo
 * criterio que ya siguen `ConfirmDialog` y `DashboardShell`.
 *
 * ── Por qué el módulo Zoom de Swiper y no una librería nueva ────────────────
 * `swiper` ya es dependencia del proyecto (hero de la landing y carrusel de
 * reseñas). Su módulo `Zoom` trae, sin código propio:
 *   · pellizco en táctil,
 *   · doble toque / doble click para alternar,
 *   · arrastre para desplazar la foto ampliada (le pone `cursor: move` y
 *     `touch-action: none` al slide, ver `swiper/css/zoom`),
 *   · y el reseteo del zoom al cambiar de slide.
 * Sumar `react-medium-image-zoom` o similar habría agregado peso al bundle para
 * repetir algo que ya estaba instalado.
 *
 * ⚠️ La rueda del mouse NO viene incluida en el módulo (sólo pellizco y doble
 * click), así que se cablea a mano más abajo — es lo único que se agrega.
 */

/**
 * Ampliación máxima. 4x y no el 3x que trae Swiper por defecto: las fotos de
 * producción tienen una mediana de 720px de ancho, y a 3x sobre un teléfono ya
 * no se llega a leer el número de una puerta o el detalle de una terminación,
 * que es para lo que la gente amplía. Más de 4x sólo muestra píxeles.
 */
const MAX_ZOOM = 4;

export interface LightboxImage {
  id: number;
  url: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  /** Índice de la imagen con la que abre. */
  initialIndex: number;
  /** Se usa para el `alt` de cada foto. */
  title: string;
  onClose: () => void;
  /**
   * Muestra el botón "Copiar imagen". Se activa en la ficha compartible: quien
   * la recibe suele ser otro martillero que necesita la foto para su propia
   * publicación, y bajarla una por una con click derecho es incómodo en el
   * teléfono. En el detalle público del sitio no se ofrece.
   */
  allowCopy?: boolean;
}

export function ImageLightbox({
  images, initialIndex, title, onClose, allowCopy = false,
}: ImageLightboxProps) {
  const [montado, setMontado] = useState(false);
  const [actual, setActual] = useState(initialIndex);
  const [ampliada, setAmpliada] = useState(false);
  const [copiando, setCopiando] = useState(false);
  const swiperRef = useRef<SwiperClass | null>(null);

  // `createPortal` necesita el DOM: en el render del servidor no existe
  // `document`. Se difiere al primer efecto, que sólo corre en el cliente.
  useEffect(() => setMontado(true), []);

  /**
   * Bloqueo del scroll de fondo + Escape.
   *
   * Se compensa el ancho de la scrollbar con `padding-right`, igual que
   * `FiltersModal`: sin eso, al ocultar la barra la página de atrás se corre
   * unos píxeles y se ve un salto al abrir y al cerrar.
   */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  /**
   * Rueda del mouse → zoom incremental.
   *
   * ── Dos decisiones que no son obvias ────────────────────────────────────
   *
   * 1. **Listener nativo con `{ passive: false }`, no el `onWheel` de React.**
   *    Hace falta `preventDefault()` para que la rueda no scrollee la página de
   *    atrás, y React registra sus handlers de `wheel` como pasivos — ahí
   *    `preventDefault()` no tiene efecto y el navegador tira un warning.
   *
   * 2. **Se le pasa un RATIO a `zoom.in()`, no el evento.** Las dos formas
   *    funcionan en runtime (`zoom.mjs` hace
   *    `typeof e === 'number' ? e : null` para distinguirlas), pero los tipos
   *    de Swiper sólo declaran el número. Y de paso queda mejor: pasar el
   *    evento salta directo a `maxRatio` de una, mientras que el ratio permite
   *    acercarse de a poco, que es lo que uno espera de la rueda.
   *
   * `escalaRef` sigue el zoom actual (lo actualiza `onZoomChange`) porque el
   * listener se registra una sola vez y no puede leer estado de React.
   */
  const contenedorRef = useRef<HTMLDivElement>(null);
  const escalaRef = useRef(1);
  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const zoom = swiperRef.current?.zoom;
      if (!zoom) return;
      e.preventDefault();
      const paso = e.deltaY < 0 ? 1.4 : 1 / 1.4;
      const siguiente = Math.min(Math.max(escalaRef.current * paso, 1), MAX_ZOOM);
      if (siguiente <= 1) zoom.out();
      else zoom.in(siguiente);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  /**
   * Copiar la imagen al portapapeles.
   *
   * ⚠️ Dos detalles que hacen que esto funcione de verdad:
   *
   * 1. **Se pide la URL de `/_next/image`, no la de Cloudinary.** Es del mismo
   *    origen, así que no depende de los headers CORS del CDN ni "contamina" el
   *    canvas (un canvas con píxeles de otro origen sin CORS lanza
   *    `SecurityError` al leerlo). De paso llega ya redimensionada.
   * 2. **Se convierte a PNG.** `ClipboardItem` sólo acepta `image/png` de forma
   *    confiable en los navegadores que lo soportan; pasarle el JPEG/WebP
   *    original falla con `NotAllowedError`.
   *
   * Si algo de eso no está disponible (Safari viejo, contexto no seguro), se
   * cae a copiar el LINK de la imagen como texto, que sigue siendo útil, y el
   * toast dice claramente cuál de las dos cosas se copió.
   */
  const copiarImagen = useCallback(async () => {
    const img = images[actual];
    if (!img) return;
    setCopiando(true);
    const urlAbsoluta = new URL(img.url, window.location.origin).href;
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('sin soporte de imagen en el portapapeles');
      }
      const optimizada = `/_next/image?url=${encodeURIComponent(img.url)}&w=1920&q=90`;
      const blob = await (await fetch(optimizada)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
      const png = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!png) throw new Error('no se pudo convertir a PNG');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      toast.success('Imagen copiada al portapapeles');
    } catch {
      try {
        await navigator.clipboard.writeText(urlAbsoluta);
        toast.success('Link de la imagen copiado');
      } catch {
        toast.error('No se pudo copiar la imagen');
      }
    } finally {
      setCopiando(false);
    }
  }, [images, actual]);

  if (!montado) return null;

  const total = images.length;

  return createPortal(
    <div
      ref={contenedorRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de ${title}`}
      /* ⚠️ `z-10000` y no un `z-50` cualquiera: el botón flotante de "ir arriba"
         (`.button` en `globals.css`) está clavado en `z-index: 9999`, así que
         con cualquier valor menor se dibujaba ENCIMA de la foto ampliada —
         verificado en captura. Este visor tiene que estar por sobre todo lo que
         flota en la página. */
      className="fixed inset-0 z-10000 flex flex-col bg-ink-950/95 backdrop-blur-sm [animation:loader-in_.18s_ease-out_both]"
    >
      {/* ── BARRA SUPERIOR ──
          `shrink-0` para que no la aplaste el visor de abajo, que es `flex-1`. */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white tabular-nums">
          {actual + 1} / {total}
        </span>

        <div className="flex items-center gap-2">
          {/* Estado del zoom: además de ser un botón, es el único indicador de
              que la foto se puede ampliar. Sin él, en escritorio no hay ninguna
              pista de que el doble click hace algo. */}
          <button
            onClick={() => swiperRef.current?.zoom?.toggle()}
            aria-label={ampliada ? 'Alejar' : 'Ampliar'}
            className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            {ampliada ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>

          {allowCopy && (
            <button
              onClick={copiarImagen}
              disabled={copiando}
              aria-label="Copiar imagen"
              title="Copiar imagen al portapapeles"
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              <Copy size={16} />
              <span className="hidden sm:inline">{copiando ? 'Copiando…' : 'Copiar'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Cerrar galería"
            className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── VISOR ── */}
      <div className="relative min-h-0 flex-1">
        <Swiper
          modules={[Zoom, Navigation, Keyboard]}
          initialSlide={initialIndex}
          zoom={{ maxRatio: MAX_ZOOM, minRatio: 1, toggle: true }}
          keyboard={{ enabled: true }}
          navigation={{ prevEl: '.lb-prev', nextEl: '.lb-next' }}
          spaceBetween={24}
          onSwiper={(s) => { swiperRef.current = s; }}
          onSlideChange={(s) => {
            setActual(s.activeIndex);
            /* Reseteo del zoom al cambiar de foto. Sin esto la siguiente
               imagen aparece ya ampliada y descentrada, con el nivel que había
               quedado en la anterior. */
            s.zoom?.out();
            escalaRef.current = 1;
            setAmpliada(false);
          }}
          onZoomChange={(_s, scale) => {
            escalaRef.current = scale;
            setAmpliada(scale > 1);
          }}
          className="h-full w-full"
        >
          {images.map((img, i) => (
            <SwiperSlide key={img.id}>
              {/* ⚠️ `swiper-zoom-container` es el nombre de clase que el módulo
                  Zoom busca para saber qué ampliar (`containerClass`). Sin este
                  wrapper el zoom simplemente no hace nada. */}
              <div className="swiper-zoom-container">
                <Image
                  src={img.url}
                  alt={`${title} — foto ${i + 1} de ${total}`}
                  width={1920}
                  height={1440}
                  sizes="100vw"
                  quality={95}
                  priority={i === initialIndex}
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ── FLECHAS ──
            Fuera del `<Swiper>` no funcionarían con `navigation` por selector,
            así que van acá dentro pero por encima (`z-10`). Se ocultan con una
            sola imagen. */}
        {total > 1 && (
          <>
            <button
              className="lb-prev absolute top-1/2 left-3 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:left-6"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="lb-next absolute top-1/2 right-3 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:right-6"
              aria-label="Foto siguiente"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* ── AYUDA ──
          Un renglón, y distinto según el dispositivo: en un teléfono no existe
          el doble click ni la rueda, y en escritorio no existe el pellizco.
          Decirle a cada uno el gesto del otro es ruido. */}
      <p className="shrink-0 px-4 pt-1 pb-4 text-center text-[11px] text-white/45">
        <span className="sm:hidden">Pellizcá o tocá dos veces para ampliar · Arrastrá para mover</span>
        <span className="hidden sm:inline">
          Doble click o rueda para ampliar · Arrastrá para mover · Flechas del teclado para cambiar de foto
        </span>
      </p>
    </div>,
    document.body,
  );
}

export default ImageLightbox;
