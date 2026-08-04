'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import {
  User, Home, FileText, LogOut, ChevronDown,
  ArrowLeft, Users, Building2, BarChart2, Bell, Eye, Megaphone
} from 'lucide-react';
import api from '@/modules/shared/lib/axios';
import { DashboardShell } from '@/modules/shared/ui/DashboardShell';

// ── Tipos ─────────────────────────────────────────────
// `AdminNotification` y `getNotifType` viven en `notificaciones/notifShared`:
// antes este archivo tenía SU PROPIA copia de la clasificación, con reglas
// levemente distintas a la de las pantallas de notificaciones ('solicitó' acá
// vs. 'solicitud para' allá). Eran dos heurísticas divergentes para lo mismo,
// así que los badges del sidebar podían no coincidir con lo que después
// mostraba la pantalla. Ahora clasifican con el campo `type` del backend, en un
// único lugar.
import { getNotifType, type AdminNotification } from './notificaciones/notifShared';



/**
 * Estados del menú lateral, compartidos por `NavLink` y por la cabecera de
 * `NavGroup` para que un ítem suelto y un grupo se vean exactamente igual.
 *
 * El hover antes era solo un cambio de color de texto, instantáneo y muy
 * flojo: no se percibía sobre qué ítem estabas parado. Ahora suma un fondo
 * verde tenue, una barra de acento a la izquierda que crece desde 0, y un
 * desplazamiento mínimo del contenido — con transición, no de golpe.
 */
export const NAV_ITEM_BASE =
  'group relative flex w-full items-center gap-3 rounded-lg py-2.5 pr-3 pl-4 text-sm font-semibold transition-all duration-200 ease-out';

export const NAV_ITEM_IDLE =
  'text-gray-500 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b] hover:pl-5';

export const NAV_ITEM_ACTIVE = 'bg-[#0b7a4b] text-white shadow-[0_6px_16px_-8px_rgba(11,122,75,0.8)]';

