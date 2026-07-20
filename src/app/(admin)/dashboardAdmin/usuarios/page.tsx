'use client';

import { useState, useEffect } from 'react';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { toast } from 'sonner';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users, Search, Trash2, Mail, FileText,
  User, Shield, ChevronDown, ChevronUp,
  ArrowLeft, Phone,
} from 'lucide-react';

interface UserType {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  photo: string | null;
  role: 'user' | 'admin';
  profileIncomplete: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)   return 'Hoy';
  if (days < 30)  return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} meses`;
  return `Hace ${Math.floor(months / 12)} años`;
}

const WhatsappIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ── UserCard FUERA del componente principal para evitar re-mount y scroll jump ──
interface UserCardProps {
  u: UserType;
  isExpanded: boolean;
  isDeleting: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  whatsappUrl: (phone: string) => string;
  gmailUrl: (email: string, name: string) => string;
}

function UserCard({ u, isExpanded, isDeleting, onToggle, onDelete, whatsappUrl, gmailUrl }: UserCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl mb-2 border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-sm hover:border-gray-200 ${
        isDeleting ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {/* ── Fila principal ── */}
      <div className="flex items-center  gap-5 px-5 py-4">

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center ring-1 ring-gray-100">
            {u.photo ? (
              <Image src={u.photo} alt={u.name} width={48} height={48} className="object-cover w-full h-full" />
            ) : (
              <User size={18} className="text-gray-300" />
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-sm truncate">{u.name} {u.surname}</p>
            {u.role === 'admin' && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0b7a4b]/10 text-[#0b7a4b] shrink-0">
                <Shield size={9} /> Admin
              </span>
            )}
            {u.profileIncomplete && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                Perfil incompleto
              </span>
            )}
          </div>
          <p className="text-xs text-gray-700 mt-0.5 truncate">{u.email}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Registrado {timeAgo(u.createdAt)} · ID #{u.id}
          </p>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-4 shrink-0">
          <a
            href={whatsappUrl(u.phone)}
            target="_blank"
            rel="noopener noreferrer"
            title={`WhatsApp: ${u.phone}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #25d366, #1ebe5d)' }}
          >
            <WhatsappIcon size={13} />
            <span className="hidden sm:inline">{u.phone}</span>
          </a>
          <a
            href={gmailUrl(u.email, u.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0b7a4b] bg-[#0b7a4b]/8 hover:bg-[#0b7a4b]/14 transition-all active:scale-95"
          >
            <Mail size={13} />
            <span className="hidden sm:inline">Email</span>
          </a>
          <button
            onClick={() => onToggle(u.id)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {u.role !== 'admin' && (
            <button
              aria-label='a'
              onClick={() => onDelete(u.id, `${u.name} ${u.surname}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-50 hover:bg-red-100 transition-all active:scale-95"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Detalle expandido con transición CSS ── */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-50 bg-[#fcfffd] px-8 py-6">

            {/* Grid de datos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-6">
              {[
                { label: 'Nombre completo', value: `${u.name} ${u.surname}` },
                { label: 'Email', value: u.email, truncate: true },
                { label: 'Teléfono', value: u.phone || '—' },
                {
                  label: 'Miembro desde',
                  value: new Date(u.createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  }),
                },
              ].map(({ label, value, truncate }) => (
                <div key={label} className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                  <p className={`text-sm font-medium text-gray-700 ${truncate ? 'truncate' : ''}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-5">
              <a
                href={whatsappUrl(u.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #25d366, #1ebe5d)' }}
              >
                <WhatsappIcon size={15} />
                Contactar por WhatsApp
              </a>
              <a
                href={gmailUrl(u.email, u.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-700 transition-all active:scale-95"
              >
                <Mail size={15} />
                Enviar email
              </a>
              <Link
                href={`/dashboardAdmin/usuarios/${u.id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-700 border border-[#0b7a4b]/20 hover:border-[#0b7a4b]/40 transition-all active:scale-95"
              >
                <FileText size={15} />
                Ver Detalle del Usuario
              </Link>
              {u.role !== 'admin' && (
                <button
                  onClick={() => onDelete(u.id, `${u.name} ${u.surname}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500  bg-red-200 hover:bg-red-300 transition-all active:scale-95 ml-auto"
                >
                  <Trash2 size={15} />
                  Eliminar usuario
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('No se pudieron cargar los usuarios'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleDelete = (id: number, name: string) => {
    confirmDialog({
      title: '¿Eliminar usuario?',
      message: `Se eliminarán todos los datos de ${name}, incluidos sus favoritos y solicitudes. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      icon: Trash2,
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await api.delete(`/users/${id}`);
          setUsers(prev => prev.filter(u => u.id !== id));
          toast.success('Usuario eliminado');
        } catch (error) {
          toast.error(getErrorMessage(error));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const filtered = users.filter(u =>
    `${u.name} ${u.surname} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const regularUsers = filtered.filter(u => u.role === 'user');
  const adminUsers   = filtered.filter(u => u.role === 'admin');

  const whatsappUrl = (phone: string) =>
    `https://wa.me/${phone.replace(/\D/g, '')}`;

  const gmailUrl = (email: string, name: string) => {
    const subject = encodeURIComponent(`Cerca Trova Inmobiliaria — Consulta para ${name}`);
    return `https://mail.google.com/mail/?view=cm&to=${email}&su=${subject}`;
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Back */}
      <Link
        href="/dashboardAdmin"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#0b7a4b] hover:text-[#0f8c58] group transition-colors w-fit"
      >
        <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
          <ArrowLeft size={14} />
        </span>
      </Link>

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Usuarios</h1>
          <p className="text-sm text-gray-600 font-semibold mt-0.5">
            {users.filter(u => u.role === 'user').length} usuarios registrados
          </p>
        </div>
        {/* Stats rápidas */}
        <div className="flex gap-4">
          <div className="text-center hidden sm:block">
            <p className="text-lg font-semibold text-[#0b7a4b]">{users.filter(u => u.role === 'user').length}</p>
            <p className="text-[11px] text-gray-500">Usuarios</p>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="text-center hidden sm:block">
            <p className="text-lg font-semibold text-[#0b7a4b]">{users.filter(u => u.role === 'admin').length}</p>
            <p className="text-[11px] text-gray-500">Admins</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-100 bg-white focus:outline-none focus:border-[#0b7a4b]/30 focus:ring-2 focus:ring-[#0b7a4b]/8 transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <div className="h-3.5 bg-gray-100 rounded-full w-1/3" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border  border-gray-100 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0b7a4b]/8 flex items-center justify-center">
            <Users size={24} className="text-[#0b7a4b]" />
          </div>
          <p className="font-bold text-gray-600 text-sm">
            {search ? 'Sin resultados para esa búsqueda' : 'No hay usuarios todavía'}
          </p>
        </div>
      )}

      {/* Lista usuarios regulares */}
      {!loading && regularUsers.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-1">
            <Users size={13} className="text-[#0b7a4b]" />
            <p className="text-xs font-bold text-[#0b7a4b] uppercase tracking-wider">
              Usuarios ({regularUsers.length})
            </p>
          </div>
          {regularUsers.map(u => (
            <UserCard
              key={u.id}
              u={u}
              isExpanded={expandedId === u.id}
              isDeleting={deletingId === u.id}
              onToggle={handleToggle}
              onDelete={handleDelete}
              whatsappUrl={whatsappUrl}
              gmailUrl={gmailUrl}
            />
          ))}
        </div>
      )}

      {/* Lista admins */}
      {!loading && adminUsers.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-1">
            <Shield size={13} className="text-[#0b7a4b]" />
            <p className="text-xs font-bold text-[#0b7a4b] uppercase tracking-wider">
              Administradores ({adminUsers.length})
            </p>
          </div>
          {adminUsers.map(u => (
            <UserCard
              key={u.id}
              u={u}
              isExpanded={expandedId === u.id}
              isDeleting={deletingId === u.id}
              onToggle={handleToggle}
              onDelete={handleDelete}
              whatsappUrl={whatsappUrl}
              gmailUrl={gmailUrl}
            />
          ))}
        </div>
      )}

    </div>
  );
}