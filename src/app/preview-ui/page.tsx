'use client';

/**
 * ⚠️ PÁGINA TEMPORAL DE PREVIEW — NO ES PARTE DEL PRODUCTO.
 *
 * Existe solo para ver en vivo las piezas del sistema de diseño mientras las
 * construimos (tokens de color, ConfirmDialog, Field/Input/Select).
 * Ruta: http://localhost:3000/preview-ui
 *
 * Borrar esta carpeta cuando el rediseño esté cerrado.
 */

import { useState } from 'react';
import { Trash2, LogOut } from 'lucide-react';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import { Field } from '@/modules/shared/ui/Field';
import { Input } from '@/modules/shared/ui/Input';
import { Select } from '@/modules/shared/ui/Select';
import { toast } from 'sonner';

const BRAND_STEPS = [
  { step: '50', cls: 'bg-brand-50', hex: '#eff9f4' },
  { step: '100', cls: 'bg-brand-100', hex: '#d7f0e3' },
  { step: '200', cls: 'bg-brand-200', hex: '#b0e2c8' },
  { step: '300', cls: 'bg-brand-300', hex: '#7ecfa7' },
  { step: '400', cls: 'bg-brand-400', hex: '#45b782' },
  { step: '500', cls: 'bg-brand-500', hex: '#14a366', note: 'ya en uso' },
  { step: '600', cls: 'bg-brand-600', hex: '#0f8b57', note: 'ya en uso' },
  { step: '700', cls: 'bg-brand-700', hex: '#0b7a4b', note: 'MARCA · 581 usos' },
  { step: '800', cls: 'bg-brand-800', hex: '#085031', note: 'ya en uso' },
  { step: '900', cls: 'bg-brand-900', hex: '#063923' },
  { step: '950', cls: 'bg-brand-950', hex: '#032315' },
];

const INK_STEPS = [
  { step: '50', cls: 'bg-ink-50', hex: '#f6f7f6' },
  { step: '100', cls: 'bg-ink-100', hex: '#e8eae9' },
  { step: '200', cls: 'bg-ink-200', hex: '#d1d5d2' },
  { step: '300', cls: 'bg-ink-300', hex: '#adb3af' },
  { step: '400', cls: 'bg-ink-400', hex: '#7e8681' },
  { step: '500', cls: 'bg-ink-500', hex: '#5b635e' },
  { step: '600', cls: 'bg-ink-600', hex: '#444a46' },
  { step: '700', cls: 'bg-ink-700', hex: '#363b38' },
  { step: '800', cls: 'bg-ink-800', hex: '#222624' },
  { step: '900', cls: 'bg-ink-900', hex: '#141715' },
  { step: '950', cls: 'bg-ink-950', hex: '#0a0c0b', note: 'negro del logo' },
];