/** Barra de acento a la izquierda. Va dentro del ítem, como `<span>`. */
export function NavAccent({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute top-1/2 left-0 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200 ease-out ${
        active ? 'h-7 bg-white' : 'h-0 bg-[#0b7a4b] group-hover:h-5'
      }`}
    />
  );
}

// ── NavLink con badge ─────────────────────────────────
function NavLink({
  href, label, icon: Icon, isActive, badge = 0
}: {
  href: string; label: string; icon: React.ElementType; isActive: boolean; badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`${NAV_ITEM_BASE} ${isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`}
    >
      <NavAccent active={isActive} />
      <Icon size={18} className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#0b7a4b]'}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] leading-none font-black ${
          isActive ? 'bg-white text-[#0b7a4b]' : 'bg-red-500 text-white'
        }`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Grupo desplegable del menú lateral.
 *
 * Arranca abierto si alguna de sus rutas hijas es la activa, para que al
 * recargar en una subpágina el menú no aparezca colapsado ocultando dónde
 * estás parado.
 */
function NavGroup({
  label, icon: Icon, items, badge = 0
}: {
  label: string;
  icon: React.ElementType;
  items: { href: string; label: string; badge?: number; exact?: boolean }[];
  badge?: number;
}) {
  const pathname = usePathname();
  const isChildActive = items.some((i) =>
    i.exact ? pathname === i.href : pathname.startsWith(i.href.split('?')[0]),
  );
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
        {badge > 0 && (
          <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-black text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* `grid-rows-[0fr→1fr]` en vez de montar/desmontar: el submenú se abre y
          se cierra con transición real de alto, sin saltos. */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <ul className="mt-1 ml-5 space-y-0.5 overflow-hidden border-l border-gray-200 pl-3">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href.split('?')[0]);
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
                  {item.badge ? (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] leading-none font-black text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}


// ── Sidebar ───────────────────────────────────────────
function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifs, setNotifs] = useState<AdminNotification[]>([]);

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/admin');
      setNotifs(data);
    } catch { /* silencioso */ }
  }, []);

 useEffect(() => {
  fetchNotifs();
  const interval = setInterval(fetchNotifs, 60000);
  window.addEventListener('notif-updated', fetchNotifs); // 👈

  return () => {
    clearInterval(interval);
    window.removeEventListener('notif-updated', fetchNotifs); // 👈
  };
}, [fetchNotifs]);


  // Conteos por tipo — solo no leídas
  const unread = notifs.filter(n => !n.read);
  const counts = {
    usuarios:     unread.filter(n => getNotifType(n) === 'nuevo_usuario').length,
    solicitudes:  unread.filter(n => getNotifType(n) === 'nueva_solicitud').length,
    comentarios:  unread.filter(n => getNotifType(n) === 'comentario').length,
    valoraciones: unread.filter(n => getNotifType(n) === 'valoracion').length,
    favoritos:    unread.filter(n => getNotifType(n) === 'favorito').length,
    notificaciones: unread.length
  };

  // La navegación principal ahora se arma con `NavGroup` directamente en el
  // JSX (ver abajo); solo la sección "Cuenta" sigue siendo una lista plana.
  const accountNavItems = [
    { href: '/dashboardAdmin/perfil',       label: 'Mi Perfil',    icon: User,     badge: 0 },
    { href: '/dashboardAdmin/estadisticas', label: 'Estadísticas', icon: BarChart2, badge: 0 },
  ];

  const handleLogoutConfirm = () => {
    const nombre = user?.name?.trim();

    confirmDialog({
      title: '¿Ya te vas?',
      message: nombre
        ? `¡Esperamos verte pronto, ${nombre}! ¿Confirmás que querés cerrar sesión?`
        : '¿Confirmás que querés cerrar sesión?',
      confirmLabel: 'Sí, salir',
      cancelLabel: 'No, me quedo',
      variant: 'logout',
      onConfirm: async () => {
        await logout();
      }
    });
  };

  return (
    // Sin logo ni tarjeta de perfil: esos datos ya están en la barra superior.
    // El sidebar queda solo con navegación, así entra sin scroll inicial.
    //
    // Devuelve el CONTENIDO, no el `<aside>`: el contenedor (sidebar fijo en
    // desktop / cajón deslizante en mobile) lo pone `DashboardShell`, así el
    // mismo menú sirve para los dos casos sin duplicarlo.
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-4 pt-5 pb-3">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]"
        >
          <ArrowLeft size={17} className="transition-transform group-hover:-translate-x-0.5" />
          Volver al inicio
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        <p className="mb-2 px-4 text-[10px] font-bold tracking-[0.14em] text-[#0b7a4b] uppercase">
          Panel Admin
        </p>

        <NavLink
          href="/dashboardAdmin"
          label="Inicio"
          icon={Home}
          isActive={pathname === '/dashboardAdmin'}
        />

        {/* "Editar propiedades" y "Eliminar propiedades" eran dos accesos a la
            MISMA pantalla (el listado, que ya trae los botones Editar y
            Eliminar en cada fila); solo cambiaban un `?accion=` que resaltaba
            un botón. Duplicar el acceso para eso no aportaba nada, así que
            quedó un único "Gestionar propiedades". Mismo caso en Publicaciones
            con "Editar y moderar" / "Eliminar publicaciones". */}
        <NavGroup
          label="Propiedades"
          icon={Building2}
          items={[
            { href: '/dashboardAdmin/propiedades/nueva', label: 'Publicar propiedad', exact: true },
            { href: '/dashboardAdmin/propiedades', label: 'Gestionar propiedades', exact: true },
            { href: '/properties', label: 'Ver catálogo público' },
          ]}
        />

        <NavGroup
          label="Publicaciones"
          icon={Megaphone}
          items={[
            { href: '/dashboardAdmin/publicaciones/nueva', label: 'Crear publicación', exact: true },
            { href: '/dashboardAdmin/publicaciones', label: 'Gestionar publicaciones', exact: true },
          ]}
        />

        <NavGroup
          label="Notificaciones"
          icon={Bell}
          badge={counts.notificaciones}
          // Cada categoría es su propia página, no un filtro de la vista general.
          items={[
            { href: '/dashboardAdmin/notificaciones', label: 'Todas', badge: counts.notificaciones, exact: true },
            { href: '/dashboardAdmin/notificaciones/usuarios', label: 'Usuarios registrados', badge: counts.usuarios },
            { href: '/dashboardAdmin/notificaciones/solicitudes', label: 'Solicitudes de publicación', badge: counts.solicitudes },
            { href: '/dashboardAdmin/notificaciones/comentarios', label: 'Comentarios', badge: counts.comentarios },
            { href: '/dashboardAdmin/notificaciones/valoraciones', label: 'Valoraciones', badge: counts.valoraciones },
            { href: '/dashboardAdmin/notificaciones/favoritos', label: 'Favoritos', badge: counts.favoritos },
          ]}
        />

        <NavGroup
          label="Solicitudes"
          icon={FileText}
          badge={counts.solicitudes}
          items={[
            { href: '/dashboardAdmin/solicitudes', label: 'Todas', exact: true },
            { href: '/dashboardAdmin/solicitudes?estado=aceptado', label: 'Aceptadas' },
            { href: '/dashboardAdmin/solicitudes?estado=rechazado', label: 'Rechazadas' },
            { href: '/dashboardAdmin/solicitudes?estado=en_revision', label: 'En revisión' },
          ]}
        />

        <NavGroup
          label="Usuarios"
          icon={Users}
          badge={counts.usuarios}
          items={[
            { href: '/dashboardAdmin/usuarios', label: 'Todos los usuarios' },
            { href: '/dashboardAdmin/usuarios?rol=user', label: 'Solo usuarios' },
            { href: '/dashboardAdmin/usuarios?rol=admin', label: 'Solo administradores' },
          ]}
        />

        <div className="pt-4">
          <p className="mb-2 px-4 text-[10px] font-bold tracking-[0.14em] text-[#0b7a4b] uppercase">
            Cuenta
          </p>
          {accountNavItems.map((item) => (
            <NavLink key={item.href} {...item} isActive={pathname.startsWith(item.href)} />
          ))}
        </div>
      </nav>

      <div className="p-4 pb-7 mt-auto border-t border-gray-300 space-y-1">
        {/* Context switcher — el admin puede ver el sitio como un usuario común */}
        <Link
          href="/dashboard"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-[#0b7a4b]/10 hover:text-[#0b7a4b] transition-all duration-200 group"
        >
          <Eye size={19} className="group-hover:scale-110 transition-transform" />
          Vista de Usuario
        </Link>
        <button
          onClick={handleLogoutConfirm}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#0b7a4b] hover:bg-red-100 hover:text-red-600 transition-all duration-200 group"
        >
          <LogOut size={19} className="group-hover:translate-x-1 transition-transform" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); return; }
    if (!isLoading && user && user.role !== 'admin') router.push('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#0b7a4b]/10 border-t-[#0b7a4b] animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  // `DashboardShell` aporta el chrome (sidebar fijo ≥lg, cajón + barra
  // superior por debajo) y el padding lateral. El ancho del contenido lo sigue
  // decidiendo `DashboardPage` según sea listado o formulario.
  return (
    <DashboardShell sidebar={<Sidebar />} label="Panel Admin">
      {children}
    </DashboardShell>
  );
}