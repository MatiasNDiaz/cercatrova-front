'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import { DashboardShell } from '@/modules/shared/ui/DashboardShell';
import { NotifCountBadge } from '@/modules/shared/ui/notifIndicators';
import api from '@/modules/shared/lib/axios';
import { loginUrlFromHere } from '@/modules/shared/lib/returnTo';
// Mismo clasificador que la pantalla de notificaciones — ver el docstring de
// `notifShared.ts` para por qué NO puede haber una segunda copia acá.
import { contarSinLeer, type UserNotification } from './notificaciones/notifShared';
import {
  Home, Settings, Bell, FileText, Building2,
  LogOut, ChevronDown, Pencil, ArrowLeft, Shield,
} from 'lucide-react';

// ── NAVEGACIÓN DEL SIDEBAR ────────────────────────────────────────────────────
// El menú principal se arma con `NavGroup` en el JSX; acá solo queda la
// sección "Cuenta", que es una lista plana.
const accountNavItems = [
  { href: '/dashboard/perfil', label: 'Editar Perfil', icon: Pencil },
  { href: '/dashboard/preferencias', label: 'Preferencias', icon: Settings },
];

/* Mismos estados que el sidebar del panel admin — se replican acá (y no se
   importan de allá) para no crear una dependencia del dashboard de usuario
   hacia el módulo de admin. Si cambia uno, cambiar los dos. */
const NAV_ITEM_BASE =
  'group relative flex w-full items-center gap-3 rounded-lg py-2.5 pr-3 pl-4 text-sm font-semibold transition-all duration-200 ease-out';

const NAV_ITEM_IDLE = 'text-gray-500 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b] hover:pl-5';

const NAV_ITEM_ACTIVE = 'bg-[#0b7a4b] text-white shadow-[0_6px_16px_-8px_rgba(11,122,75,0.8)]';

/**
 * Ruta actual COMPLETA (pathname + query string), normalizada.
 *
 * ── El bug que resuelve ─────────────────────────────────────────────────────
 * El resaltado de los subítems se calculaba con
 * `pathname === item.href.split('?')[0]`, es decir **tirando la query string a
 * la basura**. Los seis subítems de Notificaciones apuntan todos a
 * `/dashboard/notificaciones` y sólo se distinguen por `?tipo=`, así que al
 * colapsarlos al mismo pathname la condición daba `true` para los seis a la
 * vez: el grupo entero quedaba resaltado y era imposible ver en cuál estabas.
 *
 * Comparar la URL completa es lo único que distingue `?tipo=precios` de
 * `?tipo=respuestas`. Se ordenan los parámetros para que `?a=1&b=2` y
 * `?b=2&a=1` —la misma pantalla— no se consideren distintas.
 */
function useCurrentHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = new URLSearchParams(searchParams.toString());
  qs.sort();
  const s = qs.toString();
  return s ? `${pathname}?${s}` : pathname;
}

