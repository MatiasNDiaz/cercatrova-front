"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Instagram, ArrowUpRight, InstagramIcon } from "lucide-react";
import { BsWhatsapp } from "react-icons/bs";

export const FooterPublic = () => {
  return (
    <footer className="relative mt-20 overflow-hidden">
      
      {/* SECCIÓN DE TRANSICIÓN: Curva superior moderna */}
      <div className="h-24 bg-withe w-full relative">
        <div 
          className="absolute bottom-0 left-0 w-full h-24 bg-[#0b7a4b]" 
          style={{ clipPath: "ellipse(80% 100% at 50% 100%)" }}
        />
      </div>

      {/* CONTENEDOR PRINCIPAL: Color verde Cerca Trova */}
      <div className="bg-[#0b7a4b] text-white">
        <div className="relative max-w-7xl mx-auto px-6 py-11">
          
          {/* CTA BOX: Estilo burbuja de cristal (Glassmorphism) */}
          <div className="mb-20 rounded-[35px] bg-white/10 backdrop-blur-md border border-white/20 p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                ¿Encontramos tu nuevo hogar?
              </h2>
              <p className="text-white text-lg">
                El equipo de <span className="font-bold">Cerca Trova</span> está listo para asesorarte.
              </p>
            </div>

            <a
              href="https://wa.me/543513872817"
              target="_blank"
              className="group bg-[#13b973] hover:bg-white hover:text-[#0b7a4b] text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg flex items-center gap-2"
            >
              Contactar ahora
              <ArrowUpRight size={20} className="group-hover:rotate-45 transition-transform" />
            </a>
          </div>

          {/* GRID PRINCIPAL SEPARADO POR COLUMNAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-white/50 pb-16">
            
            {/* COL 1: LOGO Y BIO */}
            <div className="flex flex-col items-center md:items-start space-y-6">
              
              <div className="bg-white p-3 rounded-2xl shadow-2xl inline-block">
                <Image
                  src="/LogoInmobiliaria.png"
                  alt="Cerca Trova Logo"
                  width={130}
                  height={130}
                  className="object-contain"
                />
              </div>
              <p className="text-white text-sm leading-relaxed text-center md:text-left font-medium">
                Expertos en el mercado inmobiliario de Córdoba. Brindamos seguridad, 
                transparencia y calidez humana en cada operación.
              </p>
            </div>

            {/* COL 2: LINKS NAVEGACIÓN */}
            <FooterList 
              title="Navegación" 
              links={[
                { label: "Inicio", href: "/" },
                { label: "Propiedades", href: "#propiedades" },
                { label: "Servicios", href: "#servicios" },
                { label: "Sobre Nosotros", href: "#nosotros" },
              ]} 
            />

            {/* COL 3: SERVICIOS DETALLADOS */}
            <FooterList 
              title="Servicios" 
              links={[
                { label: "Ventas y Alquileres", href: "#venta" },
                { label: "Tasaciones Profesionales", href: "#tasaciones" },
                { label: "Gestión de Documentación", href: "#legal" },
                { label: "Asesoramiento de Inversión", href: "#inversiones" },
              ]} 
            />

            {/* COL 4: CONTACTO MODERNO */}
            <div className="space-y-6">
              <h3 className="font-bold text-xl mb-4 text-[#ffffff]">Contacto</h3>
              <div className="space-y-3">
                <ContactLink 
                  icon={<BsWhatsapp size={18} />} 
                  text="+54 9 3513 87-2817" 
                  href="https://wa.me/543513872817" 
                />
                <ContactLink 
                  icon={<Mail size={18} />} 
                  text="info@cercatrova.com" 
                  href="mailto:info@cercatrova.com" 
                />
                <ContactLink 
                  icon={<InstagramIcon size={18} />} 
                  text="Instagram" 
                  href="https://www.instagram.com/inmobiliariacercatrova/" 
                />
                
              </div>
              
            </div>
            
          </div>


              {/* mapa */}
         <div className="mt-10 mb-10 ">

            <h3 className="text-2xl font-bold mb-6">
              Nuestra oficina
            </h3>

            <div className="rounded-3xl overflow-hidden border border-[#159a63] shadow-2xl hover:shadow-[0_0_40px_rgba(19,185,115,0.4)] transition-all duration-500">
              <iframe
                src="https://www.google.com/maps?q=49%20Jos%C3%A9%20Antonio%20de%20Sucre,%20C%C3%B3rdoba,%20Argentina&output=embed"
                width="100%"
                height="500"
                loading="lazy"
                className="w-full"
              />
            </div>

          </div>  


          {/* BARRA DE COPYRIGHT */}
          <div className="mt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
            <p>© {new Date().getFullYear()} Inmobiliaria Cerca Trova</p>
            <div className="flex gap-8">
              <Link href="/privacidad" className="hover:text-[#22c55e] transition-colors">Privacidad</Link>
              <Link href="/terminos" className="hover:text-[#22c55e] transition-colors">Términos</Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

/* COMPONENTE PARA LISTAS DE LINKS */
const FooterList = ({ title, links }: { title: string, links: { label: string, href: string }[] }) => (
  <div className="flex flex-col items-center md:items-start">
    <h3 className="font-bold text-xl mb-6 text-[#fcfcfc]">{title}</h3>
    <ul className="space-y-4 text-center md:text-left">
      {links.map((link) => (
        <li key={link.label}>
          <Link 
            href={link.href} 
            className="text-white hover:text-white transition-all duration-300 text-sm font-semibold hover:translate-x-1 inline-block"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

/* COMPONENTE PARA CONTACTO */
const ContactLink = ({ icon, text, href }: { icon: any, text: string, href: string }) => (
  <a
    href={href}
    target="_blank"
    className="flex items-center gap-4 group p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-300"
  >
    <span className="text-[#e0e7e3] group-hover:scale-110 transition-transform">
      {icon}
    </span>
    <span className="text-sm font-semibold text-white group-hover:text-white">
      {text}
    </span>
  </a>
);