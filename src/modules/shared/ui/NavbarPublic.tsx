"use client";

import { useScrollToSection } from '@/modules/shared/ui/useScrollToSection';
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
import { usePathname } from "next/navigation";
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
    { label: "Terrenos", href: "/properties?typeOfPropertyId=4" },
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
    <>
    <nav className={`${NAV_SHELL} ${isVisible ? "translate-y-0" : "-translate-y-[130%]"}`}>
      {/* ── LOGO ── */}
      <button
        aria-label="Ir al inicio"
        onClick={() => scrollTo("inicio")}
        className="shrink-0 cursor-pointer transition-opacity duration-200 hover:opacity-80"
      >
        <Image
          src="/LogoInmobiliaria.png"
          alt="Cerca Trova"
          width={140}
          height={140}
          priority
          className="h-13 w-auto object-contain"
        />
      </button>

      {/* ── HAMBURGUESA MOBILE (< xl) ──
          La barra mobile queda con lo mínimo: logo + hamburguesa. "Iniciar
          sesión" NO va acá — vive solo dentro del cajón, como una opción más
          del menú, para no competir por el ancho de la barra.

          `ml-auto` empuja el botón al borde derecho: sin él, con la lista de
          escritorio oculta (`hidden xl:flex`), quedaba pegado al logo. */}
      <button
        onClick={toggleMenu}
        aria-label="Abrir navegación"
        aria-expanded={isMenuOpen}
        className="ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-xl text-brand-700 transition-colors duration-200 hover:bg-brand-50 active:scale-95 xl:hidden"
      >
        <Menu size={28} />
      </button>

      {/* ── DESKTOP NAV ──
          Orden: inicio · publicaciones · propiedades · servicios · nosotros ·
          consultas. "Publicaciones" es nuevo y entra a la izquierda de
          propiedades; "contacto" se quitó (sigue en el footer). */}
      <ul className="ml-auto mr-4 hidden flex-row items-center gap-1 xl:flex">
        <li>
          <NavLinkScroll sectionId="inicio" icon={<Home size={16} />} label="Inicio" />
        </li>

        <li>
          <Link href="/publicaciones" className={navItemClass(pathname === "/publicaciones")}>
            <Newspaper size={16} />
            Publicaciones
          </Link>
        </li>

        <li className="group relative">
          <span className={`${navItemClass(pathname.startsWith("/properties"))}`}>
            <Building2 size={16} />
            Propiedades
            <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />
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
          <span className={`${navItemClass(pathname.startsWith("/servicios"))}`}>
            <Briefcase size={16} />
            Servicios
            <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />
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
          <NavLinkScroll sectionId="nosotros" icon={<Users size={16} />} label="Nosotros" />
        </li>

        <li>
          <NavLinkScroll sectionId="faq" icon={<MessageCircle size={16} />} label="Consultas" />
        </li>

        <li className="ml-2">
          <Link href="/login" className={NAV_CTA}>
            <LogIn size={16} />
            Iniciar sesión
          </Link>
        </li>
      </ul>

    </nav>

      {/* ══════════════════════════════════════════════════════════════════
          OVERLAY + CAJÓN MOBILE — van FUERA del <nav> a propósito.

          Estaban adentro, y ahí `position: fixed` NO se medía contra la
          ventana. El <nav> lleva `translate-y-0` (para esconderse al
          scrollear), y cualquier valor de `transform`/`translate` distinto de
          `none` convierte al elemento en el bloque contenedor de sus
          descendientes fixed. Resultado: el cajón se posicionaba contra la
          BARRITA, no contra la pantalla —
            `top-0 right-0` → esquina de la navbar
            `h-full`        → 100% del alto de la navbar (~90px)
          y por eso se veía como una pastilla blanca corta arriba, con el
          resto del contenido (avatar, nombre, "cerrar sesión") desbordando
          sin fondo por encima del hero.

          Como hermanos del <nav>, ya no hay ancestro transformado y `fixed`
          vuelve a referirse a la ventana: el cajón ocupa el alto completo.
          ══════════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE: Overlay ── */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 xl:hidden z-60 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={toggleMenu} />

      {/* ── MOBILE: Drawer ──
          `overflow-hidden`: los dos submenús deslizables de adentro son
          `absolute inset-0 translate-x-full`, o sea que en reposo viven 300px a
          la derecha del cajón. Medido, el cajón tenía `clientWidth: 300` y
          `scrollWidth: 600`. Hoy eso no genera scroll en la página porque el
          cajón es `fixed` (y lo `fixed` no cuenta para el desborde del
          documento), pero es un desborde igual: alcanza con que algún ancestro
          gane un `transform` para que el cajón deje de ser fixed-respecto-al-
          viewport y ese medio ancho de pantalla pase a empujar la página.
          Recortarlo acá lo vuelve imposible por construcción. */}
      <div className={`fixed top-0 right-0 h-full w-75 overflow-hidden rounded-2xl rounded-tr-none bg-white shadow-2xl transform transition-transform duration-300 ease-out xl:hidden z-70 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
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
    </>
  );
};
