'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, GraduationCap, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import { Role } from '@/modules/shared/types/api';
import { CtaButton } from './CtaButton';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/**
 * HERO de la landing (Bloque LANDING §1, §2, §3).
 *
 * ⚠️ FIX DE ALTURA (bug reportado: "Image has fill and a height value of 0"):
 * antes el `<Swiper>` iba `absolute inset-0` y los slides confiaban en el CSS
 * propio de Swiper para heredar altura. Eso dejaba `.swiper-slide` en 0px, así
 * que `<Image fill>` no tenía contenedor con alto y no se renderizaba.
 *
 * Ahora la altura se propaga explícitamente en TODA la cadena:
 *   section (altura fija h-160/h-180)
 *     → Swiper           h-full
 *       → .swiper-wrapper h-full  (selector arbitrario)
 *         → .swiper-slide h-full  (selector arbitrario)
 *           → contenedor de <Image fill>  (relative + h-full)
 * El Swiper ya no es `absolute`: participa del flujo y toma el alto real de la
 * sección. El texto es el que pasa a estar superpuesto en `absolute`.
 */

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2400&auto=format&fit=crop',
    title: 'Encontrá el lugar donde empieza tu historia',
    description:
      'Casas y departamentos seleccionados en Córdoba, con el acompañamiento de un martillero matriculado en cada paso.',
  },
  {
    id: 2,
    // Fachada de departamentos: acompaña el mensaje urbano de Nueva Córdoba.
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2400&auto=format&fit=crop',
    title: 'Viví donde todo sucede',
    description:
      'Nueva Córdoba te conecta con shoppings, gastronomía, universidades y espacios verdes en minutos.',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2400&auto=format&fit=crop',
    title: 'Espacios para crecer en familia',
    description:
      'Departamentos amplios y funcionales en las ubicaciones más estratégicas de la ciudad.',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2400&auto=format&fit=crop',
    title: 'Invertí con visión de futuro',
    description:
      'Propiedades con alta demanda y excelente proyección de valor en Córdoba capital.',
  },
];

