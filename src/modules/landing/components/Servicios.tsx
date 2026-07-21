import Link from 'next/link';
import {
  Home,
  Key,
  DollarSign,
  Briefcase,
  Megaphone,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import {
  FaChessKing,
  FaChessQueen,
  FaChessBishop,
  FaChessKnight,
  FaChessRook,
  FaChessPawn,
} from 'react-icons/fa6';
import { BsWhatsapp } from 'react-icons/bs';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { WHATSAPP_NUMBER } from '@/modules/shared/lib/contact';

/**
 * Servicios (Bloque LANDING §3).
 *
 * Se reemplazó la tarjeta 3D (rotate3d + capa "glass" + ~170 líneas de CSS
 * inyectado con dangerouslySetInnerHTML) por tarjetas planas y modernas.
 * Motivo además de estético: el CSS viejo fijaba `width: 320px; height: 350px`,
 * así que las tarjetas no eran responsivas y el texto se cortaba en las
 * descripciones más largas.
 *
 * Los 6 servicios ya existían en el array (incluida "Gestión Legal y
 * Documental"), así que la grilla queda 3 + 3 en desktop.
 */

const services = [
  {
    id: 'venta',
    title: 'Venta de Propiedades',
    description: 'Estrategias personalizadas para posicionar tu propiedad y maximizar su valor de venta.',
    icon: Home,
    watermark: FaChessKing,
  },
  {
    id: 'alquiler',
    title: 'Alquileres',
    description: 'Gestión completa: evaluación de inquilinos, redacción contractual y seguimiento mensual.',
    icon: Key,
    watermark: FaChessRook,
  },
  {
    id: 'tasaciones',
    title: 'Tasaciones Profesionales',
    description: 'Valoraciones fundamentadas en análisis comparativos y conocimiento real del mercado.',
    icon: DollarSign,
    watermark: FaChessBishop,
  },
  {
    id: 'asesoramiento',
    title: 'Asesoramiento Inmobiliario',
    description: 'Acompañamiento estratégico para decisiones informadas y seguras en cada etapa.',
    icon: Briefcase,
    watermark: FaChessKnight,
  },
  {
    id: 'comercializacion',
    title: 'Publicamos tu Propiedad',
    description: 'Evaluamos tu propiedad e iniciamos el proceso de comercialización de inmediato.',
    icon: Megaphone,
    watermark: FaChessQueen,
  },
  {
    id: 'legal',
    title: 'Gestión Legal y Documental',
    description: 'Supervisión de contratos y documentación para asegurar transparencia jurídica.',
    icon: FileCheck,
    watermark: FaChessPawn,
  },
];

export default function Servicios() {
  return (
    <section id="servicios" className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Servicios inmobiliarios"
          title={<>Hacemos que todo sea <span className="text-brand-700">más simple para vos</span></>}
          subtitle="Desde la tasación hasta la escritura, cubrimos cada etapa de la operación."
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={(i % 3) * 0.08} className="h-full">
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service }: { service: (typeof services)[number] }) {
  const Icon = service.icon;
  const Watermark = service.watermark;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `¡Hola! Me interesa el servicio de ${service.title}. ¿Me pueden dar más información?`
  )}`;

  return (
    <div
      id={service.id}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white p-7 transition-all duration-400 hover:-translate-y-1.5 hover:border-brand-700/40 hover:shadow-[0_24px_50px_-18px_rgba(6,57,35,0.35)]"
    >
      <Watermark
        aria-hidden
        className="
          pointer-events-none
          absolute
          -top--10
          right-3
          z-0
          text-brand-100/90
          transition-all
          duration-300
          group-hover:text-brand-200
          group-hover:scale-105
        "
        size={100}
      />

      {/* ── CONTENIDO ── (por encima de la marca de agua) */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Ícono */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-all duration-400 group-hover:scale-105 group-hover:bg-brand-700 group-hover:text-white">
          <Icon size={24} strokeWidth={2} />
        </div>

        <h3 className="mt-5 text-xl font-bold tracking-tight text-ink-900">{service.title}</h3>
        <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">{service.description}</p>

        {/* Botones — misma línea visual que el resto de los CTAs de la landing:
            el primario es verde sólido (antes era `ink-900` negro, lo que rompía
            la consistencia con "Ver propiedades" y "Ver todas las propiedades"). */}
        <div className="mt-7 flex flex-wrap items-center gap-2.5 border-t border-ink-100 pt-5">
          <Link
            href={`/servicios/${service.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(6,57,35,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-[0_10px_22px_-8px_rgba(6,57,35,0.7)] active:scale-[0.98]"
          >
            Ver detalle
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border-2 border-ink-200 px-5 py-2.5 text-sm font-bold text-ink-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#25d366] hover:bg-[#25d366] hover:text-white active:scale-[0.98]"
          >
            <BsWhatsapp size={15} />
            Consultar
          </a>
        </div>
      </div>
    </div>
  );
}