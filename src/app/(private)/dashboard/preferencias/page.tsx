'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import {
  MapPin, Home, Ruler, DollarSign, Bell, Save,
  Bed, Bath, Hourglass, FileCheck, Car, Trees,
  ArrowLeft, SlidersHorizontal, ChevronDown, ChevronUp,
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

// ── TIPOS ─────────────────────────────────────────────────────────────────────
interface FormState {
  zone: string;
  localidad: string;
  barrio: string;
  operationType: string;
  typeOfPropertyId: string | number;
  preferredPrice: string;
  minRooms: string;
  minBathrooms: string;
  m2: string;
  maxAntiquity: string;
  property_deed: boolean;
  garage: boolean;
  patio: boolean;
  notifyNewMatches: boolean;
  notifyPriceDrops: boolean;
}

interface SummaryCardProps {
  form: FormState;
  propertyTypes: PropertyType[];
  onEdit: () => void;
}

// ── CARD RESUMEN NARRATIVO ────────────────────────────────────────────────────
function SummaryCard({ form, propertyTypes, onEdit }: SummaryCardProps) {
  const typeName = propertyTypes.find(t => String(t.id) === String(form.typeOfPropertyId))?.name;

  const hasAnyData =
    form.localidad || form.barrio || form.zone ||
    form.operationType || form.typeOfPropertyId ||
    form.preferredPrice || form.minRooms || form.minBathrooms ||
    form.m2 || form.maxAntiquity ||
    form.property_deed || form.garage || form.patio;

  const activeBadges = [
    form.property_deed && { label: 'escritura', icon: FileCheck },
    form.garage        && { label: 'garage',    icon: Car },
    form.patio         && { label: 'patio',     icon: Trees },
  ].filter(Boolean) as { label: string; icon: React.ElementType }[];

  // ── Construye la oración narrativa ──────────────────────
  const buildStory = (): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];

    const hi = (text: string, key: string) => (
      <span key={key} className="text-[#0b7a4b] font-semibold">{text}</span>
    );

    const opLabel =
      form.operationType === 'venta' ? 'comprar' :
      form.operationType === 'alquiler' ? 'alquilar' :
      form.operationType === 'alquiler temporal' ? 'alquilar temporalmente' : null;

    const typeArticle =
      typeName === 'Casa' ? 'una casa' :
      typeName === 'Departamento' ? 'un departamento' :
      typeName ? `una ${typeName.toLowerCase()}` : 'una propiedad';

    // Apertura
    if (opLabel) {
      parts.push('Querés ', hi(opLabel, 'op'), ' ', hi(typeArticle, 'type'));
    } else {
      parts.push('Estás buscando ', hi(typeArticle, 'type'));
    }

    // Ubicación
    const locParts = [form.localidad, form.barrio].filter(Boolean).join(', ');
const zonePart = form.zone ? `zona ${form.zone}` : '';
const fullLoc  = [locParts, zonePart].filter(Boolean).join(' · ');