export const PropertySlider = () => {
  const { user, isLoading } = useAuth();
  const [active, setActive] = useState(0);

  const isAdmin = user?.role === Role.ADMIN;
  const secondaryCta = user
    ? {
        href: isAdmin ? '/dashboardAdmin' : '/dashboard',
        label: 'Ir a mi panel',
        Icon: LayoutDashboard,
      }
    : { href: '/login', label: 'Iniciar sesión', Icon: LogIn };

  return (
    <>
      <section className="relative h-160 w-full overflow-hidden bg-ink-950 md:h-180">
        {/* Capa base: el carrusel ocupa el alto real de la sección. */}
        <Swiper
          modules={[Autoplay, EffectFade, Navigation, Pagination]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={900}
          loop
          autoplay={{ delay: 5500, disableOnInteraction: false }}
          navigation={{ prevEl: '.hero-prev', nextEl: '.hero-next' }}
          pagination={{
            el: '.hero-dots',
            clickable: true,
            bulletClass: 'hero-dot',
            bulletActiveClass: 'hero-dot-active',
          }}
          onSlideChange={(s) => setActive(s.realIndex)}
          className="h-full w-full [&_.swiper-slide]:h-full [&_.swiper-wrapper]:h-full"
        >
          {slides.map((slide, i) => (
            <SwiperSlide key={slide.id}>
              <div className="relative h-full w-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
                {/* Doble capa: oscurece parejo y refuerza abajo, para que el
                    texto blanco tenga contraste sobre cualquier foto. */}
                <div className="absolute inset-0 bg-ink-950/25" />
                <div className="absolute inset-0 bg-linear-to-t from-ink-950/85 via-ink-950/25 to-ink-950/45" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ── CONTENIDO SUPERPUESTO ── */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
          <div className="w-full max-w-4xl text-center">
            

            {/* Altura mínima fija: el texto de cada slide tiene distinto largo,
                y sin esto los botones "saltaban" de posición en cada cambio. */}
            <div className="mt-7 flex min-h-64 flex-col md:min-h-68">
              {/* key={active} re-dispara la animación en cada cambio de slide */}
              <motion.h1
                key={`t-${active}`}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: 'easeOut', delay: 0.08 }}
                className="text-4xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-5xl md:text-6xl"
              >
                {slides[active].title}
              </motion.h1>

              <motion.p
                key={`d-${active}`}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: 'easeOut', delay: 0.18 }}
                className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-lg"
              >
                {slides[active].description}
              </motion.p>
            </div>

            {/* ── CTAs — posición fija gracias al min-h de arriba ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
              className="pointer-events-auto flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <CtaButton
                href="/properties"
                variant="primary"
                icon={<ArrowRight size={18} className="transition-transform duration-300 group-hover/cta:translate-x-1" />}
                className="w-full sm:w-auto"
              >
                Ver propiedades
              </CtaButton>

              {/* Mientras hidrata la sesión no se muestra, para no mostrar
                  "Iniciar sesión" y cambiarlo un instante después. */}
              {!isLoading && (
                <CtaButton
                  href={secondaryCta.href}
                  variant="outlineLight"
                  icon={<secondaryCta.Icon size={18} />}
                  className="w-full sm:w-auto"
                >
                  {secondaryCta.label}
                </CtaButton>
              )}
            </motion.div>
          </div>
        </div>

        {/* ── NAVEGACIÓN ── */}
        <button
          aria-label="Slide anterior"
          className="hero-prev absolute top-1/2 left-4 z-30 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-ink-950/35 text-white backdrop-blur-sm transition-all hover:bg-brand-700 md:flex"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          aria-label="Slide siguiente"
          className="hero-next absolute top-1/2 right-4 z-30 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-ink-950/35 text-white backdrop-blur-sm transition-all hover:bg-brand-700 md:flex"
        >
          <ChevronRight size={22} />
        </button>

        <div className="hero-dots absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-2" />

        <style>{`
          .hero-dot {
            display: block;
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.45);
            cursor: pointer;
            transition: width 0.4s ease, background 0.4s ease;
          }
          .hero-dot-active {
            width: 30px;
            background: #14a366;
          }
        `}</style>
      </section>

      <EstudiantesBand />
    </>
  );
};

/**
 * Franja de estudiantes (Bloque LANDING §2).
 *
 * Se eligió una franja debajo del carrusel en vez de un 5º slide: como slide
 * habría aparecido solo 1 de cada 5 rotaciones (y el mensaje se perdería), y
 * habría competido con el CTA principal del hero. Como franja fija está siempre
 * visible y funciona como transición del hero oscuro al resto de la página.
 *
 * El CTA apunta a /properties con la búsqueda ya cargada en "Nueva Córdoba",
 * el barrio de la ciudad universitaria. Se usa el mismo query param `search`
 * que lee `usePropertyFilters`, así que el catálogo abre ya filtrado.
 */
function EstudiantesBand() {
  return (
    <section className="mt-14 surface-brand-deep relative overflow-hidden py-16 md:py-20">
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 lg:flex-row lg:gap-16">
        {/* Imagen */}
        <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] sm:h-64 lg:h-72 lg:w-[42%]">
          <Image
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1400&auto=format&fit=crop"
            alt="Estudiantes estudiando juntos en un departamento luminoso"
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover"
          />
        </div>

        {/* Texto */}
        <div className="flex-1  text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.22em] text-white uppercase backdrop-blur-sm">
            <GraduationCap size={14} />
            Vida universitaria
          </span>

          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
            ¿Venís a estudiar a Córdoba?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80 lg:mx-0 md:text-lg">
            Consultanos por nuestros departamentos cerca de la Ciudad Universitaria:
            monoambientes y unidades compartidas, listas para mudarte y a minutos de las facultades.
          </p>

          <div className="mt-8 flex justify-center lg:justify-start">
            <CtaButton
              href="/properties?search=Nueva+C%C3%B3rdoba"
              variant="outlineLight"
              icon={<ArrowRight size={18} className="transition-transform duration-300 group-hover/cta:translate-x-1" />}
            >
              Ver departamentos en zona universitaria
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PropertySlider;
