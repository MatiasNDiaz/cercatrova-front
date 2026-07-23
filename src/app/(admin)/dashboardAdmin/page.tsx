'use client';

import { useAuth } from '@/modules/shared/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/modules/shared/lib/axios';
import {
  Users, Building2, FileText, ChevronRight,
  TrendingUp, Clock, User, BarChart2, Bell,
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
    color: 'bg-[#0b7a4b]/12 text-[#0b7a4b]',
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
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    href: '/dashboardAdmin/estadisticas',
    icon: BarChart2,
    label: 'Estadísticas',
    description: 'Ver y gestionar estadísticas',
    color: 'bg-purple-100 text-purple-600',
  },
];

// Variantes de framer-motion para aparición escalonada.
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

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
    { label: 'Usuarios registrados',   value: stats?.totalUsers,       icon: Users,     color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Propiedades activas',    value: stats?.totalProperties,  icon: Building2, color: 'text-[#0b7a4b]',  bg: 'bg-[#0b7a4b]/10' },
    { label: 'Solicitudes totales',    value: stats?.totalRequests,    icon: FileText,  color: 'text-amber-600',  bg: 'bg-amber-100' },
    { label: 'Pendientes de revisión', value: stats?.pendingRequests,  icon: Clock,     color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* ── BANNER DE BIENVENIDA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl px-8 py-7 shadow-[0_20px_50px_-24px_rgba(6,57,35,0.6)]"
        style={{ background: 'linear-gradient(135deg, #0b7a4b 0%, #0f8c58 55%, #14a366 100%)' }}
      >
        {/* Textura sutil de puntos */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        {/* Halo decorativo */}
        <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/20">
              Panel de administración
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Bienvenido {user?.name || 'Admin'} 👋
            </h2>
            <p className="mt-2 text-sm font-medium text-white/80">
              Desde acá gestionás y controlás todo el sitio.
            </p>

            {stats && (
              <div className="mt-5 flex flex-wrap gap-2.5">
                <StatChip icon={Building2} label={`${stats.totalProperties} propiedades`} />
                <StatChip icon={Users} label={`${stats.totalUsers} usuarios`} />
                {stats.pendingRequests > 0 && (
                  <StatChip icon={Clock} label={`${stats.pendingRequests} pendientes`} highlight />
                )}
              </div>
            )}
          </div>

          <div className="relative hidden shrink-0 sm:block">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white shadow-2xl">
              {user?.photo ? (
                <Image src={user.photo} alt="Avatar" width={112} height={112} className="h-full w-full object-cover" />
              ) : (
                <User size={40} className="text-[#0b7a4b]" />
              )}
            </div>
            <span className="absolute bottom-1.5 right-1.5 h-5 w-5 rounded-full border-2 border-white bg-green-400" />
          </div>
        </div>
      </motion.div>

      {/* ── INDICADORES (KPIs) ── */}
      <div>
        <SectionLabel icon={BarChart2} text="Indicadores" />
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <motion.div
              key={label}
              variants={item}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-2xl font-black text-[#0b7a4b]">
                  {value !== undefined
                    ? value
                    : <span className="inline-block h-6 w-10 animate-pulse rounded bg-gray-100" />}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-gray-500">{label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── ACCESOS RÁPIDOS ── */}
      <div>
        <SectionLabel icon={TrendingUp} text="Accesos rápidos" />
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {quickLinks.map(({ href, icon: Icon, label, description, color }) => (
            <motion.div key={href} variants={item} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Link
                href={href}
                className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                  <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900">{label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{description}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#0b7a4b]" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </div>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────────────────────
function StatChip({ icon: Icon, label, highlight = false }: { icon: React.ElementType; label: string; highlight?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
      highlight ? 'bg-amber-300/25 text-white ring-amber-200/40' : 'bg-white/15 text-white ring-white/20'
    }`}>
      <Icon size={13} />
      {label}
    </span>
  );
}

function SectionLabel({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={16} className="text-[#0b7a4b]" />
      <h3 className="text-sm font-black uppercase tracking-wider text-[#0b7a4b]">{text}</h3>
    </div>
  );
}