if (fullLoc) {
  parts.push(' en ', hi(fullLoc, 'loc'));
}

    // Características numéricas
    const chars: React.ReactNode[] = [];
    if (form.minRooms)     chars.push(hi(`${form.minRooms} habitación${Number(form.minRooms) > 1 ? 'es' : ''}`, 'rooms'));
    if (form.minBathrooms) chars.push(hi(`${form.minBathrooms} baño${Number(form.minBathrooms) > 1 ? 's' : ''}`, 'baths'));
    if (form.m2)           chars.push(hi(`${form.m2} m²`, 'm2'));

    if (chars.length > 0) {
      parts.push(', con al menos ');
      chars.forEach((c, i) => {
        parts.push(c);
        if (i < chars.length - 2) parts.push(', ');
        else if (i === chars.length - 2) parts.push(' y ');
      });
    }

    // Antigüedad
    if (form.maxAntiquity) {
      parts.push(' y no más de ', hi(`${form.maxAntiquity} años`, 'ant'), ' de antigüedad');
    }

    // Precio
    if (form.preferredPrice) {
      parts.push('. Tu presupuesto es de ', hi(`USD ${Number(form.preferredPrice).toLocaleString('es-AR')}`, 'price'));
    }

    // Extras booleanos
    if (activeBadges.length > 0) {
      const labels = activeBadges.map(b => b.label);
      const last = labels.pop()!;
      const extrasText = labels.length > 0 ? `${labels.join(', ')} y ${last}` : last;
      parts.push('. Preferís que tenga ', hi(extrasText, 'extras'));
    }

    parts.push('.');
    return parts;
  };

  // ── Empty state ──────────────────────────────────────────
  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-2xl border border-[#0b7a4b]/15 p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#0b7a4b]/10 flex items-center justify-center">
          <SlidersHorizontal size={22} className="text-[#0b7a4b]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Todavía no configuraste tus preferencias</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Completá el formulario de abajo para que te avisemos cuando aparezca algo que te interese
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#0b7a4b]/20 overflow-hidden shadow-sm">

      {/* Header */}
      <div className="flex  items-center justify-between px-5 py-3.5 border-b border-[#0b7a4b]/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0b7a4b] flex items-center justify-center">
            <SlidersHorizontal size={13} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-[#0b7a4b]">Tus preferencias actuales</p>
        </div>
        <button
          onClick={onEdit}
          className="text-xs font-semibold text-[#0b7a4b] bg-white border border-[#0b7a4b]/20 px-3 py-1.5 rounded-lg hover:bg-[#0b7a4b]/5 transition-all"
        >
          Editar
        </button>
      </div>

      {/* Historia narrativa */}
      <div className="px-5 py-5 flex flex-col gap-4">

        {/* Oración principal */}
        <p className="text-md text-gray-600 leading-relaxed">
          {buildStory()}
        </p>

        {/* Badges de extras si los hay */}
        {activeBadges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeBadges.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#0b7a4b] bg-[#0b7a4b]/8 border border-[#0b7a4b]/15 px-2.5 py-1 rounded-lg capitalize"
              >
                <Icon size={11} /> {label}
              </span>
            ))}
          </div>
        )}

        {/* Notificaciones */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          <Bell size={12} className="text-[#0b7a4b] shrink-0" />
          <p className="text-[11px] text-gray-400">
            {form.notifyNewMatches && form.notifyPriceDrops
              ? 'Te avisamos por nuevas propiedades y bajas de precio'
              : form.notifyNewMatches
              ? 'Te avisamos cuando haya nuevas propiedades'
              : form.notifyPriceDrops
              ? 'Te avisamos cuando haya bajas de precio'
              : 'Notificaciones desactivadas'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── PAGE PRINCIPAL ────────────────────────────────────────────────────────────
export default function PreferenciasPage() {
  const { user } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [hasPrefs, setHasPrefs] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);

  const [form, setForm] = useState<FormState>({
    zone:             '',
    localidad:        '',
    barrio:           '',
    operationType:    '',
    typeOfPropertyId: '',
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
        setShowForm(true);
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
      setShowForm(false);
    } catch {
      toast.error('No se pudieron guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
          <div className="h-3 bg-gray-100 rounded-full w-1/4 mb-5" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">

      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#0b7a4b] hover:text-[#0f8c58] group transition-colors w-fit"
      >
        <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
          <ArrowLeft size={14} />
        </span>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl mt-1 font-bold text-[#0b7a4b]">Preferencias</h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Guardá tus criterios y te avisamos cuando aparezca algo que te interese
        </p>
      </div>

      {/* ── CARD RESUMEN NARRATIVO ── */}
      <SummaryCard
        form={form}
        propertyTypes={propertyTypes}
        onEdit={() => setShowForm(true)}
      />

      {/* ── TOGGLE FORMULARIO ── */}
      {hasPrefs && (
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center justify-between w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal size={15} className="text-[#0b7a4b]" />
            <span className="text-sm font-medium text-gray-700">
              {showForm ? 'Ocultar configuración' : 'Editar preferencias'}
            </span>
          </div>
          {showForm
            ? <ChevronUp size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            : <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          }
        </button>
      )}

      {/* ── FORMULARIO (colapsable si ya tiene prefs) ── */}
      <div className={`flex flex-col gap-5 ${showForm || !hasPrefs ? 'block' : 'hidden'}`}>

        {/* UBICACIÓN */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
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

        {/* TIPO DE PROPIEDAD */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
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

        {/* CARACTERÍSTICAS */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
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

          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { key: 'property_deed', label: 'Con escritura', icon: FileCheck },
              { key: 'garage',        label: 'Con garage',    icon: Car },
              { key: 'patio',         label: 'Con patio',     icon: Trees },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} type="button"
                onClick={() => set(key, !form[key as keyof FormState])}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
                  form[key as keyof FormState]
                    ? 'bg-[#0b7a4b]/10 border-[#0b7a4b]/40 text-[#0b7a4b]'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#0b7a4b]/30 hover:text-[#0b7a4b]'
                }`}>
                <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                  form[key as keyof FormState] ? 'bg-[#0b7a4b] border-[#0b7a4b]' : 'border-gray-400'
                }`}>
                  {form[key as keyof FormState] && (
                    <span className="text-white text-[10px] font-black">✓</span>
                  )}
                </div>
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* PRECIO */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <SectionTitle icon={DollarSign} label="Precio estimado" />
          <Field label="Precio objetivo (USD)" hint="Se notifica con ±5-7% de tolerancia según el rango de precio">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0b7a4b] text-sm font-bold">$</span>
              <input type="number" min="0" value={form.preferredPrice}
                onChange={e => set('preferredPrice', e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400"
                placeholder="Ej: 85000" />
            </div>
          </Field>
        </div>

        {/* NOTIFICACIONES */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
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
                onClick={() => set(key, !form[key as keyof FormState])}
                className={`flex items-center justify-between gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  form[key as keyof FormState]
                    ? 'bg-[#0b7a4b]/8 border-[#0b7a4b]/30'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}>
                <div>
                  <p className={`text-sm font-semibold ${
                    form[key as keyof FormState] ? 'text-[#0b7a4b]' : 'text-gray-700'
                  }`}>{label}</p>
                  <p className={`text-xs mt-0.5 ${
                    form[key as keyof FormState] ? 'text-[#0b7a4b]/70' : 'text-gray-500'
                  }`}>{desc}</p>
                </div>
                <div className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${
                  form[key as keyof FormState] ? 'bg-[#0b7a4b]' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                    form[key as keyof FormState] ? 'left-5.5' : 'left-0.5'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pb-4">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
            <Save size={15} />
            {saving ? 'Guardando...' : hasPrefs ? 'Actualizar preferencias' : 'Guardar preferencias'}
          </button>
        </div>

      </div>
    </div>
  );
}