import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MapPin, Mail } from 'lucide-react';
import { BsWhatsapp, BsInstagram, BsFacebook } from 'react-icons/bs';
import { WHATSAPP_NUMBER, whatsappLink } from '@/modules/shared/lib/contact';

/**
 * Footer público (Bloque LANDING §9) — rediseñado por completo.
 *
 * Qué cambió respecto de la versión anterior:
 *  - **Se eliminó el arco SVG** de curvas grises/blancas de arriba y el verde
 *    plano `#0b7a4b`. Ahora usa `.surface-brand-deepest`, la misma familia de
 *    verde profundo con textura que la franja de estudiantes y Trayectoria, así
 *    que el footer cierra la página en lugar de cortarla.
 *  - **Se eliminaron los 8 círculos decorativos y los 2 grids de puntos SVG**
 *    dibujados a mano (≈35 líneas): la textura ahora la da la clase CSS.
 *  - **Enlaces reorganizados**: 3 columnas claras (Navegación / Servicios /
 *    Legal) + bloque de contacto, en vez de la grilla de 12 con anchos dispares.
 *  - **Redes sociales rediseñadas**: contenedores circulares neutros que se
 *    tiñen del color real de cada marca al hacer hover, en vez de estar siempre
 *    a todo color compitiendo entre sí y con el verde del fondo.
 *
 * La información de contacto (WhatsApp, Instagram, Facebook, dirección, mapa,
 * matrícula) se mantiene exactamente igual — solo cambia el diseño.
 */

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Propiedades', href: '/properties' },
  { label: 'Servicios', href: '/#servicios' },
  { label: 'Reseñas', href: '/#reseñas' },
  { label: 'Sobre nosotros', href: '/#nosotros' },
  { label: 'Preguntas frecuentes', href: '/#faq' },
];

const serviceLinks = [
  { label: 'Venta de propiedades', href: '/servicios/venta' },
  { label: 'Alquileres', href: '/servicios/alquiler' },
  { label: 'Tasaciones', href: '/servicios/tasaciones' },
  { label: 'Asesoramiento', href: '/servicios/asesoramiento' },
  { label: 'Gestión legal', href: '/servicios/legal' },
  { label: 'Publicar mi propiedad', href: '/publicar' },
];

const socials = [
  {
    label: 'WhatsApp',
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    Icon: BsWhatsapp,
    hover: 'hover:bg-[#25d366] hover:border-[#25d366]',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/inmobiliariacercatrova/',
    Icon: BsInstagram,
    hover: 'hover:border-transparent hover:bg-linear-to-br hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]',
  },
  {
    label: 'Facebook',
    href: 'https://web.facebook.com/profile.php?id=100095365100918',
    Icon: BsFacebook,
    hover: 'hover:bg-[#1877f2] hover:border-[#1877f2]',
  },
];

