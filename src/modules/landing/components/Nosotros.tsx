"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function Nosotros() {
  const imagenes = [
    "/imagenesPapucho/papucho1.jpg",
    "/imagenesPapucho/papucho2.jpg",
    "/imagenesPapucho/papucho3.jpg",
    "/imagenesPapucho/papucho5.jpg",
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

  return (
    <section id="nosotros" className="py-24 bg-gray-50 flex flex-col items-center overflow-hidden">
      {/* Cabecera de Sección */}
      <div  className="text-center mb-16">
        <span className="text-sm tracking-[0.2em] uppercase text-[#0b7a4b] font-medium">Nuestra Historia</span>
        <h2  className="text-4xl md:text-5xl font-semibold mt-4 text-gray-900">Tu aliado en cada <span className="text-[#0b7a4b]">inversion</span></h2>
        <div className="w-28 h-0.5 bg-[#0b7a4b] mx-auto mt-8"></div>
      </div>

      {/* Tarjeta Principal Expansible 
          Ancho inicial: 450px (w-112.5) 
          Ancho expandido: 1100px para que el 1/3 vs 2/3 se vea prolijo */}
      <div  className="group relative duration-700 ease-in-out font-sans cursor-pointer bg-white w-112.5 h-137.5 rounded-3xl overflow-hidden hover:w-275 shadow-2xl border border-gray-100 flex transition-all">
        
        {/* LADO IZQUIERDO: Carrusel de Imágenes 
            Estado cerrado: Ocupa el 100% de la tarjeta (w-112.5)
            Estado hover: Se encoge a ~360px (aproximadamente 1/3 de 1100px) */}
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
                className="object-cover object-center grayscale-[15%] group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                sizes="(max-width: 1100px) 450px, 360px"
              />
            </div>
          ))}
          
          {/* Overlay Informativo (Solo en Hover) */}
          <div id="nosotros" className="absolute inset-0 bg-linear-to-t from-[#0b7a4b]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10">
            <h4 className="text-2xl font-bold text-white tracking-tight leading-none">
              Edgar Alberto Diaz
            </h4>
            <p className="text-white/90 text-sm font-medium mt-2">Martillero Público & Corredor Inmobiliario</p>
          </div>

          {/* Tag de "Conoceme" (Visible sin hover) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 group-hover:opacity-0 transition-opacity duration-300">
            <span className="bg-white backdrop-blur-md px-6 py-2 rounded-full text-[11px] font-bold tracking-[0.3em] text-[#0b7a4b] uppercase shadow-lg border border-gray-100">
              Conoceme
            </span>
          </div>
        </div>

        {/* LADO DERECHO: Biografía Profesional 
            Ocupa los 2/3 restantes con flex-1 */}
        <div className="flex flex-col justify-between py-12 px-16 flex-1 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-300 min-w-[600px]">
          
          {/* Bloque Superior: Título con personalidad */}
          <header className="relative">
            <div className="absolute -left-6 top-0 w-1.5 h-full bg-[#0b7a4b] rounded-full"></div>
            <h3 className="text-[#0b7a4b] text-4xl font-black leading-[1.1] tracking-tight">
              Uniendo familias <br /> 
              <span className="text-gray-900">con hogares.</span>
            </h3>
          </header>

          {/* Bloque Central: Biografía y Valores */}
          <div className="flex flex-col space-y-8 mt-4">
            <article className="space-y-5">
              <p className="text-lg text-gray-600 leading-relaxed">
                Me gradué como <strong className="text-gray-900 font-bold">Martillero Público en la Universidad <span className="text-[#0b7a4b]">Siglo 21</span> </strong>. Mi formación académica es la base sobre la que construyo una visión profundamente humana del mercado inmobiliario cordobés.
              </p>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Cuento con <strong className="text-gray-900 font-bold">7 años de trayectoria</strong> impecable, definiendo mi carrera a través de valores innegociables y una predisposición absoluta hacia mis clientes.
              </p>
            </article>

            {/* Cita Destacada */}
            <blockquote className="bg-gray-100 border-l-4 border-[#0b7a4b] p-6 rounded-r-xl">
              <p className="italic text-gray-700 text-lg font-medium leading-relaxed">
                "Mi objetivo es que te sientas escuchado, comprendido y, por sobre todo, seguro en tu inversión."
              </p>
            </blockquote>
          </div>

          {/* Bloque Inferior: Tags de Identidad */}
          <footer className="mt-auto pt-8 border-t border-gray-100">
            <div className="flex flex-wrap gap-3">
              {["Empatía", "Carácter", "Profesionalismo"].map((tag) => (
                <span 
                  key={tag} 
                  className="px-5 py-2 bg-gray-50 border border-gray-200 rounded-full text-[10px] font-bold text-[#0b7a4b] uppercase tracking-[0.15em] shadow-sm hover:border-[#0b7a4b] transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}