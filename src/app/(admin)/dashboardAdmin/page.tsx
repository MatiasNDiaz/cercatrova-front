'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/modules/shared/lib/axios';
import {
  Users, Building2, FileText, ChevronRight,
  TrendingUp, Clock, User,
  BarChart2,
  Bell,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalProperties: number;
  totalRequests: number;
  pendingRequests: number;
}

const quickLinks = [
  {
    href: '/dashboardAdmin/propiedades',
    icon: Building2,
    label: 'Propiedades',
    description: 'Publicar, editar y gestionar propiedades',
    color: 'bg-[#0b7a4b]/15 text-[#0b7a4b]',
  },
  {
    href: '/dashboardAdmin/solicitudes',
    icon: FileText,
    label: 'Solicitudes',
    description: 'Revisar y responder solicitudes de usuarios',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    href: '/dashboardAdmin/usuarios',
    icon: Users,
    label: 'Usuarios',
    description: 'Ver usuarios, contactarlos o eliminarlos',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    href: '/dashboardAdmin/notificaciones',
    icon: Bell,
    label: 'Notificaciones',
    description: 'Ver y gestionar notificaciones',
    color: 'bg-green-100 text-green-600',
  },
    {
    href: '/dashboardAdmin/estadisticas',
    icon: BarChart2,
    label: 'Estadísticas',
    description: 'Ver y gestionar estadísticas',
    color: 'bg-purple-100 text-purple-600',
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, propsRes, reqsRes] = await Promise.all([
          api.get('/users'),
          api.get('/properties'),
          api.get('/property-requests'),
        ]);
        setStats({
          totalUsers:      usersRes.data?.length ?? 0,
          totalProperties: propsRes.data?.properties?.length ?? propsRes.data?.length ?? 0,
          totalRequests:   reqsRes.data?.length ?? 0,
          pendingRequests: reqsRes.data?.filter(
            (r: { status: string }) => r.status === 'enviado' || r.status === 'en_revision'
          ).length ?? 0,
        });
      } catch {
        // silencioso
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Usuarios registrados',  value: stats?.totalUsers,       icon: Users,     color: 'text-blue-600',  bg: 'bg-blue-50' },
    { label: 'Propiedades activas',   value: stats?.totalProperties,  icon: Building2, color: 'text-[#0b7a4b]', bg: 'bg-[#0b7a4b]/10' },
    { label: 'Solicitudes totales',   value: stats?.totalRequests,    icon: FileText,  color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Pendientes de revisión',value: stats?.pendingRequests,  icon: Clock,     color: 'text-orange-500',bg: 'bg-orange-50' },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Banner */}
      <div
        className="relative flex flex-col justify-center shadow-4xl rounded-tr-3xl rounded-tl-3xl rounded-br-xl rounded-bl-xl h-64  px-10 overflow-hidden"
        style={{ backgroundImage: 'url(/BannerInmo.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/55 rounded-tr-3xl rounded-tl-3xl rounded-br-xl rounded-bl-xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-white text-4xl font-bold ml-5 tracking-tight leading-tight">
              Bienvenido {user?.name || 'Usuario'} 👋!
            </h2>
            <p className="text-white text-xs mt-4 ml-8 font-medium uppercase">
              Desde acá gestionás y controlas todo el sitio
            </p>
          </div>
          <div className="relative shrink-0">
            <div className="w-34 h-34 rounded-full border-4 border-white/30 shadow-2xl bg-white overflow-hidden flex items-center justify-center">
              {user?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photo} alt="Avatar" className="w-full h-full object-contain" />
              ) : (
                <User size={36} className="text-[#0b7a4b]" />
              )}
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
          </div>
        </div>

        {stats && (
          <div className="relative z-10 flex gap-6 mt-5">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-green-400" />
              <span className="text-white text-xs font-semibold">{stats.totalProperties} propiedades</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-blue-300" />
              <span className="text-white text-xs font-semibold">{stats.totalUsers} usuarios</span>
            </div>
            {stats.pendingRequests > 0 && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-300" />
                <span className="text-white text-xs font-semibold">{stats.pendingRequests} solicitudes pendientes</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stat cards */}
       <div className="flex items-center gap-2 mt-4">
          <BarChart2 size={16} className="text-[#0b7a4b] " />
          <h3 className="text-sm font-black text-[#0b7a4b]  uppercase tracking-wider">Indicadores</h3>
        </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
        
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0b7a4b]">
                {value !== undefined
                  ? value
                  : <span className="w-10 h-6 bg-gray-100 rounded animate-pulse inline-block" />
                }
              </p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[#0b7a4b] mt-6" />
          <h3 className="text-sm font-black text-[#0b7a4b] mt-6 uppercase tracking-wider">Accesos rápidos</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map(({ href, icon: Icon, label, description, color }) => (
            <Link key={href} href={href}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-[#0b7a4b] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}