const SURFACES = [
  { name: 'white', cls: 'bg-white', hex: '#ffffff', note: 'Tailwind nativo — cards' },
  { name: 'surface', cls: 'bg-surface', hex: '#f5f7f5', note: 'fondo de página' },
  { name: 'surface-alt', cls: 'bg-surface-alt', hex: '#e5e7e5', note: 'sección secundaria' },
  { name: 'surface-deep', cls: 'bg-surface-deep', hex: '#cbd8cd', note: 'fondo de dashboard (user + admin)' },
];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-bold tracking-tight text-ink-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Swatches({ steps }: { steps: { step: string; cls: string; hex: string; note?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {steps.map((s) => (
        <div key={s.step} className="overflow-hidden rounded-xl border border-ink-100">
          <div className={`h-16 w-full ${s.cls}`} />
          <div className="bg-white px-3 py-2">
            <p className="text-xs font-bold text-ink-800">{s.step}</p>
            <p className="font-mono text-[11px] text-ink-400">{s.hex}</p>
            {s.note && <p className="mt-0.5 text-[10px] font-semibold text-brand-700">{s.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PreviewUIPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('');
  const [conError, setConError] = useState(false);

  return (
    <main className="min-h-screen bg-surface px-6 pt-28 pb-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">

        <header>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
            Sistema de diseño · preview temporal
          </span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink-900">
            Fundaciones de UI
          </h1>
          <p className="mt-2 max-w-2xl text-ink-500">
            Piezas creadas pero todavía <strong className="text-ink-700">no usadas</strong> en el
            resto del proyecto. Se migran página por página en las próximas sesiones.
            Esta ruta (<code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">/preview-ui</code>)
            es temporal y se borra al cerrar el rediseño.
          </p>
        </header>

        {/* ── TOKENS ─────────────────────────────────────────────── */}
        <Section
          title="Verde de marca — escala brand"
          subtitle="Los pasos 500/600/700/800 son los tonos exactos que el proyecto ya usa, para que migrar sea un reemplazo 1:1 sin cambio visual."
        >
          <Swatches steps={BRAND_STEPS} />
        </Section>

        <Section
          title="Negro y gris — escala ink"
          subtitle="Se llama ink y no gray a propósito: nombrarla gray pisaría la escala nativa de Tailwind y cambiaría cada text-gray-* que ya existe."
        >
          <Swatches steps={INK_STEPS} />
        </Section>

        <Section title="Superficies" subtitle="Fondos de página, sección y dashboard.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SURFACES.map((s) => (
              <div key={s.name} className="overflow-hidden rounded-xl border border-ink-100">
                <div className={`h-16 w-full ${s.cls}`} />
                <div className="bg-white px-3 py-2">
                  <p className="font-mono text-xs font-bold text-ink-800">{s.name}</p>
                  <p className="font-mono text-[11px] text-ink-400">{s.hex}</p>
                  <p className="mt-0.5 text-[10px] text-ink-500">{s.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Gradiente de marca" subtitle="Preserva exacto el par #0f8b57 → #14a366 que ya usan 20+ botones, ahora centralizado.">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-16 w-64 rounded-xl" style={{ background: 'var(--gradient-brand)' }} />
            <code className="rounded-lg bg-ink-100 px-3 py-2 font-mono text-xs text-ink-700">
              style=&#123;&#123; background: &apos;var(--gradient-brand)&apos; &#125;&#125;
            </code>
          </div>
        </Section>

        {/* ── CONFIRM DIALOG ─────────────────────────────────────── */}
        <Section
          title="ConfirmDialog"
          subtitle="Reemplaza las 8 copias del modal de confirmación. Probá Escape y click en el fondo para cerrar."
        >
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                confirmDialog({
                  title: '¿Eliminar propiedad?',
                  message: 'Se va a borrar "Casa 3 amb en Nueva Córdoba" junto con sus imágenes. Esta acción no se puede deshacer.',
                  confirmLabel: 'Eliminar',
                  variant: 'danger',
                  icon: Trash2,
                  onConfirm: () => {
                    toast.success('Propiedad eliminada');
                  },
                })
              }
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.98]"
            >
              <Trash2 size={16} /> variant=&quot;danger&quot;
            </button>

            <button
              onClick={() =>
                confirmDialog({
                  title: '¿Cerrar sesión?',
                  message: 'Vas a volver al inicio y vas a tener que ingresar tus datos de nuevo para entrar.',
                  confirmLabel: 'Cerrar sesión',
                  cancelLabel: 'Me quedo',
                  variant: 'default',
                  icon: LogOut,
                  onConfirm: () => {
                    toast.success('Sesión cerrada');
                  },
                })
              }
              className="flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <LogOut size={16} /> variant=&quot;default&quot;
            </button>

            <button
              onClick={() =>
                confirmDialog({
                  title: '¿Eliminar usuario?',
                  message: 'Probá este: onConfirm es async y tarda 1.5s — el botón queda cargando.',
                  confirmLabel: 'Eliminar',
                  variant: 'danger',
                  onConfirm: async () => {
                    await new Promise((r) => setTimeout(r, 1500));
                    toast.success('Usuario eliminado');
                  },
                })
              }
              className="cursor-pointer rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-ink-700 transition-all hover:bg-ink-200 active:scale-[0.98]"
            >
              onConfirm async (loading)
            </button>
          </div>
        </Section>

        {/* ── FORM ───────────────────────────────────────────────── */}
        <Section
          title="Field / Input / Select"
          subtitle="Misma apariencia que hoy (label chico bold + input gris que blanquea al foco), centralizada. El rediseño visual de inputs es una sesión aparte."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Matías" />
            </Field>

            <Field label="Email" hint="Te avisamos acá cuando haya novedades.">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@email.com"
              />
            </Field>

            <Field label="Tipo de propiedad" required>
              <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="casa">Casa</option>
                <option value="depto">Departamento</option>
                <option value="terreno">Terreno</option>
              </Select>
            </Field>

            <Field
              label="Con error"
              error={conError ? 'Este campo es obligatorio.' : undefined}
            >
              <Input
                placeholder="Tocá el botón de abajo"
                invalid={conError}
                onChange={() => {}}
              />
            </Field>
          </div>

          <button
            onClick={() => setConError((v) => !v)}
            className="mt-4 cursor-pointer rounded-xl bg-ink-100 px-4 py-2 text-sm font-semibold text-ink-700 transition-all hover:bg-ink-200"
          >
            {conError ? 'Quitar error' : 'Mostrar estado de error'}
          </button>
        </Section>

      </div>
    </main>
  );
}
