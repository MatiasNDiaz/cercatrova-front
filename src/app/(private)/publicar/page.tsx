'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { Field } from '@/modules/shared/ui/Field';
import { Input, inputBaseClasses } from '@/modules/shared/ui/Input';
import { Select } from '@/modules/shared/ui/Select';
import { toast } from 'sonner';
import { Save, ArrowLeft, MapPin, Home, Ruler, DollarSign, CheckSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Valores EXACTOS de los enums del backend (CreateRequestPropertyDto) — otro valor da 400
const TIPOS_PROPIEDAD   = ['Casa', 'Departamento', 'Terreno', 'Local', 'Oficina', 'Quinta'];
const TIPOS_OPERACION   = ['Venta', 'Alquiler', 'Alquiler temporal'];
const ESTADOS           = ['Excelente', 'Muy bueno', 'Bueno', 'Regular', 'A refaccionar'];
const ORIENTACIONES     = ['Norte', 'Sur', 'Este', 'Oeste', 'Noreste', 'Noroeste', 'Sureste', 'Suroeste'];

/**
 * Encabezado de sección del formulario.
 *
 * Ahora usa el mismo lenguaje que el resto del sitio: ícono en pastilla verde
 * + título en negro, con una línea que ocupa el espacio sobrante. Antes era
 * texto verde en mayúsculas suelto, sin la pastilla, y no se parecía a ningún
 * otro encabezado del proyecto.
 */
function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <h2 className="mb-5 flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700/10 text-brand-700">
        <Icon size={15} />
      </span>
      <span className="text-sm font-bold tracking-tight text-ink-900">{label}</span>
      <span className="ml-1 h-px flex-1 bg-ink-200/70" />
    </h2>
  );
}

/** Tarjeta de sección — mismo radio y sombra en dos capas que el dashboard. */
const CARD =
  'rounded-xl border border-ink-100 bg-white p-6 shadow-[0_1px_2px_rgba(10,12,11,0.04),0_8px_24px_-12px_rgba(10,12,11,0.12)]';

