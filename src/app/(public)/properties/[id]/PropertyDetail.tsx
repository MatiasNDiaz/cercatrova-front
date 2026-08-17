'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Star, Bed, Bath, Maximize, Car, TreePine,
  FileCheck, Hourglass, MapPin, Home, ChevronLeft,
  ChevronRight, User, Calendar, CheckCircle2, XCircle,
  Building2, Navigation, MessageCircle, Send, Pencil,
  Trash2, LogIn, MessageCircleMore, ShieldCheck, Landmark, Eye, EyeOff,
  PawPrint, Receipt, Phone,
} from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { BsWhatsapp } from 'react-icons/bs';
import { toast } from 'sonner';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import { fechaLarga } from '@/modules/shared/lib/fecha';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { FavoriteButton } from '@/modules/shared/ui/Favoritebutton';
import { AmpliarHint } from '@/modules/shared/ui/AmpliarHint';
import { whatsappLink } from '@/modules/shared/lib/contact';
import { priceParts, formatExpensas } from '@/modules/shared/lib/money';
import { PropertyCard } from '@/modules/properties/components/PropertyCard';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { Property } from '@/modules/properties/interfaces/propertyInterface';
import { OperationType } from '@/modules/properties/interfaces/operation-type';
import {
  BADGE_BASE, operationBadgeSoft, propertyTypeBadgeSoft, statusBadgeColor, statusDotColor,
} from '@/modules/properties/lib/badgeStyles';
import { Reveal } from '@/modules/landing/components/Reveal';
import { loginUrlWithReturn, currentPathWithQuery } from '@/modules/shared/lib/returnTo';

// ── INTERFACES ────────────────────────────────────────────────────────────────
interface PropertyImage { id: number; url: string; isCover?: boolean; }
/**
 * Agente de la propiedad.
 *
 * `phone` y `email` admiten `null` porque así los declara el contrato
 * (`User.phone: string | null`, y los usuarios creados por Google llegan con
 * `phone: ''`). Antes eran `string | undefined` y encajaba sólo porque la
 * página pasaba la propiedad sin tipar (`getOne` devolvía `any`); al tipar el
 * fetch en `page.tsx` quedó a la vista el desajuste.
 */
interface Agent {
  id: number;
  name: string;
  surname?: string | null;
  email?: string | null;
  phone?: string | null;
  /**
   * ⚠️ El backend manda la foto en `photo` — así lo declara `AGENT_PUBLIC_FIELDS`
   * (`['id','name','surname','phone','photo']` en `properties.service.ts`).
   * El componente leía `avatar`, un nombre que no existe en la respuesta, así
   * que el círculo del agente SIEMPRE caía al ícono genérico aunque la foto
   * estuviera cargada. Se lee `photo` y se deja `avatar` como alias por si
   * alguna respuesta vieja lo trae.
   */
  photo?: string | null;
  avatar?: string | null;
}

interface Comment {
  id: number;
  message: string;
  created_at: string;
  /** Moderación del admin: los usuarios comunes no lo reciben del backend. */
  isHidden?: boolean;
  user?: { id?: number; name: string; surname: string; photo?: string };
}

interface Rating {
  id: number;
  score: number;
  user?: { id?: number; name: string; photo?: string };
}

/**
 * Shape de la propiedad en el detalle.
 *
 * Los campos escalares se derivan del tipo canónico (`shared/types/api.ts`) para
 * que no haya una copia paralela que se desincronice al agregar columnas. Solo
 * se sobreescriben las relaciones, que en esta pantalla se consumen con los
 * shapes reducidos de arriba (`Agent`, `Comment`, `Rating`, `PropertyImage`).
 */
export type PropertyFull = Omit<
  Property,
  'agent' | 'comments' | 'ratings' | 'images' | 'typeOfProperty'
> & {
  typeOfProperty?: { id: number; name: string };
  images?: PropertyImage[];
  agent?: Agent;
  comments?: Comment[];
  ratings?: Rating[];
};

/**
 * ── TEXTO LIBRE: por qué cada nodo de contenido lleva `wrap-anywhere` ──────────
 *
 * Esta pantalla es la ÚNICA de la zona pública que imprime texto escrito por
 * personas (título y descripción del admin, comentarios de los usuarios,
 * dirección). El resto del sitio muestra copy controlado, y por eso el bug de
 * abajo se veía sólo acá.
 *
 * Sin regla de corte, una sola palabra sin espacios —típicamente un link pegado
 * en un comentario— es indivisible: el `<p>` que la contiene declara ese ancho
 * como su MÍNIMO y ninguna caja de arriba puede achicarlo.
 *
 * ⚠️ La utilidad es `wrap-anywhere` (`overflow-wrap: anywhere`) y NO
 * `break-words` (`overflow-wrap: break-word`). Se probaron las dos y sólo la
 * primera arregla esto: por especificación, `break-word` parte la palabra al
 * PINTAR pero **no** cambia el tamaño `min-content` que el elemento declara
 * hacia arriba, así que el grid/flex que lo contiene sigue reservándole los
 * 673px y el documento sigue desbordado. `anywhere` sí afecta el `min-content`,
 * que es justo el número del que cuelga todo el problema. Medido: con
 * `break-words` el `<main>` seguía en `scrollWidth: 690`; con `wrap-anywhere`
 * baja a 390.
 *
 * Medido con Chrome en emulación mobile (390px, DPR 2), un comentario con una
 * URL de Google Maps daba esta cadena:
 *
 *   <p> del comentario ................ ancho mínimo 673px
 *   → columna izquierda del grid ...... scrollWidth 674px
 *   → div.mx-auto.max-w-6xl.px-4 ...... scrollWidth 690px
 *   → document ........................ scrollWidth 690px  (viewport: 390px)
 *
 * Y el último paso es el que rompía la navbar: cuando el documento supera el
 * ancho de pantalla, el navegador móvil **agranda el bloque contenedor inicial**
 * a ese ancho. La navbar es `fixed` con `w-[96%]`, así que ese 96% pasó a
 * calcularse sobre 690px en vez de 390px: se maquetó 662px de ancho y la
 * hamburguesa quedó en x≈659, fuera de la pantalla, sólo alcanzable
 * scrolleando de costado. El botón flotante de "ir arriba" (`fixed right:70px`)
 * se corría por exactamente lo mismo.
 *
 * O sea: la navbar nunca estuvo rota. Era contenido de ESTA página empujando el
 * viewport. Por eso el fix va en los nodos de texto y no en la navbar.
 *
 * (Como red de seguridad hay además un `overflow-x: clip` en `html`/`body`
 * —ver `globals.css`—, para que ningún contenido futuro pueda volver a mover la
 * navbar. Es defensa en profundidad, no el arreglo.)
 */

// ── ESTILOS DE LA BARRA DE ACCESOS RÁPIDOS ────────────────────────────────────
// Cada acceso es un chip que en hover se tiñe MUY suave.
//
// Antes el hover rellenaba el chip con un sólido saturado (`bg-brand-700`,
// `bg-red-600`, `bg-blue-600`, `bg-amber-500`) e invertía el texto a blanco:
// cuatro rectángulos de color fuerte apareciendo y desapareciendo en la primera
// fila de la página, que es justo donde el ojo aterriza. Ahora se usa el mismo
// criterio que el resto del sitio —fondo muy claro + borde/texto más oscuro—
// así el hover se nota sin gritar. El color propio de cada acceso lo sigue
// dando su ícono, que no cambia.
/**
 * ── TRES FORMATOS, Y POR QUÉ EL CORTE ESTÁ EN `xl` ──────────────────────────
 *
 * La barra tiene SEIS piezas (5 accesos + el botón Guardar) y se maqueta de
 * tres maneras según cuánto ancho haya:
 *
 *   · `< sm`  → grilla de 2 columnas x 3 filas.
 *   · `sm`–`xl` → grilla de 3 columnas x 2 filas.
 *   · `xl+`  → UNA sola fila horizontal, con los separadores `|`.
 *
 * En los dos formatos de grilla cada acceso es un BLOQUE que llena su celda:
 * ancho completo, contenido centrado, y fondo + borde propios para que se lea
 * como una pieza y no como texto suelto. `text-xs` sólo en mobile, porque la
 * celda mide ~165px en un teléfono de 412px y "Ver dirección exacta" no entraba
 * a 14px; de `sm` para arriba la celda ya da para `text-sm`.
 *
 * En `xl` vuelve al chip de siempre: ancho automático, alineado a la izquierda,
 * sin fondo ni borde (los aporta el `hover`), y `whitespace-nowrap` para que
 * ninguna etiqueta parta en dos renglones dentro de la fila.
 *
 * ⚠️ **El corte es `xl` (1280px) y no `sm` ni `lg`, y el número sale de medir**,
 * no de gusto. Con la fila armada, las piezas ocupan:
 *
 *     5 accesos + 4 separadores ................ 927px
 *   + separación hasta el botón Guardar ........  16px
 *   + botón Guardar ...........................  109px
 *   ────────────────────────────────────────────────────
 *                                        total  1052px
 *
 * y el ancho interno disponible es `min(1152, viewport − 32) − 40` (el
 * `max-w-6xl` del contenedor menos su `px-4` y el `px-5` de la barra). Para que
 * entren 1052px hace falta un viewport de **≥1124px**: en `lg` (1024px) el hueco
 * es de 952px y la fila NO entra por ~100px. Por eso `lg` sigue siendo grilla.
 *
 * Con la separación anterior (`gap-x-4`) la fila pedía 1084px contra los 1080px
 * disponibles: se pasaba por **4px** y por eso Guardar caía a una segunda fila
 * incluso en pantallas grandes. Bajar la separación de los separadores a
 * `gap-x-3` recorta 8 huecos de 4px = 32px y deja 28px de margen.
 */
