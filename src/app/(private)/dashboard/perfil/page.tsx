'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import Image from 'next/image';
import { toast } from 'sonner';
import api from '@/modules/shared/lib/axios';
import {
  User, Camera, Save, Eye, EyeOff, Lock, Mail,
  Phone, BadgeCheck, Pencil,
} from 'lucide-react';

export default function PerfilPage() {
  const { user, updateUser } = useAuth(); // ← agregamos updateUser

  // ── DATOS PERSONALES ──
  const [name, setName] = useState(user?.name ?? '');
  const [surname, setSurname] = useState(user?.surname ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingData, setSavingData] = useState(false);

  // ── CONTRASEÑA ──
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // ── FOTO ──
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── ACTUALIZAR DATOS ──
  const handleSaveData = async () => {
    if (!name.trim() || !surname.trim() || !email.trim()) {
      toast.error('Nombre, apellido y email son obligatorios');
      return;
    }
    setSavingData(true);
    try {
      await api.patch(`/users/${user!.id}`, { name, surname, phone, email });
      updateUser({ name, surname, phone, email }); // ← actualiza el contexto
      toast.success('Datos actualizados correctamente');
    } catch {
      toast.error('No se pudieron actualizar los datos');
    } finally {
      setSavingData(false);
    }
  };

  // ── ACTUALIZAR CONTRASEÑA ──
  const handleSavePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Completá todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch(`/users/${user!.id}`, { password: newPassword });
      toast.success('Contraseña actualizada');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('No se pudo actualizar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── SUBIR FOTO ──
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: updated } = await api.patch(`/users/${user!.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ photo: updated.photo }); // ← actualiza la foto en todo el contexto
      toast.success('Foto actualizada');
    } catch {
      toast.error('No se pudo subir la foto');
      setPreviewPhoto(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const currentPhoto = previewPhoto ?? user?.photo ?? null;

  return (
    <div className="flex flex-col gap-6">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl font-bold text-[#0b7a4b]">Mi Perfil</h1>
        <p className="text-sm text-gray-600 mt-0.5">Administrá tu información personal y seguridad</p>
      </div>

      {/* ── FOTO DE PERFIL ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
          <Camera size={14} />Foto de perfil
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0b7a4b]/10 flex items-center justify-center ring-4 ring-[#0b7a4b]/10">
              {currentPhoto ? (
                <Image src={currentPhoto} alt="Foto de perfil" width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-[#0b7a4b]" />
              )}
            </div>
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <button aria-label="Cambiar foto de perfil" onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#0b7a4b] text-white flex items-center justify-center shadow-md hover:bg-[#0f8b57] transition-colors">
              <Pencil size={13} />
            </button>
          </div>

          <div>
            <p className="font-bold text-gray-900">{user?.name} {user?.surname}</p>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
            <button onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#0b7a4b] bg-[#0b7a4b]/8 hover:bg-[#0b7a4b]/15 rounded-xl transition-colors disabled:opacity-50">
              <Camera size={14} />
              {uploadingPhoto ? 'Subiendo...' : 'Cambiar foto'}
            </button>
          </div>
          <input aria-label="Foto de perfil" ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
      </div>

      {/* ── DATOS PERSONALES ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
          <BadgeCheck size={14} />Datos personales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Nombre</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all"
                placeholder="Tu nombre" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Apellido</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input value={surname} onChange={e => setSurname(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all"
                placeholder="Tu apellido" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all"
                placeholder="tu@email.com" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Teléfono</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all"
                placeholder="Tu teléfono" />
            </div>
          </div>

        </div>
        <div className="flex justify-end mt-5">
          <button onClick={handleSaveData} disabled={savingData}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
            <Save size={15} />
            {savingData ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* ── CONTRASEÑA ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
          <Lock size={14} />Cambiar contraseña
        </h2>
        <div className="flex flex-col gap-4 max-w-md">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Nueva contraseña</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                type={showNew ? 'text' : 'password'}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all"
                placeholder="Mínimo 6 caracteres" />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Confirmar contraseña</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                type={showConfirm ? 'text' : 'password'}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all"
                placeholder="Repetí la nueva contraseña" />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {confirmPassword && (
            <p className={`text-xs font-semibold ${newPassword === confirmPassword ? 'text-emerald-500' : 'text-red-400'}`}>
              {newPassword === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
            </p>
          )}

        </div>
        <div className="flex justify-end mt-5">
          <button onClick={handleSavePassword} disabled={savingPassword}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
            <Save size={15} />
            {savingPassword ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </div>
      </div>

    </div>
  );
}