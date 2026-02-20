import React from "react";
import {
  Home,
  Key,
  DollarSign,
  Briefcase,
  Megaphone,
  FileCheck,
  ChevronDown,
} from "lucide-react";
import { BsWhatsapp } from "react-icons/bs"; // Asegúrate de tener react-icons instalado

const services = [
  {
    id: "venta",
    title: "Venta de Propiedades",
    description: "Estrategias personalizadas para posicionar su propiedad y maximizar su valor de venta.",
    icon: Home,
  },
  {
    id: "alquiler",
    title: "Alquiler de Propiedades",
    description: "Gestión completa: evaluación de inquilinos, redacción contractual y seguimiento.",
    icon: Key,
  },
  {
    id: "tasaciones",
    title: "Tasaciones Profesionales",
    description: "Valoraciones fundamentadas en análisis comparativos y conocimiento del mercado.",
    icon: DollarSign,
  },
  {
    id: "asesoramiento",
    title: "Asesoramiento Profesional",
    description: "Acompañamiento estratégico para decisiones informadas y seguras en cada etapa.",
    icon: Briefcase,
  },
  {
    id: "comercializacion",
    title: "Publicación y Comercialización",
    description: "Evaluamos su propiedad e iniciamos el proceso de comercialización de inmediato.",
    icon: Megaphone,
  },
  {
    id: "legal",
    title: "Gestión Legal y Documental",
    description: "Supervisión de contratos y documentación para asegurar transparencia jurídica.",
    icon: FileCheck,
  },
];

export default function ServiciosPremium3D() {
  return (
    <section id="servicios" className="py-28 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-24">
          <span className="text-sm tracking-[0.2em] uppercase text-[#0b7a4b] font-medium">
            Servicios Inmobiliarios
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold mt-6 text-gray-900 leading-tight">
            Hacemos que todo sea <span className="text-[#0b7a4b]">más simple para vos.</span>
          </h2>
          <div className="w-28 h-0.5 bg-[#0b7a4b] mx-auto mt-8"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-20 gap-x-10 justify-items-center">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .card-parent {
          width: 320px;
          height: 350px;
          perspective: 1000px;
        }

        .card-3d {
          height: 100%;
          position: relative;
          border-radius: 50px;
          background: linear-gradient(135deg, #0b7a4b 0%, #22c55e 100%);
          transition: all 0.5s ease-in-out;
          transform-style: preserve-3d;
        }

        .glass-layer {
          transform-style: preserve-3d;
          position: absolute;
          inset: 8px;
          border-radius: 55px;
          border-top-right-radius: 100%;
          background: linear-gradient(0deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.8) 100%);
          backdrop-filter: blur(5px);
          transform: translate3d(0px, 0px, 25px);
          border-left: 1px solid white;
          border-bottom: 1px solid white;
          transition: all 0.5s ease-in-out;
        }

        .card-content {
          padding: 110px 30px 0px 30px;
          transform: translate3d(0, 0, 30px);
        }

        .card-3d-title {
          display: block;
          color: #042f2e;
          font-weight: 900;
          font-size: 1.25rem;
          line-height: 1.2;
        }

        .card-3d-text {
          display: block;
          color: #064e3b;
          font-size: 0.875rem;
          margin-top: 15px;
          line-height: 1.5;
          font-weight: 500;
        }

        .card-bottom {
          padding: 10px 20px;
          transform-style: preserve-3d;
          position: absolute;
          bottom: 25px;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transform: translate3d(0, 0, 60px); /* Botones más hacia adelante */
        }

        .view-more-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: white;
          background-color: #042f2e; /* Color sólido oscuro para contraste */
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px 18px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 13px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .whatsapp-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: white;
          background-color: #16A34A; /* Verde oficial WhatsApp sólido */
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px 18px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 13px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4); /* Brillo verde */
        }

        .view-more-btn:hover {
          transform: scale(1.08) translate3d(0, 0, 15px);
          background-color: white;
          color: #042f2e;
        }

        .whatsapp-btn:hover {
          transform: scale(1.08) translate3d(0, 0, 15px);
          background-color: white;
          color: #25D366;
          box-shadow: 0 8px 25px rgba(37, 211, 102, 0.5);
        }

        .card-logo-container {
          position: absolute;
          right: 0;
          top: 0;
          transform-style: preserve-3d;
        }

        .circle {
          display: block;
          position: absolute;
          aspect-ratio: 1;
          border-radius: 50%;
          top: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(5px);
          transition: all 0.5s ease-in-out;
        }

        .c5 { 
          width: 45px; transform: translate3d(0, 0, 100px); top: 30px; right: 30px; 
          display: grid; place-content: center; transition-delay: 0.4s;
          background: #0b7a4b; color: white;
        }

        .card-parent:hover .card-3d {
          transform: rotate3d(1, 1, 0, 25deg);
          box-shadow: rgba(5, 71, 17, 0.3) 30px 50px 25px -40px, rgba(5, 71, 17, 0.1) 0px 25px 30px 0px;
        }

        .card-parent:hover .c5 { transform: translate3d(0, 0, 120px); }
      ` }} />
    </section>
  );
}

function ServiceCard({ service }) {
  const Icon = service.icon;
  const phoneNumber = "543513872817";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=Hola! Estoy interesado en el servicio de: ${service.title}`;

  return (
    <div className="card-parent" id={service.id}>
      <div className="card-3d">
        <div className="card-logo-container">
          <span className="circle c1"></span>
          <span className="circle c2"></span>
          <span className="circle c3"></span>
          <span className="circle c4"></span>
          <span className="circle c5">
            <Icon size={20} />
          </span>
        </div>

        <div className="glass-layer"></div>

        <div className="card-content">
          <span className="card-3d-title">{service.title}</span>
          <span className="card-3d-text">{service.description}</span>
        </div>

        <div className="card-bottom">
          <button className="view-more-btn">
            Info <ChevronDown size={14} strokeWidth={3} />
          </button>
          
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn"
          >
            Consultar <BsWhatsapp size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}