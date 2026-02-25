"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Mail,
  Instagram,
  Menu,
  X,
  ArrowLeft,
  Home,
  Briefcase,
  Building2,
  Users,
  PhoneCallIcon,
  LogIn,
  MessageCircle,
} from "lucide-react";
import { BsWhatsapp } from "react-icons/bs";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

// ── HOOK: hide on scroll down, show on scroll up ──────────────────────────────
function useHideOnScroll() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Siempre visible cuando estás cerca del tope
      if (currentScrollY < 80) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY.current) {
        setIsVisible(false); // scrolleando hacia abajo → ocultar
      } else {
        setIsVisible(true);  // scrolleando hacia arriba → mostrar
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return isVisible;
}

// ── HOOK: scroll suave a sección ──────────────────────────────────────────────
function useScrollToSection() {
  const router = useRouter();
  const pathname = usePathname();

  return (sectionId: string, closeMenu?: () => void) => {
    closeMenu?.();

    const scrollToEl = () => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    if (pathname === "/") {
      scrollToEl();
    } else {
      router.push("/");
      setTimeout(scrollToEl, 600);
    }
  };
}

// ── TIPOS ─────────────────────────────────────────────────────────────────────
interface NavLinkScrollProps {
  sectionId: string;
  icon: React.ReactNode;
  label: string;
  underlineWidth: string;
  onClose?: () => void;
}

