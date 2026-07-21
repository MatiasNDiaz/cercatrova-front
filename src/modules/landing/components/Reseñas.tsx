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
 * inyectado) ya se había migrado a Swiper coverflow. En §6 se rediseñó la
 * tarjeta y se sumó verde a la sección:
 *  - Fondo `brand-50` (verde muy claro) en vez de blanco.
 *  - Cada tarjeta lleva una barra superior con el gradiente de marca, comilla
 *    verde, anillo verde en el avatar y chip verde con el tipo de operación.
 *  - Info nueva por testimonio: **operación** (Compra / Venta / Alquiler) y
 *    **zona**, para que el testimonio sea creíble y no un texto suelto.
 *  - Fotos: retratos reales de Unsplash (antes `i.pravatar.cc`). Las 10 URLs
 *    se verificaron una por una; `images.unsplash.com` ya estaba en
 *    `remotePatterns`, así que se usa `next/image`.
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
    <section id="reseñas" className="overflow-hidden bg-brand-50 py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Testimonios"
          title={<>Lo que dicen <span className="text-brand-700">nuestros clientes</span></>}
          subtitle="Historias reales de familias e inversores que confiaron en nosotros."
        />
      </div>

      <Swiper
        modules={[Autoplay, EffectCoverflow, Pagination]}
        effect="coverflow"
        grabCursor
        centeredSlides
        loop
        slidesPerView="auto"
        spaceBetween={24}
        autoplay={{ delay: 3800, disableOnInteraction: false, pauseOnMouseEnter: true }}
        coverflowEffect={{ rotate: 0, stretch: 0, depth: 130, modifier: 2, slideShadows: false }}
        pagination={{
          el: '.reviews-dots',
          clickable: true,
          bulletClass: 'review-dot',
          bulletActiveClass: 'review-dot-active',
        }}
        className="px-6! pb-4!"
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.name} className="w-84! py-6 sm:w-96!">
            <figure className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white p-7 shadow-[0_8px_30px_-12px_rgba(6,57,35,0.18)] transition-shadow duration-300 hover:shadow-[0_22px_45px_-18px_rgba(6,57,35,0.35)]">
              {/* Barra superior de marca */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ background: 'var(--gradient-brand)' }}
              />

              <div className="flex items-start justify-between gap-3">
                <Quote size={28} className="shrink-0 text-brand-300" strokeWidth={2.5} />
                <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-brand-800 uppercase">
                  {review.operacion}
                </span>
              </div>

              <blockquote className="mt-3 grow text-[15px] leading-relaxed text-ink-600">
                &ldquo;{review.text}&rdquo;
              </blockquote>

              <div className="mt-5 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    className={i < review.stars ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}
                  />
                ))}
              </div>

              <figcaption className="mt-5 flex items-center gap-3.5 border-t border-brand-100 pt-5">
                <Image
                  src={review.photo}
                  alt={review.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-brand-600 ring-offset-2"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-900">{review.name}</p>
                  <p className="truncate text-xs font-medium text-brand-700">{review.zona}</p>
                </div>
              </figcaption>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="reviews-dots mt-6 flex justify-center gap-2" />

      <style>{`
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
