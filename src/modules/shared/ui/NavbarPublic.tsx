"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
  Home,
  Briefcase,
  Building2,
  Users,
  Newspaper,
  LogIn,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  NAV_SHELL, NAV_ITEM, NAV_CTA, NAV_DROPDOWN, NAV_DROPDOWN_ITEM,
  NAV_MOBILE_ITEM, navItemClass,
} from "./navStyles";

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
  onClose?: () => void;
}

// ── COMPONENTE: Link con smooth scroll ────────────────────────────────────────
// El hover ya no es un subrayado: se rellena como píldora (ver `navStyles`).
const NavLinkScroll = ({ sectionId, icon, label, onClose }: NavLinkScrollProps) => {
  const scrollTo = useScrollToSection();

  return (
    <button onClick={() => scrollTo(sectionId, onClose)} className={NAV_ITEM}>
      {icon}
      {label}
    </button>
  );
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export const NavbarPublic = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const scrollTo = useScrollToSection();
  const isVisible = useHideOnScroll();
  const pathname = usePathname();

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
    { label: "Publicamos tu propiedad", href: "/servicios/comercializacion" },
  ];

  // El desplegable de "contacto" se sacó de la navbar: los canales de contacto
  // (WhatsApp / Instagram / Facebook) siguen estando en el footer.

  return (
    <nav className={`${NAV_SHELL} ${isVisible ? "translate-y-0" : "-translate-y-[130%]"}`}>
      {/* ── LOGO ── */}
      <div className="flex items-center">
        <button aria-label="Ir al inicio" onClick={() => scrollTo("inicio")} className="cursor-pointer">
          <Image src="/LogoInmobiliaria.png" alt="Logo Cerca Trova" width={115} height={130} className="bg-white w-30 object-contain border md:w-30 ml-4 md:ml-8 rounded-full" />
        </button>
      </div>

      {/* ── HAMBURGUESA MOBILE ── */}
      <button onClick={toggleMenu} aria-label="Abrir navegación" className="mr-2 rounded-2xl p-2 text-brand-700 transition-all duration-200 hover:bg-brand-50 active:scale-95 md:hidden">
        <Menu size={30} />
      </button>

      {/* ── DESKTOP NAV ──
          Orden: inicio · publicaciones · propiedades · servicios · nosotros ·
          consultas. "Publicaciones" es nuevo y entra a la izquierda de
          propiedades; "contacto" se quitó (sigue en el footer). */}
      <ul className="ml-auto mr-4 hidden flex-row items-center gap-1 md:flex">
        <li>
          <NavLinkScroll sectionId="inicio" icon={<Home size={17} />} label="Inicio" />
        </li>

        <li>
          <Link href="/publicaciones" className={navItemClass(pathname === "/publicaciones")}>
            <Newspaper size={17} />
            Publicaciones
          </Link>
        </li>

        <li className="group relative">
          <span className={`${NAV_ITEM} ${pathname.startsWith("/properties") ? "text-brand-800" : ""}`}>
            <Building2 size={17} />
            Propiedades
            <ChevronDown size={15} className="transition-transform duration-300 group-hover:rotate-180" />
          </span>
          <ul className={`${NAV_DROPDOWN} w-52`}>
            {propiedadesLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className={NAV_DROPDOWN_ITEM}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </li>

        <li className="group relative">
          <span className={`${NAV_ITEM} ${pathname.startsWith("/servicios") ? "text-brand-800" : ""}`}>
            <Briefcase size={17} />
            Servicios
            <ChevronDown size={15} className="transition-transform duration-300 group-hover:rotate-180" />
          </span>
          <ul className={`${NAV_DROPDOWN} w-64`}>
            {serviciosLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className={NAV_DROPDOWN_ITEM}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </li>

        <li>
          <NavLinkScroll sectionId="nosotros" icon={<Users size={17} />} label="Nosotros" />
        </li>

        <li>
          <NavLinkScroll sectionId="faq" icon={<MessageCircle size={17} />} label="Consultas" />
        </li>

        <li className="ml-2">
          <Link href="/login" className={NAV_CTA}>
            <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <LogIn size={18} className="relative transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span className="relative">Iniciar sesión</span>
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
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => scrollTo("inicio", closeMenu)} className={NAV_MOBILE_ITEM}>
                  <Home size={22} className="shrink-0 text-brand-700" />Inicio
                </button>
              </li>
              <li>
                <Link href="/publicaciones" onClick={closeMenu} className={NAV_MOBILE_ITEM}>
                  <Newspaper size={22} className="shrink-0 text-brand-700" />Publicaciones
                </Link>
              </li>
              <li>
                <button onClick={() => setActiveSubmenu("propiedades")} className={`${NAV_MOBILE_ITEM} justify-between`}>
                  <span className="flex items-center gap-4">
                    <Building2 size={22} className="shrink-0 text-brand-700" />Propiedades
                  </span>
                  <ArrowLeft size={16} className="rotate-180" />
                </button>
              </li>
              <li>
                <button onClick={() => setActiveSubmenu("servicios")} className={`${NAV_MOBILE_ITEM} justify-between`}>
                  <span className="flex items-center gap-4">
                    <Briefcase size={22} className="shrink-0 text-brand-700" />Servicios
                  </span>
                  <ArrowLeft size={16} className="rotate-180" />
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("nosotros", closeMenu)} className={NAV_MOBILE_ITEM}>
                  <Users size={22} className="shrink-0 text-brand-700" />Nosotros
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("faq", closeMenu)} className={NAV_MOBILE_ITEM}>
                  <MessageCircle size={22} className="shrink-0 text-brand-700" />Consultas
                </button>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-center border-t border-ink-100 p-6">
            <Link href="/login" onClick={closeMenu} className={`${NAV_CTA} w-full rounded-2xl py-4 text-lg`}>
              <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <LogIn size={22} className="relative transition-transform duration-300 group-hover:-translate-y-0.5" />
              <span className="relative tracking-wide">Iniciar sesión</span>
            </Link>
          </div>

          {/* ── SUBMENÚS DESLIZABLES ──
              Ya no incluye "contacto": ese desplegable se quitó de la navbar. */}
          {["propiedades", "servicios"].map((menu) => (
            <div key={menu} className={`absolute inset-0 z-80 rounded-2xl bg-white transition-transform duration-300 ${activeSubmenu === menu ? "translate-x-0" : "translate-x-full"}`}>
              <div className="flex items-center border-b border-ink-100 p-5 shadow-sm">
                <button onClick={() => setActiveSubmenu(null)} aria-label="Volver" className="mr-2 rounded-full p-2 text-brand-700 transition-colors hover:bg-brand-50">
                  <ArrowLeft size={24} />
                </button>
                <span className="text-xl font-bold text-ink-900 capitalize">{menu}</span>
              </div>
              <ul className="space-y-1.5 p-4">
                {(menu === "propiedades" ? propiedadesLinks : serviciosLinks).map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} onClick={closeMenu} className={NAV_MOBILE_ITEM}>{link.label}</Link>
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