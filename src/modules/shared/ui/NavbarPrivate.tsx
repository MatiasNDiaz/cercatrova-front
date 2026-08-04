"use client";

import { useScrollToSection } from '@/modules/shared/ui/useScrollToSection';
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown, Menu, X, ArrowLeft, Home, Building2,
  LogOut, Bell, PlusSquare, User, LayoutDashboard, Shield,
  Newspaper, Briefcase, UsersRound, MessageCircle,
} from "lucide-react";
import {
  NAV_SHELL, NAV_ITEM, NAV_DROPDOWN, NAV_DROPDOWN_ITEM,
  NAV_MOBILE_ITEM, navItemClass,
} from "./navStyles";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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


/**
 * Campanita con contador de no leídas.
 *
 * Se renderiza DOS veces: dentro del `<ul>` de escritorio y en el cluster
 * mobile. Es el mismo componente en los dos casos a propósito — si fueran dos
 * bloques de JSX copiados, el badge podría quedar con estilos distintos o, peor,
 * alguien tocaría uno y no el otro.
 *
 * `min-h-11 min-w-11` (44px) para que sea cómodo de tocar con el pulgar: el
 * ícono solo con `p-2.5` daba un objetivo de ~41px.
 */
function NotificationBell({
  href, label, unreadCount,
}: {
  href: string; label: string; unreadCount: number;
}) {
  return (
    <Link
      href={href}
      aria-label={unreadCount > 0 ? `${label} (${unreadCount} sin leer)` : label}
      className="bell-hover relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-brand-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-800"
    >
      <Bell size={21} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-black text-white shadow-sm">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

/**
 * Contenido del panel de usuario: cabecera "conectado como" + Mi perfil +
 * Panel + Cerrar sesión.
 *
 * Lo usan el desplegable de escritorio y el de mobile. Es el mismo componente
 * en los dos para que no se separen (antes el bloque de escritorio era JSX
 * suelto y en mobile no existía: el avatar abría el cajón de navegación
 * completo, que en un teléfono de 430px se leía como un panel tapando el hero,
 * no como el menú de la cuenta).
 */
function UserPanelItems({
  user, isAdmin, perfilHref, dashboardHref, onNavigate, onLogout,
}: {
  // `surname` admite `null` porque así viene en el tipo `User` del contrato.
  user: { name?: string; surname?: string | null } | null;
  isAdmin: boolean;
  perfilHref: string;
  dashboardHref: string;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <li className="border-b border-gray-100 bg-[#0f8b57]/5 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
          </span>
          conectado como
        </p>
        <p className="mt-1 truncate text-[15px] font-bold text-[#0b7a4b]">
          {user?.name} {user?.surname ?? ""}
        </p>
        {isAdmin && (
          <div className="mt-1.5 flex w-fit items-center gap-1 rounded-full bg-[#0b7a4b] px-2 py-0.5 text-white">
            <Shield size={9} />
            <span className="text-[9px] font-black tracking-wider uppercase">Administrador</span>
          </div>
        )}
      </li>
      <li>
        <Link href={perfilHref} onClick={onNavigate}
          className="flex min-h-11 items-center gap-2.5 border-l-2 border-transparent px-4 py-3 text-sm font-medium text-[#0b7a4b] transition-all duration-200 hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10">
          <User size={19} className="shrink-0" />
          Mi perfil
        </Link>
      </li>
      <li>
        <Link href={dashboardHref} onClick={onNavigate}
          className="flex min-h-11 items-center gap-2.5 border-l-2 border-transparent px-4 py-3 text-sm font-medium text-[#0b7a4b] transition-all duration-200 hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10">
          <LayoutDashboard size={19} className="shrink-0" />
          {isAdmin ? 'Panel admin' : 'Panel de control'}
        </Link>
      </li>
      <li className="border-t border-gray-300" />
      <li>
        <button onClick={onLogout}
          className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-b-xl border-l-2 border-transparent px-4 py-3 text-sm font-semibold text-red-600 transition-all duration-200 hover:border-red-500 hover:bg-red-100">
          <LogOut size={19} className="shrink-0" />
          Cerrar sesión
        </button>
      </li>
    </>
  );
}

const propiedadesLinks = [
  { label: "Venta",     href: "/properties?operationType=venta" },
  { label: "Alquiler",  href: "/properties?operationType=alquiler" },
  { label: "Terrenos",  href: "/properties?typeOfPropertyId=5" },
  { label: "Ver todas", href: "/properties" },
];

// Mismos servicios que la navbar pública: el usuario logueado tiene que ver
// las mismas secciones del sitio que un visitante.
const serviciosLinks = [
  { label: "Venta de Propiedades",      href: "/servicios/venta" },
  { label: "Alquiler de Propiedades",   href: "/servicios/alquiler" },
  { label: "Tasaciones de Propiedades", href: "/servicios/tasaciones" },
  { label: "Asesoramiento Profesional", href: "/servicios/asesoramiento" },
  { label: "Publicamos tu propiedad",   href: "/servicios/comercializacion" },
];

export const NavbarPrivate = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  /** Panel de cuenta en mobile — independiente del cajón de navegación. */
  const [userPanelOpen, setUserPanelOpen] = useState(false);

  const { logout, user, isLoading } = useAuth();
  const scrollTo = useScrollToSection();
  const isVisible = useHideOnScroll();
  const pathname = usePathname();

  const isAdmin = user?.role === 'admin';

  // La barra superior muestra siempre las SECCIONES DEL SITIO (las mismas que
  // ve un visitante), tanto para el usuario común como para el admin: es la
  // navegación pública. Las secciones del panel viven en el sidebar del
  // dashboard, no acá.

  const dashboardHref = isAdmin ? '/dashboardAdmin' : '/dashboard';
  const perfilHref    = isAdmin ? '/dashboardAdmin/perfil' : '/dashboard/perfil';

  // El panel de cuenta se cierra al navegar (si no, quedaba abierto sobre la
  // pantalla nueva) y con Escape.
  useEffect(() => { setUserPanelOpen(false); }, [pathname]);

  useEffect(() => {
    if (!userPanelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setUserPanelOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [userPanelOpen]);

  // 👇 fetch según rol
 useEffect(() => {
  if (!user) return;
  // `/notifications/unread-count` devuelve solo el número y resuelve el rol
  // desde el token. Antes se pedía la LISTA COMPLETA cada 60s para contar en
  // JS los no leídos: eran decenas de filas viajando por la red, cada minuto y
  // por cada pestaña abierta, para pintar un badge.
  const fetchUnread = async () => {
    try {
      const { data } = await api.get<{ count: number }>('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch { /* silencioso */ }
  };
  fetchUnread();
  const interval = setInterval(fetchUnread, 60000);
  // Las acciones que marcan como leído emiten `notif-updated`; sin esto el
  // badge se quedaba desactualizado hasta el siguiente tick de 60s.
  window.addEventListener('notif-updated', fetchUnread);
  return () => {
    clearInterval(interval);
    window.removeEventListener('notif-updated', fetchUnread);
  };
}, [user]);

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
      variant: 'logout',
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

        {/* ── CLUSTER MOBILE (< xl) ──
            La campanita y el acceso al panel vivían DENTRO del `<ul>` de
            escritorio, que es `hidden xl:flex`: por debajo del breakpoint un
            usuario logueado se quedaba sin campanita y sin contador de no
            leídas en la barra — el único acceso era abrir el menú.

            Ahora la campanita se renderiza también acá (mismo componente
            `NotificationBell`, así el badge no puede quedar desincronizado), y
            el avatar es el que abre el menú: es un objetivo más grande y más
            reconocible que un ícono de hamburguesa, y el panel del usuario
            (perfil / panel de control / cerrar sesión) es lo primero que
            aparece dentro del cajón.

            `ml-auto` empuja el cluster al borde derecho: si no, con el `<ul>`
            oculto quedaba pegado al logo. */}
        <div className="ml-auto flex items-center gap-1 xl:hidden">
          <NotificationBell
            href={isAdmin ? "/dashboardAdmin/notificaciones" : "/dashboard/notificaciones"}
            label={isAdmin ? "Notificaciones del panel" : "Notificaciones"}
            unreadCount={unreadCount}
          />

          {/* ── PANEL DE CUENTA — anclado al avatar ──
              Antes el avatar abría el cajón de navegación completo: un panel
              de alto total sobre el borde derecho que, en un teléfono de
              430px, se leía como un bloque flotando encima del hero y no como
              el menú de la cuenta.

              Ahora es un desplegable anclado al propio botón
              (`relative` + `absolute top-full right-0`), igual que en
              escritorio: nace debajo del avatar y se alinea a su borde
              derecho, así que no puede aterrizar en cualquier lado de la
              pantalla. */}
          <div className="relative">
            <button
              onClick={() => { setUserPanelOpen(v => !v); setIsMenuOpen(false); }}
              aria-label="Abrir panel de cuenta"
              aria-expanded={userPanelOpen}
              aria-haspopup="menu"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors duration-200 hover:bg-brand-50 active:scale-95"
            >
              {!isLoading && user?.photo ? (
                <Image src={user.photo} alt="" width={34} height={34}
                  className="h-8.5 w-8.5 shrink-0 rounded-full object-cover ring-2 ring-brand-700/20" />
              ) : (
                <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#0f8b57] to-[#14a366] ring-2 ring-brand-700/20">
                  <User size={17} className="text-white" />
                </span>
              )}
            </button>

            {userPanelOpen && (
              <>
                <ul
                  role="menu"
                  className="absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-[0_20px_50px_-12px_rgba(10,12,11,0.45)] [animation:loader-in_.16s_ease-out_both]"
                >
                  <UserPanelItems
                    user={user ?? null}
                    isAdmin={isAdmin}
                    perfilHref={perfilHref}
                    dashboardHref={dashboardHref}
                    onNavigate={() => setUserPanelOpen(false)}
                    onLogout={() => { setUserPanelOpen(false); handleLogoutConfirm(); }}
                  />
                </ul>
              </>
            )}
          </div>

          {/* Hamburguesa — SOLO navegación del sitio, separada de la cuenta. */}
          <button
            onClick={() => { toggleMenu(); setUserPanelOpen(false); }}
            aria-label="Abrir navegación"
            aria-expanded={isMenuOpen}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-brand-700 transition-colors duration-200 hover:bg-brand-50 active:scale-95"
          >
            <Menu size={26} />
          </button>
        </div>

        {/* DESKTOP NAV — MISMAS secciones para usuario y admin:
            Inicio · Publicaciones · Propiedades · Servicios · Nosotros ·
            Consultas, más la campanita y el panel del avatar.
            Las secciones del panel de admin viven en su sidebar, no acá.
            "Contacto" sigue solo en el footer. */}
        <ul className="ml-auto mr-3 hidden flex-row items-center gap-0.5 xl:flex">
          <li>
            <button onClick={() => scrollTo("inicio")} className={NAV_ITEM}>
              <Home size={16} />
              Inicio
            </button>
          </li>

          <li>
            <Link href="/publicaciones" className={navItemClass(pathname === "/publicaciones")}>
              <Newspaper size={16} />
              Publicaciones
            </Link>
          </li>

          <li className="group relative">
            <span className={navItemClass(pathname.startsWith("/properties"))}>
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
            <span className={navItemClass(pathname.startsWith("/servicios"))}>
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
            <button onClick={() => scrollTo("nosotros")} className={NAV_ITEM}>
              <UsersRound size={16} />
              Nosotros
            </button>
          </li>

          <li>
            <button onClick={() => scrollTo("faq")} className={NAV_ITEM}>
              <MessageCircle size={16} />
              Consultas
            </button>
          </li>

          {/* Publicar tu propiedad: solo para usuarios comunes — el admin
              publica desde su panel, no manda solicitudes. */}
          {!isAdmin && (
            <li>
              <Link href="/publicar" className={navItemClass(pathname === "/publicar")}>
                <PlusSquare size={16} />
                Publicar
              </Link>
            </li>
          )}

          {/* Campanita — la ruta cambia según el rol */}
          <li>
            <NotificationBell
              href={isAdmin ? "/dashboardAdmin/notificaciones" : "/dashboard/notificaciones"}
              label={isAdmin ? "Notificaciones del panel" : "Notificaciones"}
              unreadCount={unreadCount}
            />
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

            <ul className="invisible absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-ink-100 bg-white opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <UserPanelItems
                user={user ?? null}
                isAdmin={isAdmin}
                perfilHref={perfilHref}
                dashboardHref={dashboardHref}
                onNavigate={() => {}}
                onLogout={handleLogoutConfirm}
              />
            </ul>
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
        {/* MOBILE: Overlay */}
        <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 xl:hidden z-60 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
          onClick={toggleMenu} />

        {/* MOBILE: Drawer */}
        <div className={`fixed top-0 right-0 h-full w-75 rounded-2xl rounded-tr-none bg-white shadow-2xl transform transition-transform duration-300 ease-out xl:hidden z-70 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
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
                {/* Mismas secciones que en escritorio, para usuario y admin */}
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
                  <button onClick={() => setActiveSubmenu("servicios")} className={`${NAV_MOBILE_ITEM} justify-between`}>
                    <span className="flex items-center gap-4">
                      <Briefcase size={22} className="shrink-0 text-brand-700" />
                      Servicios
                    </span>
                    <ArrowLeft size={16} className="rotate-180" />
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo("nosotros", closeMenu)} className={NAV_MOBILE_ITEM}>
                    <UsersRound size={22} className="shrink-0 text-brand-700" />
                    Nosotros
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo("faq", closeMenu)} className={NAV_MOBILE_ITEM}>
                    <MessageCircle size={22} className="shrink-0 text-brand-700" />
                    Consultas
                  </button>
                </li>
                {!isAdmin && (
                  <li>
                    <Link href="/publicar" onClick={closeMenu} className={NAV_MOBILE_ITEM}>
                      <PlusSquare size={22} className="shrink-0 text-brand-700" />
                      Publicar
                    </Link>
                  </li>
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

          {/* Submenús deslizables: propiedades y servicios */}
          {["propiedades", "servicios"].map((menu) => (
            <div
              key={menu}
              className={`absolute inset-0 z-80 rounded-2xl bg-white transition-transform duration-300 ${
                activeSubmenu === menu ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex items-center border-b border-ink-100 p-5 shadow-sm">
                <button onClick={() => setActiveSubmenu(null)} aria-label="Volver"
                  className="mr-2 rounded-full p-2 text-brand-700 transition-colors hover:bg-brand-50">
                  <ArrowLeft size={24} />
                </button>
                <span className="text-xl font-bold text-ink-900 capitalize">{menu}</span>
              </div>
              <ul className="space-y-1.5 p-4">
                {(menu === "propiedades" ? propiedadesLinks : serviciosLinks).map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} onClick={closeMenu} className={NAV_MOBILE_ITEM}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      {/* ── Fondo del panel de cuenta ──
          Va FUERA del `<nav>` a propósito. `NAV_SHELL` es `fixed z-50`, o sea
          que crea un contexto de apilamiento: un overlay puesto adentro queda
          atrapado ahí y termina oscureciendo también el logo y la campanita de
          la propia barra. Como hermano, con `z-40` (< 50), oscurece la página
          pero la navbar y su panel quedan nítidos por encima.

          Cumple dos funciones: separa visualmente el panel del contenido —era
          lo que se veía "atravesando" el hero— y captura el toque de afuera
          para cerrarlo. */}
      {userPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/40 xl:hidden [animation:loader-in_.16s_ease-out_both]"
          onClick={() => setUserPanelOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
};