'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import Image from 'next/image';
import { HeaderSearch } from '@/modules/properties/components/HeaderSearch';

const slides = [
  {
    id: 1,
    image: 'https://images3.alphacoders.com/591/thumb-1920-591439.jpg',
    title: 'Viví donde todo sucede',
    description: 'Nueva Córdoba te conecta con shoppings, gastronomía, universidades y espacios verdes en minutos.',
  },
  {
    id: 2,
    image: '/estudiante.jpg',
    title: 'Tu nueva etapa empieza acá',
    description: 'Si venís a estudiar a Córdoba, te ayudamos a encontrár un espacio cómodo, seguro y cerca de todo.',
  },
  {
    id: 3,
    image: '/adolecenteIndependizado.png',
    title: 'Dá el paso hacia tu independencia',
    description: 'Opciones pensadas para que empieces a vivir por tu cuenta con respaldo y tranquilidad.',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=2400',
    title: 'Espacios para crecer en familia',
    description: 'Departamentos amplios y funcionales en ubicaciones estratégicas de la ciudad.',
  },
  {
    id: 5,
    image: '/chicaMudandose.jpg',
    title: 'Invertí con visión de futuro',
    description: 'Propiedades con alta demanda y excelente proyección en córdoba capital.',
  },
];


export const PropertySlider = () => {
  const [index, setIndex] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(nextSlide, 4500);
  };

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % slides.length);
    resetTimer();
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
    resetTimer();
  };

  useEffect(() => {
    timerRef.current = setInterval(nextSlide, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (slideRef.current && titleRef.current && descRef.current) {
      const tl = gsap.timeline();
      tl.fromTo(slideRef.current, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' });
      tl.fromTo([titleRef.current, descRef.current], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out' }, '<');
    }
  }, [index]);

  return (
    <div className="relative w-full h-175 bg-gray-900 overflow-hidden">
      <div ref={slideRef} className="absolute inset-0 w-full h-full">
        <Image
          src={slides[index].image}
          alt={slides[index].title}
          fill
          style={{ objectFit: 'cover', objectPosition: 'top' }}
          priority
        />
      </div>
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
        <h2 ref={titleRef}  className="text-3xl md:text-5xl font-bold drop-shadow-2xl mb-4 text-center text-s [text-shadow:2px_2px_8px_rgba(0,0,0,1)]">
          {slides[index].title}
        </h2>
        <p ref={descRef} className="text-lg md:text-xl max-w-6xl drop-shadow-2xl text-center mb-37.5  [text-shadow:2px_2px_8px_rgba(0,0,0,1)]">
          {slides[index].description}
        </p>
      </div>

      {/* Buscador */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="w-full max-w-4xl px-4 pointer-events-auto mt-10">
          <HeaderSearch onToggleFilters={() => {}} />
        </div>
      </div>

      {/* Navegación */}
      <button aria-label='a' onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm transition-all">
        <ChevronLeft size={30} />
      </button>
      <button aria-label='a' onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm transition-all">
        <ChevronRight size={30} />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, i) => (
          <button aria-label='a' key={i} onClick={() => setIndex(i)} className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-[#0b7a4b]' : 'w-2 bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
};

export default PropertySlider;
