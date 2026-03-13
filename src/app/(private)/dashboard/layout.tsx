'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User, Heart,Home, Settings, Bell, FileText,
  LogOut, ChevronRight,
} from 'lucide-react';

// ── NAVEGACIÓN DEL SIDEBAR ────────────────────────────────────────────────────
const navItems = [
  { href: '/dashboard/',          label: 'Inicio',       icon: Home },
  { href: '/dashboard/perfil',          label: 'Mi Perfil',       icon: User },
  { href: '/dashboard/favoritos',       label: 'Favoritos',       icon: Heart },
  { href: '/dashboard/preferencias',    label: 'Preferencias',    icon: Settings },
  { href: '/dashboard/mis-solicitudes', label: 'Mis Solicitudes', icon: FileText },
  { href: '/dashboard/notificaciones',  label: 'Notificaciones',  icon: Bell },
];



// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="w-72 rounded-r-3xl mt-4.5 shrink-0 h-screen sticky top flex flex-col bg-white border-r border-gray-100 shadow-sm">

      {/* Header — logo + volver */}
      <div className="px-6 py-5 pt-4 border-b border-gray-200 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#0b7a4b] hover:text-[#0f8b57] transition-colors group">
        <Image src="/LogoInmobiliaria.png" alt="Logo" width={280} height={100} className="w-36 h-auto" />
        </Link>
      </div>

      {/* Avatar + datos del usuario */}
     <div className="px-6 py-7 border-b border-gray-200 bg-white">
  <div className="flex flex-col items-center text-center gap-2">

    {/* Avatar */}
    <div className="relative w-20 h-20 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-md">
      {user?.photo ? (
        <Image
          src={user.photo}
          alt={user.name}
          width={80}
          height={80}
          className="object-cover w-full h-full"
        />
      ) : (
        <User size={30} className="text-[#0b7a4b]" />
      )}
    </div>


    {/* Name */}
    <p className="font-bold text-gray-900 text-lg leading-tight">
      {user?.name} {user?.surname}
    </p>

    {/* Email */}
    <p className="text-sm text-gray-600 truncate max-w-45">
      {user?.email}
    </p>

  </div>
</div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group
                ${isActive
                  ? 'bg-[#0b7a4b] text-white shadow-md shadow-[#0b7a4b]/20'
                  : 'text-gray-600 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]'
                }`}>
              <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#0b7a4b] transition-colors'} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} className="text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200 group">
          <LogOut size={18} className="text-gray-400 group-hover:text-red-400 transition-colors" />
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

  // Protección de ruta — si no hay sesión, redirige al login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Mientras verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f2f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-3 border-[#0b7a4b]/20 border-t-[#0b7a4b] animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario (y ya terminó de cargar), no renderiza nada — el useEffect redirige
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f0f2f0] flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-full mx-auto mt-[-22] px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}