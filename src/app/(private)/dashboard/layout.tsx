'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import {
  User, Heart, Home, Settings, Bell, FileText,
  LogOut, ChevronRight, Pencil, ArrowLeft, Shield,
} from 'lucide-react';

// ── NAVEGACIÓN DEL SIDEBAR ────────────────────────────────────────────────────
const mainNavItems = [
  { href: '/dashboard/', label: 'Inicio', icon: Home },
  { href: '/dashboard/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/dashboard/mis-solicitudes', label: 'Mis Solicitudes', icon: FileText },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
];

const accountNavItems = [
  { href: '/dashboard/perfil', label: 'Editar Perfil', icon: Pencil },
  { href: '/dashboard/preferencias', label: 'Preferencias', icon: Settings },
];

// ── COMPONENTE NAVLINK ────────────────────────────────────────────────────────
function NavLink({ href, label, icon: Icon, isActive }: { href: string, label: string, icon: React.ElementType, isActive: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative
        ${isActive
          ? 'bg-linear-to-r from-[#0b7a4b] to-[#0f8c58] text-white shadow-md shadow-[#0b7a4b]/20'
          : 'text-gray-500 hover:bg-[#0b7a4b]/10 hover:text-[#0b7a4b]'
        }`}
    >
      {isActive && <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />}
      <Icon size={19} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#0b7a4b] transition-colors'} />
      <span className="flex-1">{label}</span>
      {isActive && <ChevronRight size={14} className="text-white/80" />}
    </Link>
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
      {/* Header — Logo + Back */}
      <div className="p-6 flex items-center justify-start">
        <Link 
          href="/" 
          className="p-2 rounded-lg bg-gray-100 text-[#0b7a4b] hover:bg-[#0b7a4b]/10 transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <Link href="/" className="transition-opacity hover:opacity-80 ml-7">
          <Image src="/LogoInmobiliaria.png" alt="Logo" width={140} height={40} className="w-32 h-auto" />
        </Link>
      </div>

      {/* Profile Card */}
      <div className="px-6 py-4 mb-2">
        <div className="p-4 rounded-2xl bg-[#0b7a4b]/10 border border-gray-100 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-white overflow-hidden ring-2 ring-[#0b7a4b]/20 shadow-sm">
              {user?.photo ? (
                <Image src={user.photo} alt={user.name} width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <User size={24} className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <h3 className="font-bold text-gray-900 leading-tight truncate w-full">
            {user?.name} {user?.surname}
          </h3>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold mt-1">Usuario</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1 mb-6">
          {/* Título de sección: Bold y Color Verde */}
          <p className="px-4 text-[11px] font-bold text-[#0b7a4b] uppercase tracking-widest mb-2">Menú Principal</p>
          {mainNavItems.map((item) => (
            <NavLink key={item.href} {...item} isActive={pathname === item.href} />
          ))}
        </div>

        <div className="space-y-1">
          {/* Título de sección: Bold y Color Verde */}
          <p className="px-4 text-[11px] font-bold text-[#0b7a4b] uppercase tracking-widest mb-2">Cuenta</p>
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