'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import {
  MapPin, Home, Ruler, DollarSign, Bell, Save,
  Bed, Bath, Hourglass, FileCheck, Car, Trees,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface PropertyType {
  id: number;
  name: string;
}

const OPERATION_TYPES = ['venta', 'alquiler', 'alquiler temporal'];

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
      {hint && <p className="text-[11px] font-medium text-[#0b7a4b]/70 mt-0.5">{hint}</p>}
    </div>
  );
}

const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400";
const selectClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all appearance-none";

export default function PreferenciasPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPrefs, setHasPrefs] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);

  const [form, setForm] = useState({
    zone:             '',
    localidad:        '',
    barrio:           '',
    operationType:    '',
    typeOfPropertyId: '' as string | number,
    preferredPrice:   '',
    minRooms:         '',
    minBathrooms:     '',
    m2:               '',
    maxAntiquity:     '',
    property_deed:    false,
    garage:           false,
    patio:            false,
    notifyNewMatches: true,
    notifyPriceDrops: true,
  });

  const set = (key: string, value: string | boolean | number) =>
    setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: types } = await api.get('/property-types');
        setPropertyTypes(types);
      } catch {
        toast.error('No se pudieron cargar los tipos de propiedad');
      }
      try {
        const { data } = await api.get('/search-preferences');
        if (data) {
          setHasPrefs(true);
          setForm({
            zone:             data.zone ?? '',
            localidad:        data.localidad ?? '',
            barrio:           data.barrio ?? '',
            operationType:    data.operationType ?? '',
            typeOfPropertyId: data.typeOfProperty?.id ?? '',
            preferredPrice:   data.preferredPrice ?? '',
            minRooms:         data.minRooms ?? '',
            minBathrooms:     data.minBathrooms ?? '',
            m2:               data.m2 ?? '',
            maxAntiquity:     data.maxAntiquity ?? '',
            property_deed:    data.property_deed ?? false,
            garage:           data.garage ?? false,
            patio:            data.patio ?? false,
            notifyNewMatches: data.notifyNewMatches ?? true,
            notifyPriceDrops: data.notifyPriceDrops ?? true,
          });
        }
      } catch {
        // No tiene preferencias todavía
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAll();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        zone:             form.zone || undefined,
        localidad:        form.localidad || undefined,
        barrio:           form.barrio || undefined,
        operationType:    form.operationType || undefined,
        typeOfPropertyId: form.typeOfPropertyId ? Number(form.typeOfPropertyId) : undefined,
        preferredPrice:   form.preferredPrice ? Number(form.preferredPrice) : undefined,
        minRooms:         form.minRooms ? Number(form.minRooms) : undefined,
        minBathrooms:     form.minBathrooms ? Number(form.minBathrooms) : undefined,
        m2:               form.m2 ? Number(form.m2) : undefined,
        maxAntiquity:     form.maxAntiquity ? Number(form.maxAntiquity) : undefined,
        property_deed:    form.property_deed,
        garage:           form.garage,
        patio:            form.patio,
        notifyNewMatches: form.notifyNewMatches,
        notifyPriceDrops: form.notifyPriceDrops,
      };
      if (hasPrefs) {
        await api.patch('/search-preferences', payload);
      } else {
        await api.post('/search-preferences', payload);
        setHasPrefs(true);
      }
      toast.success('Preferencias guardadas ✓');
    } catch {
      toast.error('No se pudieron guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4].map(i => (
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
   <Link href="/dashboard" className="inline-flex  bg-white rounded-full border border-gray-300 p-2 w-fit items-center gap-2  text-sm font-semibold text-[#0b7a4b] hover:text-[#0f8c58] group transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform mt-0.5" />
          </Link>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0b7a4b]">Preferencias</h1>
        <p className="text-sm  text-gray-600 mt-0.5">
          Guardá tus criterios y te avisamos cuando aparezca algo que te interese
        </p>
      </div>

      {/* ── UBICACIÓN ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={MapPin} label="Ubicación" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Localidad" hint="Ej: Córdoba Capital, La Calera, Villa Carlos Paz">
            <input value={form.localidad} onChange={e => set('localidad', e.target.value)}
              className={inputClass} placeholder="Ej: Córdoba Capital" />
          </Field>
          <Field label="Barrio" hint="Ej: Nueva Córdoba, Güemes, Alta Córdoba">
            <input value={form.barrio} onChange={e => set('barrio', e.target.value)}
              className={inputClass} placeholder="Ej: Nueva Córdoba" />
          </Field>
          <Field label="Zona">
            <input value={form.zone} onChange={e => set('zone', e.target.value)}
              className={inputClass} placeholder="Ej: cordoba, sierras, norte" />
          </Field>
        </div>
      </div>

      {/* ── TIPO DE PROPIEDAD ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={Home} label="Tipo de propiedad" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo">
            <select aria-label="Tipo de propiedad" value={form.typeOfPropertyId}
              onChange={e => set('typeOfPropertyId', e.target.value)} className={selectClass}>
              <option value="">Cualquier tipo</option>
              {propertyTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Operación">
            <select aria-label="Tipo de operación" value={form.operationType}
              onChange={e => set('operationType', e.target.value)} className={selectClass}>
              <option value="">Venta o alquiler</option>
              {OPERATION_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* ── CARACTERÍSTICAS ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={Ruler} label="Características" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Habitaciones mínimas">
            <div className="relative">
              <Bed size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0b7a4b]" />
              <input type="number" min="0" value={form.minRooms}
                onChange={e => set('minRooms', e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400"
                placeholder="Ej: 2" />
            </div>
          </Field>
          <Field label="Baños mínimos">
            <div className="relative">
              <Bath size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0b7a4b]" />
              <input type="number" min="0" value={form.minBathrooms}
                onChange={e => set('minBathrooms', e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400"
                placeholder="Ej: 1" />
            </div>
          </Field>
          <Field label="Superficie (m²)" hint="±15% de tolerancia en el matching">
            <div className="relative">
              <Ruler size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0b7a4b]" />
              <input type="number" min="0" value={form.m2}
                onChange={e => set('m2', e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400"
                placeholder="Ej: 80" />
            </div>
          </Field>
          <Field label="Antigüedad máxima (años)" hint="+2 años de tolerancia en el matching">
            <div className="relative">
              <Hourglass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0b7a4b]" />
              <input type="number" min="0" value={form.maxAntiquity}
                onChange={e => set('maxAntiquity', e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400"
                placeholder="Ej: 20" />
            </div>
          </Field>
        </div>

        {/* Atributos booleanos */}
        <div className="flex flex-wrap gap-3 mt-5">
          {[
            { key: 'property_deed', label: 'Con escritura', icon: FileCheck },
            { key: 'garage',        label: 'Con garage',    icon: Car },
            { key: 'patio',         label: 'Con patio',     icon: Trees },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} type="button"
              onClick={() => set(key, !form[key as keyof typeof form])}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
                form[key as keyof typeof form]
                  ? 'bg-[#0b7a4b]/10 border-[#0b7a4b]/40 text-[#0b7a4b]'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#0b7a4b]/30 hover:text-[#0b7a4b]'
              }`}>
              <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                form[key as keyof typeof form] ? 'bg-[#0b7a4b] border-[#0b7a4b]' : 'border-gray-400'
              }`}>
                {form[key as keyof typeof form] && (
                  <span className="text-white text-[10px] font-black">✓</span>
                )}
              </div>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRECIO ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={DollarSign} label="Precio estimado" />
        <Field label="Precio objetivo (USD)" hint="Se notifica con ±5-7% de tolerancia según el rango de precio">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0b7a4b] text-sm font-black">$</span>
            <input type="number" min="0" value={form.preferredPrice}
              onChange={e => set('preferredPrice', e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400"
              placeholder="Ej: 85000" />
          </div>
        </Field>
      </div>

      {/* ── NOTIFICACIONES ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={Bell} label="Notificaciones por email" />
        <div className="flex flex-col gap-3">
          {[
            {
              key: 'notifyNewMatches',
              label: 'Nuevas propiedades que coincidan',
              desc: 'Te avisamos por mail cuando se publique algo que cumpla tus criterios',
            },
            {
              key: 'notifyPriceDrops',
              label: 'Bajas de precio',
              desc: 'Te avisamos cuando una propiedad reduzca su precio',
            },
          ].map(({ key, label, desc }) => (
            <div key={key}
              onClick={() => set(key, !form[key as keyof typeof form])}
              className={`flex items-center justify-between gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                form[key as keyof typeof form]
                  ? 'bg-[#0b7a4b]/8 border-[#0b7a4b]/30'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}>
              <div>
                <p className={`text-sm font-bold ${
                  form[key as keyof typeof form] ? 'text-[#0b7a4b]' : 'text-gray-700'
                }`}>
                  {label}
                </p>
                <p className={`text-xs mt-0.5 ${
                  form[key as keyof typeof form] ? 'text-[#0b7a4b]/70' : 'text-gray-500'
                }`}>
                  {desc}
                </p>
              </div>
              {/* Toggle switch */}
              <div className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${
                form[key as keyof typeof form] ? 'bg-[#0b7a4b]' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                  form[key as keyof typeof form] ? 'left-5.5' : 'left-0.5'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pb-4">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
          <Save size={15} />
          {saving ? 'Guardando...' : hasPrefs ? 'Actualizar preferencias' : 'Guardar preferencias'}
        </button>
      </div>

    </div>
  );
}