const QUICK_LINK_BASE =
  'group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-100 bg-surface-mint px-2 py-2.5 text-center text-xs font-semibold transition-all duration-300 ease-out ' +
  'sm:px-3 sm:text-sm ' +
  'xl:w-auto xl:justify-start xl:rounded-lg xl:border-transparent xl:bg-transparent xl:px-3 xl:py-1.5 xl:whitespace-nowrap';

/** Entrada de cada acceso rápido: fade + slide corto, escalonado por el padre. */
const QUICK_LINK_ITEM = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// ── TARJETA DE SECCIÓN ────────────────────────────────────────────────────────
// El fondo de la página es el verde de sección (`bg-surface-mint`) — el mismo
// que el catálogo y el modal de filtros, para que las tres pantallas se lean
// como un solo sistema. Antes era `bg-surface`, un gris a ~2 puntos de
// luminancia del blanco de las tarjetas: no separaba nada.
// Con `shadow-sm` las tarjetas blancas casi no se despegaban y todo se leía plano. Esta sombra en dos capas
// (una corta de contacto + una larga difusa) las levanta del fondo sin
// ensuciar. Es el mismo criterio que ya usan las cards del catálogo.
const CARD =
  'rounded-3xl border border-ink-100 bg-white shadow-[0_2px_4px_-2px_rgba(10,12,11,0.06),0_14px_34px_-14px_rgba(10,12,11,0.20)]';

/**
 * Tonos semánticos de las pastillas de ícono del detalle.
 *
 * Antes TODAS eran verdes (`bg-brand-700/10 text-brand-700`): ubicación,
 * descripción, características y comentarios se veían idénticas, así que el
 * ícono no aportaba ninguna pista de qué sección era — solo decoraba.
 * Ahora cada tipo de contenido tiene su color, y ese color se repite en la
 * barra de accesos rápidos de arriba, de modo que el enlace y la sección a la
 * que lleva comparten la misma señal visual.
 */
const TONO_ICONO = {
  brand: { pastilla: 'bg-brand-700/10 text-brand-700',  texto: 'text-brand-700'  },
  rojo:  { pastilla: 'bg-red-100 text-red-600',         texto: 'text-red-600'    },
  azul:  { pastilla: 'bg-blue-100 text-blue-600',       texto: 'text-blue-600'   },
  ambar: { pastilla: 'bg-amber-100 text-amber-500',     texto: 'text-amber-500'  },
} as const;

export type TonoIcono = keyof typeof TONO_ICONO;

