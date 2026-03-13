"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { BsWhatsapp, BsInstagram, BsFacebook } from "react-icons/bs";

export const FooterPublic = () => {
  return (
    <footer className="relative mt-5">

      {/* ══ ARCO SVG ══════════════════════════════════════════════ */}
      <div className="w-full overflow-hidden" style={{ lineHeight: 0, height: 110 }}>
        <svg viewBox="0 0 1440 110" xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none" style={{ width: "100%", height: "110px", display: "block" }}>
          <path d="M0,110 L0,75 C200,25 440,105 720,68 C1000,30 1240,95 1440,58 L1440,110 Z"
            fill="#084f30" opacity="0.5" />
          <path d="M0,110 L0,88 C220,36 460,102 720,72 C980,42 1220,98 1440,65 L1440,110 Z"
            fill="#0b7a4b" />
        </svg>
      </div>

      {/* ══ CUERPO ════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ background: "#0b7a4b" }}>

        {/* ── Fondo con vida ──────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Círculos grandes difusos */}
          <div className="absolute -top-40 -left-40 w-140 h-140 rounded-full"
            style={{ background: "rgba(255,255,255,0.055)" }} />
          <div className="absolute top-0 -right-20 w-100 h-100 rounded-full"
            style={{ background: "rgba(34,197,94,0.07)" }} />
          <div className="absolute -bottom-15 left-[30%] w-125 h-125 rounded-full"
            style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute bottom-10 right-[5%] w-65 h-65 rounded-full"
            style={{ background: "rgba(34,197,94,0.06)" }} />
          {/* Círculos medianos */}
          <div className="absolute top-[45%] left-[6%] w-32.5 h-32.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute top-[12%] left-[58%] w-22.5 h-22.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute bottom-[20%] left-[22%] w-17.5 h-17.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute top-[30%] right-[18%] w-12.5 h-12.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.07)" }} />
          {/* Grid de puntos — esquina derecha arriba */}
          <svg className="absolute right-0 top-0" width="260" height="260" style={{ opacity: 0.045 }}>
            {[...Array(7)].map((_, r) => [...Array(7)].map((_, c) => (
              <circle key={`${r}-${c}`} cx={c * 35 + 18} cy={r * 35 + 18} r="2.5" fill="white" />
            )))}
          </svg>
          {/* Grid de puntos — esquina izquierda abajo */}
          <svg className="absolute left-0 bottom-0" width="200" height="200" style={{ opacity: 0.04 }}>
            {[...Array(5)].map((_, r) => [...Array(5)].map((_, c) => (
              <circle key={`${r}-${c}`} cx={c * 36 + 18} cy={r * 36 + 18} r="2.2" fill="white" />
            )))}
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-12 pt-6">

          {/* ── CTA CARD ───────────────────────────────────────── */}
          <div
            className="mb-16 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.09)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <span className="absolute -right-14 -top-14 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
            <span className="absolute right-[38%] -bottom-12 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10 text-center md:text-left">
              <p className="text-white/95 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">
                ¿Listo para el próximo paso?
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
                ¿Encontramos tu nuevo hogar?
              </h2>
              <p className="text-white/95 text-base">
                El equipo de <span className="font-bold text-white">Cerca Trova</span> está listo para asesorarte sin compromiso.
              </p>
            </div>

            <a href="https://wa.me/543513872817" target="_blank" rel="noopener noreferrer"
              className="group relative z-10 flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base text-white shrink-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: "#25d366", boxShadow: "0 4px 18px rgba(37,211,102,0.4)" }}>
              <BsWhatsapp size={20} />
              Contactar ahora
              <ArrowUpRight size={15} className="group-hover:rotate-45 transition-transform duration-300" />
            </a>
          </div>

          {/* ══ GRID 12 COLUMNAS ═══════════════════════════════════
              Logo(3) | Nav(2) | Servicios(3) | Contacto(4)          */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-10 pb-14"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.11)" }}>

            {/* ── COL LOGO — 3/12 ─────────────────────────────── */}
            <div className="lg:col-span-3 flex flex-col items-center md:items-start gap-5">
              <div className="bg-white p-3 rounded-2xl shadow-xl inline-block">
                <Image src="/LogoInmobiliaria.png" alt="Cerca Trova" width={108} height={108} className="object-contain" />
              </div>
              <p className="text-white text-sm leading-relaxed text-center md:text-left">
                Expertos en el mercado inmobiliario de Córdoba. Seguridad, transparencia y calidez en cada operación.
              </p>
              {/* Social pills */}
              <div className="flex items-center gap-2.5 mt-1">
                <SocialPill href="https://wa.me/543513872817"
                  bg="#25d366" glow="rgba(37,211,102,0.45)" label="WhatsApp">
                  <BsWhatsapp size={19} color="white" />
                </SocialPill>
                <SocialPill href="https://www.instagram.com/inmobiliariacercatrova/"
                  bg="linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"
                  glow="rgba(220,39,67,0.4)" label="Instagram">
                  <BsInstagram size={18} color="white" />
                </SocialPill>
                <SocialPill href="https://web.facebook.com/profile.php?id=100095365100918"
                  bg="#1877F2"
                  glow="rgba(24,119,242,0.4)"
                  label="Facebook">
                  <BsFacebook size={20.5} color="#FFFFFF" className="ml-px" />
                </SocialPill>
              </div>
            </div>

            {/* ── COL NAVEGACIÓN — 2/12 ───────────────────────── */}
            <div className="lg:col-span-2 flex flex-col items-center md:items-start">
              <ColTitle>Navegación</ColTitle>
              <ul className="space-y-3.5 text-center md:text-left w-full">
                {[
                  { label: "Inicio", href: "/" },
                  { label: "Propiedades", href: "#propiedades" },
                  { label: "Servicios", href: "#servicios" },
                  { label: "Reseñas", href: "#reseñas" },
                  { label: "Sobre Nosotros", href: "#nosotros" },
                ].map(l => <FooterLink key={l.label} {...l} />)}
              </ul>
            </div>

            {/* ── COL SERVICIOS — 3/12 ────────────────────────── */}
            <div className="lg:col-span-3 flex flex-col items-center md:items-start">
              <ColTitle>Servicios</ColTitle>
              <ul className="space-y-3.5 text-center md:text-left w-full">
                {[
                  { label: "Venta de Propiedades", href: "/servicios/venta" },
                  { label: "Alquiler", href: "/servicios/alquiler" },
                  { label: "Tasaciones", href: "/servicios/tasaciones" },
                  { label: "Gestión Legal", href: "/servicios/legal" },
                  { label: "Publicar mi propiedad", href: "/servicios/comercializacion" },
                ].map(l => <FooterLink key={l.label} {...l} />)}
              </ul>
            </div>

            {/* ── COL CONTACTO — 4/12 ─────────────────────────── */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <ColTitle>Contacto</ColTitle>

              <ContactLink icon={<BsWhatsapp size={19} />}
                iconBg="#25d366" iconGlow="rgba(37,211,102,0.35)"
                label="WhatsApp" href="https://wa.me/543513872817" />

              <ContactLink icon={<BsInstagram size={20} />}
                iconBg="linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"
                iconGlow="rgba(220,39,67,0.35)"
                label="@inmobiliariacercatrova"
                href="https://www.instagram.com/inmobiliariacercatrova/" />

              <ContactLink
                icon={<BsFacebook size={20} color="#FFFFFF" className="ml-px" />}
                iconBg="#1877F2" iconGlow="rgba(24,119,242,0.4)"
                label="Inmob Cercatrova " href="https://web.facebook.com/profile.php?id=100095365100918" />
              
              {/* Horario */}
            </div>
          </div>

          {/* ── MAPA ───────────────────────────────────────────── */}
          <div className="mt-12 mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                <MapPin size={20} className="text-white/90" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white leading-none">Nuestra oficina:</h3>
                <p className="text-white/95 text-sm mt-0.5">Sucre 51, Pta baja Of.2, Córdoba, Argentina 5000</p>
              </div>
              
            </div>
            <div className="rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,255,255,0.07)]"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              <iframe
                src="https://www.google.com/maps?q=51%20Jos%C3%A9%20Antonio%20de%20Sucre,%20C%C3%B3rdoba,%20Argentina&output=embed"
                width="100%" height="380" loading="lazy" className="w-full block" />
            </div>
          </div>

          {/* ── COPYRIGHT ──────────────────────────────────────── */}
          <div className="pt-7 flex flex-col md:flex-row justify-between items-center gap-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#25d366" }} />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                © {new Date().getFullYear()} Inmobiliaria Cerca Trova — Córdoba, Argentina | Matrícula N° 04 4838
              </p>
            </div>
            <div className="flex gap-6">
              <Link href="/privacidad"
                className="text-[11px] font-bold uppercase tracking-widest text-white hover:text-white/70 transition-colors">
                Privacidad
              </Link>
              <Link href="/terminos"
                className="text-[11px] font-bold uppercase tracking-widest text-white hover:text-white/70 transition-colors">
                Términos
              </Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