/** Igual que `useCurrentHref` pero sobre un `href` escrito a mano en el menú. */
function normalizeHref(href: string) {
  const [path, search = ''] = href.split('?');
  const qs = new URLSearchParams(search);
  qs.sort();
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/**
 * ¿Este ítem del menú corresponde a la pantalla en la que estoy?
 *
 * Un ítem con query propia sólo se enciende con esa query exacta. Uno sin
 * query se enciende con su pathname exacto —y NO cuando hay query—, así
 * `/notificaciones?tipo=precios` no ilumina también "Todas".
 */
function isItemActive(href: string, pathname: string, currentHref: string) {
  const normalizado = normalizeHref(href);
  if (normalizado.includes('?')) return currentHref === normalizado;
  return currentHref === normalizado || pathname.startsWith(`${normalizado}/`);
}

function NavAccent({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute top-1/2 left-0 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200 ease-out ${
        active ? 'h-7 bg-white' : 'h-0 bg-[#0b7a4b] group-hover:h-5'
      }`}
    />
  );
}

// ── COMPONENTE NAVLINK ────────────────────────────────────────────────────────
function NavLink({ href, label, icon: Icon, isActive }: { href: string, label: string, icon: React.ElementType, isActive: boolean }) {
  return (
    <Link href={href} className={`${NAV_ITEM_BASE} ${isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`}>
      <NavAccent active={isActive} />
      <Icon size={18} className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#0b7a4b]'}`} />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

/**
 * Grupo desplegable del menú lateral.
 * Arranca abierto si alguna ruta hija es la activa, para no ocultar dónde
 * estás parado al recargar en una subpágina.
 */
function NavGroup({
  label, icon: Icon, items, badge = 0,
}: {
  label: string;
  icon: React.ElementType;
  items: { href: string; label: string; badge?: number }[];
  /** Contador de no leídas. Mismo tratamiento que el badge del panel admin. */
  badge?: number;
}) {
  const pathname = usePathname();
  const currentHref = useCurrentHref();
  const isChildActive = items.some((i) => isItemActive(i.href, pathname, currentHref));
  const [open, setOpen] = useState(isChildActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`${NAV_ITEM_BASE} cursor-pointer ${
          isChildActive ? 'bg-[#0b7a4b]/10 text-[#0b7a4b]' : NAV_ITEM_IDLE
        }`}
      >
        <NavAccent active={isChildActive} />
        <Icon size={18} className={`shrink-0 transition-colors duration-200 ${isChildActive ? 'text-[#0b7a4b]' : 'text-gray-400 group-hover:text-[#0b7a4b]'}`} />
        <span className="flex-1 truncate text-left">{label}</span>
        <NotifCountBadge count={badge} variant="sidebar" />
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Apertura con transición de alto real (grid 0fr→1fr) en vez de
          montar/desmontar de golpe. */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <ul className="mt-1 ml-5 space-y-0.5 overflow-hidden border-l border-gray-200 pl-3">
          {items.map((item) => {
            const active = isItemActive(item.href, pathname, currentHref);
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  tabIndex={open ? undefined : -1}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#0b7a4b]/12 font-semibold text-[#0b7a4b]'
                      : 'text-gray-500 hover:translate-x-0.5 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]'
                  }`}
                >
                  <span className="flex-1">{item.label}</span>
                  <NotifCountBadge count={item.badge ?? 0} variant="sidebarSub" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  /**
   * Contador de notificaciones sin leer.
   *
   * ── El problema que resuelve ──────────────────────────────────────────────
   * El badge rojo vivía SOLO en `NavbarPrivate`, y `NavbarSelector` devuelve
   * `null` para todo lo que empiece con `/dashboard`. O sea: el usuario veía el
   * contador en el sitio público, entraba a su panel y desaparecía — justo en
   * la pantalla donde más lo necesita. El panel de admin sí lo tenía.
   *
   * Usa `GET /notifications/unread-count`, que devuelve `{ count }` y resuelve
   * el feed según el rol del token — no hace falta traerse la lista entera.
   * Mismo par de disparadores que el resto del sitio: polling de 60s + el
   * evento `notif-updated` que emiten las acciones de "marcar como leída",
   * para que el número baje al instante y no al minuto.
   */
  /**
   * ⚠️ Pasó de `GET /notifications/unread-count` a `GET /notifications`.
   *
   * `unread-count` devuelve sólo `{ count }` — alcanzaba cuando el sidebar
   * mostraba un único número en el grupo "Notificaciones". Ahora cada subítem
   * lleva su propio badge por categoría, y el backend no expone ese desglose
   * (es exactamente la misma limitación que ya obligaba al panel de admin a
   * traerse la lista completa, documentada en `CLAUDE.md`).
   *
   * El total sigue saliendo de la misma lista, así que el número del grupo y
   * el de sus hijos no pueden contradecirse.
   */
  const [notifs, setNotifs] = useState<UserNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get<UserNotification[]>('/notifications');
        setNotifs(Array.isArray(data) ? data : []);
      } catch { /* silencioso: el badge es informativo, no puede romper el panel */ }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    window.addEventListener('notif-updated', fetchNotifs);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notif-updated', fetchNotifs);
    };
  }, [user]);

  // Mismo helper que usa la pantalla de notificaciones: el badge del menú y el
  // del tab salen del mismo cálculo y no pueden decir números distintos.
  const sinLeer = contarSinLeer(notifs);

  const handleLogoutConfirm = () => {
    // El saludo se arma acá (no en el componente compartido) porque el nombre
    // es propio de este caso de uso.
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
    // Devuelve el CONTENIDO, no el `<aside>`: el contenedor (sidebar fijo en
    // desktop / cajón deslizante en mobile) lo pone `DashboardShell`.
    <div className="flex h-full min-h-0 flex-col">
      {/* Sin logo ni tarjeta de perfil: ya están en la barra superior. */}
      <div className="px-4 pt-5 pb-3">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]"
        >
          <ArrowLeft size={17} className="transition-transform group-hover:-translate-x-0.5" />
          Volver al inicio
        </Link>
      </div>

      {/* Navegación */}
      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        <p className="mb-2 px-4 text-[10px] font-bold tracking-[0.14em] text-[#0b7a4b] uppercase">
          Mi cuenta
        </p>

        <NavLink href="/dashboard" label="Inicio" icon={Home} isActive={pathname === '/dashboard'} />

        <NavGroup
          label="Mis propiedades"
          icon={Building2}
          items={[
            { href: '/dashboard/favoritos', label: 'Guardadas en favoritos' },
            { href: '/dashboard/valoradas', label: 'Que valoré' },
            { href: '/dashboard/comentadas', label: 'Que comenté' },
          ]}
        />

        {/* ⚠️ Acá vivía un grupo "Preferencias" (Ver y editar / Cargar
            preferencias) que duplicaba el acceso ya presente en la sección
            CUENTA de más abajo: los dos llevaban a `/dashboard/preferencias`.
            Se eliminó el de arriba y quedó sólo el de CUENTA, junto a "Editar
            Perfil", que es donde corresponde por tratarse de configuración de
            la cuenta.

            El link que se perdía era `?nueva=1`, que abre el formulario ya
            desplegado. No queda nada huérfano: la propia pantalla de
            preferencias tiene su botón de editar, y cuando el usuario todavía
            no cargó ninguna, abre el formulario sola. */}

        {/* Orden pedido: lo que se publica primero (propiedades, publicaciones),
            después lo personalizado (preferencias) y por último los avisos de
            cambio (precio). Mismo orden que las tarjetas de acceso rápido de la
            pantalla, para que el sidebar y el contenido no se contradigan.

            "Todas" NO lleva badge: su número ya está en la cabecera del grupo,
            justo arriba. */}
        <NavGroup
          label="Notificaciones"
          icon={Bell}
          badge={sinLeer.total}
          items={[
            { href: '/dashboard/notificaciones', label: 'Todas' },
            { href: '/dashboard/notificaciones?tipo=propiedades_nuevas', label: 'Propiedades nuevas', badge: sinLeer.propiedades_nuevas },
            { href: '/dashboard/notificaciones?tipo=publicaciones', label: 'Publicaciones nuevas', badge: sinLeer.publicaciones },
            { href: '/dashboard/notificaciones?tipo=coincidencias', label: 'Según mis preferencias', badge: sinLeer.coincidencias },
            { href: '/dashboard/notificaciones?tipo=precios', label: 'Bajaron de precio', badge: sinLeer.precios },
            { href: '/dashboard/notificaciones?tipo=respuestas', label: 'Respuestas a mis comentarios', badge: sinLeer.respuestas },
            // Los tres estados de solicitud faltaban acá — la pantalla de
            // notificaciones ya los tenía como tabs (`FilterTab` en
            // notificaciones/page.tsx) y `contarSinLeer()` ya los calculaba;
            // sólo no estaban expuestos como acceso directo del sidebar.
            // Mismas etiquetas que esos tabs, para que no haya dos nombres
            // distintos para la misma categoría.
            { href: '/dashboard/notificaciones?tipo=solicitudes_aceptadas', label: 'Aceptadas', badge: sinLeer.solicitudes_aceptadas },
            { href: '/dashboard/notificaciones?tipo=solicitudes_rechazadas', label: 'Rechazadas', badge: sinLeer.solicitudes_rechazadas },
            { href: '/dashboard/notificaciones?tipo=solicitudes_revision', label: 'En revisión', badge: sinLeer.solicitudes_revision },
          ]}
        />

        <NavLink
          href="/dashboard/mis-solicitudes"
          label="Mis solicitudes"
          icon={FileText}
          isActive={pathname === '/dashboard/mis-solicitudes'}
        />

        <div className="pt-4">
          <p className="mb-2 px-4 text-[10px] font-bold tracking-[0.14em] text-[#0b7a4b] uppercase">
            Cuenta
          </p>
          {accountNavItems.map((item) => (
            <NavLink key={item.href} {...item} isActive={pathname === item.href} />
          ))}
        </div>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 pb-10 mt-auto border-t border-gray-300 space-y-1">
        {/* Context switcher — solo para admins que están mirando la vista de usuario */}
        {user?.role === 'admin' && (
          <Link
            href="/dashboardAdmin"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-[#0b7a4b]/10 hover:text-[#0b7a4b] transition-all duration-200 group"
          >
            <Shield size={19} className="group-hover:scale-110 transition-transform" />
            Panel Admin
          </Link>
        )}
        <button
          onClick={handleLogoutConfirm}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#0b7a4b] bg-  hover:bg-red-100 hover:text-red-600 transition-all duration-200 group"
        >
          <LogOut size={19} className="group-hover:translate-x-1 transition-transform" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ── LAYOUT PRINCIPAL ──────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // `loginUrlFromHere` y no `/login` pelado: así el visitante que entró por
      // un link directo a una pantalla del dashboard vuelve a ESA pantalla al
      // loguearse. Es el mismo mecanismo que usan favoritos/comentarios/rating.
      router.push(loginUrlFromHere());
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#0b7a4b]/10 border-t-[#0b7a4b] animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Cargando tu espacio...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Igual que el panel admin: `DashboardShell` pone el chrome y el padding;
  // el ancho del contenido lo decide `DashboardPage`.
  return (
    <DashboardShell sidebar={<Sidebar />} label="Mi cuenta">
      {children}
    </DashboardShell>
  );
}