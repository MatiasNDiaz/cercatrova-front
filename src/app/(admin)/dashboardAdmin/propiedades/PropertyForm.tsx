'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import {
  Save, ArrowLeft, Upload, X, Star, ImagePlus,
  Home, MapPin, Ruler, DollarSign, Tag, Info,
} from 'lucide-react';

// ── TIPOS ─────────────────────────────────────────────────────────────────────
interface PropertyType { id: number; name: string; }

interface ExistingImage {
  id: number;
  url: string;
  isCover: boolean;
}

interface NewImage {
  file: File;
  preview: string;
  isCover: boolean;
}

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'pendiente',  label: 'Pendiente' },
  { value: 'vendida',    label: 'Vendida' },
  { value: 'alquilada',  label: 'Alquilada' },
  { value: 'en pausa',   label: 'En pausa' },
];

const OP_OPTIONS = [
  { value: 'venta',    label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'temporal', label: 'Alquiler temporal' },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400';
const selectCls = 'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all appearance-none';

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <h2 className="text-sm font-bold text-[#0b7a4b] uppercase tracking-wider flex items-center gap-2 mb-4">
      <Icon size={14} />{label}
    </h2>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] font-medium text-[#0b7a4b]/70">{hint}</p>}
    </div>
  );
}

// ── PROPS del componente ──────────────────────────────────────────────────────
interface PropertyFormProps {
  propertyId?: number; // si viene = modo edición
}

