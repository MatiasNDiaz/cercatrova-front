'use client';

/* eslint-disable @next/next/no-img-element */
import { Star, Quote } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Pagination } from 'swiper/modules';
import { SectionHeading } from './SectionHeading';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

/**
 * Testimonios (Bloque LANDING §4).
 *
 * Se migró el carrusel circular 3D (que rotaba con `@keyframes rotating` 35s y
 * ~80 líneas de CSS inyectado con dangerouslySetInnerHTML) a Swiper con efecto
 * coverflow. El bloque <style> se eliminó por completo.
 *
 * Motivo además de estético: el carrusel viejo giraba en 3D de forma continua,
 * así que buena parte de las tarjetas estaba de espaldas o muy inclinada y el
 * texto quedaba ilegible durante la mayor parte del ciclo. Coverflow mantiene
 * siempre una tarjeta al frente, perfectamente legible.
 *
 * Los 10 testimonios siguen hardcodeados (no vienen del backend).
 */

const reviews = [
  { name: 'Carlos Gómez',  text: 'Excelente atención, vendieron mi casa en tiempo récord.', stars: 5 },
  { name: 'Lucía Pérez',   text: 'Muy profesionales. Me ayudaron con todo el papeleo legal.', stars: 4 },
  { name: 'Martín Sosa',   text: 'La mejor inmobiliaria de Córdoba, súper recomendados.', stars: 5 },
  { name: 'Elena Ruiz',    text: 'Encontré el departamento de mis sueños gracias a ellos.', stars: 5 },
  { name: 'Jorge Paz',     text: 'Tasación justa y proceso transparente. Muy conforme.', stars: 4 },
  { name: 'Sofía Milán',   text: 'Atención personalizada y muy amable por parte del agente.', stars: 5 },
  { name: 'Raúl Castro',   text: 'Gran variedad de propiedades y filtros muy útiles.', stars: 5 },
  { name: 'Ana Clara',     text: 'El sistema de notificaciones me avisó justo cuando entró la casa.', stars: 4 },
  { name: 'Pedro Luis',    text: 'Muy serios y responsables en el manejo documental.', stars: 5 },
  { name: 'Valeria Domínguez', text: 'Me encantó la sección de favoritos, muy práctica.', stars: 5 },
];

export default function Resenas() {
  return (
    <section id="reseñas" className="overflow-hidden bg-white py-24 md:py-28">
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
        pagination={{ el: '.reviews-dots', clickable: true, bulletClass: 'review-dot', bulletActiveClass: 'review-dot-active' }}
        className="px-6! pb-4!"
      >
        {reviews.map((review, index) => (
          <SwiperSlide key={review.name} className="w-80! py-6 sm:w-90!">
            <figure className="flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-7 shadow-[0_8px_30px_-12px_rgba(10,12,11,0.15)] transition-shadow duration-300 hover:shadow-[0_20px_45px_-18px_rgba(11,122,75,0.35)]">
              <Quote size={26} className="shrink-0 text-brand-200" strokeWidth={2.5} />

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

              <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-5">
                <img
                  src={`https://i.pravatar.cc/120?u=${index + 20}`}
                  alt={review.name}
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-brand-100"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-900">{review.name}</p>
                  <p className="text-xs text-ink-400">Cliente verificado</p>
                </div>
              </figcaption>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="reviews-dots mt-6 flex justify-center gap-2" />

      {/* Estilos de los bullets (clases custom pasadas a la paginación de Swiper). */}
      <style>{`
        .review-dot {
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #d1d5d2;
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