// ── COMPONENTE: Link con smooth scroll y underline animado ────────────────────
const NavLinkScroll = ({ sectionId, icon, label, underlineWidth, onClose }: NavLinkScrollProps) => {
  const scrollTo = useScrollToSection();

  return (
    <button
      onClick={() => scrollTo(sectionId, onClose)}
      className="group relative px-3 py-3.5 text-lg font-semibold text-[#0b7a4b] transition-colors duration-300 cursor-pointer"
    >
      <span className="relative group-hover:text-[#0f8b57] transition-colors duration-300">
        {icon}
        {label}
      </span>
      <span className={`absolute -bottom-1 left-3 ${underlineWidth} h-0.5 bg-linear-to-r from-[#0f8b57] to-[#14a366] origin-right scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left`} />
    </button>
  );
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export const NavbarPublic = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const scrollTo = useScrollToSection();
  const isVisible = useHideOnScroll();

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    setActiveSubmenu(null);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveSubmenu(null);
  };

  const propiedadesLinks = [
    { label: "Venta", href: "/properties?operationType=venta" },
    { label: "Alquiler", href: "/properties?operationType=alquiler" },
    { label: "Terrenos", href: "/properties?typeOfPropertyId=5" },
    { label: "Ver todas", href: "/properties" },
  ];

  const serviciosLinks = [
    { label: "Venta de Propiedades", href: "/servicios/venta" },
    { label: "Alquiler de Propiedades", href: "/servicios/alquiler" },
    { label: "Tasaciones de Propiedades", href: "/servicios/tasaciones" },
    { label: "Asesoramiento Profesional", href: "/servicios/asesoramiento" },
    { label: "Publicamos tu propiedad", href: "/servicios/publicacion" },
    { label: "Gestión Legal y Documental", href: "/servicios/gestion-legal" },
  ];

  const contactoLinks = [
    { label: "+54 9 351387-2817", href: "https://wa.me/543513872817", icon: <BsWhatsapp className="mr-2 text-xl" />, external: true },
    { label: "Instagram", href: "https://www.instagram.com/inmobiliariacercatrova/", icon: <Instagram className="mr-2" />, external: true },
    { label: "Email", href: "mailto:info@cercatrova.com", icon: <Mail className="mr-2" />, external: true },
  ];

  return (
    <nav
      className={`
        fixed top-0.5 left-0 right-0 z-50 mx-auto w-[95%] m-auto
        flex flex-row p-2.5 justify-between md:justify-start items-center
        bg-white shadow-lg rounded-full mt-0.5
        transition-transform duration-300 ease-in-out
        ${isVisible ? "translate-y-0" : "-translate-y-[120%]"}
      `}
    >
      {/* ── LOGO ── */}
      <div className="flex items-center">
        <button aria-label="Ir al inicio" onClick={() => scrollTo("inicio")} className="cursor-pointer">
          <Image src="/LogoInmobiliaria.png" alt="Logo Cerca Trova" width={115} height={130} className="bg-white w-30 object-contain border md:w-30 ml-4 md:ml-8 rounded-full" />
        </button>
      </div>

      {/* ── HAMBURGUESA MOBILE ── */}
      <button onClick={toggleMenu} aria-label="Abrir navegación" className="md:hidden p-2 rounded-2xl mr-2 text-[#0b7a4b] hover:bg-[#0f8b57]/10 active:scale-95 transition-transform">
        <Menu size={30} />
      </button>

      {/* ── DESKTOP NAV ── */}
      <ul className="hidden md:flex flex-row gap-4 items-center ml-auto mr-8">
        <li>
          <NavLinkScroll sectionId="inicio" icon={<Home size={18} className="inline mr-2 mb-0.5" />} label="inicio" underlineWidth="w-19" />
        </li>

        <li className="relative group">
          <span className="flex items-center text-lg font-semibold text-[#0b7a4b] p-2 cursor-pointer">
            <Building2 size={18} className="inline mr-2 mt-1" />
            propiedades
            <ChevronDown className="w-4 h-4 ml-1 mt-1 transition-transform group-hover:rotate-180" />
          </span>
          <ul className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            {propiedadesLinks.map((link, i) => (
              <li key={link.label}>
                <Link href={link.href} className={`block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 ${i === 0 ? "rounded-tl-xl rounded-tr-xl" : ""} ${i === propiedadesLinks.length - 1 ? "rounded-b-xl" : ""}`}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </li>

        <li className="relative group">
          <span className="flex items-center text-lg font-semibold text-[#0b7a4b] p-2 cursor-pointer">
            <Briefcase size={18} className="inline mr-2 mt-1" />
            servicios
            <ChevronDown className="w-4 h-4 ml-1 mt-1 transition-transform group-hover:rotate-180" />
          </span>
          <ul className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            {serviciosLinks.map((link, i) => (
              <li key={link.label}>
                <Link href={link.href} className={`block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 ${i === 0 ? "rounded-tl-xl rounded-tr-xl" : ""} ${i === serviciosLinks.length - 1 ? "rounded-b-xl" : ""}`}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </li>

        <li>
          <NavLinkScroll sectionId="nosotros" icon={<Users size={18} className="inline mr-2" />} label="nosotros" underlineWidth="w-27" />
        </li>

        <li>
          <NavLinkScroll sectionId="faq" icon={<MessageCircle size={18} className="inline mr-2 mb-0.5" />} label="consultas" underlineWidth="w-27" />
        </li>

        <li className="relative group">
          <span className="flex items-center text-lg font-semibold text-[#0b7a4b] p-2 cursor-pointer">
            <PhoneCallIcon size={18} className="inline mr-2 mt-1" />
            contacto
            <ChevronDown className="w-4 h-4 ml-1 mt-1 transition-transform group-hover:rotate-180" />
          </span>
          <ul className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            {contactoLinks.map((link, i) => (
              <li key={link.label}>
                <a href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined} className={`flex items-center px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 ${i === 0 ? "rounded-tl-xl rounded-tr-xl" : ""} ${i === contactoLinks.length - 1 ? "rounded-b-xl" : ""}`}>
                  {link.icon}{link.label}
                </a>
              </li>
            ))}
          </ul>
        </li>

        <li>
          <Link href="/login" className="relative overflow-hidden flex justify-center items-center px-6 py-2.5 text-lg font-bold text-white bg-linear-to-r from-[#0f8b57] to-[#14a366] hover:from-[#0d7a4d] hover:to-[#0f8b57] rounded-full active:scale-95 transition-all duration-300 group">
            <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <LogIn size={20} className="inline mr-2 transition-transform group-hover:-translate-y-0.5" />
            <span className="relative">iniciar sesión</span>
          </Link>
        </li>
      </ul>

      {/* ── MOBILE: Overlay ── */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden z-60 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={toggleMenu} />

      {/* ── MOBILE: Drawer ── */}
      <div className={`fixed top-0 right-0 h-full w-75 rounded-2xl rounded-tr-none bg-white shadow-2xl transform transition-transform duration-300 ease-out md:hidden z-70 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 shadow-md">
            <span className="font-bold text-[#0b7a4b] text-xl">Menú</span>
            <button onClick={toggleMenu} aria-label="Cerrar navegación" className="p-2 text-white bg-[#0d9f62] hover:bg-[#0b7a4b] transition-colors rounded-full">
              <X size={25} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-3">
              <li>
                <button onClick={() => scrollTo("inicio", closeMenu)} className="w-full flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b">
                  <Home size={24} className="text-[#0b7a4b] shrink-0" /><span className="ml-4">inicio</span>
                </button>
              </li>
              <li>
                <button onClick={() => setActiveSubmenu("propiedades")} className="w-full flex items-center justify-between p-4 text-xl border-b font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors">
                  <div className="flex items-center"><Building2 size={24} className="text-[#0b7a4b] shrink-0" /><span className="ml-4">propiedades</span></div>
                  <ArrowLeft className="w-4 h-4 ml-3 rotate-180" />
                </button>
              </li>
              <li>
                <button onClick={() => setActiveSubmenu("servicios")} className="w-full flex items-center justify-between p-4 text-xl border-b font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors">
                  <div className="flex items-center"><Briefcase size={24} className="text-[#0b7a4b] shrink-0" /><span className="ml-4">servicios</span></div>
                  <ArrowLeft className="w-4 h-4 ml-3 rotate-180" />
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("nosotros", closeMenu)} className="w-full flex items-center p-4 text-xl border-b font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors">
                  <Users size={24} className="text-[#0b7a4b] shrink-0" /><span className="ml-4">nosotros</span>
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("faq", closeMenu)} className="w-full flex items-center p-4 text-xl border-b font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors">
                  <MessageCircle size={24} className="text-[#0b7a4b] shrink-0" /><span className="ml-4">consultas</span>
                </button>
              </li>
              <li>
                <button onClick={() => setActiveSubmenu("contacto")} className="w-full flex items-center justify-between p-4 text-xl border-b font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors">
                  <div className="flex items-center"><PhoneCallIcon size={24} className="text-[#0b7a4b] shrink-0" /><span className="ml-4">contacto</span></div>
                  <ArrowLeft className="w-4 h-4 ml-3 rotate-180" />
                </button>
              </li>
            </ul>
          </div>

          <div className="flex justify-center items-center p-6 border-t border-gray-100">
            <Link href="/login" onClick={closeMenu} className="relative overflow-hidden w-full flex items-center justify-center py-4 bg-linear-to-r from-[#0f8b57] to-[#14a366] hover:from-[#0d7a4d] hover:to-[#0f8b57] text-white font-bold text-lg rounded-2xl shadow-lg active:scale-[0.97] transition-all duration-300 group">
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <LogIn size={22} className="mr-2 transition-transform group-hover:-translate-y-0.5" />
              <span className="tracking-wide">iniciar sesión</span>
            </Link>
          </div>

          {/* ── SUBMENÚS DESLIZABLES ── */}
          {["propiedades", "servicios", "contacto"].map((menu) => (
            <div key={menu} className={`absolute inset-0 rounded-2xl bg-white z-80 transition-transform duration-300 ${activeSubmenu === menu ? "translate-x-0" : "translate-x-full"}`}>
              <div className="flex items-center p-5 border-b border-gray-100 shadow-md">
                <button onClick={() => setActiveSubmenu(null)} aria-label="Volver" className="p-2 mr-2 text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-full">
                  <ArrowLeft size={24} />
                </button>
                <span className="font-bold text-[#0b7a4b] text-xl capitalize">{menu}</span>
              </div>
              <ul className="p-4 space-y-3">
                {menu === "propiedades" && propiedadesLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} onClick={closeMenu} className="block p-4 text-lg text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]">{link.label}</Link>
                  </li>
                ))}
                {menu === "servicios" && serviciosLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} onClick={closeMenu} className="block p-4 text-lg text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]">{link.label}</Link>
                  </li>
                ))}
                {menu === "contacto" && contactoLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined} onClick={closeMenu} className="flex items-center p-4 text-lg text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]">
                      {link.icon}{link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};