/** Encabezado de sección: ícono en pastilla tintada + título. */
function SectionHeader({
  icon: Icon, title, id, className = 'mb-6', tono = 'brand',
}: {
  icon: React.ElementType; title: string; id?: string; className?: string;
  tono?: TonoIcono;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONO_ICONO[tono].pastilla}`}>
        <Icon size={18} />
      </span>
      <h2 id={id} className="text-lg font-bold text-ink-900">{title}</h2>
    </div>
  );
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function StarRating({ score, size = 18 }: { score: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size}
          className={s <= Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-ink-200 fill-ink-200'}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return fechaLarga(dateStr);
}

/**
 * Cuánto se toleraría AGRANDAR una foto antes de preferir mostrarla entera.
 *
 * 1.15 = hasta un 15% de ampliación se deja pasar con `object-cover`, porque a
 * ese nivel no se percibe y conviene el encuadre a sangre. De ahí para arriba
 * la pérdida se nota y gana la nitidez.
 */
const TOLERANCIA_AMPLIACION = 1.15;

// ── SLIDER ────────────────────────────────────────────────────────────────────
function ImageSlider({ images, title }: { images: PropertyImage[]; title: string }) {
  const [current, setCurrent] = useState(0);
  /** Visor a pantalla completa con zoom — ver `shared/ui/ImageLightbox`. */
  const [lightbox, setLightbox] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);

  /**
   * Píxeles reales que trajo cada foto, por id.
   *
   * Se leen del `<img>` ya cargado (`naturalWidth/Height`) y no de la base: la
   * entidad `PropertyImages` del backend no guarda dimensiones, y agregarlas
   * habría implicado migración + backfill de 80 filas. Además esto mide lo que
   * el navegador **efectivamente recibió** —que es `min(variante pedida, ancho
   * del original)`— que es justo el número que decide si alcanza o no.
   */
  const [medidas, setMedidas] = useState<Record<number, { w: number; h: number }>>({});
  const [caja, setCaja] = useState({ w: 736, h: 520 });

  // Tamaño real del visor. Se mide en vez de hardcodear 736x520 para que la
  // decisión también sea correcta en mobile, donde el hueco es casi cuadrado
  // (100vw x 420) y por lo tanto mucho más exigente con las fotos verticales.
  useEffect(() => {
    const medirCaja = () => {
      const r = cajaRef.current?.getBoundingClientRect();
      if (r?.width) setCaja({ w: r.width, h: r.height });
    };
    medirCaja();
    window.addEventListener('resize', medirCaja);
    return () => window.removeEventListener('resize', medirCaja);
  }, []);

  const medir = useCallback((id: number, el: HTMLImageElement) => {
    const { naturalWidth: w, naturalHeight: h } = el;
    if (!w || !h) return;
    setMedidas((prev) => (prev[id]?.w === w && prev[id]?.h === h ? prev : { ...prev, [id]: { w, h } }));
  }, []);

  /**
   * Encuadre de UNA foto: a sangre si le sobran píxeles, entera si no.
   *
   * `object-cover` obliga a escalar por el lado que peor entra
   * (`max(cajaW/w, cajaH/h)`). Si ese número pasa de 1, el navegador está
   * inventando píxeles y ahí es donde se pierden las líneas de las lozas.
   * `object-contain` escala por el otro lado (`min(...)`), que siempre es menor
   * o igual — nunca amplía más que `cover`, y en las verticales amplía
   * MUCHÍSIMO menos (medido: x2.73 → x0.54).
   *
   * Mientras la foto no cargó se asume `cover`: es el caso más común y evita
   * que la galería arranque con bandas y salte al encuadre definitivo.
   */
  const fit = useCallback(
    (img: PropertyImage): 'cover' | 'contain' => {
      const m = medidas[img.id];
      if (!m) return 'cover';
      const ampliacionCover = Math.max(caja.w / m.w, caja.h / m.h);
      return ampliacionCover > TOLERANCIA_AMPLIACION ? 'contain' : 'cover';
    },
    [medidas, caja],
  );

  if (!images.length) return (
    <div className="flex h-96 w-full items-center justify-center rounded-3xl bg-ink-100">
      <Home size={48} className="text-ink-400" />
    </div>
  );

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    // Sombra aliviada: antes era `0_20px_50px_-24px` verde y caía como un
    // bloque pesado debajo de la galería.
    <div className="group relative w-full overflow-hidden rounded-3xl border border-ink-100 bg-ink-950 shadow-[0_2px_4px_-2px_rgba(10,12,11,0.08),0_12px_28px_-16px_rgba(10,12,11,0.28)]">
      {/* ── VISOR A PANTALLA COMPLETA ──
          Se monta sólo cuando está abierto: mientras está cerrado no hay ni
          portal ni instancia de Swiper ni listener de teclado dando vueltas. */}
      {lightbox && (
        <ImageLightbox
          images={images}
          initialIndex={current}
          title={title}
          onClose={() => setLightbox(false)}
        />
      )}

      <div ref={cajaRef} className="relative h-105 w-full md:h-130">
        {images.map((img, i) => (
          <div key={img.id} className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
            {/* Fondo difuminado — SÓLO en las fotos que se muestran enteras.
                Rellena las bandas que deja `object-contain` con una copia
                ampliada y borroneada de la misma foto, en vez de dos barras
                negras. Se pide diminuta (`sizes="32px"`, `quality={20}`):
                está desenfocada 24px, así que más resolución no se vería y
                sólo sumaría peso. `scale-110` porque `blur` samplea fuera del
                elemento y sin agrandarlo se ven los bordes lavados. */}
            {fit(img) === 'contain' && (
              <Image
                src={img.url}
                alt=""
                aria-hidden
                fill
                sizes="32px"
                quality={20}
                className="scale-110 object-cover blur-2xl"
              />
            )}

            {/* ── CALIDAD Y ENCUADRE — medido sobre las 80 fotos reales ─────
                `quality={95}` y NO 85. A partir de 95 next/image deja de
                recodificar y **devuelve el archivo original tal cual**: medido
                contra producción, q=95 da el mismo peso, el mismo formato y un
                error de 0.00/255 respecto de la URL cruda de Cloudinary. Con
                q=85 el error era 2.01/255. O sea: la doble compresión que se
                sospechaba existía, y a 95 desaparece del todo sin necesidad de
                `unoptimized` (que perdería el srcset y el lazy loading).

                ⚠️ NO se agregó `f_auto,q_auto` en la URL de Cloudinary: medido,
                esa transformación devuelve 82 KB contra los 130 KB del
                original, o sea comprime MÁS. Hoy Cloudinary no está
                optimizando nada (las URLs guardadas son `/upload/v123/...`
                peladas), así que nunca hubo dos capas compitiendo: había una
                sola, la de Next.

                ── El encuadre, que es el 90% del problema ──
                La causa dominante no era la compresión sino la RESOLUCIÓN de
                los archivos. Auditadas las 80 imágenes de producción: ancho
                mínimo 261 px, mediana 720 px; 60 de 80 ya se agrandan en
                pantalla normal. Una foto vertical de 540x960 metida con
                `object-cover` en este hueco (736x520) se agranda x2.73 y se
                recorta el 60%.

                Por eso el encuadre se decide POR FOTO (ver `fit()`): las que
                tienen píxeles de sobra siguen a sangre con `object-cover` —que
                es como se ve mejor y es el encuadre elegido— y sólo las que no
                llegan pasan a `object-contain`, donde en vez de agrandarse se
                REDUCEN y quedan nítidas.

                `sizes="800px"`: la galería se clava en ~736 px por el
                `max-w-6xl` del contenedor, sin importar cuán ancho sea el
                monitor. El `62vw` que había antes pedía 1190 px en una pantalla
                de 1920 — una variante 60% más grande de la que se puede
                mostrar. */}
            <Image
              src={img.url}
              alt={`${title} - foto ${i + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              quality={95}
              className={fit(img) === 'contain' ? 'object-contain' : 'object-cover'}
              priority={i === 0}
              onLoad={(e) => medir(img.id, e.currentTarget)}
            />
          </div>
        ))}
        {/* `pointer-events-none`: el degradado es decorativo y cubre `inset-0`,
            así que sin esto se comía todos los clicks del botón de ampliar que
            va justo debajo. */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink-950/50 via-transparent to-transparent" />

        {/* ── ABRIR EL VISOR ──
            Es un `<button>` que cubre la foto entera, y no un `onClick` en el
            contenedor: así el gesto queda anunciado a lectores de pantalla y es
            alcanzable con el teclado.

            Va ANTES de las flechas y del contador en el DOM a propósito. Los
            tres son `absolute` sin `z-index`, o sea que el orden de pintado lo
            decide el orden del documento: al ir primero, las flechas quedan por
            encima y un click en ellas cambia de foto en vez de abrir el visor,
            sin necesidad de `stopPropagation`. */}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Ampliar imagen"
          className="absolute inset-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
        />
        <AmpliarHint className="absolute top-5 right-5" />

        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute top-1/2 left-4 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-3 text-brand-700 shadow-lg backdrop-blur-sm transition-transform hover:scale-110" aria-label="Foto anterior">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-3 text-brand-700 shadow-lg backdrop-blur-sm transition-transform hover:scale-110" aria-label="Siguiente foto">
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <div className="pointer-events-none absolute right-5 bottom-5 rounded-full bg-ink-950/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
          {current + 1} / {images.length}
        </div>
      </div>
      {images.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto bg-ink-950/80 p-3">
          {images.map((img, i) => (
            <button aria-label={`Ver foto ${i + 1}`} key={img.id} onClick={() => setCurrent(i)}
              className={`relative h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${i === current ? 'scale-105 border-brand-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <Image
                src={img.url}
                alt={`Ver foto ${i + 1} de ${title}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Visor a pantalla completa, cargado BAJO DEMANDA.
 *
 * `ImageLightbox` arrastra Swiper + su módulo Zoom: medido, ponerlo como import
 * estático subía el First Load JS de esta ruta de 204 kB a 241 kB. Y la enorme
 * mayoría de las visitas nunca abre el visor — mira las fotos en la galería
 * embebida y sigue de largo.
 *
 * Con `next/dynamic` el chunk se pide recién en el click de "Ampliar", que es
 * justo el momento en que el usuario ya está esperando algo. `ssr: false`
 * porque el visor es un portal a `document.body`: no existe en el servidor.
 */
const ImageLightbox = dynamic(
  () => import('@/modules/shared/ui/ImageLightbox').then((m) => m.ImageLightbox),
  { ssr: false },
);

// ── TARJETA DE PRECIO + CTA ───────────────────────────────────────────────────
/**
 * Precio, tipo de operación y el botón de WhatsApp.
 *
 * ── Por qué es un componente y se renderiza DOS veces ───────────────────────
 * En escritorio vive en el sidebar sticky, que es donde corresponde: acompaña
 * el scroll y queda siempre a la vista.
 *
 * En mobile el grid colapsa a una columna y el sidebar cae DESPUÉS de toda la
 * columna izquierda — o sea después de la galería, la ficha, la descripción,
 * las características, los comentarios Y el mapa. El precio, que es el primer
 * dato que alguien busca, quedaba a varias pantallas de scroll del principio.
 *
 * Por eso en mobile se renderiza una segunda instancia arriba, justo antes de
 * la descripción. Las dos salen de esta misma función y se excluyen entre sí
 * (`lg:hidden` / `hidden lg:block`), así que nunca se ven las dos a la vez y no
 * pueden divergir: si cambia el precio o el copy del CTA, cambia en los dos
 * lugares porque es un solo bloque de JSX.
 *
 * No lleva estado ni efectos, así que duplicar el nodo no duplica ningún
 * trabajo: es markup puro derivado de props.
 */
function PriceCard({
  precio, operationType, wa, className = '',
}: {
  precio: { amount: string; code: string };
  operationType?: string;
  wa: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${CARD} ${className}`}>
      {/* Franja de marca arriba: le da jerarquía a la tarjeta de
          precio, que es el dato más importante del sidebar. */}
      <div className="h-1.5 w-full" style={{ background: 'var(--gradient-brand)' }} />
      {/* El precio es el dato más importante del sidebar, pero antes
          era solo un número grande sobre blanco con un rótulo gris
          encima — se leía como un dato más de la lista. Ahora vive en
          su propio panel verde clarísimo: la etiqueta es una píldora
          de marca, el monto está separado del código de moneda en su
          propia línea de base, y debajo va el tipo de operación, que
          antes solo aparecía arriba en los badges del título.
          El símbolo (`$` / `US$`) y el código (`ARS` / `USD`) salen de
          `currency`, no de un "USD" escrito a mano como antes. */}
      <div className="border-b border-brand-100 bg-brand-50/60 px-7 pt-6 pb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-white uppercase">
          <Landmark size={12} />
          Precio
        </span>
        {/* `text-4xl` en mobile y `sm:text-[2.6rem]`: con un importe de
            9 dígitos ("$ 185.000.000") los 41.6px se comían el ancho de un
            teléfono y el código de moneda se iba a otro renglón. */}
        <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 leading-none">
          <span className="text-4xl font-black tracking-tight text-brand-800 sm:text-[2.6rem]">
            {precio.amount}
          </span>
          <span className="text-sm font-bold tracking-wide text-brand-600">{precio.code}</span>
        </p>
        {operationType && (
          <p className="mt-2.5 text-xs font-semibold text-ink-500">
            Publicada en <span className="text-brand-700 capitalize">{operationType}</span>
          </p>
        )}
      </div>
      <div className="px-7 pb-7">
        <a href={wa} target="_blank" rel="noopener noreferrer"
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(6,57,35,0.6)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          style={{ background: 'var(--gradient-brand)' }}>
          <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
          <BsWhatsapp size={20} /><span className="relative">Consultar por WhatsApp</span>
        </a>
        <p className="mt-3 text-center text-xs text-ink-500">Respondemos en menos de 24hs</p>
      </div>
    </div>
  );
}

// ── MAPA ──────────────────────────────────────────────────────────────────────
function GoogleMapSection({ address }: { address: string }) {
  const encodedAddress = encodeURIComponent(address);
  const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  return (
    <div className={`scroll-mt-28 ${CARD} p-8`}>
      <SectionHeader icon={MapPin} title="Ubicación" id="mapa-ubicacion" className="mb-3" tono="rojo" />
      <p className="mb-6 flex items-center gap-2 text-sm font-medium wrap-anywhere text-ink-600">
        <Navigation size={14} className="shrink-0 text-brand-700" />{address}
      </p>
      <div className="overflow-hidden rounded-2xl border border-brand-700/15 shadow-lg transition-all duration-500 hover:shadow-[0_0_40px_-6px_rgba(11,122,75,0.25)]">
        <iframe
          src={mapUrl}
          width="100%"
          height="440"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full"
          title="Mapa de ubicación de la propiedad"
        />
      </div>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`} target="_blank" rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700/10 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-700/20">
        <Navigation size={16} />Abrir en Google Maps
      </a>
    </div>
  );
}

// ── STAR PICKER ───────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          className="cursor-pointer transition-transform hover:scale-125 active:scale-110" aria-label={`${s} estrellas`}>
          <Star size={28} className={s <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-ink-200 fill-ink-200'} />
        </button>
      ))}
    </div>
  );
}

// ── COMENTARIOS + RATINGS ─────────────────────────────────────────────────────
function CommentsAndRatings({
  propertyId,
  initialComments,
  initialRatings,
  initialAverage,
  onRatingsChange,
}: {
  propertyId: number;
  initialComments: Comment[];
  initialRatings: Rating[];
  initialAverage: number;
  onRatingsChange: (ratings: Rating[], average: number) => void;
}) {
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);
  const [ratingAverage, setRatingAverage] = useState(initialAverage);

  const [newMessage, setNewMessage] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const myRating = ratings.find((r) => r.user?.id === user?.id);
  const [selectedScore, setSelectedScore] = useState<number>(myRating?.score ?? 0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // ── FETCH INICIAL ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commentsRes, ratingsRes] = await Promise.all([
          api.get(`/properties/${propertyId}/comments`),
          api.get(`/ratings/${propertyId}`),
        ]);
        setComments(commentsRes.data);
        const ratingsData: Rating[] = ratingsRes.data;
        setRatings(ratingsData);
        if (ratingsData.length) {
          const sum = ratingsData.reduce((acc, r) => acc + r.score, 0);
          const avg = Number((sum / ratingsData.length).toFixed(2));
          setRatingAverage(avg);
          setTimeout(() => onRatingsChange(ratingsData, avg), 0);
        }
      } catch {}
    };
    fetchData();
  }, [propertyId, onRatingsChange]);

  // Sincroniza selectedScore cuando llegan los ratings frescos
  useEffect(() => {
    const my = ratings.find((r) => r.user?.id === user?.id);
    if (my) setSelectedScore(my.score);
  }, [ratings, user]);

  // ── PROMEDIO LOCAL ──
  const recalcAverage = (updated: Rating[]) => {
    if (!updated.length) {
      setRatingAverage(0);
      setTimeout(() => onRatingsChange(updated, 0), 0);
      return;
    }
    const sum = updated.reduce((acc, r) => acc + r.score, 0);
    const avg = Number((sum / updated.length).toFixed(2));
    setRatingAverage(avg);
    setTimeout(() => onRatingsChange(updated, avg), 0);
  };

  // ── SUBMIT COMENTARIO ──
  const handleCommentSubmit = async () => {
    if (!newMessage.trim()) return;
    setSubmittingComment(true);
    try {
      const { data: created } = await api.post<Comment>(
        `/properties/${propertyId}/comments`,
        { message: newMessage.trim() }
      );
      setComments((prev) => [
        {
          ...created,
          created_at: created.created_at ?? new Date().toISOString(),
          user: { name: user!.name, surname: '', photo: user!.photo ?? undefined, id: user!.id },
        },
        ...prev,
      ]);
      setNewMessage('');
      toast.success('Comentario publicado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingComment(false);
    }
  };

  // ── EDITAR COMENTARIO ──
  const handleEditSubmit = async (commentId: number) => {
    if (!editMessage.trim()) return;
    setSubmittingEdit(true);
    try {
      await api.patch(`/properties/${propertyId}/comments/${commentId}`, { message: editMessage.trim() });
      setComments((prev) =>
        prev.map((c) => c.id === commentId ? { ...c, message: editMessage.trim() } : c)
      );
      setEditingId(null);
      toast.success('Comentario editado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingEdit(false);
    }
  };

  // ── ELIMINAR COMENTARIO ──
  const handleDelete = (commentId: number) => {
    confirmDialog({
      title: '¿Eliminar comentario?',
      message: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/properties/${propertyId}/comments/${commentId}`);
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          toast.success('Comentario eliminado');
        } catch (error) {
          toast.error(getErrorMessage(error));
        }
      },
    });
  };

  // ── OCULTAR / MOSTRAR COMENTARIO (solo admin) ──
  // Moderación blanda: el comentario no se borra, deja de mostrarse al resto.
  const handleToggleHidden = async (commentId: number) => {
    try {
      const { data } = await api.patch(`/properties/${propertyId}/comments/${commentId}/hide`);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, isHidden: data.isHidden } : c)),
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // ── SUBMIT RATING ──
  const handleRatingSubmit = async () => {
    if (!selectedScore) return;
    setSubmittingRating(true);
    try {
      await api.post(`/ratings/${propertyId}`, { score: selectedScore });
      setRatings((prev) => {
        const exists = prev.find((r) => r.user?.id === user!.id);
        const updated = exists
          ? prev.map((r) => r.user?.id === user!.id ? { ...r, score: selectedScore } : r)
          : [...prev, { id: Date.now(), score: selectedScore, user: { name: user!.name, id: user!.id } }];
        recalcAverage(updated);
        return updated;
      });
      toast.success(myRating ? 'Valoración actualizada' : 'Valoración enviada');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    /* `flex flex-col gap-8` — MISMA separación que el resto de las secciones de
       la columna izquierda.
       Antes era un fragmento (`<>`) con los dos bloques como hermanos sueltos:
       funcionaba mientras el padre los recibía directo, porque heredaban su
       `gap-8`. Al envolver este componente en `<Reveal>` para animarlo, los dos
       quedaron dentro de un mismo contenedor y el gap del padre dejó de
       aplicarse entre ellos — Valoraciones y Comentarios se veían pegados. */
    <div className="flex flex-col gap-8">
      {/* ── VALORACIONES ── */}
      <div id="valoracion" className={`scroll-mt-28 ${CARD} p-8`}>
        <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-ink-900">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-500">
            <Star size={18} className="fill-amber-400 text-amber-400" />
          </span>
          Valoraciones
          {ratings.length > 0 && (
            <span className="ml-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">
              {ratings.length}
            </span>
          )}
        </h2>

        {ratings.length > 0 && (
          <div className="mb-6 flex items-center gap-4 rounded-2xl bg-surface-mint p-5">
            <span className="text-5xl font-black text-brand-700">{ratingAverage.toFixed(1)}</span>
            <div>
              <StarRating score={ratingAverage} size={22} />
              <p className="mt-1 text-sm text-ink-500">
                Basado en {ratings.length} {ratings.length === 1 ? 'valoración' : 'valoraciones'}
              </p>
            </div>
          </div>
        )}

        {ratings.length > 0 && (
          <div className="mb-6 flex flex-col gap-1">
            {ratings.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-ink-50 py-3 last:border-none">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-700/10">
                    {r.user?.photo ? (
                      <Image src={r.user.photo} alt={r.user.name} width={32} height={32} className="rounded-full object-cover" />
                    ) : (
                      <User size={14} className="text-brand-700" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-ink-700">{r.user?.name || 'Anónimo'}</span>
                  {r.user?.id === user?.id && (
                    <span className="rounded-full bg-brand-700/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand-700 uppercase">
                      Tu valoración
                    </span>
                  )}
                </div>
                <StarRating score={r.score} size={16} />
              </div>
            ))}
          </div>
        )}

        {user?.role === 'admin' ? (
          /* Valorar es exclusivo de usuarios comunes: `POST /ratings/:id` lleva
             `@Roles(Role.USER)`, así que al admin le devolvería 403. Se le
             muestra el motivo en vez de un formulario que no puede usar. */
          <p className="rounded-2xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-500">
            Las valoraciones son de los usuarios: desde una cuenta de administrador no se puede valorar.
          </p>
        ) : user ? (
          <div className="rounded-2xl border border-brand-700/10 bg-brand-700/5 p-5">
            <p className="mb-3 text-sm font-bold text-ink-700">
              {myRating ? '✏️ Modificar tu valoración' : '⭐ Valorá esta propiedad'}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <StarPicker value={selectedScore} onChange={setSelectedScore} />
              <button onClick={handleRatingSubmit} disabled={!selectedScore || submittingRating}
                className="cursor-pointer rounded-xl px-5 py-2 text-sm font-bold text-white transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'var(--gradient-brand)' }}>
                {submittingRating ? 'Enviando...' : myRating ? 'Actualizar' : 'Enviar valoración'}
              </button>
            </div>
          </div>
        ) : (
          <Link href={loginUrlWithReturn(currentPathWithQuery() ?? `/properties/${propertyId}`)}
            className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 p-4 text-sm text-ink-500 transition-all duration-300 hover:border-brand-700 hover:text-brand-700">
            <LogIn size={16} className="transition-transform group-hover:scale-110" />
            Iniciá sesión para valorar esta propiedad
          </Link>
        )}
      </div>

      {/* ── COMENTARIOS ── */}
      <div id="comentarios" className={`scroll-mt-28 ${CARD} p-8`}>
        <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-ink-900">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <MessageCircleMore size={18} />
          </span>
          Comentarios
          <span className="ml-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
            {comments.length}
          </span>
        </h2>

        {user ? (
          <div className="mb-8 flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700/10">
              {user.photo ? (
                <Image src={user.photo} alt={user.name} width={40} height={40} className="rounded-full object-cover" />
              ) : (
                <User size={18} className="text-brand-700" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribí tu comentario sobre esta propiedad..."
                maxLength={500} rows={3}
                className="w-full resize-none rounded-2xl border border-ink-200 bg-surface-mint px-4 py-3 text-sm text-ink-700 transition-all duration-200 placeholder:text-ink-500 focus:border-brand-700 focus:bg-white focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500">{newMessage.length}/500</span>
                <button onClick={handleCommentSubmit} disabled={!newMessage.trim() || submittingComment}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'var(--gradient-brand)' }}>
                  <Send size={14} />
                  {submittingComment ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link href={loginUrlWithReturn(currentPathWithQuery() ?? `/properties/${propertyId}`)}
            className="group mb-8 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 p-4 text-sm text-ink-500 transition-all duration-300 hover:border-brand-700 hover:text-brand-700">
            <LogIn size={16} className="transition-transform group-hover:scale-110" />
            Iniciá sesión para dejar un comentario
          </Link>
        )}

        {comments.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center text-ink-500">
            <MessageCircle size={36} className="mb-3 text-ink-400" />
            <p className="text-sm font-medium">Todavía no hay comentarios.</p>
            <p className="mt-1 text-xs">¡Sé el primero en opinar!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {comments.map((comment) => {
              const isOwner = comment.user?.id === user?.id;
              const isAdmin = user?.role === 'admin';
              return (
                <div key={comment.id} className="group/comment flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700/10">
                    {comment.user?.photo ? (
                      <Image src={comment.user.photo} alt={comment.user.name} width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <User size={18} className="text-brand-700" />
                    )}
                  </div>
                  {/* Un comentario oculto solo lo recibe el admin (el backend lo
                      filtra para el resto); se marca en ámbar para que se note. */}
                  <div className={`flex-1 rounded-2xl px-5 py-4 ${comment.isHidden ? 'border border-amber-200 bg-amber-50' : 'bg-surface-mint'}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink-800">
                          {comment.user?.name ? `${comment.user.name} ${comment.user.surname || ''}` : 'Usuario'}
                        </span>
                        {isOwner && (
                          <span className="rounded-full bg-brand-700/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand-700 uppercase">
                            Tú
                          </span>
                        )}
                        {comment.isHidden && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                            <EyeOff size={9} />Oculto
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="mr-2 text-xs text-ink-500">{formatDate(comment.created_at)}</span>
                        {isAdmin && (
                          <button onClick={() => handleToggleHidden(comment.id)}
                            className="cursor-pointer rounded-lg p-1.5 text-ink-500 opacity-0 transition-all hover:bg-amber-50 hover:text-amber-600 group-hover/comment:opacity-100"
                            aria-label={comment.isHidden ? 'Mostrar comentario' : 'Ocultar comentario'}
                            title={comment.isHidden ? 'Mostrar' : 'Ocultar'}>
                            {comment.isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                        )}
                        {isOwner && editingId !== comment.id && (
                          <button onClick={() => { setEditingId(comment.id); setEditMessage(comment.message); }}
                            className="cursor-pointer rounded-lg p-1.5 text-ink-500 opacity-0 transition-all hover:bg-brand-700/10 hover:text-brand-700 group-hover/comment:opacity-100"
                            aria-label="Editar">
                            <Pencil size={13} />
                          </button>
                        )}
                        {(isOwner || isAdmin) && editingId !== comment.id && (
                          <button onClick={() => handleDelete(comment.id)}
                            className="cursor-pointer rounded-lg p-1.5 text-ink-500 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover/comment:opacity-100"
                            aria-label="Eliminar">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    {editingId === comment.id ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <textarea aria-label="comentario" value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          maxLength={500} rows={3}
                          className="w-full resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 transition-all focus:border-brand-700 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)}
                            className="cursor-pointer rounded-lg bg-ink-100 px-4 py-1.5 text-xs font-semibold text-ink-500 transition-colors hover:bg-ink-200">
                            Cancelar
                          </button>
                          <button onClick={() => handleEditSubmit(comment.id)} disabled={submittingEdit}
                            className="cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-40"
                            style={{ background: 'var(--gradient-brand)' }}>
                            {submittingEdit ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* `wrap-anywhere` — ver "TEXTO LIBRE". ESTE es el nodo que
                         rompía la navbar en mobile: un comentario con un link
                         pegado medía 673px de ancho mínimo y arrastraba el
                         documento entero a 690px. */
                      <p className="text-sm leading-relaxed wrap-anywhere text-ink-600">{comment.message}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PROPIEDADES SIMILARES ──────────────────────────────────────────────────────
function SimilarProperties({
  currentId, operationType, typeOfPropertyId,
}: {
  currentId: number; operationType: string; typeOfPropertyId?: number;
}) {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertiesService
      .getFilteredProperties({
        operationType: operationType as OperationType,
        typeOfPropertyId,
        page: 1,
        limit: 4,
      })
      .then((res) => setItems((res?.data || []).filter((p) => p.id !== currentId).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentId, operationType, typeOfPropertyId]);

  if (loading || items.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="mb-8">
        <span className="inline-block rounded-full bg-brand-700 px-4 py-1.5 text-xs font-bold tracking-[0.22em] text-white uppercase shadow-[0_4px_12px_-4px_rgba(11,122,75,0.6)]">
          También te puede interesar
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
          Propiedades <span className="text-brand-700">similares</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </section>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function PropertyDetail({ property }: { property: PropertyFull }) {
  const {
    title, description, direccion, localidad, barrio, zone,
    rooms, bathrooms, garage, patio, aptoMascotas, property_deed, tractoAbreviado, boleto,
    supTotal, supCubierta, antiquity, price, currency, expensas, operationType, status,
    typeOfProperty, images = [], agent,
    comments = [], ratings = [], ratingAverage = 0,
    created_at,
  } = property;

  // ── Estado local para el título — se sincroniza con CommentsAndRatings ──
  const [liveRatingsCount, setLiveRatingsCount] = useState(ratings.length);
  const [liveAverage, setLiveAverage] = useState(ratingAverage);

  /**
   * `useCallback` con `[]`: sólo llama a dos setters de estado, que React
   * garantiza estables, así que la identidad de esta función no necesita
   * cambiar nunca.
   *
   * Importa porque `CommentsAndRatings` la recibe como prop y la usa dentro de
   * un `useEffect`. Sin memoizar, la función se recreaba en cada render del
   * padre y no se podía incluir en las dependencias del efecto sin provocar un
   * refetch infinito de comentarios y valoraciones — por eso estaba omitida y
   * ESLint lo marcaba. Memoizada, la dependencia se puede declarar de verdad.
   */
  const handleRatingsChange = useCallback((updatedRatings: Rating[], updatedAverage: number) => {
    setLiveRatingsCount(updatedRatings.length);
    setLiveAverage(updatedAverage);
  }, []);

  /**
   * Las imágenes se muestran EN EL ORDEN QUE MANDA EL BACKEND.
   *
   * Antes acá había un `sort` local por `isCover`. Se eliminó por dos motivos:
   *
   *  1. El backend ahora persiste el orden que el admin eligió por drag & drop
   *     (`PropertyImages.order`) y `GET /properties/:id` las devuelve con
   *     `ORDER BY order ASC, id ASC`. Reordenar acá pisaría esa decisión.
   *  2. El comparador estaba MAL: `(a, b) => a.isCover ? -1 : b.isCover ? 1 : 0`
   *     no define un orden consistente (para dos imágenes sin portada devolvía
   *     0, pero comparaba solo contra `a`), así que el resultado dependía del
   *     algoritmo interno de `Array.prototype.sort`.
   *
   * La portada sigue quedando primera: el backend garantiza `order = 0 ⇔ isCover`.
   */
  const sortedImages = images;
  const isAvailable = status === 'disponible';
  const precio = priceParts(price, currency);

  // Query del mapa: ahora existe `direccion` (calle y número) como campo real.
  // Se completa con barrio/localidad para desambiguar la búsqueda en Google Maps.
  // Fallback a la ubicación sola en las propiedades cargadas antes del campo.
  const mapAddress = [direccion, barrio, localidad].filter(Boolean).join(', ');
  const wa = whatsappLink(`Hola! Estoy interesado en la propiedad: "${title}" (ID: ${property.id}). ¿Podría darme más información?`);

  const scrollTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen bg-surface-mint">
      <div className="mx-auto max-w-6xl px-4 pt-32 pb-20">

        {/* ── BARRA DE ACCESOS RÁPIDOS ──
            `motion.div` directo y no `<Reveal>`: esta barra ya está dentro del
            viewport al cargar, así que un `whileInView` dispararía igual pero
            dependiendo del margen de detección. Con `animate` entra siempre, y
            el `staggerChildren` hace que los accesos aparezcan uno detrás de
            otro en vez de todos de golpe.

            ── 2x3 en mobile · 3x2 en tablet · UNA FILA en `xl` ──
            Los accesos pasaron de 4 a 5 ("Ver Características") y, contando el
            botón de Guardar, son SEIS piezas. En la grilla 2x2 anterior el
            botón de favorito quedaba fuera —era el otro hijo del flex— y con
            seis elementos la fila se comprimía o desbordaba.

            Ahora la grilla vive en ESTE contenedor y las seis piezas son celdas
            hermanas, así que los dos formatos de grilla salen exactos: 2x3 en
            mobile y 3x2 en tablet, sin celdas huérfanas.

            De `xl` para arriba pasa a ser una sola fila horizontal, con los
            accesos a la izquierda y Guardar a la derecha (`xl:justify-between`).
            El porqué del `xl` —y no `sm`— está medido en la nota de
            `QUICK_LINK_BASE`: la fila necesita 1052px de ancho interno y recién
            los hay a partir de un viewport de ~1124px.

            ⚠️ Se conserva `xl:flex-wrap` a propósito. Si algún día una etiqueta
            se alarga y la fila deja de entrar, con `wrap` degrada a dos renglones
            (feo pero legible); con `nowrap` se desbordaría de la tarjeta, y ese
            desborde lo taparía el `overflow-x: clip` de `globals.css` dejando
            texto cortado sin que nadie se entere. */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
          className={`mb-8 grid grid-cols-2 items-stretch gap-2 px-5 py-3 sm:grid-cols-3 xl:flex xl:flex-wrap xl:items-center xl:justify-between xl:gap-4 ${CARD} rounded-2xl`}
        >
          {/* Contenedor intermedio también `motion`: las variantes de framer
              se propagan por el árbol de componentes `motion`, y un `<div>`
              común en el medio cortaría la cadena y el stagger no llegaría a
              los accesos.

              ⚠️ `contents` (`display: contents`) hasta `xl` — no es decorativo.
              Este div tiene que existir para agrupar los cinco accesos en la
              fila de escritorio (si no, `xl:justify-between` los separaría uno
              de otro en vez de separarlos del botón Guardar), pero mientras el
              layout es grilla no debe generar caja propia: con
              `display: contents` desaparece del layout y sus hijos pasan a ser
              celdas directas de la grilla de arriba, que es lo que permite el
              2x3 y el 3x2 con Guardar incluido como una celda más.

              ⚠️ `gap-x-3` y no `gap-x-4` en la fila de `xl`: son los 4px por
              hueco que faltaban para que las seis piezas entraran en un renglón
              (ver el cálculo en `QUICK_LINK_BASE`). El `gap-y-2` queda como
              salvavidas por si alguna vez tuviera que envolver.

              ⚠️ Cada wrapper lleva `min-w-0`. Sin eso, un item de grilla usa
              `min-width: auto`, o sea que se niega a achicarse por debajo del
              ancho de su contenido: la columna derecha se desbordaba de la
              tarjeta y los textos quedaban cortados contra el borde de la
              pantalla. Con `min-w-0` la celda puede encoger y el texto envuelve. */}
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            className="contents xl:flex xl:w-auto xl:flex-wrap xl:items-center xl:gap-x-3 xl:gap-y-2"
          >
            <motion.div variants={QUICK_LINK_ITEM} className="min-w-0">
              <Link href="/properties" className={`${QUICK_LINK_BASE} text-brand-700 hover:border-brand-200 hover:bg-brand-50`}>
                <ArrowLeft size={16} className="shrink-0 transition-transform duration-300 ease-out group-hover:-translate-x-1" />
                Volver al catálogo
              </Link>
            </motion.div>

            <motion.span variants={QUICK_LINK_ITEM} className="hidden text-ink-400 xl:inline" aria-hidden>|</motion.span>

            {/* ── VER CARACTERÍSTICAS ──
                Va 2º, entre "Volver al catálogo" y "Ver Valoraciones", por
                pedido explícito.

                Color: verde PROFUNDO (`brand-800` / `brand-900`), no el
                `brand-700` de "Volver al catálogo". La regla de la barra es que
                cada acceso comparta señal visual con la sección a la que lleva
                —por eso valoraciones es ámbar, comentarios azul y ubicación
                roja— y el encabezado de "Características" es verde de marca
                (`tono='brand'`). Un ámbar/azul/rojo nuevo rompería esa
                correspondencia y además saldría de la paleta (verde/gris/blanco);
                un `brand-700` lo volvería indistinguible de "Volver al catálogo".
                El paso oscuro resuelve las dos cosas: mismo idioma verde, tono
                propio, y el ícono `Building2` es el mismo de la sección destino. */}
            <motion.div variants={QUICK_LINK_ITEM} className="min-w-0">
              <a href="#caracteristicas" onClick={scrollTo('caracteristicas')} className={`${QUICK_LINK_BASE} text-brand-900 hover:border-brand-800/40 hover:bg-brand-100 hover:text-brand-900`}>
                <Building2 size={16} className="shrink-0 text-brand-800 transition-transform duration-300 ease-out group-hover:scale-110" />
                Ver Características
              </a>
            </motion.div>

            <motion.span variants={QUICK_LINK_ITEM} className="hidden text-ink-400 xl:inline" aria-hidden>|</motion.span>

            {/* Valoraciones y "Ver dirección exacta" están intercambiados
                respecto del orden original, por pedido: valoraciones queda
                arriba (más visible) y la dirección pasa al último. */}
            <motion.div variants={QUICK_LINK_ITEM} className="min-w-0">
              <a href="#valoracion" onClick={scrollTo('valoracion')} className={`${QUICK_LINK_BASE} text-ink-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700`}>
                <Star size={16} className="shrink-0 fill-amber-400 text-amber-500 transition-transform duration-300 ease-out group-hover:scale-110" />
                Ver Valoraciones
              </a>
            </motion.div>

            <motion.span variants={QUICK_LINK_ITEM} className="hidden text-ink-400 xl:inline" aria-hidden>|</motion.span>

            <motion.div variants={QUICK_LINK_ITEM} className="min-w-0">
              <a href="#comentarios" onClick={scrollTo('comentarios')} className={`${QUICK_LINK_BASE} text-ink-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700`}>
                <MessageCircleMore size={16} className="shrink-0 text-blue-600 transition-transform duration-300 ease-out group-hover:scale-110" />
                Ver Comentarios
              </a>
            </motion.div>

            <motion.span variants={QUICK_LINK_ITEM} className="hidden text-ink-400 xl:inline" aria-hidden>|</motion.span>

            <motion.div variants={QUICK_LINK_ITEM} className="min-w-0">
              <a href="#mapa-ubicacion" onClick={scrollTo('mapa-ubicacion')} className={`${QUICK_LINK_BASE} text-ink-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700`}>
                <MapPin size={16} className="shrink-0 text-red-600 transition-transform duration-300 ease-out group-hover:scale-110" />
                Ver dirección exacta
              </a>
            </motion.div>
          </motion.div>

          {/* ── FAVORITOS (reusa el componente compartido) ──
              6ª celda de la grilla en mobile; a la derecha de la fila en
              escritorio. */}
          <motion.div variants={QUICK_LINK_ITEM} className="flex min-w-0 items-stretch">
            <FavoriteButton propertyId={property.id} />
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── COLUMNA IZQUIERDA (2/3) ── */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            <Reveal y={18}>
              <ImageSlider images={sortedImages} title={title} />
            </Reveal>

            {/* ── ENCABEZADO ──
                Va en su propia tarjeta blanca (antes flotaba suelto sobre el
                gris y se leía como un bloque plano), con bastante más aire
                interno para que el título respire. */}
            <Reveal y={18}>
             <div className={`${CARD} px-8 py-9`}>
              <div className="mb-5 flex flex-wrap items-center gap-2.5">
                <span className={`${BADGE_BASE} ${operationBadgeSoft(operationType)}`}>{operationType}</span>
                <span className={`${BADGE_BASE} ${propertyTypeBadgeSoft(typeOfProperty?.name)}`}>
                  {typeOfProperty?.name || 'Propiedad'}
                </span>
                <span className={`${BADGE_BASE} gap-1.5 ${statusBadgeColor(status)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDotColor(status)}`} aria-hidden />
                  {isAvailable && <ShieldCheck size={13} />}{status}
                </span>
              </div>

              {/* Bajado de `text-3xl / md:2.6rem` (≈42px) a `text-2xl / md:3xl`
                  (≈30px). Con títulos reales de esta inmobiliaria —largos, con
                  comillas y aclaraciones entre paréntesis— el tamaño anterior
                  ocupaba cuatro renglones y empujaba toda la ficha hacia abajo.
                  Sigue siendo el elemento más grande del bloque, que es lo que
                  tiene que seguir destacando. */}
              {/* `wrap-anywhere` — ver la nota de "TEXTO LIBRE" arriba del archivo.
                  El título lo escribe el admin y puede traer una palabra sin
                  espacios más ancha que el teléfono. */}
              <h1 className="text-2xl leading-tight font-bold tracking-tight wrap-anywhere text-ink-900 md:text-3xl">
                {title}
              </h1>

              {/* ── UBICACIÓN ──
                  Orden fijo: dirección → barrio → zona → localidad. Píldoras
                  (`rounded-full`) con el ícono en su propio círculo tintado, en
                  vez del bloque de texto plano separado por "·" que había antes.
                  `leading-none` en ambos textos: sin eso el label (10px) y el
                  valor (14px) arrastran line-heights distintos y cada píldora
                  centraba su contenido a una altura diferente.
                  Los datos vacíos no se renderizan.

                  ── Paleta: mismo criterio que "Comodidades" ──
                  Antes cada píldora apilaba TRES verdes distintos y muy
                  parecidos entre sí (`surface-mint` de fondo, `brand-700/10` en
                  el círculo del ícono, `brand-700` en el ícono) más un borde
                  gris `ink-100` y un label gris `ink-500`. Cuatro píldoras en
                  fila con esa mezcla se leían sucias: el círculo del ícono
                  apenas se despegaba del fondo de la píldora, y el gris del
                  borde peleaba con el verde del relleno.

                  Ahora es el mismo par que el resto del rediseño: borde fino
                  `brand-800` sobre fondo `brand-50` (muy claro), ícono y valor
                  en verde oscuro. Un solo verde de fondo y un solo verde de
                  trazo, en vez de tres tonos compitiendo.

                  El label chico se sube de `ink-500` a `brand-700`: es el único
                  gris que quedaba y rompía la lectura de la píldora como una
                  unidad. Se mantiene más claro que el valor para conservar la
                  jerarquía label/dato.

                  Hover: `brand-100` (un paso más oscuro que el fondo, mismo
                  criterio que pediste) y el círculo del ícono se invierte a
                  sólido. Antes el hover CAMBIABA de familia de color
                  (`surface-mint` → `brand-50`), que es justamente el salto que
                  se veía poco prolijo. */}
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                {[
                  { icon: MapPin,     label: 'Dirección', value: direccion },
                  { icon: Building2,  label: 'Barrio',    value: barrio },
                  { icon: Navigation, label: 'Zona',      value: zone },
                  { icon: Landmark,   label: 'Localidad', value: localidad },
                ]
                  .filter((seg) => seg.value)
                  .map(({ icon: Icon, label, value }) => (
                    /* `max-w-full` + `min-w-0`: la píldora es `inline-flex`, o
                       sea que se dimensiona por su contenido. Con una dirección
                       larga (o una calle escrita sin espacios) se estiraba más
                       que la tarjeta y empujaba el documento — medido, la fila
                       de píldoras daba `clientWidth 292` / `scrollWidth 427` en
                       un teléfono de 390px. Con estas dos la píldora puede
                       encoger hasta el ancho disponible y el texto envuelve. */
                    <span
                      key={label}
                      className="group inline-flex max-w-full min-w-0 items-center gap-2.5 rounded-full border border-brand-800 bg-brand-50 py-1.5 pr-5 pl-1.5 transition-colors duration-200 hover:bg-brand-100"
                    >
                      {/* Pastilla BLANCA con el ícono en verde oscuro (y no un
                          `brand-800/10`, que sobre el fondo `brand-50` de la
                          píldora quedaba prácticamente invisible). Acá el ícono
                          va en verde y no en blanco sobre sólido —a diferencia
                          de las tarjetas de Características— porque el círculo
                          mide 32px: un disco verde oscuro de ese tamaño, cuatro
                          veces seguidas en una misma fila, pesaba más que el
                          propio dato de ubicación. El blanco lo recorta contra
                          el verde clarito sin agregar carga visual. */}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-800 transition-colors duration-200 group-hover:bg-brand-800 group-hover:text-white">
                        <Icon size={15} />
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-[10px] leading-none font-bold tracking-[0.12em] text-brand-700 uppercase">
                          {label}
                        </span>
                        <span className="text-sm leading-none font-semibold wrap-anywhere text-brand-900">{value}</span>
                      </span>
                    </span>
                  ))}
              </div>

              {/* ── liveAverage y liveRatingsCount se actualizan sin recargar ── */}
              {liveRatingsCount > 0 && (
                <div className="mt-7 flex items-center gap-3 border-t border-ink-100 pt-6">
                  <StarRating score={liveAverage} />
                  <span className="text-sm font-semibold text-ink-700">{liveAverage.toFixed(1)}</span>
                  <span className="text-sm text-ink-500">({liveRatingsCount} {liveRatingsCount === 1 ? 'valoración' : 'valoraciones'})</span>
                </div>
              )}
             </div>
            </Reveal>

            {/* ── PRECIO + CTA (SOLO MOBILE) ──
                En escritorio el precio vive en el sidebar sticky y está siempre
                a la vista. En mobile el grid colapsa a una columna y ese sidebar
                cae al final de todo: había que scrollear la galería, la ficha,
                la descripción, las características, los comentarios y el mapa
                para llegar al precio — el dato que la persona vino a buscar.

                Acá queda arriba de la descripción: apenas debajo del título y
                la ubicación, o sea dentro de la primera pantalla o la siguiente.
                Es la MISMA `PriceCard` del sidebar, con las clases invertidas
                (`lg:hidden` contra `hidden lg:block`), así que las dos no pueden
                mostrarse a la vez ni quedar desincronizadas. */}
            <Reveal y={18} className="lg:hidden">
              <PriceCard precio={precio} operationType={operationType} wa={wa} />
            </Reveal>

            {/* Descripción */}
            <Reveal y={18}>
              <div className={`${CARD} p-8`}>
                <SectionHeader icon={Home} title="Descripción" className="mb-5" />
                {/* `wrap-anywhere` — ver "TEXTO LIBRE". Las descripciones suelen
                    traer links pegados ("mas info en https://..."), que sin
                    regla de corte son una sola palabra de 600px. */}
                <p className="leading-relaxed wrap-anywhere whitespace-pre-line text-ink-600">{description}</p>
              </div>
            </Reveal>

            {/* Características */}
            <Reveal y={18}>
             {/* `id` + `scroll-mt-28` como valoraciones/comentarios/ubicación:
                 el margen de scroll compensa la navbar fija, que si no tapa el
                 encabezado al aterrizar desde el acceso rápido. */}
             <div id="caracteristicas" className={`scroll-mt-28 ${CARD} p-8`}>
              <SectionHeader icon={Building2} title="Características" />

              {/* ── SPECS NUMÉRICAS ──
                  Mismo par de colores que "Comodidades" y que las píldoras de
                  ubicación: borde fino `brand-800` sobre fondo `brand-50`, con
                  el valor y el label en verde oscuro.

                  Antes eran las únicas tarjetas GRISES de toda la ficha (borde
                  `ink-100`, valor `ink-900`, label `ink-500`) y quedaban
                  inmediatamente arriba de las de Comodidades, que ya estaban en
                  verde: se leía como si fueran dos componentes de sistemas de
                  diseño distintos pegados uno abajo del otro.

                  El label pasa de `ink-500` a `brand-700` y el valor de
                  `ink-900` a `brand-900`: el valor sigue siendo el dato
                  protagonista por tamaño y peso (`text-lg font-bold` contra
                  10px), no por ser el único con color.

                  Se conserva el `hover` con elevación y sombra —es lo que da la
                  sensación de tarjeta— pero el cambio de fondo pasa a
                  `brand-100`, un paso más oscuro dentro de la MISMA familia, en
                  vez de saltar de gris a verde como antes.

                  Expensas se suma al final y SOLO si tiene valor: `formatExpensas`
                  devuelve `null` cuando el campo viene vacío, y el `.filter()`
                  descarta esa tarjeta. Mostrar "Expensas: —" ocuparía una celda
                  para no decir nada, y en una casa (que nunca tiene expensas)
                  aparecería siempre. */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { icon: Bed,       value: rooms,               label: 'Habitaciones' },
                  { icon: Bath,      value: bathrooms,           label: 'Baños' },
                  { icon: Maximize,  value: supTotal != null ? `${supTotal} m²` : '—',       label: 'Sup. Total' },
                  { icon: Maximize,  value: supCubierta != null ? `${supCubierta} m²` : '—', label: 'Sup. Cubierta' },
                  { icon: Hourglass, value: `${antiquity} años`, label: 'Antigüedad' },
                  { icon: Receipt,   value: formatExpensas(expensas), label: 'Expensas' },
                ].filter((item) => item.value != null).map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-brand-800 bg-brand-50 px-3 py-6 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-100 hover:shadow-[0_10px_24px_-12px_rgba(6,57,35,0.3)]"
                    >
                      {/* Círculo SÓLIDO con el ícono en blanco, exactamente
                          como las tarjetas de Comodidades de abajo. Se probó
                          antes con `bg-brand-800/10` (tintado al 10%) y sobre
                          el fondo `brand-50` de la tarjeta quedaba casi
                          invisible: el ícono flotaba sin pastilla y las dos
                          secciones seguían sin parecerse, que era justo lo que
                          había que resolver. */}
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-white">
                        <Icon size={20} />
                      </span>
                      <span className="text-lg leading-none font-bold text-brand-900">{item.value}</span>
                      <span className="text-center text-[10px] leading-none font-bold tracking-[0.1em] text-brand-700 uppercase">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ── COMODIDADES Y DOCUMENTACIÓN ──
                  Rediseño de contraste. Antes lo que tiene y lo que no se
                  distinguían por el ícono (✓ vs ✗) y por un verde muy suave
                  contra un gris casi idéntico: de un vistazo la grilla se leía
                  como seis tarjetas iguales, y había que ir ítem por ítem
                  mirando el ícono chico de la derecha para saber qué incluye la
                  propiedad.

                  Ahora el color hace todo el trabajo y el ícono solo confirma:
                   - TIENE  → borde `brand-800` (el verde de marca, un paso más
                     oscuro que el `brand-700` histórico) sobre fondo `brand-50`,
                     muy claro. Contraste alto entre borde y fondo.
                   - NO TIENE → borde `red-600` fuerte sobre fondo `red-50`.
                  Los dos bordes son finitos (1px, el `border` por defecto): la
                  idea es que se noten por saturación, no por grosor — un borde
                  grueso convertiría la grilla en un tablero de ajedrez.

                  El rojo NO significa "error": significa "esta propiedad no lo
                  incluye", que es exactamente el dato que el visitante viene a
                  buscar. Por eso también se le da un `title` explícito a cada
                  tarjeta: el color solo no puede ser el único portador de la
                  información (WCAG 1.4.1), y quien no distingue rojo de verde
                  sigue teniendo el ✓/✗ y el texto del tooltip. */}
              <p className="mt-8 mb-4 text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase">
                Comodidades y documentación
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Car,       label: 'Cochera',           value: garage },
                  { icon: TreePine,  label: 'Patio',             value: patio },
                  { icon: PawPrint,  label: 'Apto Mascotas',     value: aptoMascotas },
                  // Documentación legal: los tres son independientes y pueden
                  // convivir en la misma propiedad.
                  { icon: FileCheck, label: 'Apto Escritura',    value: property_deed },
                  { icon: FileCheck, label: 'Tracto abreviado',  value: tractoAbreviado },
                  { icon: FileCheck, label: 'Boleto',            value: boleto },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      title={item.value ? `Esta propiedad tiene: ${item.label}` : `Esta propiedad NO tiene: ${item.label}`}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
                        item.value
                          ? 'border-brand-800 bg-brand-50 text-brand-900'
                          : 'border-red-600 bg-red-50 text-red-800'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          item.value ? 'bg-brand-800 text-white' : 'bg-red-600 text-white'
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="text-sm font-semibold">{item.label}</span>
                      {item.value
                        ? <CheckCircle2 size={17} className="ml-auto shrink-0 text-brand-800" />
                        : <XCircle size={17} className="ml-auto shrink-0 text-red-600" />}
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 border-t border-ink-100 pt-5">
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <Calendar size={14} className="shrink-0 text-brand-700" />
                  <span>Publicada el: <strong className="text-ink-800">{formatDate(created_at)}</strong></span>
                </div>
              </div>
             </div>
            </Reveal>

            {/* ── COMENTARIOS + RATINGS ── */}
            <Reveal y={18}>
              <CommentsAndRatings
              propertyId={property.id}
              initialComments={comments}
              initialRatings={ratings}
              initialAverage={ratingAverage}
                onRatingsChange={handleRatingsChange}
              />
            </Reveal>

            <Reveal y={18}>
              <GoogleMapSection address={mapAddress} />
            </Reveal>
          </div>

          {/* ── COLUMNA DERECHA (1/3) - STICKY ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 flex flex-col gap-5">

              {/* ── PRECIO + CTA (escritorio) ──
                  `hidden lg:block` porque en mobile esta misma tarjeta ya se
                  renderiza arriba, antes de la descripción — ver `PriceCard`.
                  Las dos son excluyentes: nunca se ven las dos a la vez. */}
              <PriceCard
                precio={precio}
                operationType={operationType}
                wa={wa}
                className="hidden lg:block"
              />

              {/* ── PUBLICADA POR ──
                  ⚠️ El rótulo dice "Publicada por" y NO "Agente a cargo", por
                  pedido explícito de la inmobiliaria: "agente a cargo" suena a
                  la jerga de las franquicias grandes y no es como se presentan.

                  Estilo: la tarjeta era blanca y plana, con el rótulo y la foto
                  sueltos sobre el fondo. Ahora tiene una franja de marca arriba
                  —el mismo recurso que la tarjeta de precio, así las dos piezas
                  del sidebar se leen como del mismo sistema— y el bloque de la
                  persona va sobre `brand-50` con borde, de forma que la foto y
                  el nombre queden contenidos en vez de flotando. */}
              {agent && (
                <div className={`overflow-hidden ${CARD}`}>
                  <div className="h-1.5 w-full" style={{ background: 'var(--gradient-brand)' }} />
                  <div className="p-7">
                    <p className="mb-4 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-brand-700 uppercase">
                      <ShieldCheck size={13} className="shrink-0" />
                      Publicada por
                    </p>
                    <div className="flex items-center gap-4 rounded-2xl border border-brand-800/15 bg-brand-50 p-3">
                      {/* Circular, no `rounded-2xl`: es una CARA, y el cuadrado
                          redondeado la recortaba por las mejillas. Además el
                          <Image> no llenaba el contenedor — sin `h-full w-full`
                          una foto no cuadrada quedaba descentrada dentro de la
                          caja.

                          El aro `brand-800` (era `brand-200`) es lo que despega
                          la foto del fondo; el `ring-offset-2` evita que se
                          pegue a la imagen. Ahora el offset es `brand-50` y no
                          blanco, porque el bloque que la contiene es verde
                          claro: con offset blanco quedaba un halo que no
                          coincidía con ningún fondo. */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-brand-800 ring-offset-2 ring-offset-brand-50">
                        {(agent.photo ?? agent.avatar)
                          ? <Image src={(agent.photo ?? agent.avatar)!} alt={agent.name} width={64} height={64} className="h-full w-full object-cover" />
                          : <User size={26} className="text-brand-800" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-brand-900">
                          {agent.name}{agent.surname ? ` ${agent.surname}` : ''}
                        </p>
                        {/* `email` NO viene en la respuesta (no está en
                            `AGENT_PUBLIC_FIELDS`), así que esa línea nunca se
                            renderizaba. Se usa `phone`, que sí llega. */}
                        {agent.phone && (
                          <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium text-brand-700">
                            <Phone size={11} className="shrink-0" />
                            {agent.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── RESUMEN ──
                  Era una lista de renglones planos: label gris a la izquierda,
                  valor gris más oscuro a la derecha, separados por una línea
                  `ink-100` casi invisible. Con 10 filas seguidas, todas del
                  mismo peso y sin ningún anclaje visual, la vista resbalaba y
                  costaba seguir un renglón de punta a punta.

                  Tres cambios, en orden de importancia:

                  1. **Filas alternadas** (`odd:bg-brand-50/60`). Es lo que hace
                     que el ojo pueda saltar de una fila a la otra sin perderse
                     en horizontal. Se usa el verde de marca al 60% y no un gris:
                     un `ink-50` acá metería una cuarta familia de color en una
                     ficha que ya está unificada en verde. Va MUY diluido a
                     propósito — la alternancia tiene que sentirse, no verse.
                  2. **Se van los separadores.** Con bandas alternadas, la línea
                     divisoria es redundante y ensucia (dos señales para lo
                     mismo). Antes era la única señal, y era demasiado débil.
                  3. **El label sube a `brand-700` y el valor a `brand-900`.**
                     Mismo criterio que Características: se elimina el gris
                     suelto y la jerarquía la dan el peso y el tono, no dos
                     grises casi iguales.

                  El `space-y-1` se reemplaza por padding horizontal en cada
                  fila: con bandas de fondo, el aire tiene que ir DENTRO de la
                  banda, si no las franjas quedan separadas y flotando. Se
                  compensa con `-mx-2` para que las bandas se extiendan un poco
                  más allá del texto sin desbordar la tarjeta. */}
              <div className={`${CARD} p-7`}>
                <p className="mb-4 text-[11px] font-bold tracking-[0.14em] text-brand-700 uppercase">Resumen</p>
                <ul className="-mx-2 overflow-hidden rounded-xl text-sm">
                  {[
                    { label: 'Tipo',       value: typeOfProperty?.name },
                    { label: 'Operación',  value: operationType },
                    { label: 'Localidad',     value: localidad },
                    { label: 'Barrio',        value: barrio },
                    { label: 'Dirección',     value: direccion },
                    { label: 'Zona',          value: zone },
                    // `.filter(i => i.value)` de abajo descarta solo los que no
                    // tienen dato, así que las superficies nulas no se muestran.
                    { label: 'Sup. Total',    value: supTotal != null ? `${supTotal} m²` : undefined },
                    { label: 'Sup. Cubierta', value: supCubierta != null ? `${supCubierta} m²` : undefined },
                    { label: 'Antigüedad',    value: `${antiquity} años` },
                    // `formatExpensas` devuelve null si no hay valor, y el
                    // `.filter()` de abajo se encarga: sin expensas cargadas la
                    // fila no aparece.
                    { label: 'Expensas',      value: formatExpensas(expensas) ?? undefined },
                  ].filter(i => i.value).map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between gap-4 px-3 py-2.5 odd:bg-brand-50/60"
                    >
                      <span className="shrink-0 font-medium text-brand-700">{item.label}</span>
                      <span className="min-w-0 text-right font-semibold wrap-anywhere text-brand-900 capitalize">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* ── PROPIEDADES SIMILARES ── */}
        <SimilarProperties
          currentId={property.id}
          operationType={operationType}
          typeOfPropertyId={typeOfProperty?.id}
        />
      </div>
    </main>
  );
}
