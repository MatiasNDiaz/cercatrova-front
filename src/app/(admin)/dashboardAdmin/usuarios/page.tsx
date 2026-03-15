'use client';

import { useState, useEffect } from 'react';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users, Search, Trash2, Mail, FileText,
  User, Shield, ChevronDown, ChevronUp,
  ArrowLeft,
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

  const handleDelete = (id: number, name: string) => {
    toast.custom((t) => (
      <div className="flex flex-col gap-4 bg-white rounded-3xl px-7 py-6 w-96 shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={20} className="text-red-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">¿Eliminar usuario?</p>
            <p className="text-sm text-gray-500 mt-0.5">{name}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Se eliminarán todos sus datos, favoritos y solicitudes. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t);
              setDeletingId(id);
              try {
                await api.delete(`/users/${id}`);
                setUsers(prev => prev.filter(u => u.id !== id));
                toast.success('Usuario eliminado');
              } catch {
                toast.error('No se pudo eliminar el usuario');
              } finally {
                setDeletingId(null);
              }
            }}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all active:scale-95"
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => toast.dismiss(t)}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { position: 'top-center', duration: 10000, unstyled: true, style: { background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 } });
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

  const UserCard = ({ u }: { u: UserType }) => {
    const isExpanded = expandedId === u.id;

    return (
        
      <div className={`bg-white rounded-3xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${
        deletingId === u.id ? 'opacity-50 pointer-events-none' : ''
      }`}>

        {/* ── Fila principal ── */}
        <div className="flex items-center gap-4 p-4">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center ring-2 ring-gray-100">
              {u.photo ? (
                <Image src={u.photo} alt={u.name} width={56} height={56} className="object-cover w-full h-full" />
              ) : (
                <User size={22} className="text-gray-400" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 truncate">{u.name} {u.surname}</p>
              {u.role === 'admin' && (
                <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0b7a4b] text-white shrink-0">
                  <Shield size={9} /> Admin
                </span>
              )}
              {u.profileIncomplete && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                  Perfil incompleto
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{u.email}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Registrado {timeAgo(u.createdAt)} · ID #{u.id}
            </p>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-2 shrink-0">
            <a href={whatsappUrl(u.phone)} target="_blank" rel="noopener noreferrer"
              title={`WhatsApp: ${u.phone}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #25d366, #1ebe5d)' }}>
              <WhatsappIcon size={14} />
              {u.phone}
            </a>
            <a href={gmailUrl(u.email, u.name)} target="_blank" rel="noopener noreferrer"
              title={`Email: ${u.email}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all active:scale-95">
              <Mail size={13} />
              Email
            </a>
            <button onClick={() => setExpandedId(isExpanded ? null : u.id)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {u.role !== 'admin' && (
              <button aria-label='a' onClick={() => handleDelete(u.id, `${u.name} ${u.surname}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Detalle expandido ── */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
  isExpanded ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0'
}`}>
  <div className="border-t border-gray-100 bg-gray-50/50 px-10 py-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nombre completo</p>
        <p className="text-sm font-semibold text-gray-800">{u.name} {u.surname}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{u.email}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Teléfono</p>
        <p className="text-sm font-semibold text-gray-800">{u.phone || '—'}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Miembro desde</p>
        <p className="text-sm font-semibold text-gray-800">
          {new Date(u.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-3">
      <a href={whatsappUrl(u.phone)} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 hover:brightness-110 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #25d366, #1ebe5d)' }}>
        <WhatsappIcon size={16} />
        Contactar por WhatsApp
      </a>

      <a href={gmailUrl(u.email, u.name)} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 transition-all active:scale-95 shadow-sm">
        <Mail size={16} />
        Enviar email por Gmail
      </a>

      <Link
        href={`/dashboardAdmin/usuarios/${u.id}`}
        className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold text-[#0b7a4b] bg-[#0b7a4b]/13 hover:bg-[#0b7a4b]/20 transition-all active:scale-95 shadow-sm"
      >
        <FileText size={16} />
        Ver solicitudes
      </Link>

      {u.role !== 'admin' && (
        <button onClick={() => handleDelete(u.id, `${u.name} ${u.surname}`)}
          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold text-red-600 bg-red-100 hover:bg-red-100 transition-all active:scale-95 shadow-sm">
          <Trash2 size={16} />
          Eliminar usuario
        </button>
      )}
    </div>
  </div>
</div>


      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
  <Link href="/dashboardAdmin"
        className="inline-flex bg-white rounded-full p-2 border border-gray-300 px-2 w-fit items-center gap-2 text-sm font-semibold text-[#0b7a4b] hover:text-[#0f8c58] group transition-colors">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform mt-0.5" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-[#0b7a4b]">Usuarios</h1>
        <p className="text-sm font-medium text-gray-600 mt-0.5">
          {users.filter(u => u.role === 'user').length} usuarios registrados
        </p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-[#0b7a4b] transition-all" />
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-gray-200 animate-pulse flex gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <div className="h-4 bg-gray-200 rounded-full w-1/3" />
                <div className="h-3 bg-gray-200 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-3xl p-12 border border-gray-200 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center">
            <Users size={28} className="text-[#0b7a4b]" />
          </div>
          <p className="font-bold text-gray-800">
            {search ? 'Sin resultados para esa búsqueda' : 'No hay usuarios todavía'}
          </p>
        </div>
      )}

      {!loading && regularUsers.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[#0b7a4b]" />
            <p className="text-xs font-black text-[#0b7a4b] uppercase tracking-wider">
              Usuarios ({regularUsers.length})
            </p>
          </div>
          {regularUsers.map(u => <UserCard key={u.id} u={u} />)}
        </div>
      )}

      {!loading && adminUsers.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-[#0b7a4b]" />
            <p className="text-xs font-black text-[#0b7a4b] uppercase tracking-wider">
              Administradores ({adminUsers.length})
            </p>
          </div>
          {adminUsers.map(u => <UserCard key={u.id} u={u} />)}
        </div>
      )}

    </div>
  );
}