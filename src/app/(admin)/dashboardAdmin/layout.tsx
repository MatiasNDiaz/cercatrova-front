'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  User, Home, FileText, LogOut, ChevronRight,
  ArrowLeft, Users, Building2, BarChart2, Shield, Bell,
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
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative
        ${isActive
          ? 'bg-linear-to-r from-[#0b7a4b] to-[#0f8c58] text-white shadow-md shadow-[#0b7a4b]/20'
          : 'text-gray-500 hover:bg-[#0b7a4b]/10 hover:text-[#0b7a4b]'
        }`}
    >
      {isActive && <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />}
      <Icon size={19} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#0b7a4b] transition-colors'} />
      <span className="flex-1">{label}</span>
      {badge > 0
        ? <span className={`min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-black flex items-center justify-center leading-none shadow-sm ${
            isActive ? 'bg-white text-[#0b7a4b]' : 'bg-red-500 text-white'
          }`}>
            {badge > 99 ? '99+' : badge}
          </span>
        : isActive && <ChevronRight size={14} className="text-white/80" />
      }
    </Link>
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

  const mainNavItems = [
    { href: '/dashboardAdmin',                  label: 'Inicio',          icon: Home,      badge: 0 },
    { href: '/dashboardAdmin/propiedades',       label: 'Propiedades',     icon: Building2, badge: 0 },
    { href: '/dashboardAdmin/solicitudes',       label: 'Solicitudes',     icon: FileText,  badge: counts.solicitudes },
    { href: '/dashboardAdmin/usuarios',          label: 'Usuarios',        icon: Users,     badge: counts.usuarios },
    { href: '/dashboardAdmin/notificaciones',    label: 'Notificaciones',  icon: Bell,      badge: counts.notificaciones },
  ];

  const accountNavItems = [
    { href: '/dashboardAdmin/perfil',       label: 'Mi Perfil',    icon: User,     badge: 0 },
    { href: '/dashboardAdmin/estadisticas', label: 'Estadísticas', icon: BarChart2, badge: 0 },
  ];

  const handleLogoutConfirm = () => {
    toast.custom((t) => (
      <div className="flex flex-col items-center gap-6 bg-white rounded-4xl px-8 py-8 w-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-gray-50">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
          <div className="relative w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <LogOut size={28} className="text-emerald-700" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-2xl font-bold text-[#0b7a4b] pb-2 tracking-tight">¿Ya te vas?</h3>
          <p className="text-[15px] text-gray-500 font-medium px-2">
            ¡Esperamos verte pronto,{' '}
            <span className="text-emerald-600 font-bold">{user?.name || 'Admin'}</span>!{' '}
            ¿Confirmás que querés cerrar sesión?
          </p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={() => toast.dismiss(t)}
            className="flex-1 py-4 text-[15px] font-bold text-white rounded-2xl transition-all active:scale-95 cursor-pointer shadow-[0_8px_20px_rgba(15,139,87,0.35)] hover:brightness-110 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}
          >
            No, me quedo
          </button>
          <button
            onClick={() => { toast.dismiss(t); logout(); }}
            className="flex-1 py-4 text-[15px] font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-2xl transition-all active:scale-95 cursor-pointer"
          >
            Sí, salir
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
      style: { background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 },
    });
  };

  return (
    <aside className="w-72 bg-white border-r rounded-tr-3xl mt-4 border-gray-100 flex flex-col h-screen sticky top-0 shadow-sm">
      <div className="p-5 flex items-center justify-start">
        <Link href="/" className="p-2 rounded-lg bg-gray-100 text-[#0b7a4b] hover:bg-[#0b7a4b]/10 transition-all group">
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <Link href="/" className="transition-opacity hover:opacity-80 ml-7">
          <Image src="/LogoInmobiliaria.png" alt="Logo" width={140} height={40} className="w-32 h-auto" />
        </Link>
      </div>

      <div className="px-6 mb-6 ">
        <div className="p-2 rounded-2xl bg-[#0b7a4b]/10 border border-gray-100 flex flex-col items-center text-center">
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
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <h3 className="font-bold text-gray-900 leading-tight truncate w-full">
            {user?.name} {user?.surname}
          </h3>
          <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-[#0b7a4b] text-white">
            <Shield size={11} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Administrador</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4  overflow-y-auto">
        <div className="space-y-2 mb-6">
          <p className="px-4 text-[11px] font-bold text-[#0b7a4b] uppercase tracking-widest mb-2">Panel Admin</p>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              isActive={
                item.href === '/dashboardAdmin'
                  ? pathname === '/dashboardAdmin'
                  : pathname.startsWith(item.href)
              }
            />
          ))}
        </div>
        <div className="space-y-1">
          <p className="px-4 text-[11px] font-bold text-[#0b7a4b] uppercase tracking-widest mb-2">Cuenta</p>
          {accountNavItems.map((item) => (
            <NavLink key={item.href} {...item} isActive={pathname.startsWith(item.href)} />
          ))}
        </div>
      </nav>

      <div className="p-4 pb-7 mt-auto border-t border-gray-300">
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
    <div className="min-h-screen bg-[#cbd8cd] flex">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto pb-8">
        <div className="max-w-7xl mx-auto px-8 py-4">
          {children}
        </div>
      </main>
    </div>
  );
}