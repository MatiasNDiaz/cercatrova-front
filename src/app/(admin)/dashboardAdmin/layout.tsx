'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import {
  User, Home, FileText, LogOut, ChevronDown,
  ArrowLeft, Users, Building2, BarChart2, Bell, Eye, Megaphone,
} from 'lucide-react';
import api from '@/modules/shared/lib/axios';

// ── Tipos ─────────────────────────────────────────────
interface AdminNotif {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

type NotifType = 'nuevo_usuario' | 'nueva_solicitud' | 'valoracion' | 'comentario' | 'favorito' | 'generica';

function getNotifType(title: string, message: string): NotifType {
  const t = (title + ' ' + message).toLowerCase();
  if (t.includes('usuario registrado') || t.includes('se registró'))          return 'nuevo_usuario';
  if (t.includes('solicitud de publicación') || t.includes('solicitó'))       return 'nueva_solicitud';
  if (t.includes('valoración') || t.includes('estrella'))                     return 'valoracion';
  if (t.includes('comentó') || t.includes('comentario'))                      return 'comentario';
  if (t.includes('favorito') || t.includes('guardó'))                         return 'favorito';
  return 'generica';
}



// ── NavLink con badge ─────────────────────────────────
function NavLink({
  href, label, icon: Icon, isActive, badge = 0,
}: {
  href: string; label: string; icon: React.ElementType; isActive: boolean; badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200
        ${isActive
          ? 'bg-[#0b7a4b] text-white shadow-sm'
          : 'text-gray-500 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]'
        }`}
    >
      <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400 transition-colors group-hover:text-[#0b7a4b]'} />
      <span className="flex-1">{label}</span>
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
  label, icon: Icon, items, badge = 0,
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
        className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
          isChildActive ? 'bg-[#0b7a4b]/8 text-[#0b7a4b]' : 'text-gray-500 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]'
        }`}
      >
        <Icon size={18} className={isChildActive ? 'text-[#0b7a4b]' : 'text-gray-400 transition-colors group-hover:text-[#0b7a4b]'} />
        <span className="flex-1 text-left">{label}</span>
        {badge > 0 && (
          <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-black text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="mt-1 ml-5 space-y-0.5 border-l border-gray-200 pl-3">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href.split('?')[0]);
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${
                    active ? 'bg-[#0b7a4b]/10 text-[#0b7a4b]' : 'text-gray-500 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]'
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
      )}
    </div>
  );
}


// ── Sidebar ───────────────────────────────────────────
function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifs, setNotifs] = useState<AdminNotif[]>([]);

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
    usuarios:     unread.filter(n => getNotifType(n.title, n.message) === 'nuevo_usuario').length,
    solicitudes:  unread.filter(n => getNotifType(n.title, n.message) === 'nueva_solicitud').length,
    comentarios:  unread.filter(n => getNotifType(n.title, n.message) === 'comentario').length,
    valoraciones: unread.filter(n => getNotifType(n.title, n.message) === 'valoracion').length,
    favoritos:    unread.filter(n => getNotifType(n.title, n.message) === 'favorito').length,
    notificaciones: unread.length,
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
      variant: 'default',
      icon: LogOut,
      onConfirm: async () => {
        await logout();
      },
    });
  };

  return (
    // Sin logo ni tarjeta de perfil: esos datos ya están en la barra superior.
    // El sidebar queda solo con navegación, así entra sin scroll inicial.
    <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-gray-100 bg-white shadow-sm">
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

        <NavGroup
          label="Propiedades"
          icon={Building2}
          items={[
            { href: '/dashboardAdmin/propiedades/nueva', label: 'Publicar propiedad', exact: true },
            { href: '/dashboardAdmin/propiedades?accion=editar', label: 'Editar propiedades' },
            { href: '/dashboardAdmin/propiedades?accion=eliminar', label: 'Eliminar propiedades' },
            { href: '/properties', label: 'Ver catálogo público' },
          ]}
        />

        <NavGroup
          label="Publicaciones"
          icon={Megaphone}
          items={[
            { href: '/dashboardAdmin/publicaciones/nueva', label: 'Crear publicación', exact: true },
            { href: '/dashboardAdmin/publicaciones?accion=moderar', label: 'Editar y moderar' },
            { href: '/dashboardAdmin/publicaciones?accion=eliminar', label: 'Eliminar publicaciones' },
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
    </aside>
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

  return (
    <div className="h-screen overflow-hidden bg-surface-deep flex">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto pb-8">
        <div className="max-w-7xl mx-auto px-8 py-4">
          {children}
        </div>
      </main>
    </div>
  );
}