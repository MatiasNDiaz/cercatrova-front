'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Key, BadgeDollarSign, Home, FileText, Gavel, MapPin, Calculator,
  Plus, Minus, ChevronDown,
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';

/**
 * Preguntas frecuentes (Bloque LANDING §7).
 *
 * Mejoras sobre la versión anterior:
 *  - La apertura usa `AnimatePresence` + `height: auto` de framer-motion. Antes
 *    era `max-h-125` fijo, que además de animar con una curva rara recortaba
 *    cualquier respuesta que superara ese alto.
 *  - Las tarjetas ocultas ya no se renderizan con `absolute`/`invisible`
 *    (quedaban en el DOM y podían superponerse); ahora simplemente no se montan.
 *  - Chevron que rota + ícono que cambia de fondo al abrir.
 *
 * ⚠️ Corrección de contenido pedida: la ley de martilleros y corredores de
 * Córdoba es la **7191**, no la 9445 (que figuraba en 2 respuestas).
 */

const faqData = [
  {
    question: '¿Cuáles son los requisitos para alquilar en Córdoba?',
    answer:
      'Para alquilar solicitamos: 1) Garantía propietaria de la provincia de Córdoba (o de otra provincia sujeta a revisión). 2) Dos o tres recibos de sueldo que tripliquen el valor del alquiler. También aceptamos seguros de caución como Alucerto o Finaer.',
    Icon: Key,
  },
  {
    question: '¿Qué gastos tengo al momento de comprar una propiedad?',
    answer:
      'Debés considerar: honorarios profesionales (Ley 7191), gastos de escrituración (escribanía), impuesto a los sellos y aportes registrales. Aproximadamente entre un 7% y 9% adicional al valor de compra.',
    Icon: BadgeDollarSign,
  },
  {
    question: '¿Cómo es el proceso de tasación de mi inmueble?',
    answer:
      'Realizamos una visita técnica para evaluar estado y entorno. Luego aplicamos un Análisis Comparativo de Mercado (ACM) con datos actuales de Córdoba para determinar el valor real de mercado.',
    Icon: Calculator,
  },
  {
    question: '¿Qué documentación necesito para poner en venta mi casa?',
    answer:
      'Necesitás: escritura original, plano de mensura actualizado, DNI de los titulares y libre deuda de impuestos (Rentas y Municipalidad).',
    Icon: FileText,
  },
  {
    question: '¿Es seguro invertir en pozo o preventa hoy?',
    answer:
      'Sí, con desarrollistas de trayectoria. En Córdoba permite dolarizar ahorros y obtener una capitalización de entre el 20% y 30%. Filtramos solo proyectos con respaldo jurídico.',
    Icon: Home,
  },
  {
    question: '¿Ustedes gestionan el cobro de alquileres?',
    answer:
      'Exacto. Ofrecemos administración integral: cobranza, pago de impuestos, control de expensas y resolución de problemas técnicos, para que el propietario no tenga preocupaciones.',
    Icon: MapPin,
  },
  {
    question: '¿Qué hace un Martillero Público por mi seguridad?',
    answer:
      'Un martillero matriculado (Ley 7191) garantiza que la operación sea legal y ética. Verificamos la situación dominial y la inhibición de vendedores para proteger tu inversión.',
    Icon: Gavel,
  },
];

const INITIAL_VISIBLE = 4;

export default function RealEstateFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? faqData : faqData.slice(0, INITIAL_VISIBLE);

  return (
    <section id="faq" className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          title={<>Aclaramos <span className="text-brand-700">tus dudas</span></>}
          subtitle="Lo que más nos consultan antes de comprar, vender o alquilar."
        />

        <div className="flex flex-col gap-4">
          {visible.map((item, index) => {
            const isOpen = openIndex === index;
            const Icon = item.Icon;

            return (
              <Reveal key={item.question} delay={Math.min(index, 3) * 0.06}>
                <div
                  className={`overflow-hidden rounded-3xl border bg-white transition-all duration-300 ${
                    isOpen
                      ? 'border-brand-700/30 shadow-[0_16px_40px_-16px_rgba(11,122,75,0.3)]'
                      : 'border-ink-100 hover:border-brand-700/25 hover:shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-center gap-4 p-6 text-left"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
                        isOpen ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      <Icon size={19} />
                    </span>

                    <span
                      className={`flex-1 text-base font-bold transition-colors duration-300 md:text-lg ${
                        isOpen ? 'text-brand-700' : 'text-ink-900'
                      }`}
                    >
                      {item.question}
                    </span>

                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        isOpen ? 'rotate-180 bg-brand-700 text-white' : 'bg-ink-100 text-ink-400'
                      }`}
                    >
                      <ChevronDown size={17} />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="border-t border-ink-100 px-6 py-5 text-[15px] leading-relaxed text-ink-600 md:pl-21">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => {
              if (showAll) setOpenIndex(null);
              setShowAll(!showAll);
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-brand-700 bg-white px-8 py-3.5 text-sm font-bold text-brand-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-700 hover:text-white hover:shadow-[0_12px_28px_-10px_rgba(11,122,75,0.6)] active:scale-[0.98]"
          >
            {showAll ? (
              <>Ver menos preguntas <Minus size={17} /></>
            ) : (
              <>Ver más preguntas <Plus size={17} /></>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
