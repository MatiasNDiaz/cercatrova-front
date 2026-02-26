"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function Nosotros() {
  const imagenes = [
    "/imagenesPapucho/papucho1.jpg",
    "/imagenesPapucho/papucho2.jpg",
    "/imagenesPapucho/papucho3.jpg",
    "/imagenesPapucho/papucho5.jpg",
    "/imagenesPapucho/papucho9.jpg",
    "/imagenesPapucho/papucho6.jpg",
    "/imagenesPapucho/papucho7.jpg",
    "/imagenesPapucho/papucho8.jpg",
  ];

  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % imagenes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [imagenes.length]);

  const tags = [
    { label: "Empatía",          emoji: "🤝" },
    { label: "Carácter",         emoji: "💪" },
    { label: "Profesionalismo",  emoji: "🏆" },
  ];

  return (
    <section id="nosotros" className="py-20 bg-gray-50 flex flex-col items-center overflow-hidden">

      {/* ── CABECERA ── */}
      <div className="text-center mb-12">
        <span className="text-sm tracking-[0.2em] uppercase text-[#0b7a4b] font-medium">
          Nuestra Historia
        </span>
        <h2 className="text-4xl md:text-5xl font-semibold mt-3 text-gray-900">
          Tu aliado en cada <span className="text-[#0b7a4b]">inversión</span>
        </h2>
        <div className="w-28 h-0.5 bg-[#0b7a4b] mx-auto mt-8" />
      </div>

      {/* ── TARJETA EXPANSIBLE ── */}
      <div className="group relative duration-700 ease-in-out font-sans cursor-pointer bg-white w-112.5 h-137.5 rounded-3xl overflow-hidden hover:w-275 shadow-2xl border border-gray-100 flex transition-all">

        {/* ── LADO IZQUIERDO: Carrusel ── */}
        <div className="relative w-112.5 group-hover:w-90 h-full overflow-hidden transition-all duration-700 ease-in-out shrink-0">
          {imagenes.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentImg ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={img}
                alt={`Edgar Diaz - Foto ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover object-center grayscale-15 group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                sizes="(max-width: 1100px) 450px, 360px"
              />
            </div>
          ))}

          {/* Overlay en hover */}
          <div className="absolute inset-0 bg-linear-to-t from-[#044327]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10">
            <h4 className="text-2xl font-bold text-white tracking-tight leading-none">
              Edgar Alberto Díaz
            </h4>
            <p className="text-white/90 text-sm font-medium mt-2">
              Martillero Público & Corredor Inmobiliario
            </p>
          </div>

          {/* Tag "Conoceme" sin hover */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 group-hover:opacity-0 transition-opacity duration-300">
            <span className="bg-white backdrop-blur-md px-6 py-2 rounded-full text-[11px] font-bold tracking-[0.3em] text-[#0b7a4b] uppercase shadow-lg border border-gray-100">
              Conoceme
            </span>
          </div>
        </div>

        {/* ── LADO DERECHO: Biografía ── */}
        <div className="flex flex-col justify-between py-12 px-16 flex-1 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-300 min-w-150">

          {/* Título */}
          <header className="relative">
            <div className="absolute -left-6 top-0 w-1.5 h-full bg-[#0b7a4b] rounded-full" />
            <h3 className="text-[#0b7a4b] text-4xl font-black leading-[1.1] tracking-tight">
              Uniendo familias <br />
              <span className="text-gray-900">con hogares.</span>
            </h3>
          </header>

          {/* Texto */}
          <div className="flex flex-col space-y-8 mt-6">
            <article className="space-y-5">
              <p className="text-lg text-gray-600 leading-relaxed">
                Soy <strong className="text-gray-900 font-bold">Edgar Díaz</strong>, Martillero Público
                y Corredor Inmobiliario graduado en la Universidad{" "}
                <span className="text-[#0b7a4b] font-bold">Siglo 21</span>. Elegí esta profesión
                porque creo que detrás de cada operación hay una historia de vida, y eso merece
                el máximo compromiso.
              </p>

              <p className="text-lg text-gray-600 leading-relaxed">
                Con <strong className="text-gray-900 font-bold">más de 7 años en el mercado cordobés</strong>,
                acompañé a cientos de familias e inversores a tomar decisiones seguras,
                transparentes y con resultados reales.
              </p>
            </article>

            {/* Cita — corta y contundente */}
            <blockquote className="relative bg-gray-100 border-l-4 border-[#0b7a4b] p-6 rounded-r-xl overflow-hidden">
              {/* Comilla decorativa de fondo */}
              <span className="absolute -top-3 -left-1 text-[120px] leading-none text-[#0b7a4b]/10 font-serif select-none">
                &quot;
              </span>
              <p className="relative italic text-gray-700 text-lg font-semibold leading-relaxed">
                Tu tranquilidad es mi trabajo.
              </p>
            </blockquote>
          </div>

          {/* Tags con hover mejorado */}
          <footer className="mt-auto pt-8 border-t border-gray-100">
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span
                  key={tag.label}
                  className="
                    group/tag flex items-center gap-1.5
                    px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.15em]
                    bg-gray-50 border border-gray-200 text-[#0b7a4b]
                    shadow-sm cursor-default select-none
                    hover:bg-[#0b7a4b] hover:text-white hover:border-[#0b7a4b]
                    hover:shadow-[0_4px_14px_rgba(11,122,75,0.3)]
                    hover:scale-105
                    transition-all duration-300
                  "
                >
                  <span className="opacity-0 group-hover/tag:opacity-100 transition-opacity duration-300 text-sm">
                  </span>
                  {tag.label}
                </span>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}