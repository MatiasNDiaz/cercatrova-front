'use client';

import Image from 'next/image';
import { Star, Quote } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Pagination } from 'swiper/modules';
import { SectionHeading } from './SectionHeading';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

/**
 * Testimonios (Bloque LANDING §4, rediseñado en §6).
 *
 * El carrusel circular 3D (con `@keyframes rotating` y ~80 líneas de CSS
 * inyectado) ya se había migrado a Swiper coverflow. Base que se mantiene:
 * fondo `brand-50`, operación + zona por testimonio, y retratos de Unsplash
 * vía `next/image` (`images.unsplash.com` ya está en `remotePatterns`).
 *
 * Rediseño de la tanda "Conocenos" — tarjeta más premium y menos amontonada:
 *  - **Separación real:** `spaceBetween` 24 → 44 y `depth`/`modifier` del
 *    coverflow bajados (130/2 → 90/1.5). Antes las laterales se montaban sobre
 *    la central.
 *  - **Jerarquía invertida en la cabecera:** la valoración encabeza la tarjeta
 *    (antes quedaba perdida entre el texto y el pie), la operación va enfrente,
 *    el comentario crece a 17px como protagonista y la identidad cierra abajo.
 *  - **Se fue la barra de gradiente superior** (se leía como banner y
 *    envejecía la tarjeta): ahora la marca la da una comilla gigante al ~5% de
 *    opacidad, en el mismo patrón de marca de agua que usan `Confianza.tsx` y
 *    la tarjeta de la frase de `Nosotros.tsx`.
 *  - **Foco en la tarjeta central:** las laterales quedan al 50% de opacidad y
 *    `scale(0.94)`; hover con elevación y sombra progresiva. Todo respeta
 *    `prefers-reduced-motion`.
 *
 * Los 10 testimonios siguen hardcodeados (no vienen del backend).
 */

const reviews = [
  {
    name: 'Carlos Gómez',
    text: 'Excelente atención, vendieron mi casa en tiempo récord y al precio que esperaba.',
    stars: 5,
    operacion: 'Venta',
    zona: 'Cerro de las Rosas',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Lucía Pérez',
    text: 'Muy profesionales. Me ayudaron con todo el papeleo legal de principio a fin.',
    stars: 4,
    operacion: 'Compra',
    zona: 'Nueva Córdoba',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Martín Sosa',
    text: 'La mejor inmobiliaria de Córdoba, súper recomendados. Todo claro desde el día uno.',
    stars: 5,
    operacion: 'Alquiler',
    zona: 'Güemes',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Elena Ruiz',
    text: 'Encontré el departamento de mis sueños gracias a ellos. Muy atentos a lo que buscaba.',
    stars: 5,
    operacion: 'Compra',
    zona: 'Alta Córdoba',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Jorge Paz',
    text: 'Tasación justa y proceso transparente. Muy conforme con el resultado final.',
    stars: 4,
    operacion: 'Tasación',
    zona: 'Villa Belgrano',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Sofía Milán',
    text: 'Atención personalizada y muy amable por parte del agente en cada visita.',
    stars: 5,
    operacion: 'Alquiler',
    zona: 'Nueva Córdoba',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Raúl Castro',
    text: 'Gran variedad de propiedades y filtros muy útiles para encontrar lo que buscaba.',
    stars: 5,
    operacion: 'Compra',
    zona: 'Villa Allende',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Ana Clara',
    text: 'El sistema de notificaciones me avisó justo cuando entró la casa que quería.',
    stars: 4,
    operacion: 'Compra',
    zona: 'Urca',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Pedro Luis',
    text: 'Muy serios y responsables en el manejo documental. Cero sorpresas al escriturar.',
    stars: 5,
    operacion: 'Venta',
    zona: 'General Paz',
    photo: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Valeria Domínguez',
    text: 'Me encantó poder guardar favoritos y comparar antes de decidirme. Muy práctico.',
    stars: 5,
    operacion: 'Alquiler',
    zona: 'Cofico',
    photo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop',
  },
];