// `Field`, `Input` y `Select` ahora vienen de shared/ui (antes estaban duplicados acá).

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
    } catch (error) {
      // El backend valida los enums (tipoPropiedad, tipoOperacion, estadoConservacion)
      // con mensajes en español que listan los valores permitidos.
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    // Esta página vive FUERA del layout del dashboard (tiene navbar y footer
    // públicos), así que se le da acá el fondo verde de sección que usan el
    // catálogo y el detalle — antes no tenía fondo propio y se veía el
    // `#f2f1f1` del body, con las tarjetas blancas flotando sin contexto.
    // El ancho es el mismo `max-w-4xl` que los formularios del dashboard.
    <main className="min-h-screen bg-surface-mint px-4 pt-28 pb-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex w-full max-w-4xl flex-col gap-6"
      >
        {/* Header — mismo patrón que `DashboardHeader`: volver arriba de todo,
            después ícono + título + bajada. */}
        <Link
          href="/"
          className="group inline-flex w-fit items-center gap-2.5 text-sm font-semibold text-brand-700 transition-colors duration-200 hover:text-brand-800"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white shadow-sm transition-transform duration-200 group-hover:-translate-x-0.5">
            <ArrowLeft size={14} />
          </span>
          Volver al inicio
        </Link>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700/10 text-brand-700">
            <Home size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">Publicá tu propiedad</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Completá los datos y un agente de Cerca Trova se contactará con vos de inmediato.
            </p>
          </div>
        </div>

      {/* ── UBICACIÓN ── */}
      <div className={CARD}>
        <SectionTitle icon={MapPin} label="Ubicación" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Localidad *">
            <Input value={form.localidad} onChange={e => set('localidad', e.target.value)} placeholder="Ej: Córdoba Capital" />
          </Field>
          <Field label="Barrio *">
            <Input value={form.barrio} onChange={e => set('barrio', e.target.value)} placeholder="Ej: Nueva Córdoba" />
          </Field>
          <Field label="Dirección *">
            <Input value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Ej: Av. Colón 1234" />
          </Field>
          <Field label="Piso / Depto">
            <Input value={form.pisoDepto} onChange={e => set('pisoDepto', e.target.value)} placeholder="Ej: 4B (opcional)" />
          </Field>
        </div>
      </div>

      {/* ── CARACTERÍSTICAS ── */}
      <div className={CARD}>
        <SectionTitle icon={Home} label="Características" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de propiedad *">
            <Select aria-label="Tipo de propiedad" value={form.tipoPropiedad} onChange={e => set('tipoPropiedad', e.target.value)}>
              <option value="">Seleccioná...</option>
              {TIPOS_PROPIEDAD.map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Tipo de operación *">
            <Select aria-label="Tipo de operación" value={form.tipoOperacion} onChange={e => set('tipoOperacion', e.target.value)}>
              <option value="">Seleccioná...</option>
              {TIPOS_OPERACION.map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Estado de conservación *">
            <Select aria-label="Estado de conservación" value={form.estadoConservacion} onChange={e => set('estadoConservacion', e.target.value)}>
              <option value="">Seleccioná...</option>
              {ESTADOS.map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Orientación">
            <Select aria-label="Orientación" value={form.orientacion} onChange={e => set('orientacion', e.target.value)}>
              <option value="">Seleccioná... (opcional)</option>
              {ORIENTACIONES.map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Habitaciones *">
            <Input type="number" min="0" value={form.habitaciones} onChange={e => set('habitaciones', e.target.value)} placeholder="Ej: 3" />
          </Field>
          <Field label="Baños *">
            <Input type="number" min="0" value={form.baños} onChange={e => set('baños', e.target.value)} placeholder="Ej: 2" />
          </Field>
          <Field label="Antigüedad (años) *">
            <Input type="number" min="0" value={form.antiguedad} onChange={e => set('antiguedad', e.target.value)} placeholder="Ej: 10" />
          </Field>
        </div>
      </div>

      {/* ── SUPERFICIES ── */}
      <div className={CARD}>
        <SectionTitle icon={Ruler} label="Superficies" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="M² totales *">
            <Input type="number" min="0" value={form.m2Totales} onChange={e => set('m2Totales', e.target.value)} placeholder="Ej: 200" />
          </Field>
          <Field label="M² cubiertos *">
            <Input type="number" min="0" value={form.m2Cubiertos} onChange={e => set('m2Cubiertos', e.target.value)} placeholder="Ej: 150" />
          </Field>
        </div>
      </div>

      {/* ── ATRIBUTOS ── */}
      <div className={CARD}>
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
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
                form[key as keyof typeof form]
                  ? 'border-brand-700/30 bg-brand-700/10 text-brand-700'
                  : 'border-ink-200 bg-white text-ink-500 hover:border-brand-700/30 hover:text-ink-700'
              }`}>
              <div className={`flex h-4 w-4 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                form[key as keyof typeof form] ? 'border-brand-700 bg-brand-700' : 'border-ink-300'
              }`}>
                {form[key as keyof typeof form] && <span className="text-white text-[10px] font-black">✓</span>}
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRECIO Y MENSAJE ── */}
      <div className={CARD}>
        <SectionTitle icon={DollarSign} label="Precio y contacto" />
        <div className="flex flex-col gap-4">
          <Field label="Precio estimado (USD) *">
            <Input type="number" min="0" value={form.precioEstimado} onChange={e => set('precioEstimado', e.target.value)} placeholder="Ej: 85000" />
          </Field>
          <Field label="Mensaje para el agente">
            {/* textarea: usa las clases base sueltas porque no hay componente <Textarea> */}
            <textarea
              value={form.mensajeAgente}
              onChange={e => set('mensajeAgente', e.target.value)}
              rows={4}
              className={`${inputBaseClasses} border-gray-200 focus:border-brand-700 resize-none`}
              placeholder="Contale al agente lo que necesites saber sobre tu propiedad..."
            />
          </Field>
        </div>
      </div>

      {/* ── SUBMIT ── */}
      {/* ── SUBMIT ── */}
      <div className={`${CARD} flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end`}>
        <Link href="/"
          className="rounded-xl border border-ink-200 px-6 py-3 text-center text-sm font-bold text-ink-500 transition-all duration-200 hover:border-ink-400 hover:text-ink-700">
          Cancelar
        </Link>
        <button onClick={handleSubmit} disabled={saving}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(6,57,35,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ background: 'var(--gradient-brand)' }}>
          {saving
            ? <><Loader2 size={15} className="animate-spin" />Enviando…</>
            : <><Save size={15} />Enviar solicitud</>}
        </button>
      </div>

      </motion.div>
    </main>
  );
}