export const FooterPublic = () => {
  return (
    <footer className="surface-brand-deepest relative overflow-hidden">
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-10">

        {/* ══ CTA ═══════════════════════════════════════════════ */}
        <div className="flex flex-col items-center justify-between gap-7 rounded-2xl border border-white/15 bg-white/[0.07] p-8 backdrop-blur-md md:flex-row md:p-10">
          <div className="text-center md:text-left">
            <p className="text-[11px] font-bold tracking-[0.22em] text-brand-300 uppercase">
              ¿Listo para el próximo paso?
            </p>
            <h2 className="mt-2.5 text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl">
              ¿Encontramos tu nuevo hogar?
            </h2>
            <p className="mt-2 text-[15px] text-white/70">
              El equipo de <span className="font-semibold text-white">Cerca Trova</span> está listo
              para asesorarte sin compromiso.
            </p>
          </div>

          <a
            href={whatsappLink('¡Hola! Me gustaría recibir asesoramiento sobre una propiedad.')}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex shrink-0 items-center gap-2.5 rounded-xl bg-white px-7 py-4 text-base font-bold text-brand-800 shadow-[0_10px_28px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.75)] active:scale-[0.98]"
          >
            <BsWhatsapp size={19} />
            Contactar ahora
            <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:rotate-45" />
          </a>
        </div>

        {/* ══ COLUMNAS ══════════════════════════════════════════ */}
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 border-b border-white/10 pb-14 md:grid-cols-2 lg:grid-cols-12">

          {/* Marca */}
          <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left lg:col-span-4">
            <div className="inline-block rounded-xl bg-white p-3 shadow-lg">
              <Image
                src="/LogoInmobiliaria.png"
                alt="Cerca Trova"
                width={104}
                height={104}
                className="object-contain"
              />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              Expertos en el mercado inmobiliario de Córdoba. Seguridad, transparencia y calidez en
              cada operación.
            </p>

            <div className="flex items-center gap-3">
              {socials.map(({ label, href, Icon, hover }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all duration-300 hover:-translate-y-1 hover:text-white ${hover}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Navegación */}
          <div className="lg:col-span-2">
            <ColTitle>Navegación</ColTitle>
            <ul className="flex flex-col gap-3">
              {navLinks.map((l) => (
                <FooterLink key={l.label} {...l} />
              ))}
            </ul>
          </div>

          {/* Servicios */}
          <div className="lg:col-span-3">
            <ColTitle>Servicios</ColTitle>
            <ul className="flex flex-col gap-3">
              {serviceLinks.map((l) => (
                <FooterLink key={l.label} {...l} />
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div className="lg:col-span-3">
            <ColTitle>Contacto</ColTitle>
            <ul className="flex flex-col gap-3.5">
              <ContactRow
                icon={<BsWhatsapp size={15} />}
                label="+54 351 387 2817"
                sub="WhatsApp"
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
              />
              <ContactRow
                icon={<BsInstagram size={15} />}
                label="@inmobiliariacercatrova"
                sub="Instagram"
                href="https://www.instagram.com/inmobiliariacercatrova/"
              />
              <ContactRow
                icon={<Mail size={15} />}
                label="Inmob Cercatrova"
                sub="Facebook"
                href="https://web.facebook.com/profile.php?id=100095365100918"
              />
              <li className="flex items-start gap-3 pt-1">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-brand-300">
                  <MapPin size={15} />
                </span>
                <span className="text-sm leading-relaxed text-white/70">
                  Sucre 51, Pta. baja Of. 2
                  <br />
                  Córdoba, Argentina (5000)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ══ MAPA ══════════════════════════════════════════════ */}
        <div className="mt-14">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-brand-300">
              <MapPin size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold leading-none text-white">Nuestra oficina</h3>
              <p className="mt-1 text-sm text-white/60">
                Sucre 51, Pta. baja Of. 2, Córdoba, Argentina 5000
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/15">
            <iframe
              title="Ubicación de la oficina de Cerca Trova"
              src="https://www.google.com/maps?q=51%20Jos%C3%A9%20Antonio%20de%20Sucre,%20C%C3%B3rdoba,%20Argentina&output=embed"
              width="100%"
              height="340"
              loading="lazy"
              className="block w-full"
            />
          </div>
        </div>

        {/* ══ COPYRIGHT ═════════════════════════════════════════ */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-center text-xs font-medium text-white/55 md:text-left">
            © {new Date().getFullYear()} Inmobiliaria Cerca Trova — Córdoba, Argentina
            <span className="mx-2 text-white/25">|</span>
            Matrícula N° 04 4838
          </p>

          <div className="flex gap-6">
            <Link
              href="/privacidad"
              className="text-xs font-semibold tracking-wide text-white/55 transition-colors hover:text-white"
            >
              Privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-xs font-semibold tracking-wide text-white/55 transition-colors hover:text-white"
            >
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ── Helpers ─────────────────────────────────────────────────── */

const ColTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-5 text-[11px] font-bold tracking-[0.22em] text-brand-300 uppercase">
    {children}
  </h3>
);

const FooterLink = ({ label, href }: { label: string; href: string }) => (
  <li>
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-sm text-white/65 transition-colors duration-200 hover:text-white"
    >
      <span className="h-px w-0 bg-brand-400 transition-all duration-300 group-hover:w-3.5" />
      {label}
    </Link>
  </li>
);

const ContactRow = ({
  icon,
  label,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  href: string;
}) => (
  <li>
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-brand-300 transition-all duration-300 group-hover:border-white/30 group-hover:bg-white group-hover:text-brand-800">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white/80 transition-colors group-hover:text-white">
          {label}
        </span>
        <span className="block text-[11px] tracking-wide text-white/40 uppercase">{sub}</span>
      </span>
    </a>
  </li>
);

export default FooterPublic;
