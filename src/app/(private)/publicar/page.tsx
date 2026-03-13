'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/modules/shared/lib/axios';
import { toast } from 'sonner';
import { Save, ArrowLeft, MapPin, Home, Ruler, DollarSign, FileTextIcon, CheckSquare } from 'lucide-react';
import Link from 'next/link';

const TIPOS_PROPIEDAD   = ['Casa', 'Departamento', 'Quinta', 'Local', 'Oficina', 'Terreno', 'Cochera', 'Otro'];
const TIPOS_OPERACION   = ['Venta', 'Alquiler', 'Alquiler temporal'];
const ESTADOS           = ['Excelente', 'Muy bueno', 'Bueno', 'A refaccionar'];
const ORIENTACIONES     = ['Norte', 'Sur', 'Este', 'Oeste', 'Noreste', 'Noroeste', 'Sureste', 'Suroeste'];

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <h2 className="text-sm font-bold text-[#0b7a4b] uppercase tracking-wider flex items-center gap-2 mb-4">
      <Icon size={14} />{label}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-800">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all";
const selectClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all appearance-none";

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    localidad:          '',
    barrio:             '',
    direccion:          '',
    pisoDepto:          '',
    tipoPropiedad:      '',
    tipoOperacion:      '',
    estadoConservacion: '',
    m2Totales:          '',
    m2Cubiertos:        '',
    habitaciones:       '',
    baños:              '',
    antiguedad:         '',
    orientacion:        '',
    precioEstimado:     '',
    mensajeAgente:      '',
    patio:          false,
    garage:         false,
    escritura:      false,
    impuestosAlDia: false,
    aptoCredito:    false,
  });

  const set = (key: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    // Validación básica
    const required = ['localidad','barrio','direccion','tipoPropiedad','tipoOperacion','estadoConservacion','m2Totales','m2Cubiertos','habitaciones','baños','antiguedad','precioEstimado'];
    const missing = required.filter(k => !form[k as keyof typeof form]);
    if (missing.length > 0) {
      toast.error('Completá todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      await api.post('/property-requests', {
        ...form,
        m2Totales:      parseFloat(form.m2Totales),
        m2Cubiertos:    parseFloat(form.m2Cubiertos),
        habitaciones:   parseInt(form.habitaciones),
        baños:          parseInt(form.baños),
        antiguedad:     parseInt(form.antiguedad),
        precioEstimado: parseFloat(form.precioEstimado),
        pisoDepto:      form.pisoDepto || undefined,
        orientacion:    form.orientacion || undefined,
        mensajeAgente:  form.mensajeAgente || undefined,
      });
      toast.success('¡Solicitud enviada! Un agente se contactará pronto');
      router.push('/dashboard/mis-solicitudes');
    } catch {
      toast.error('No se pudo enviar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-[90%] m-auto mt-30 gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/"
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className='text-[#0b7a4b]' size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0b7a4b]">Nueva Solicitud</h1>
          <p className="text-sm text-gray-500 mt-0.5">Completá los datos y un agente te contactará</p>
        </div>
      </div>

      {/* ── UBICACIÓN ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <SectionTitle icon={MapPin} label="Ubicación" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Localidad *">
            <input value={form.localidad} onChange={e => set('localidad', e.target.value)} className={inputClass} placeholder="Ej: Córdoba Capital" />
          </Field>
          <Field label="Barrio *">
            <input value={form.barrio} onChange={e => set('barrio', e.target.value)} className={inputClass} placeholder="Ej: Nueva Córdoba" />
          </Field>
          <Field label="Dirección *">
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)} className={inputClass} placeholder="Ej: Av. Colón 1234" />
          </Field>
          <Field label="Piso / Depto">
            <input value={form.pisoDepto} onChange={e => set('pisoDepto', e.target.value)} className={inputClass} placeholder="Ej: 4B (opcional)" />
          </Field>
        </div>
      </div>

      {/* ── CARACTERÍSTICAS ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <SectionTitle icon={Home} label="Características" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de propiedad *">
            <select aria-label='a' value={form.tipoPropiedad} onChange={e => set('tipoPropiedad', e.target.value)} className={selectClass}>
              <option value="">Seleccioná...</option>
              {TIPOS_PROPIEDAD.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Tipo de operación *">
            <select aria-label='a' value={form.tipoOperacion} onChange={e => set('tipoOperacion', e.target.value)} className={selectClass}>
              <option value="">Seleccioná...</option>
              {TIPOS_OPERACION.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Estado de conservación *">
            <select aria-label='a' value={form.estadoConservacion} onChange={e => set('estadoConservacion', e.target.value)} className={selectClass}>
              <option value="">Seleccioná...</option>
              {ESTADOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Orientación">
            <select aria-label='a' value={form.orientacion} onChange={e => set('orientacion', e.target.value)} className={selectClass}>
              <option value="">Seleccioná... (opcional)</option>
              {ORIENTACIONES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Habitaciones *">
            <input type="number" min="0" value={form.habitaciones} onChange={e => set('habitaciones', e.target.value)} className={inputClass} placeholder="Ej: 3" />
          </Field>
          <Field label="Baños *">
            <input type="number" min="0" value={form.baños} onChange={e => set('baños', e.target.value)} className={inputClass} placeholder="Ej: 2" />
          </Field>
          <Field label="Antigüedad (años) *">
            <input type="number" min="0" value={form.antiguedad} onChange={e => set('antiguedad', e.target.value)} className={inputClass} placeholder="Ej: 10" />
          </Field>
        </div>
      </div>

      {/* ── SUPERFICIES ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <SectionTitle icon={Ruler} label="Superficies" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="M² totales *">
            <input type="number" min="0" value={form.m2Totales} onChange={e => set('m2Totales', e.target.value)} className={inputClass} placeholder="Ej: 200" />
          </Field>
          <Field label="M² cubiertos *">
            <input type="number" min="0" value={form.m2Cubiertos} onChange={e => set('m2Cubiertos', e.target.value)} className={inputClass} placeholder="Ej: 150" />
          </Field>
        </div>
      </div>

      {/* ── ATRIBUTOS ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <SectionTitle icon={CheckSquare} label="Atributos" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: 'patio',          label: 'Patio' },
            { key: 'garage',         label: 'Garage' },
            { key: 'escritura',      label: 'Escritura' },
            { key: 'impuestosAlDia', label: 'Impuestos al día' },
            { key: 'aptoCredito',    label: 'Apto crédito' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => set(key, !form[key as keyof typeof form])}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border transition-all ${
                form[key as keyof typeof form]
                  ? 'bg-[#0b7a4b]/10 border-[#0b7a4b]/30 text-[#0b7a4b]'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
              <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                form[key as keyof typeof form] ? 'bg-[#0b7a4b] border-[#0b7a4b]' : 'border-gray-300'
              }`}>
                {form[key as keyof typeof form] && <span className="text-white text-[10px] font-black">✓</span>}
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRECIO Y MENSAJE ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <SectionTitle icon={DollarSign} label="Precio y contacto" />
        <div className="flex flex-col gap-4">
          <Field label="Precio estimado (USD) *">
            <input type="number" min="0" value={form.precioEstimado} onChange={e => set('precioEstimado', e.target.value)} className={inputClass} placeholder="Ej: 85000" />
          </Field>
          <Field label="Mensaje para el agente">
            <textarea
              value={form.mensajeAgente}
              onChange={e => set('mensajeAgente', e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Contale al agente lo que necesites saber sobre tu propiedad..."
            />
          </Field>
        </div>
      </div>

      {/* ── SUBMIT ── */}
      <div className="flex justify-end gap-3 pb-4">
        <Link href="/"
          className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
          Cancelar
        </Link>
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
          <Save size={15} />
          {saving ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </div>

    </div>
  );
}