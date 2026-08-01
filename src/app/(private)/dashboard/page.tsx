'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import Link from 'next/link';
import { DashboardPage } from '@/modules/shared/ui/DashboardPage';
import {
  User, Heart, Settings, Bell, FileText, ChevronRight,
} from 'lucide-react';

const sections = [
  {
    href: '/dashboard/perfil',
    icon: User,
    label: 'Mi Perfil',
    description: 'Editá tus datos personales y foto de perfil',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    href: '/dashboard/favoritos',
    icon: Heart,
    label: 'Favoritos',
    description: 'Las propiedades que guardaste',
    color: 'bg-red-100 text-red-500',
  },
  {
    href: '/dashboard/preferencias',
    icon: Settings,
    label: 'Preferencias',
    description: 'Configurá tus preferencias de búsqueda',
    color: 'bg-purple-200 text-purple-600',
  },
  {
    href: '/dashboard/mis-solicitudes',
    icon: FileText,
    label: 'Mis Solicitudes',
    description: 'Seguí el estado de tus propiedades publicadas',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    href: '/dashboard/notificaciones',
    icon: Bell,
    label: 'Notificaciones',
    description: 'Tus notificaciones y alertas recientes',
    color: 'bg-[#0b7a4b]/20 text-[#0b7a4b]',
  },
];

// Se llama `DashboardHomePage` y no `DashboardPage` para no chocar con el
// componente de layout compartido que se importa arriba.
export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <DashboardPage>

      {/* ── BIENVENIDA ──
          Antes el bloque de avatar + nombre + email iba `absolute -bottom-14
          left-14` encima del banner, con un avatar de 144px y el texto al
          lado. A 390px eso no entraba de ninguna forma: el saludo centrado
          quedaba pisado por la foto, y el nombre y el email salían cortados
          por el círculo.

          Ahora son dos piezas en flujo normal: el banner con el saludo, y
          debajo una tarjeta propia con foto + nombre + email + badge. La
          tarjeta se solapa con el banner (margen negativo) recién desde `sm`,
          que es donde hay ancho para que se vea bien; en mobile simplemente va
          debajo. Sin `absolute`, no hay nada que se pueda superponer. */}
      <div>
        <div className="relative overflow-hidden rounded-xl shadow-lg">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/BannerInmo.png)' }}
          />
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 flex min-h-44 items-center justify-center px-5 py-10 sm:min-h-56 sm:px-8 md:h-64">
            <h2 className="max-w-2xl text-center text-xl leading-tight font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              ¡Hola, {user?.name}! Qué bueno verte de nuevo!
              <span className="mt-2 block text-sm font-medium text-white/90 sm:text-lg md:text-2xl">
                Tu próximo hogar te está esperando. 👋
              </span>
            </h2>
          </div>
        </div>

        {/* Tarjeta de perfil */}
        <div className="relative z-10 mx-3 -mt-8 flex flex-col items-center gap-4 rounded-xl border border-ink-100 bg-white p-5 text-center shadow-[0_1px_2px_rgba(10,12,11,0.04),0_10px_28px_-14px_rgba(10,12,11,0.2)] sm:mx-6 sm:-mt-12 sm:flex-row sm:items-center sm:gap-5 sm:text-left">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-xl sm:h-28 sm:w-28">
              {user?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photo} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User size={40} className="text-[#0b7a4b]" />
              )}
            </div>
            <span className="absolute right-1.5 bottom-1.5 h-5 w-5 rounded-full border-4 border-white bg-emerald-500 shadow-md" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
              {user?.name} {user?.surname}
            </h1>
            <p className="mt-0.5 truncate text-sm text-gray-500">{user?.email}</p>
            <p className="mt-2 inline-block rounded-full bg-[#0b7a4b]/12 px-4 py-1 text-[10px] font-bold tracking-wider text-[#0b7a4b] uppercase">
              usuario desde 2026
            </p>
          </div>
        </div>
      </div>

      {/* Cards de secciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(({ href, icon: Icon, label, description, color }) => (
          <Link key={href} href={href}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-5 group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{label}</p>
              <p className="text-sm text-gray-600 mt-0.5 truncate">{description}</p>
            </div>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-[#0b7a4b] group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
      </div>

    </DashboardPage>
  );
}