/* ── Helpers ─────────────────────────────────────────────────── */
const ColTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-extrabold text-white text-[11px] uppercase tracking-[0.2em] mb-6 pb-2.5 w-full"
    style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
    {children}
  </h3>
);

const FooterLink = ({ label, href }: { label: string; href: string }) => (
  <li>
    <Link href={href}
      className="text-sm font-medium text-white/55 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block relative group">
      <span className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full bg-[#25d366] transition-all duration-300 rounded-full" />
      {label}
    </Link>
  </li>
);

const SocialPill = ({ href, bg, glow, label, children }: {
  href: string; bg: string; glow: string; label: string; children: React.ReactNode;
}) => (
  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
    style={{ background: bg, boxShadow: `0 4px 12px ${glow}` }}>
    {children}
  </a>
);

const ContactLink = ({ icon, iconBg, iconGlow, label, href }: {
  icon: React.ReactNode; iconBg: string; iconGlow: string; label: string; href: string;
}) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 group hover:bg-white/10"
    style={{ border: "1px solid rgba(255,255,255,0.09)" }}>
    <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-110"
      style={{ background: iconBg, boxShadow: `0 3px 10px ${iconGlow}` }}>
      {icon}
    </span>
    <span className="text-sm font-semibold text-white/65 group-hover:text-white transition-colors truncate">
      {label}
    </span>
  </a>
);