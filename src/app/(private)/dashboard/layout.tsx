'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
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

// ── COMPONENTE NAVLINK ────────────────────────────────────────────────────────
function NavLink({ href, label, icon: Icon, isActive }: { href: string, label: string, icon: React.ElementType, isActive: boolean }) {
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
        className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
          isChildActive ? 'bg-[#0b7a4b]/8 text-[#0b7a4b]' : 'text-gray-500 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]'
        }`}
      >
        <Icon size={18} className={isChildActive ? 'text-[#0b7a4b]' : 'text-gray-400 transition-colors group-hover:text-[#0b7a4b]'} />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="mt-1 ml-5 space-y-0.5 border-l border-gray-200 pl-3">
          {items.map((item) => {
            const active = pathname === item.href.split('?')[0];
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${
                    active ? 'bg-[#0b7a4b]/10 text-[#0b7a4b]' : 'text-gray-500 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
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
      variant: 'default',
      icon: LogOut,
      onConfirm: async () => {
        await logout();
      },
    });
  };

  return (
    <aside className="w-72 bg-white border-r rounded-tr-3xl mt-3.75 border-gray-100 flex flex-col h-screen sticky top-0 shadow-sm">
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
    </aside>
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

  return (
    <div className="h-screen overflow-hidden bg-surface-deep flex">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar pb-8">
        <div className="max-w-7xl mx-auto px-8 py-4">
          {children}
        </div>
      </main>
    </div>
  );
}