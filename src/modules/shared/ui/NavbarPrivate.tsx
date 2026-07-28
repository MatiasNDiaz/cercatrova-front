"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown, Menu, X, ArrowLeft, Home, Building2,
  LogOut, Bell, PlusSquare, User, LayoutDashboard, Shield,
  Newspaper, Users, ClipboardList,
} from "lucide-react";
import {
  NAV_SHELL, NAV_ITEM, NAV_DROPDOWN, NAV_DROPDOWN_ITEM,
  NAV_MOBILE_ITEM, navItemClass,
} from "./navStyles";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { confirmDialog } from "@/modules/shared/ui/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import api from "@/modules/shared/lib/axios";

function useHideOnScroll() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 80) { setIsVisible(true); lastScrollY.current = currentScrollY; return; }
      setIsVisible(currentScrollY <= lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return isVisible;
}

function useScrollToSection() {
  const router = useRouter();
  const pathname = usePathname();
  return (sectionId: string, closeMenu?: () => void) => {
    closeMenu?.();
    const scrollToEl = () => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (pathname === "/") scrollToEl();
    else { router.push("/"); setTimeout(scrollToEl, 600); }
  };
}

const propiedadesLinks = [
  { label: "Venta",     href: "/properties?operationType=venta" },
  { label: "Alquiler",  href: "/properties?operationType=alquiler" },
  { label: "Terrenos",  href: "/properties?typeOfPropertyId=5" },
  { label: "Ver todas", href: "/properties" },
];

