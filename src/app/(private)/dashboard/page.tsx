'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import Link from 'next/link';
import {
  User, Heart, Settings, Bell, FileText, ChevronRight,
} from 'lucide-react';

const sections = [
  {
    href: '/dashboard/perfil',
    icon: User,
    label: 'Mi Perfil',
    description: 'Editá tus datos personales y foto de perfil',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    href: '/dashboard/favoritos',
    icon: Heart,
    label: 'Favoritos',
    description: 'Las propiedades que guardaste',
    color: 'bg-red-50 text-red-500',
  },
  {
    href: '/dashboard/preferencias',
    icon: Settings,
    label: 'Preferencias',
    description: 'Configurá tus preferencias de búsqueda',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    href: '/dashboard/mis-solicitudes',
    icon: FileText,
    label: 'Mis Solicitudes',
    description: 'Seguí el estado de tus propiedades publicadas',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    href: '/dashboard/notificaciones',
    icon: Bell,
    label: 'Notificaciones',
    description: 'Tus notificaciones y alertas recientes',
    color: 'bg-[#0b7a4b]/8 text-[#0b7a4b]',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-8  w-full ">

      {/* Bienvenida */}
<div
  className="relative flex flex-col items-center justify-center rounded-tr-3xl rounded-tl-3xl h-80 shadow-lg px-6"
  style={{
    backgroundImage: 'url(/BannerInmo.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  
  {/* Mensaje de bienvenida (movido un poco a la derecha para no chocar con el nombre si es largo) */}
  <h2 className="text-white text-4xl font-bold tracking-tight max-w-2xl leading-tight">
    ¡Hola, {user?.name}! Qué bueno verte de nuevo. <br /> 
    <span className="text-white text-lg ml-6 mt-0 font-medium">Tu próximo hogar te está esperando. 👋</span>
  </h2>

  {/* Contenedor del Avatar + Info a la derecha */}
  <div className="absolute -bottom-14 left-14 flex items-end gap-6">
    
    {/* Avatar con borde */}
    <div className="relative shrink-0">
      <div className="w-36 h-36 rounded-full border-[6px] border-[#F8FAFC] shadow-2xl bg-white overflow-hidden flex items-center justify-center">
        {user?.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User size={45} className="text-[#0b7a4b]" />
        )}
      </div>
      <div className="absolute bottom-2 right-2 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full shadow-md"></div>
    </div>

    {/* Bloque de Nombre y Detalle */}
    <div className="flex flex-col pb-1"> 
      {/* El Nombre queda sobre la parte verde por el alineamiento del flex */}
      <h1 className="text-3xl font-bold -ml-0.5 text-white drop-shadow-md tracking-tight">
        {user?.name} {user?.surname}
      </h1>
      
      {/* El resto queda debajo, sobre el fondo claro de la página */}
      <div className="mt-1 gap-1 text-left">
        <p className="text-slate-600 text-sm -ml-1">{user?.email}</p>
        <p className="text-[10px] mt-2 -ml-3.5 w-fit px-6 font-bold uppercase text-center tracking-wider text-[#0b7a4b] bg-[#0b7a4b]/12  py-1 rounded-full">
           usuario desde 2026
        </p>
      </div>
    </div>

  </div>
</div>
{/* Spacer: Importante para que el contenido de abajo no se pegue al avatar */}
<div className="h-16"></div>

      {/* Cards de secciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(({ href, icon: Icon, label, description, color }) => (
          <Link key={href} href={href}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-5 group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{label}</p>
              <p className="text-sm text-gray-400 mt-0.5 truncate">{description}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0b7a4b] group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
      </div>

    </div>
  );
}