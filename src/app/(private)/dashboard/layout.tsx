'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import { DashboardShell } from '@/modules/shared/ui/DashboardShell';
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
  label, icon: Icon, items,
}: {
  label: string;
  icon: React.ElementType;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const isChildActive = items.some((i) => pathname === i.href.split('?')[0]);
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
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Apertura con transición de alto real (grid 0fr→1fr) en vez de
          montar/desmontar de golpe. */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <ul className="mt-1 ml-5 space-y-0.5 overflow-hidden border-l border-gray-200 pl-3">
          {items.map((item) => {
            const active = pathname === item.href.split('?')[0];
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  tabIndex={open ? undefined : -1}
                  className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#0b7a4b]/12 font-semibold text-[#0b7a4b]'
                      : 'text-gray-500 hover:translate-x-0.5 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]'
                  }`}
                >
                  {item.label}
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

        <NavGroup
          label="Preferencias"
          icon={Settings}
          items={[
            { href: '/dashboard/preferencias', label: 'Ver y editar' },
            { href: '/dashboard/preferencias?nueva=1', label: 'Cargar preferencias' },
          ]}
        />

        <NavGroup
          label="Notificaciones"
          icon={Bell}
          items={[
            { href: '/dashboard/notificaciones', label: 'Todas' },
            { href: '/dashboard/notificaciones?tipo=precios', label: 'Bajaron de precio' },
            { href: '/dashboard/notificaciones?tipo=coincidencias', label: 'Según mis preferencias' },
            { href: '/dashboard/notificaciones?tipo=propiedades_nuevas', label: 'Propiedades nuevas' },
            { href: '/dashboard/notificaciones?tipo=publicaciones', label: 'Publicaciones nuevas' },
            { href: '/dashboard/notificaciones?tipo=respuestas', label: 'Respuestas a mis comentarios' },
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
      router.push('/login');
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