export const NavbarPrivate = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { logout, user, isLoading } = useAuth();
  const scrollTo = useScrollToSection();
  const isVisible = useHideOnScroll();
  const pathname = usePathname();

  const isAdmin = user?.role === 'admin';

  // Enlaces del admin en la barra superior: los mismos cuatro que el sidebar
  // del panel, para que la navegación sea la misma esté donde esté.
  const adminLinks = [
    { label: 'Inicio',      href: '/dashboardAdmin',                  icon: LayoutDashboard },
    { label: 'Publicar',    href: '/dashboardAdmin/propiedades/nueva', icon: PlusSquare },
    { label: 'Usuarios',    href: '/dashboardAdmin/usuarios',          icon: Users },
    { label: 'Solicitudes', href: '/dashboardAdmin/solicitudes',       icon: ClipboardList },
  ];

  const dashboardHref = isAdmin ? '/dashboardAdmin' : '/dashboard';
  const perfilHref    = isAdmin ? '/dashboardAdmin/perfil' : '/dashboard/perfil';

  // 👇 fetch según rol
 useEffect(() => {
  if (!user) return;
  const fetchUnread = async () => {
    try {
      const endpoint = user.role === 'admin' ? '/notifications/admin' : '/notifications'; // 👈 directo, sin isAdmin
      const { data } = await api.get(endpoint);
      setUnreadCount(data.filter((n: { read: boolean }) => !n.read).length);
    } catch { /* silencioso */ }
  };
  fetchUnread();
  const interval = setInterval(fetchUnread, 60000);
  return () => clearInterval(interval);
}, [user]); // 👈 solo user, sin isAdmin

  const toggleMenu = () => { setIsMenuOpen(p => !p); setActiveSubmenu(null); };
  const closeMenu  = () => { setIsMenuOpen(false);   setActiveSubmenu(null); };

  const handleLogoutConfirm = () => {
    closeMenu();
    const nombre = user?.name?.trim();

    confirmDialog({
      title: '¿Ya te vas?',
      message: nombre
        ? `¡Esperamos verte pronto, ${nombre}! ¿Confirmás que querés cerrar tu sesión?`
        : '¿Confirmás que querés cerrar tu sesión?',
      confirmLabel: 'Sí, salir',
      cancelLabel: 'No, me quedo',
      variant: 'default',
      icon: LogOut,
      onConfirm: async () => {
        await logout();
      },
    });
  };

  return (
    <>
      <style>{`
        @keyframes bell-shake {
          0%{transform:rotate(0deg)}15%{transform:rotate(18deg)}30%{transform:rotate(-16deg)}
          45%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}75%{transform:rotate(4deg)}
          90%{transform:rotate(-2deg)}100%{transform:rotate(0deg)}
        }
        .bell-hover:hover svg { animation: bell-shake 0.6s ease; }
      `}</style>

      <nav className={`${NAV_SHELL} ${isVisible ? "translate-y-0" : "-translate-y-[130%]"}`}>

        {/* LOGO */}
        <div className="flex items-center">
          <button aria-label="Ir al inicio" onClick={() => scrollTo("inicio")} className="cursor-pointer">
            <Image src="/LogoInmobiliaria.png" alt="Logo Cerca Trova" width={115} height={130}
              className="bg-white w-30 object-contain border md:w-30 ml-4 md:ml-8 rounded-full" />
          </button>
        </div>

        {/* HAMBURGUESA MOBILE */}
        <button onClick={toggleMenu} aria-label="Abrir navegación"
          className="mr-2 rounded-2xl p-2 text-brand-700 transition-all duration-200 hover:bg-brand-50 active:scale-95 md:hidden">
          <Menu size={30} />
        </button>

        {/* DESKTOP NAV
            · Admin  → Inicio · Publicar · Usuarios · Solicitudes (+ campanita)
            · Usuario → Inicio · Publicaciones · Propiedades · Publicar (+ campanita)
            "Contacto" se quitó de ambas; sigue en el footer. */}
        <ul className="ml-auto mr-4 hidden flex-row items-center gap-1 md:flex">

          {isAdmin ? (
            adminLinks.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className={navItemClass(pathname === href)}>
                  <Icon size={17} />
                  {label}
                </Link>
              </li>
            ))
          ) : (
            <>
              <li>
                <button onClick={() => scrollTo("inicio")} className={NAV_ITEM}>
                  <Home size={17} />
                  Inicio
                </button>
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

              <li>
                <Link href="/publicar" className={navItemClass(pathname === "/publicar")}>
                  <PlusSquare size={17} />
                  Publicar
                </Link>
              </li>
            </>
          )}

          {/* Campanita — la ruta cambia según el rol */}
          <li>
            <Link
              href={isAdmin ? "/dashboardAdmin/notificaciones" : "/dashboard/notificaciones"}
              aria-label={isAdmin ? "Notificaciones del panel" : "Notificaciones"}
              className="bell-hover relative ml-1 flex items-center rounded-full p-2.5 text-brand-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-800"
            >
              <Bell size={21} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-black text-white shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          </li>

          {/* AVATAR + DROPDOWN */}
          <li className="relative group pl-2 border-l border-gray-200">
            <button className="flex items-center gap-2 p-2 rounded-full hover:bg-[#0f8b57]/10 transition-all duration-300 cursor-pointer">
              {!isLoading && user?.photo ? (
                <Image src={user.photo} alt="Avatar" width={34} height={34}
                  className="rounded-full object-cover shrink-0 ring-2 ring-[#0b7a4b]/20" />
              ) : (
                <div className="w-8.5 h-8.5 rounded-full bg-linear-to-br from-[#0f8b57] to-[#14a366] flex items-center justify-center shrink-0 ring-2 ring-[#0b7a4b]/20">
                  <User size={17} className="text-white" />
                </div>
              )}
              {isLoading ? (
                <span className="w-20 h-4 rounded-full bg-[#0b7a4b]/15 animate-pulse inline-block" />
              ) : (
                <span className="text-lg font-semibold text-[#0b7a4b] max-w-30 truncate">
                  {user?.name ?? "Mi cuenta"}
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-[#0b7a4b] transition-transform duration-300 group-hover:rotate-180 shrink-0" />
            </button>

            <ul className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <li className="px-4 py-3 border-b border-gray-100 bg-[#0f8b57]/5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                  conectado como
                </p>
                <p className="text-[15px] font-bold text-[#0b7a4b] truncate mt-1">
                  {user?.name} {user?.surname ?? ""}
                </p>
                {isAdmin && (
                  <div className="flex items-center gap-1 mt-1.5 w-fit px-2 py-0.5 rounded-full bg-[#0b7a4b] text-white">
                    <Shield size={9} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Administrador</span>
                  </div>
                )}
              </li>
              <li>
                <Link href={perfilHref}
                  className="flex items-center border-l-2 border-transparent hover:border-[#0b7a4b] gap-2.5 px-4 py-3 text-sm text-[#0b7a4b] font-medium hover:bg-[#0f8b57]/10 transition-all duration-200">
                  <User size={19} className="shrink-0" />
                  Mi perfil
                </Link>
              </li>
              <li>
                <Link href={dashboardHref}
                  className="flex items-center gap-2.5 px-4 border-l-2 border-transparent hover:border-[#0b7a4b] py-3 text-sm text-[#0b7a4b] font-medium hover:bg-[#0f8b57]/10 transition-all duration-200">
                  <LayoutDashboard size={19} className="shrink-0" />
                  {isAdmin ? 'Panel admin' : 'Panel de control'}
                </Link>
              </li>
              <li className="border-t border-gray-300" />
              <li>
                <button onClick={handleLogoutConfirm}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-b-xl border-l-2 border-transparent hover:border-red-500 text-sm text-red-600 font-semibold hover:bg-red-100 transition-all duration-200 cursor-pointer">
                  <LogOut size={19} className="shrink-0" />
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </li>
        </ul>

        {/* MOBILE: Overlay */}
        <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden z-60 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
          onClick={toggleMenu} />

        {/* MOBILE: Drawer */}
        <div className={`fixed top-0 right-0 h-full w-75 rounded-2xl rounded-tr-none bg-white shadow-2xl transform transition-transform duration-300 ease-out md:hidden z-70 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col h-full">

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
                  <div>
                    <span className="font-bold text-[#0b7a4b] text-xl truncate max-w-32.5 block">
                      {user?.name ?? "Mi Cuenta"}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-black text-[#0b7a4b] uppercase tracking-wider">Administrador</span>
                    )}
                  </div>
                </div>
              )}
              <button onClick={closeMenu} aria-label="Cerrar navegación"
                className="p-2 text-white bg-[#0d9f62] hover:bg-[#0b7a4b] transition-colors rounded-full">
                <X size={25} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1.5">
                {isAdmin ? (
                  // Admin: los mismos 4 accesos que la barra de escritorio
                  adminLinks.map(({ label, href, icon: Icon }) => (
                    <li key={href}>
                      <Link href={href} onClick={closeMenu} className={NAV_MOBILE_ITEM}>
                        <Icon size={22} className="shrink-0 text-brand-700" />
                        {label}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <button onClick={() => scrollTo("inicio", closeMenu)} className={NAV_MOBILE_ITEM}>
                        <Home size={22} className="shrink-0 text-brand-700" />
                        Inicio
                      </button>
                    </li>
                    <li>
                      <Link href="/publicaciones" onClick={closeMenu} className={NAV_MOBILE_ITEM}>
                        <Newspaper size={22} className="shrink-0 text-brand-700" />
                        Publicaciones
                      </Link>
                    </li>
                    <li>
                      <button onClick={() => setActiveSubmenu("propiedades")} className={`${NAV_MOBILE_ITEM} justify-between`}>
                        <span className="flex items-center gap-4">
                          <Building2 size={22} className="shrink-0 text-brand-700" />
                          Propiedades
                        </span>
                        <ArrowLeft size={16} className="rotate-180" />
                      </button>
                    </li>
                    <li>
                      <Link href="/publicar" onClick={closeMenu} className={NAV_MOBILE_ITEM}>
                        <PlusSquare size={22} className="shrink-0 text-brand-700" />
                        Publicar
                      </Link>
                    </li>
                  </>
                )}

                {/* Campanita mobile — una sola, la ruta cambia según el rol
                    (antes estaba duplicada en dos bloques idénticos) */}
                <li>
                  <Link
                    href={isAdmin ? "/dashboardAdmin/notificaciones" : "/dashboard/notificaciones"}
                    onClick={closeMenu}
                    className={`${NAV_MOBILE_ITEM} justify-between`}
                  >
                    <span className="flex items-center gap-4">
                      <span className="relative shrink-0">
                        <Bell size={22} className="text-brand-700" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4.25 min-w-4.25 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] leading-none font-black text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </span>
                      Notificaciones
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500">
                        {unreadCount} sin leer
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link href={dashboardHref} onClick={closeMenu}
                    className="flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b">
                    <LayoutDashboard size={24} className="text-[#0b7a4b] shrink-0" />
                    <span className="ml-4">{isAdmin ? 'Panel admin' : 'mi panel'}</span>
                  </Link>
                </li>

                <li>
                  <Link href={perfilHref} onClick={closeMenu}
                    className="flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b">
                    <User size={24} className="text-[#0b7a4b] shrink-0" />
                    <span className="ml-4">mi perfil</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="flex justify-center items-center p-6 border-t border-gray-500">
              <button onClick={handleLogoutConfirm}
                className="relative overflow-hidden w-full flex items-center justify-center py-4 bg-linear-to-r from-[#0f8b57] to-[#14a366] hover:from-[#0d7a4d] hover:to-[#0f8b57] text-white font-bold text-lg rounded-2xl shadow-lg active:scale-[0.97] transition-all duration-300 group cursor-pointer">
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <LogOut size={22} className="mr-2 transition-transform group-hover:-translate-y-0.5" />
                <span className="tracking-wide">cerrar sesión</span>
              </button>
            </div>
          </div>

          <div className={`absolute inset-0 rounded-2xl bg-white z-80 transition-transform duration-300 ${activeSubmenu === "propiedades" ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex items-center p-5 border-b border-gray-100 shadow-md">
              <button onClick={() => setActiveSubmenu(null)} aria-label="Volver"
                className="p-2 mr-2 text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-full">
                <ArrowLeft size={24} />
              </button>
              <span className="font-bold text-[#0b7a4b] text-xl">propiedades</span>
            </div>
            <ul className="p-4 space-y-3">
              {propiedadesLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} onClick={closeMenu}
                    className="block p-4 text-lg text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]">
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