"use client";

import React, { useState } from 'react';
import { ChevronDown, Key, BadgeDollarSign, Home, FileText, Gavel, MapPin, Calculator, Plus, Minus } from 'lucide-react';

const faqData = [
  {
    question: "¿Cuáles son los requisitos para alquilar en Córdoba?",
    answer: "Para alquilar solicitamos: 1) Garantía propietaria de la provincia de Córdoba (o de otra provincia sujeta a revisión). 2) Dos o tres recibos de sueldo que tripliquen el valor del alquiler. También aceptamos seguros de caución como Alucerto o Finaer.",
    icon: <Key size={20} />
  },
  {
    question: "¿Qué gastos tengo al momento de comprar una propiedad?",
    answer: "Debés considerar: Honorarios profesionales (Ley 9445), gastos de escrituración (Escribanía), impuesto a los sellos y aportes registrales. Aproximadamente entre un 7% y 9% adicional al valor de compra.",
    icon: <BadgeDollarSign size={20} />
  },
  {
    question: "¿Cómo es el proceso de tasación de mi inmueble?",
    answer: "Realizamos una visita técnica para evaluar estado y entorno. Luego, aplicamos un Análisis Comparativo de Mercado (ACM) con datos actuales de Córdoba para determinar el valor real de mercado.",
    icon: <Calculator size={20} />
  },
  {
    question: "¿Qué documentación necesito para poner en venta mi casa?",
    answer: "Necesitás: Escritura original, plano de mensura actualizado, DNI de los titulares, y libre deuda de impuestos (Rentas y Municipalidad).",
    icon: <FileText size={20} />
  },
  {
    question: "¿Es seguro invertir en pozo o preventa hoy?",
    answer: "Sí, con desarrollistas de trayectoria. En Córdoba, permite dolarizar ahorros y obtener una capitalización de entre el 20% y 30%. Filtramos solo proyectos con respaldo jurídico.",
    icon: <Home size={20} />
  },
  {
    question: "¿Ustedes gestionan el cobro de alquileres?",
    answer: "Exacto. Ofrecemos Administración Integral: cobranza, pago de impuestos, control de expensas y resolución de problemas técnicos para que el propietario no tenga preocupaciones.",
    icon: <MapPin size={20} />
  },
  {
    question: "¿Qué hace un Martillero Público por mi seguridad?",
    answer: "Un Martillero matriculado (Ley 9445) garantiza que la operación sea legal y ética. Verificamos la situación dominial y la inhibición de vendedores para proteger tu inversión.",
    icon: <Gavel size={20} />
  }
];

const RealEstateFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);

  return (
    <section className="py-20 px-4 max-w-4xl mx-auto font-sans overflow-hidden">
      <div className="text-center mb-16">
        <span className="text-sm tracking-[0.2em] uppercase text-[#0b7a4b] font-medium">preguntas frecuentes</span>
        <h2 id="faq" className="text-4xl md:text-5xl font-semibold mt-4 text-gray-900">Aclaramos tus dudas </h2>
        <div className="w-28 h-0.5 bg-[#0b7a4b] mx-auto mt-8"></div>
      </div>

      <div className="space-y-5">
        {faqData.map((item, index) => {
          const isOpen = openIndex === index;
          // Lógica de visibilidad suave
          const isVisible = showAll || index < 4;

          return (
            <div 
              key={index}
              className={`border border-gray-100 rounded-[28px] bg-white transition-all duration-700 ease-in-out ${
                isVisible 
                  ? 'opacity-100 translate-y-0 h-auto visible' 
                  : 'opacity-0 translate-y-10 h-0 overflow-hidden invisible absolute'
              } ${
                isOpen ? 'shadow-xl ring-1 ring-[#0b7a4b]/20' : 'shadow-sm hover:shadow-md hover:border-[#0b7a4b]/30'
              }`}
              style={{ transitionDelay: isVisible ? `${(index % 4) * 100}ms` : '0ms' }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-7 focus:outline-none"
              >
                <div className="flex items-center gap-5 text-left">
                  <div className={`p-3 rounded-2xl transition-all duration-300 ${
                    isOpen ? 'bg-[#0b7a4b] text-white' : 'bg-[#0b7a4b]/10 text-[#0b7a4b] group-hover:bg-[#0b7a4b] group-hover:text-white'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`text-lg font-bold transition-colors duration-300 ${
                    isOpen ? 'text-[#0b7a4b]' : 'text-[#042f2e]'
                  }`}>
                    {item.question}
                  </span>
                </div>
                <div className={`p-1.5 rounded-full transition-all duration-500 ${
                    isOpen ? 'bg-[#0b7a4b] text-white rotate-180' : 'bg-gray-100 text-gray-400 group-hover:text-[#0b7a4b]'
                }`}>
                    <ChevronDown size={18} />
                </div>
              </button>
              
              <div 
                className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
                  isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-8 pt-0 ml-[76px] text-[#4b5563]">
                  <p className="bg-gray-50/80 p-6 rounded-2xl border-l-4 border-[#0b7a4b] text-base leading-relaxed font-medium">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => {
            if (showAll) {
                setOpenIndex(null);
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
            }
            setShowAll(!showAll);
          }}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-[#0b7a4b] text-[#0b7a4b] font-bold rounded-full hover:bg-[#0b7a4b] hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95"
        >
          {showAll ? (
            <>Ver menos preguntas <Minus size={18} /></>
          ) : (
            <>Ver más preguntas <Plus size={18} /></>
          )}
        </button>
      </div>
    </section>
  );
};

export default RealEstateFAQ;