export default function PropertyForm({ propertyId }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = !!propertyId;
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [dragging, setDragging] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);

  // Imágenes existentes (solo en edición)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  // Imágenes nuevas (locales, antes de subir)
  const [newImages, setNewImages] = useState<NewImage[]>([]);

  const [form, setForm] = useState({
    title:           '',
    description:     '',
    typeOfPropertyId: '',
    operationType:   'venta',
    status:          'disponible',
    provincia:       'Córdoba',
    localidad:       '',
    barrio:          '',
    zone:            '',
    rooms:           '',
    bathrooms:       '',
    m2:              '',
    antiquity:       '',
    price:           '',
    property_deed:   false,
    garage:          false,
    patio:           false,
  });

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  // ── Cargar tipos de propiedad ──
  useEffect(() => {
    api.get('/property-types').then(r => setPropertyTypes(r.data)).catch(() => {});
  }, []);

  // ── Cargar datos si es edición ──
  useEffect(() => {
    if (!isEdit) return;
    const fetch = async () => {
      try {
        const { data } = await api.get(`/properties/${propertyId}`);
        setForm({
          title:            data.title ?? '',
          description:      data.description ?? '',
          typeOfPropertyId: data.typeOfProperty?.id?.toString() ?? '',
          operationType:    data.operationType ?? 'venta',
          status:           data.status ?? 'disponible',
          provincia:        data.provincia ?? 'Córdoba',
          localidad:        data.localidad ?? '',
          barrio:           data.barrio ?? '',
          zone:             data.zone ?? '',
          rooms:            data.rooms?.toString() ?? '',
          bathrooms:        data.bathrooms?.toString() ?? '',
          m2:               data.m2?.toString() ?? '',
          antiquity:        data.antiquity?.toString() ?? '',
          price:            data.price?.toString() ?? '',
          property_deed:    data.property_deed ?? false,
          garage:           data.garage ?? false,
          patio:            data.patio ?? false,
        });
        setExistingImages(data.images ?? []);
      } catch {
        toast.error('No se pudo cargar la propiedad');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isEdit, propertyId]);

  // ── Drag & Drop ──
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addFiles(files);
  }, []);

  const addFiles = (files: File[]) => {
    const totalExisting = existingImages.filter(i => !deletedImageIds.includes(i.id)).length;
    const totalNew = newImages.length;
    const available = 10 - totalExisting - totalNew;
    if (available <= 0) { toast.error('Máximo 10 imágenes'); return; }
    const toAdd = files.slice(0, available);
    const mapped: NewImage[] = toAdd.map((file, idx) => ({
      file,
      preview: URL.createObjectURL(file),
      isCover: totalExisting === 0 && totalNew === 0 && idx === 0,
    }));
    setNewImages(prev => [...prev, ...mapped]);
  };

  // ── Portada — imágenes existentes ──
  const setExistingCover = async (id: number) => {
    try {
      await api.patch(`/property-images/${id}/set-cover`);
      setExistingImages(prev => prev.map(i => ({ ...i, isCover: i.id === id })));
      setNewImages(prev => prev.map(i => ({ ...i, isCover: false })));
      toast.success('Portada actualizada ✓');
    } catch {
      toast.error('No se pudo cambiar la portada');
    }
  };

  // ── Portada — imágenes nuevas ──
  const setNewCover = (idx: number) => {
    setExistingImages(prev => prev.map(i => ({ ...i, isCover: false })));
    setNewImages(prev => prev.map((i, j) => ({ ...i, isCover: j === idx })));
  };

  // ── Eliminar imagen existente ──
  const removeExisting = (id: number) => {
    setDeletedImageIds(prev => [...prev, id]);
    // Si era portada y quedan otras, la primera que no esté eliminada queda como portada
    const wasCover = existingImages.find(i => i.id === id)?.isCover;
    if (wasCover) {
      const remaining = existingImages.filter(i => i.id !== id && !deletedImageIds.includes(i.id));
      if (remaining.length > 0) {
        setExistingImages(prev => prev.map(i => ({ ...i, isCover: i.id === remaining[0].id })));
      } else if (newImages.length > 0) {
        setNewImages(prev => prev.map((i, j) => ({ ...i, isCover: j === 0 })));
      }
    }
  };

  // ── Eliminar imagen nueva ──
  const removeNew = (idx: number) => {
    const wasCover = newImages[idx].isCover;
    URL.revokeObjectURL(newImages[idx].preview);
    setNewImages(prev => {
      const next = prev.filter((_, j) => j !== idx);
      if (wasCover && next.length > 0) next[0].isCover = true;
      return next;
    });
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.title || !form.typeOfPropertyId || !form.price) {
      toast.error('Completá título, tipo de propiedad y precio');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title:            form.title,
        description:      form.description,
        typeOfPropertyId: Number(form.typeOfPropertyId),
        operationType:    form.operationType,
        status:           form.status,
        provincia:        form.provincia,
        localidad:        form.localidad,
        barrio:           form.barrio,
        zone:             form.zone,
        rooms:            Number(form.rooms) || 0,
        bathrooms:        Number(form.bathrooms) || 0,
        m2:               Number(form.m2) || 0,
        antiquity:        Number(form.antiquity) || 0,
        price:            Number(form.price),
        property_deed:    form.property_deed,
        garage:           form.garage,
        patio:            form.patio,
        ...(isEdit && deletedImageIds.length > 0 && { deleteImages: deletedImageIds }),
        // Portada: id de la imagen existente marcada como cover (solo edición)
        ...(isEdit && (() => {
          const cover = existingImages.find(i => i.isCover && !deletedImageIds.includes(i.id));
          return cover ? { setCoverImageId: cover.id } : {};
        })()),
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));

      // Agregar imágenes nuevas
      newImages.forEach(img => {
        formData.append(isEdit ? 'newImages' : 'images', img.file);
      });

      if (isEdit) {
        await api.patch(`/properties/${propertyId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Propiedad actualizada ✓');
      } else {
        await api.post('/properties', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Propiedad publicada ✓');
      }

      router.push('/dashboardAdmin/propiedades');
    } catch {
      toast.error(isEdit ? 'No se pudo actualizar' : 'No se pudo publicar la propiedad');
    } finally {
      setSaving(false);
    }
  };

  const visibleExisting = existingImages.filter(i => !deletedImageIds.includes(i.id));
  const totalImages = visibleExisting.length + newImages.length;

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-3xl p-6 border border-gray-200 animate-pulse">
          <div className="h-3 bg-gray-200 rounded-full w-1/4 mb-5" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-gray-200 rounded-xl" />
            <div className="h-10 bg-gray-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button aria-label='Volver' onClick={() => router.back()}
          className="p-2 rounded-full bg-white border border-gray-200 text-[#0b7a4b] hover:bg-gray-50 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">
            {isEdit ? 'Editar propiedad' : 'Nueva propiedad'}
          </h1>
          <p className="text-sm font-medium text-gray-600 mt-0.5">
            {isEdit ? 'Modificá los datos y guardá los cambios' : 'Completá los datos y subí las imágenes'}
          </p>
        </div>
      </div>

      {/* ── IMÁGENES ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={ImagePlus} label={`Imágenes (${totalImages}/10)`} />

        {/* Drop zone */}
        <div
          ref={dropRef}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
            dragging
              ? 'border-[#0b7a4b] bg-[#0b7a4b]/5'
              : 'border-gray-200 hover:border-[#0b7a4b]/50 hover:bg-gray-50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#0b7a4b]/10 flex items-center justify-center">
            <Upload size={22} className="text-[#0b7a4b]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-700">
              {dragging ? 'Soltá las imágenes acá' : 'Arrastrá imágenes o hacé click para seleccionar'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, WEBP — máximo 10 imágenes</p>
          </div>
          <input
            aria-label='a'
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files ?? []);
              addFiles(files);
              e.target.value = '';
            }}
          />
        </div>

        {/* Preview grid */}
        {totalImages > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Previsualización — hacé click en ⭐ para elegir portada
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">

              {/* Imágenes existentes */}
              {visibleExisting.map(img => (
                <div key={`ex-${img.id}`} className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />

                  {/* Badge portada */}
                  {img.isCover && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      <Star size={9} fill="white" /> Portada
                    </div>
                  )}

                  {/* Botones */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!img.isCover && (
                      <button
                        onClick={() => setExistingCover(img.id)}
                        title="Establecer como portada"
                        className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-500 flex items-center justify-center text-white transition-all"
                      >
                        <Star size={12} />
                      </button>
                    )}
                    <button
                    aria-label='a'
                      onClick={() => removeExisting(img.id)}
                      className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Imágenes nuevas */}
              {newImages.map((img, idx) => (
                <div key={`new-${idx}`} className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />

                  {/* Badge nueva */}
                  <div className="absolute bottom-2 left-2 bg-[#0b7a4b] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                    Nueva
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />

                  {/* Badge portada */}
                  {img.isCover && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      <Star size={9} fill="white" /> Portada
                    </div>
                  )}

                  {/* Botones */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!img.isCover && (
                      <button
                        onClick={() => setNewCover(idx)}
                        title="Establecer como portada"
                        className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-500 flex items-center justify-center text-white transition-all"
                      >
                        <Star size={12} />
                      </button>
                    )}
                    <button
                      aria-label='a'
                      onClick={() => removeNew(idx)}
                      className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── INFO BÁSICA ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={Info} label="Información básica" />
        <div className="flex flex-col gap-4">
          <Field label="Título">
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className={inputCls} placeholder="Ej: Casa amplia con jardín en Nueva Córdoba" />
          </Field>
          <Field label="Descripción">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={4} className={`${inputCls} resize-none`}
              placeholder="Describí la propiedad en detalle..." />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Tipo de propiedad">
              <select aria-label="Tipo de propiedad" value={form.typeOfPropertyId} onChange={e => set('typeOfPropertyId', e.target.value)}
                className={selectCls}>
                <option value="">Seleccionar...</option>
                {propertyTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Operación">
              <select aria-label="Operación"  value={form.operationType} onChange={e => set('operationType', e.target.value)}
                className={selectCls}>
                {OP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select aria-label="Estado" value={form.status} onChange={e => set('status', e.target.value)}
                className={selectCls}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* ── UBICACIÓN ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={MapPin} label="Ubicación" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Provincia">
            <input value={form.provincia} onChange={e => set('provincia', e.target.value)}
              className={inputCls} placeholder="Córdoba" />
          </Field>
          <Field label="Localidad">
            <input value={form.localidad} onChange={e => set('localidad', e.target.value)}
              className={inputCls} placeholder="Ej: Villa Carlos Paz" />
          </Field>
          <Field label="Barrio">
            <input value={form.barrio} onChange={e => set('barrio', e.target.value)}
              className={inputCls} placeholder="Ej: Nueva Córdoba" />
          </Field>
          <Field label="Zona">
            <input value={form.zone} onChange={e => set('zone', e.target.value)}
              className={inputCls} placeholder="Ej: sierras, norte, centro" />
          </Field>
        </div>
      </div>

      {/* ── CARACTERÍSTICAS ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={Ruler} label="Características" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Habitaciones">
            <input type="number" min="0" value={form.rooms} onChange={e => set('rooms', e.target.value)}
              className={inputCls} placeholder="0" />
          </Field>
          <Field label="Baños">
            <input type="number" min="0" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)}
              className={inputCls} placeholder="0" />
          </Field>
          <Field label="Superficie (m²)">
            <input type="number" min="0" value={form.m2} onChange={e => set('m2', e.target.value)}
              className={inputCls} placeholder="0" />
          </Field>
          <Field label="Antigüedad (años)">
            <input type="number" min="0" value={form.antiquity} onChange={e => set('antiquity', e.target.value)}
              className={inputCls} placeholder="0" />
          </Field>
        </div>

        {/* Atributos booleanos */}
        <div className="flex flex-wrap gap-3 mt-5">
          {[
            { key: 'property_deed', label: 'Con escritura' },
            { key: 'garage',        label: 'Con garage' },
            { key: 'patio',         label: 'Con patio' },
          ].map(({ key, label }) => (
            <button key={key} type="button"
              onClick={() => set(key, !form[key as keyof typeof form])}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
                form[key as keyof typeof form]
                  ? 'bg-[#0b7a4b]/10 border-[#0b7a4b]/40 text-[#0b7a4b]'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#0b7a4b]/30'
              }`}>
              <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                form[key as keyof typeof form] ? 'bg-[#0b7a4b] border-[#0b7a4b]' : 'border-gray-400'
              }`}>
                {form[key as keyof typeof form] && <span className="text-white text-[10px] font-black">✓</span>}
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRECIO ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={DollarSign} label="Precio" />
        <Field label="Precio (USD)">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0b7a4b] font-black text-sm">$</span>
            <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400"
              placeholder="Ej: 85000" />
          </div>
        </Field>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pb-4">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
          <ArrowLeft size={15} /> Cancelar
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
          <Save size={15} />
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Publicar propiedad'}
        </button>
      </div>

    </div>
  );
}