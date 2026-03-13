"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
  Home,
  Building2,
  LogOut,
  Bell,
  PlusSquare,
  User,
  LayoutDashboard,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

// ── HOOK: hide on scroll down, show on scroll up ──────────────────────────────
function useHideOnScroll() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 80) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }
      if (currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
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
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (pathname === "/") {
      scrollToEl();
    } else {
      router.push("/");
      setTimeout(scrollToEl, 600);
    }
  };
}

// ── DATA ──────────────────────────────────────────────────────────────────────
const propiedadesLinks = [
  { label: "Venta", href: "/properties?operationType=venta" },
  { label: "Alquiler", href: "/properties?operationType=alquiler" },
  { label: "Terrenos", href: "/properties?typeOfPropertyId=5" },
  { label: "Ver todas", href: "/properties" },
];

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export const NavbarPrivate = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const { logout, user, isLoading } = useAuth();
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

const handleLogoutConfirm = () => {
  closeMenu();
  toast.custom((t) => (
    <div className="flex flex-col items-center gap-6 bg-white rounded-4xl px-8 py-8 w-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-gray-50 transform transition-all">
      
      {/* Ícono con pulso suave */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></div>
        <div className="relative w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <LogOut size={28} className="text-emerald-700" />
        </div>
      </div>

      {/* Texto con mejor jerarquía */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-2xl font-black text-[#0b7a4b] pb-2 tracking-tight">
          ¿Ya te vas?
        </h3>
        <p className="text-[15px] text-gray-500 font-medium px-2">
          ¡Esperamos verte pronto, <span className="text-emerald-600 font-bold">{user?.name || "Matias"}</span>! 
          ¿Confirmás que querés cerrar tu sesión?
        </p>
      </div>

      {/* Botones Distribuidos */}
     <div className="flex gap-3 w-full mt-2">
  {/* Botón principal — "No, me quedo" destacado para que el usuario se quede */}
  <button
    onClick={() => toast.dismiss(t)}
    className="flex-1 py-4 text-[15px] font-bold text-white rounded-2xl transition-all duration-300 active:scale-95 cursor-pointer shadow-[0_8px_20px_rgba(15,139,87,0.35)] hover:shadow-[0_4px_10px_rgba(15,139,87,0.2)] hover:brightness-110 hover:-translate-y-0.5"
    style={{ background: "linear-gradient(135deg, #0f8b57, #14a366)" }}
  >
    No, me quedo 
  </button>

  {/* Botón secundario — "Sí, salir" apagado para desincentivar */}
  <button
    onClick={() => { toast.dismiss(t); logout(); }}
    className="flex-1 py-4 text-[15px] font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 hover:text-gray-600 rounded-2xl transition-all duration-300 active:scale-95 cursor-pointer"
  >
    Sí, salir
  </button>
</div>
    </div>
  ), {
    duration: 5000,
  position: "top-center",
  unstyled: true,
  style: {
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: 0,
  },
  });
};

  return (
    <>
      <style>{`
        @keyframes bell-shake {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(18deg); }
          30%  { transform: rotate(-16deg); }
          45%  { transform: rotate(12deg); }
          60%  { transform: rotate(-8deg); }
          75%  { transform: rotate(4deg); }
          90%  { transform: rotate(-2deg); }
          100% { transform: rotate(0deg); }
        }
        .bell-hover:hover svg {
          animation: bell-shake 0.6s ease;
        }
      `}</style>

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
            <Image
              src="/LogoInmobiliaria.png"
              alt="Logo Cerca Trova"
              width={115}
              height={130}
              className="bg-white w-30 object-contain border md:w-30 ml-4 md:ml-8 rounded-full"
            />
          </button>
        </div>

        {/* ── HAMBURGUESA MOBILE ── */}
        <button
          onClick={toggleMenu}
          aria-label="Abrir navegación"
          className="md:hidden p-2 rounded-2xl mr-2 text-[#0b7a4b] hover:bg-[#0f8b57]/10 active:scale-95 transition-transform"
        >
          <Menu size={30} />
        </button>

        {/* ── DESKTOP NAV — mismos valores que NavbarPublic: gap-4, text-lg, mr-8, iconos size=18 ── */}
        <ul className="hidden md:flex flex-row gap-4 items-center ml-auto mr-8">

          {/* Inicio */}
          <li>
            <button
              onClick={() => scrollTo("inicio")}
              className="group relative px-3 py-3.5 text-lg font-semibold text-[#0b7a4b] transition-colors duration-300 cursor-pointer"
            >
              <span className="relative group-hover:text-[#0f8b57] transition-colors duration-300">
                <Home size={18} className="inline mr-2 mb-0.5" />
                inicio
              </span>
              <span className="absolute -bottom-1 left-3 w-19 h-0.5 bg-linear-to-r from-[#0f8b57] to-[#14a366] origin-right scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
            </button>
          </li>

          {/* Propiedades — dropdown idéntico al público */}
          <li className="relative group">
            <span className="flex items-center text-lg font-semibold text-[#0b7a4b] p-2 cursor-pointer">
              <Building2 size={18} className="inline mr-2 mt-1" />
              propiedades
              <ChevronDown className="w-4 h-4 ml-1 mt-1 transition-transform group-hover:rotate-180" />
            </span>
            <ul className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {propiedadesLinks.map((link, i) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300
                      ${i === 0 ? "rounded-tl-xl rounded-tr-xl" : ""}
                      ${i === propiedadesLinks.length - 1 ? "rounded-b-xl" : ""}
                    `}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          {/* Publicar propiedad */}
          <li>
            <Link
              href="/publicar"
              className="group relative px-3 py-3.5 text-lg font-semibold text-[#0b7a4b] transition-colors duration-300"
            >
              <span className="relative group-hover:text-[#0f8b57] transition-colors duration-300">
                <PlusSquare size={18} className="inline mr-2 mb-0.5" />
                publicar propiedad
              </span>
              <span className="absolute -bottom-1 left-3 w-[calc(100%-24px)] h-0.5 bg-linear-to-r from-[#0f8b57] to-[#14a366] origin-right scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
            </Link>
          </li>

          {/* Notificaciones — shake on hover */}
          <li>
            <Link
              href="/notificaciones"
              aria-label="Notificaciones"
              className="bell-hover relative p-2 flex items-center text-[#0b7a4b] hover:text-[#0f8b57] hover:bg-[#0f8b57]/10 rounded-full transition-all duration-300"
            >
              <Bell size={22} />
            </Link>
          </li>

          {/* ── AVATAR + NOMBRE + DROPDOWN ── */}
          <li className="relative group pl-2 border-l border-gray-200">
            <button className="flex items-center gap-2 p-2 rounded-full hover:bg-[#0f8b57]/10 transition-all duration-300 cursor-pointer">
              {/* Avatar */}
              {!isLoading && user?.photo ? (
                <Image
                  src={user.photo}
                  alt="Avatar"
                  width={34}
                  height={34}
                  className="rounded-full object-cover shrink-0 ring-2 ring-[#0b7a4b]/20"
                />
              ) : (
                <div className="w-8.5 h-8.5 rounded-full bg-linear-to-br from-[#0f8b57] to-[#14a366] flex items-center justify-center shrink-0 ring-2 ring-[#0b7a4b]/20">
                  <User size={17} className="text-white" />
                </div>
              )}
              {/* Nombre o skeleton */}
              {isLoading ? (
                <span className="w-20 h-4 rounded-full bg-[#0b7a4b]/15 animate-pulse inline-block" />
              ) : (
                <span className="text-lg font-semibold text-[#0b7a4b] max-w-30 truncate">
                  {user?.name ?? "Mi cuenta"}
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-[#0b7a4b] transition-transform duration-300 group-hover:rotate-180 shrink-0" />
            </button>

            {/* Dropdown */}
            <ul className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl  border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <li className="px-4 py-3 border-b border-gray-100 bg-[#0f8b57]/5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
  <span className="relative flex h-1.5 w-1.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
  </span>
  conectado como
</p>
<p className="text-[15px] font-bold text-[#0b7a4b] truncate mt-1">
  {user?.name} {user?.surname ?? "Usuario"}
</p>
              </li>
              <li>
                <Link href="/dashboard/perfil" className="flex items-center  border-l-2 border-transparent hover:border-[#0b7a4b] gap-2.5 px-4 py-3 text-sm text-[#0b7a4b] font-medium hover:bg-[#0f8b57]/10 transition-all duration-200">
                  <User size={19} className="shrink-0" />
                  Mi perfil
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="flex items-center gap-2.5 px-4  border-l-2 border-transparent hover:border-[#0b7a4b] py-3 text-sm text-[#0b7a4b] font-medium hover:bg-[#0f8b57]/10 transition-all duration-200">
                  <LayoutDashboard size={19} className="shrink-0" />
                  Panel de control
                </Link>
              </li>
              <li className="border-t border-gray-300" />
              <li>
                <button
                  onClick={handleLogoutConfirm}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-b-xl  border-l-2 border-transparent hover:border-red-500 text-sm text-red-600 font-semibold hover:bg-red-100 transition-all duration-200 cursor-pointer"
                >
                  <LogOut size={19} className="shrink-0" />
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </li>

        </ul>

        {/* ── MOBILE: Overlay ── */}
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden z-60 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
          onClick={toggleMenu}
        />

        {/* ── MOBILE: Drawer ── */}
        <div
          className={`fixed top-0 right-0 h-full w-75 rounded-2xl rounded-tr-none bg-white shadow-2xl transform transition-transform duration-300 ease-out md:hidden z-70 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex flex-col h-full">

            {/* Header drawer */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 shadow-md">
              {isLoading ? (
                <span className="w-32 h-5 rounded-full bg-[#0b7a4b]/15 animate-pulse inline-block" />
              ) : (
                <div className="flex items-center gap-3">
                  {user?.photo ? (
                    <Image src={user.photo} alt="Avatar" width={36} height={36} className="rounded-full object-cover ring-2 ring-[#0b7a4b]/20" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0f8b57] to-[#14a366] flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                  <span className="font-bold text-[#0b7a4b] text-xl truncate max-w-32.5">
                    {user?.name ?? "Mi Cuenta"}
                  </span>
                </div>
              )}
              <button
                onClick={closeMenu}
                aria-label="Cerrar navegación"
                className="p-2 text-white bg-[#0d9f62] hover:bg-[#0b7a4b] transition-colors rounded-full"
              >
                <X size={25} />
              </button>
            </div>

            {/* Links mobile */}
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => scrollTo("inicio", closeMenu)}
                    className="w-full flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b"
                  >
                    <Home size={24} className="text-[#0b7a4b] shrink-0" />
                    <span className="ml-4">inicio</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSubmenu("propiedades")}
                    className="w-full flex items-center justify-between p-4 text-xl border-b font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors"
                  >
                    <div className="flex items-center">
                      <Building2 size={24} className="text-[#0b7a4b] shrink-0" />
                      <span className="ml-4">propiedades</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 ml-3 rotate-180" />
                  </button>
                </li>
                <li>
                  <Link
                    href="/publicar"
                    onClick={closeMenu}
                    className="flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b"
                  >
                    <PlusSquare size={24} className="text-[#0b7a4b] shrink-0" />
                    <span className="ml-4">publicar propiedad</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/notificaciones"
                    onClick={closeMenu}
                    className="flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b"
                  >
                    <Bell size={24} className="text-[#0b7a4b] shrink-0" />
                    <span className="ml-4">notificaciones</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/perfil"
                    onClick={closeMenu}
                    className="flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b"
                  >
                    <User size={24} className="text-[#0b7a4b] shrink-0" />
                    <span className="ml-4">mi perfil</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Botón cerrar sesión mobile */}
            <div className="flex justify-center items-center p-6 border-t border-gray-500">
              <button
                onClick={handleLogoutConfirm}
                className="relative overflow-hidden w-full flex items-center justify-center py-4 bg-linear-to-r from-[#0f8b57] to-[#14a366] hover:from-[#0d7a4d] hover:to-[#0f8b57] text-white font-bold text-lg rounded-2xl shadow-lg active:scale-[0.97] transition-all duration-300 group cursor-pointer"
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <LogOut size={22} className="mr-2 transition-transform group-hover:-translate-y-0.5" />
                <span className="tracking-wide">cerrar sesión</span>
              </button>
            </div>

          </div>

          {/* ── SUBMENÚ DESLIZABLE: Propiedades ── */}
          <div
            className={`absolute inset-0 rounded-2xl bg-white z-80 transition-transform duration-300 ${activeSubmenu === "propiedades" ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex items-center p-5 border-b border-gray-100 shadow-md">
              <button
                onClick={() => setActiveSubmenu(null)}
                aria-label="Volver"
                className="p-2 mr-2 text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-full"
              >
                <ArrowLeft size={24} />
              </button>
              <span className="font-bold text-[#0b7a4b] text-xl">propiedades</span>
            </div>
            <ul className="p-4 space-y-3">
              {propiedadesLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className="block p-4 text-lg text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </nav>
    </>
  );
};