import Image from 'next/image';
import {
  Bed, Bath, Maximize, Home, Hourglass, MapPin, Car, TreePine,
  FileCheck, Landmark, ScrollText, CheckCircle2, XCircle, Building2,
  PawPrint, Receipt,
} from 'lucide-react';
import { fechaLarga } from '@/modules/shared/lib/fecha';
import { priceParts, formatExpensas } from '@/modules/shared/lib/money';
import type { FichaProperty } from './types';

/**
 * Cuerpo de la ficha compartible.
 *
 * ── Regla que gobierna este archivo ─────────────────────────────────────────
 * Es un ESPEJO COMPLETO de la propiedad tal como la cargó el admin: los 21
 * campos del formulario de alta (`PropertyForm`) + todas las imágenes. Ninguno
 * se resume, se recorta ni se oculta — incluida la dirección exacta, que en el
 * detalle público del sitio se muestra pero acá tiene que estar sí o sí porque
 * el destinatario es un colega o un cliente directo.
 *
 * Campos representados, uno por uno (contra `Property` del backend):
 *   título · descripción · precio (con su MONEDA) · operación · tipo · estado ·
 *   provincia · localidad · barrio · dirección · zona ·
 *   ambientes · baños · sup. total · sup. cubierta · antigüedad · expensas ·
 *   escritura · tracto abreviado · boleto · cochera · patio · apto mascotas ·
 *   todas las imágenes (en el orden elegido por el admin) ·
 *   fecha de publicación y de última actualización
 *
 * Única excepción a "no se oculta nada": `expensas` NO se renderiza cuando
 * viene `null` (no informadas). Una casa nunca tiene expensas, y una celda
 * "Expensas: —" en una ficha que se le manda a un cliente se lee como un dato
 * faltante, no como "no aplica".
 *
 * ── Lo que se deja AFUERA, y por qué ────────────────────────────────────────
 * `agent`, `referredBy`, `comments`, `ratings`, `ratingAverage` y
 * `favoritesCount` existen en la respuesta del backend pero NO se muestran.
 * No son datos de la propiedad: son datos de la inmobiliaria y de la actividad
 * de su sitio. Mostrar el agente (nombre + teléfono) identificaría el origen,
 * que es justo lo que esta página tiene que evitar. Mostrar comentarios o
 * valoraciones delataría que la ficha sale de un portal con usuarios.
 *
 * ── Sin marca ───────────────────────────────────────────────────────────────
 * Cero logo, cero "Cerca Trova". Se usan los tokens de color del sistema
 * (`brand-*`, `ink-*`) porque son verde/gris/blanco genéricos, pero no hay
 * ningún elemento que permita reconocer la inmobiliaria.
 */

/** Etiqueta legible de cada estado. Se muestran todos, incluso los no públicos. */
const ESTADO_LABEL: Record<string, string> = {
  disponible: 'Disponible',
  pendiente: 'Pendiente',
  vendida: 'Vendida',
  alquilada: 'Alquilada',
  'en pausa': 'En pausa',
  eliminado: 'Dada de baja',
};

const OPERACION_LABEL: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  temporal: 'Alquiler temporal',
};

/** Dato numérico con ícono. */
function Spec({
  icon: Icon, label, value,
}: {
  icon: React.ElementType; label: string; value: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-ink-100 bg-white px-3 py-4 text-center">
      <Icon size={18} className="text-brand-700" />
      <span className="text-lg font-bold leading-none text-ink-900">{value}</span>
      <span className="text-[10px] font-bold tracking-wider text-ink-400 uppercase">{label}</span>
    </div>
  );
}

/**
 * Atributo booleano. Se listan SIEMPRE los cinco, tengan `true` o `false`:
 * que una propiedad NO tenga escritura es un dato tan relevante como que la
 * tenga, y quien recibe la ficha necesita saberlo sin ambigüedad.
 */
function BoolRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 ${
        value ? 'border-brand-700/25 bg-brand-50' : 'border-ink-100 bg-ink-50'
      }`}
    >
      <Icon size={16} className={value ? 'text-brand-700' : 'text-ink-400'} />
      <span className={`flex-1 text-sm font-semibold ${value ? 'text-brand-800' : 'text-ink-500'}`}>
        {label}
      </span>
      {value
        ? <CheckCircle2 size={16} className="shrink-0 text-brand-600" />
        : <XCircle size={16} className="shrink-0 text-ink-300" />}
    </div>
  );
}

/** Fila de ubicación. */
function LocRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
      <span className="shrink-0 text-xs font-bold tracking-wider text-ink-400 uppercase">{label}</span>
      <span className="text-right text-sm font-semibold text-ink-900">
        {value?.trim() ? value : <span className="font-normal text-ink-300">Sin especificar</span>}
      </span>
    </div>
  );
}

function Section({
  icon: Icon, title, children,
}: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_1px_2px_rgba(10,12,11,0.04),0_8px_24px_-14px_rgba(10,12,11,0.12)] sm:p-7">
      <h2 className="mb-5 flex items-center gap-2.5 text-sm font-bold tracking-wider text-brand-700 uppercase">
        <Icon size={15} />{title}
      </h2>
      {children}
    </section>
  );
}

export function FichaContent({ p }: { p: FichaProperty }) {
  /**
   * Sin `sort` local: `GET /properties/:id` ya devuelve la galería ordenada por
   * `order ASC` (el orden que el admin dejó con el drag & drop del formulario),
   * y el backend garantiza que la de `order = 0` es la portada. Reordenar acá
   * por `isCover` desarmaría ese orden.
   */
  const imagenes = p.images ?? [];
  const portada = imagenes[0];
  const resto = imagenes.slice(1);

  const ubicacionCorta = [p.barrio, p.localidad].filter(Boolean).join(', ');
  const precio = priceParts(p.price, p.currency);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">

      {/* ── ENCABEZADO ── */}
      <header className="mb-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-brand-700/25 bg-brand-50 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-brand-800 uppercase">
            {OPERACION_LABEL[p.operationType] ?? p.operationType}
          </span>
          <span className="rounded-md border border-ink-200 bg-ink-50 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-ink-700 uppercase">
            {p.typeOfProperty?.name ?? 'Propiedad'}
          </span>
          <span className="rounded-md border border-ink-200 bg-white px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-ink-600 uppercase">
            {ESTADO_LABEL[p.status] ?? p.status}
          </span>
          {/* Número de referencia: sirve para que dos personas hablen de la
              misma propiedad por teléfono sin mandarse el link. */}
          <span className="ml-auto text-[11px] font-semibold text-ink-400">
            Ref. #{p.id}
          </span>
        </div>

        <h1 className="text-3xl leading-tight font-bold tracking-tight text-ink-900 sm:text-4xl">
          {p.title}
        </h1>

        {ubicacionCorta && (
          <p className="mt-2.5 flex items-center gap-1.5 text-sm text-ink-500">
            <MapPin size={15} className="shrink-0 text-brand-700" />
            {ubicacionCorta}
          </p>
        )}

        <p className="mt-5 text-3xl font-black tracking-tight text-brand-700 sm:text-4xl">
          {precio.amount}
          <span className="ml-2 text-base font-bold text-ink-400">{precio.code}</span>
        </p>
      </header>

      {/* ── IMAGEN DESTACADA ── */}
      {portada ? (
        <div className="relative mb-3 h-72 w-full overflow-hidden rounded-2xl border border-ink-100 bg-ink-100 sm:h-105">
          <Image
            src={portada.url}
            alt={`${p.title} — imagen principal`}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </div>
      ) : (
        <div className="mb-3 flex h-56 w-full items-center justify-center rounded-2xl border border-ink-100 bg-ink-50">
          <Home size={40} className="text-ink-300" />
        </div>
      )}

      {/* ── GALERÍA — TODAS las imágenes restantes ── */}
      {resto.length > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {resto.map((img, i) => (
            <div
              key={img.id}
              className="relative aspect-4/3 overflow-hidden rounded-xl border border-ink-100 bg-ink-100"
            >
              <Image
                src={img.url}
                alt={`${p.title} — imagen ${i + 2} de ${imagenes.length}`}
                fill
                sizes="(max-width: 640px) 33vw, 220px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-5">

        {/* ── CARACTERÍSTICAS ── */}
        <Section icon={Building2} title="Características">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Spec icon={Bed} label="Ambientes" value={p.rooms ?? 0} />
            <Spec icon={Bath} label="Baños" value={p.bathrooms ?? 0} />
            <Spec icon={Maximize} label="Sup. total" value={p.supTotal != null ? `${p.supTotal} m²` : '—'} />
            <Spec icon={Maximize} label="Sup. cubierta" value={p.supCubierta != null ? `${p.supCubierta} m²` : '—'} />
            <Spec icon={Hourglass} label="Antigüedad" value={`${p.antiquity ?? 0} años`} />
            {/* Solo si tiene: `formatExpensas` devuelve null cuando no hay
                valor, y una casa sin expensas no debería mostrar una celda
                vacía en una ficha pensada para mandarle a un cliente. */}
            {formatExpensas(p.expensas) && (
              <Spec icon={Receipt} label="Expensas" value={formatExpensas(p.expensas)!} />
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <BoolRow icon={Car} label="Cochera" value={!!p.garage} />
            <BoolRow icon={TreePine} label="Patio" value={!!p.patio} />
            <BoolRow icon={PawPrint} label="Apto mascotas" value={!!p.aptoMascotas} />
          </div>
        </Section>

        {/* ── DOCUMENTACIÓN ── */}
        <Section icon={ScrollText} title="Documentación">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <BoolRow icon={FileCheck} label="Escritura" value={!!p.property_deed} />
            <BoolRow icon={Landmark} label="Tracto abreviado" value={!!p.tractoAbreviado} />
            <BoolRow icon={ScrollText} label="Boleto" value={!!p.boleto} />
          </div>
        </Section>

        {/* ── UBICACIÓN COMPLETA — dirección exacta incluida ── */}
        <Section icon={MapPin} title="Ubicación">
          <div className="flex flex-col">
            <LocRow label="Dirección" value={p.direccion} />
            <LocRow label="Barrio" value={p.barrio} />
            <LocRow label="Zona" value={p.zone} />
            <LocRow label="Localidad" value={p.localidad} />
            <LocRow label="Provincia" value={p.provincia} />
          </div>
        </Section>

        {/* ── DESCRIPCIÓN COMPLETA, sin recortar ── */}
        {p.description?.trim() && (
          <Section icon={Home} title="Descripción">
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink-600">
              {p.description}
            </p>
          </Section>
        )}
      </div>

      {/* ── PIE ──
          Sin marca ni logo. Sólo las fechas de la propiedad, que son parte de
          su información y le dan contexto a quien recibe la ficha. */}
      <footer className="mt-8 border-t border-ink-200 pt-5 text-xs text-ink-400">
        <p>Publicada el {fechaLarga(p.created_at)}</p>
        {p.updated_at && p.updated_at !== p.created_at && (
          <p className="mt-0.5">Última actualización: {fechaLarga(p.updated_at)}</p>
        )}
      </footer>
    </main>
  );
}

export default FichaContent;