export default function Resenas() {
  return (
    <section id="reseñas" className="overflow-hidden bg-surface-mint py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Testimonios"
          title={<>Lo que dicen <span className="text-brand-700">nuestros clientes</span></>}
          subtitle="Historias reales de familias e inversores que confiaron en nosotros."
        />
      </div>

      {/* `depth`/`modifier` bajados y `spaceBetween` casi al doble (24 → 44): con
          los valores anteriores las tarjetas laterales se montaban sobre la
          central y la fila se veía amontonada. Ahora respiran y el coverflow
          aporta profundidad sin encimar nada. */}
      <Swiper
        modules={[Autoplay, EffectCoverflow, Pagination]}
        effect="coverflow"
        grabCursor
        centeredSlides
        loop
        slidesPerView="auto"
        spaceBetween={44}
        autoplay={{
          // 4200 → 2600 ms. Antes avanzaba tan lento que en una pasada por la
          // landing se alcanzaban a ver dos reseñas y la sección parecía
          // estática. 2600 ms es lo más corto que todavía deja leer completo un
          // testimonio de 2-3 líneas antes de que se corra; por debajo de
          // ~2200 ms hay que apurarse y se siente nervioso.
          // `pauseOnMouseEnter` sigue activo: si alguien se detiene a leer una
          // en particular, el carrusel la espera.
          delay: 2600,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        coverflowEffect={{ rotate: 0, stretch: 0, depth: 90, modifier: 1.5, slideShadows: false }}
        pagination={{
          el: '.reviews-dots',
          clickable: true,
          bulletClass: 'review-dot',
          bulletActiveClass: 'review-dot-active',
        }}
        className="reviews-swiper px-6! pb-2!"
      >
        {reviews.map((review) => (
          // `py-12` reserva el espacio vertical donde se dibujan la sombra y la
          // elevación del hover — sin eso el `overflow-hidden` del Swiper las corta.
          <SwiperSlide key={review.name} className="w-82.5! py-12 sm:w-95!">
            <figure className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white p-8 shadow-[0_2px_8px_-2px_rgba(10,12,11,0.06),0_12px_32px_-12px_rgba(6,57,35,0.14)] transition-[transform,box-shadow,border-color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-brand-700/30 hover:shadow-[0_4px_10px_-2px_rgba(10,12,11,0.06),0_30px_60px_-20px_rgba(6,57,35,0.32)]">
              {/* Comilla como marca de agua: reemplaza la barra de gradiente
                  superior, que se leía como un banner y envejecía la tarjeta. */}
              <Quote
                aria-hidden
                size={130}
                strokeWidth={1.5}
                className="pointer-events-none absolute -top-6 -right-6 rotate-12 text-brand-700/5.5 transition-all duration-500 select-none group-hover:-top-4 group-hover:text-brand-700/9"
              />

              {/* ── Cabecera: valoración a la izquierda, operación a la derecha ──
                  Las estrellas suben al tope (antes iban entre el texto y el pie,
                  perdidas): la valoración es lo primero que se escanea en un
                  testimonio, así que encabeza la jerarquía. */}
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.stars ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}
                    />
                  ))}
                </div>
                <span className="shrink-0 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-brand-800 uppercase">
                  {review.operacion}
                </span>
              </div>

              {/* Comentario: el protagonista. Más grande y con más interlineado
                  que antes (15px → 17px) para que sea lo que domina la tarjeta. */}
              <blockquote className="relative mt-6 grow text-[17px] leading-[1.65] font-medium text-ink-700">
                &ldquo;{review.text}&rdquo;
              </blockquote>

              {/* Pie: identidad. Separador sutil y avatar con anillo de marca. */}
              <figcaption className="relative mt-7 flex items-center gap-4 border-t border-ink-100 pt-6">
                <Image
                  src={review.photo}
                  alt={review.name}
                  width={52}
                  height={52}
                  className="h-13 w-13 shrink-0 rounded-full object-cover ring-2 ring-brand-600/70 ring-offset-2 transition-all duration-400 group-hover:ring-brand-700"
                />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold tracking-tight text-ink-900">
                    {review.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-medium text-ink-500">{review.zona}</p>
                </div>
              </figcaption>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="reviews-dots mt-4 flex justify-center gap-2" />

      <style>{`
        /* TODAS las tarjetas con la misma altura (la de la más larga).
           Swiper le pone height:100% a cada slide, así que cada una se ajustaba
           a su propio contenido y la fila quedaba despareja según el largo del
           testimonio. Con height:auto + align-items:stretch el flex las estira
           todas por igual, y el h-full de la figure las llena.
           (Ojo: nada de backticks en estos comentarios — están dentro de un
           template literal y lo cortarían.) */
        .reviews-swiper .swiper-wrapper { align-items: stretch; }
        .reviews-swiper .swiper-slide { height: auto; }

        /* Foco en la tarjeta central: las laterales quedan atenuadas.
           Solo opacity. Nada de transform acá: el efecto coverflow escribe su
           propio transform INLINE en cada slide, y competir con él desde la
           hoja de estilos no se aplica (gana el inline) y encima ensucia la
           transición del carrusel. La profundidad ya la da coverflow. */
        .reviews-swiper .swiper-slide {
          opacity: 0.45;
          transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reviews-swiper .swiper-slide-active { opacity: 1; }

        /* Quien pidió menos movimiento ve todas las tarjetas planas e iguales. */
        @media (prefers-reduced-motion: reduce) {
          .reviews-swiper .swiper-slide { opacity: 1; transition: none; }
        }
        .review-dot {
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #b0e2c8;
          cursor: pointer;
          transition: width 0.4s ease, background 0.4s ease;
        }
        .review-dot-active {
          width: 26px;
          background: #0b7a4b;
        }
      `}</style>
    </section>
  );
}
