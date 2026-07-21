'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Award, ShieldCheck, HeartHandshake } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';

/**
 * Presentación del agente (Bloque LANDING §5).
 *
 * ⚠️ El efecto de deslizamiento en hover (la tarjeta angosta que se expande y
 * revela la biografía) SE CONSERVA a pedido — es la interacción que define esta
 * sección. Solo se modernizó alrededor:
 *  - curva de easing más suave y duración pareja entre ancho y contenido;
 *  - los tags pasaron a tener ícono real en vez del <span> vacío que había
 *    (quedaba un hueco con `opacity-0` que no mostraba nada nunca);
 *  - tipografía y colores migrados a los tokens (`brand-*` / `ink-*`);
 *  - las fotos son las mismas de siempre (`/imagenesPapucho/*`).
 */

const imagenes = [
  '/imagenesPapucho/papucho1.jpg',
  '/imagenesPapucho/papucho2.jpg',
  '/imagenesPapucho/papucho3.jpg',
  '/imagenesPapucho/papucho5.jpg',
  '/imagenesPapucho/papucho9.jpg',
  '/imagenesPapucho/papucho6.jpg',
  '/imagenesPapucho/papucho7.jpg',
  '/imagenesPapucho/papucho8.jpg',
];

const tags = [
  { label: 'Empatía', Icon: HeartHandshake },
  { label: 'Carácter', Icon: Award },
  { label: 'Profesionalismo', Icon: ShieldCheck },
  { label: 'Cercania', Icon: ShieldCheck },
];

export default function Nosotros() {
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % imagenes.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="nosotros" className="overflow-hidden bg-white py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Nuestra historia"
          title={<>Tu aliado en cada <span className="text-brand-700">inversión</span></>}
          subtitle="Pasá el cursor sobre la tarjeta para conocer a quien te acompaña."
        />

        <Reveal>
          <div className="flex justify-center">
            {/* ── TARJETA EXPANSIBLE (efecto conservado) ── */}
            <div className="group relative flex h-[550px] w-full max-w-[450px] cursor-pointer overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_-20px_rgba(10,12,11,0.35)] ring-1 ring-ink-100 transition-[max-width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hover:max-w-[1100px]">

              {/* ── LADO IZQUIERDO: carrusel de fotos ── */}
              <div className="relative h-full w-full shrink-0 overflow-hidden transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:w-[450px] lg:group-hover:w-[380px]">
                {imagenes.map((img, index) => (
                  <div
                    key={img}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === currentImg ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Edgar Díaz — foto ${index + 1}`}
                      fill
                      priority={index === 0}
                      sizes="450px"
                      className="scale-105 object-cover object-center grayscale-[15%] transition-all duration-700 group-hover:scale-100 group-hover:grayscale-0"
                    />
                  </div>
                ))}

                {/* Nombre — visible en hover */}
                <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-brand-950/90 via-transparent to-transparent p-8 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <h4 className="text-2xl font-bold leading-tight tracking-tight text-white">
                    Edgar Alberto Díaz
                  </h4>
                  <p className="mt-1.5 text-sm font-medium text-white/90">
                    Martillero Público &amp; Corredor Inmobiliario
                  </p>
                </div>

                {/* Pista "Conoceme" — se va en hover */}
                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 transition-opacity duration-300 group-hover:opacity-0">
                  <span className="rounded-full border border-ink-100 bg-white px-6 py-2.5 text-[11px] font-bold tracking-[0.28em] text-brand-700 uppercase shadow-lg">
                    Conoceme
                  </span>
                </div>
              </div>

              {/* ── LADO DERECHO: biografía ── */}
              <div className="hidden min-w-[620px] flex-col justify-center gap-7 px-14 py-12 opacity-0 transition-opacity duration-500 delay-200 group-hover:opacity-100 lg:flex">
                <header className="relative">
                  <span className="absolute -left-6 top-0 h-full w-1.5 rounded-full bg-brand-700" />
                  <h3 className="text-4xl font-black leading-[1.1] tracking-tight text-brand-700">
                    Uniendo familias
                    <br />
                    <span className="text-ink-900">con hogares.</span>
                  </h3>
                </header>

                <div className="space-y-4">
                  <p className="text-[17px] leading-relaxed text-ink-600">
                    Soy <strong className="font-bold text-ink-900">Edgar Díaz</strong>, Martillero
                    Público y Corredor Inmobiliario graduado en la Universidad{' '}
                    <span className="font-bold text-brand-700">Siglo 21</span>. Elegí esta profesión
                    porque detrás de cada operación hay una historia de vida, y eso merece el máximo
                    compromiso.
                  </p>
                  <p className="text-[17px] leading-relaxed text-ink-600">
                    Con <strong className="font-bold text-ink-900">más de 7 años en el mercado
                    cordobés</strong>, acompañé a cientos de familias e inversores a tomar decisiones
                    seguras, transparentes y con resultados reales.
                  </p>
                </div>

                <blockquote className="relative overflow-hidden rounded-r-2xl border-l-4 border-brand-700 bg-surface p-6">
                  <span className="pointer-events-none absolute -top-4 -left-1 font-serif text-[110px] leading-none text-brand-700/10 select-none">
                    &ldquo;
                  </span>
                  <p className="relative text-lg font-semibold italic leading-relaxed text-ink-700">
                    Tu tranquilidad es mi trabajo.
                  </p>
                </blockquote>

                <div className="flex flex-wrap gap-3 border-t border-ink-100 pt-6">
                  {tags.map(({ label, Icon }) => (
                    <span
                      key={label}
                      className="flex cursor-default items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2 text-[11px] font-bold tracking-[0.14em] text-brand-700 uppercase transition-all duration-300 select-none hover:-translate-y-0.5 hover:border-brand-700 hover:bg-brand-700 hover:text-white hover:shadow-[0_6px_16px_-4px_rgba(11,122,75,0.45)]"
                    >
                      <Icon size={13} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
