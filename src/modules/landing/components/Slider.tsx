'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import { Role } from '@/modules/shared/types/api';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/**
 * HERO de la landing (Bloque LANDING §1).
 *
 * Cambios respecto de la versión anterior:
 *  - Carrusel manual (useState + setInterval + GSAP) → Swiper con autoplay y fade.
 *  - GSAP eliminado de este componente: las entradas de texto ahora las hace
 *    framer-motion, que ya se usa en el resto de la landing. Era el único
 *    archivo del proyecto que importaba gsap.
 *  - Se quitó `HeaderSearch` (el panel de filtros ya no vive en la landing, §8).
 *  - Dos CTAs; el secundario cambia según haya sesión iniciada o no.
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

  // CTA secundario según sesión: sin sesión invita a entrar; con sesión
  // lleva al panel que corresponde al rol (el admin no tiene /dashboard propio).
  const isAdmin = user?.role === Role.ADMIN;
  const secondaryCta = user
    ? {
        href: isAdmin ? '/dashboardAdmin' : '/dashboard',
        label: 'Ir a mi panel',
        Icon: LayoutDashboard,
      }
    : { href: '/login', label: 'Iniciar sesión', Icon: LogIn };

  return (
    <section className="relative min-h-160 w-full overflow-hidden bg-ink-950 md:min-h-180">
      <Swiper
        modules={[Autoplay, EffectFade, Navigation, Pagination]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={900}
        loop
        autoplay={{ delay: 5500, disableOnInteraction: false }}
        navigation={{ prevEl: '.hero-prev', nextEl: '.hero-next' }}
        pagination={{ el: '.hero-dots', clickable: true, bulletClass: 'hero-dot', bulletActiveClass: 'hero-dot-active' }}
        onSlideChange={(s) => setActive(s.realIndex)}
        className="absolute inset-0 h-full w-full"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={slide.id} className="relative h-full w-full">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            {/* Doble capa: oscurece parejo y refuerza abajo, para que el texto
                blanco tenga contraste suficiente sobre cualquier foto. */}
            <div className="absolute inset-0 bg-ink-950/55" />
            <div className="absolute inset-0 bg-linear-to-t from-ink-950/85 via-ink-950/25 to-ink-950/45" />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* ── CONTENIDO SUPERPUESTO ── */}
      <div className="pointer-events-none relative z-20 flex min-h-160 items-center justify-center px-6 md:min-h-180">
        <div className="w-full max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="pointer-events-auto inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.25em] text-white uppercase backdrop-blur-sm"
          >
            Inmobiliaria en Córdoba
          </motion.span>

          {/* key={active} re-dispara la animación en cada cambio de slide */}
          <motion.h1
            key={`t-${active}`}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.08 }}
            className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-5xl md:text-6xl"
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

          {/* ── CTAs ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
            className="pointer-events-auto mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/properties"
              style={{ background: 'var(--gradient-brand)' }}
              className="group flex w-full items-center justify-center gap-2.5 rounded-2xl px-9 py-4 text-base font-bold text-white shadow-[0_10px_30px_-8px_rgba(11,122,75,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-10px_rgba(11,122,75,0.85)] hover:brightness-110 active:scale-[0.98] sm:w-auto"
            >
              Ver propiedades
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            {/* Mientras hidrata la sesión no se muestra el secundario, para no
                mostrar "Iniciar sesión" y cambiarlo un instante después. */}
            {!isLoading && (
              <Link
                href={secondaryCta.href}
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-white/70 bg-white/10 px-9 py-4 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-brand-700 active:scale-[0.98] sm:w-auto"
              >
                <secondaryCta.Icon size={18} />
                {secondaryCta.label}
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── NAVEGACIÓN ── */}
      <button
        aria-label="Slide anterior"
        className="hero-prev absolute top-1/2 left-4 z-30 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-ink-950/30 text-white backdrop-blur-sm transition-all hover:bg-brand-700 md:flex"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        aria-label="Slide siguiente"
        className="hero-next absolute top-1/2 right-4 z-30 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-ink-950/30 text-white backdrop-blur-sm transition-all hover:bg-brand-700 md:flex"
      >
        <ChevronRight size={22} />
      </button>

      <div className="hero-dots absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-2" />

      {/* Estilos de los bullets de Swiper (clases custom pasadas arriba). */}
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
  );
};

export default PropertySlider;
