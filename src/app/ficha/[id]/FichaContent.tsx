import {
  Bed, Bath, Maximize, Home, Hourglass, MapPin, Car, TreePine,
  FileCheck, Landmark, ScrollText, CheckCircle2, XCircle, Building2,
  PawPrint, Receipt,
} from 'lucide-react';
import { fechaLarga } from '@/modules/shared/lib/fecha';
import { priceParts, formatExpensas } from '@/modules/shared/lib/money';
import { FichaGallery } from './FichaGallery';
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
 * ── SIN MARCA ≠ SIN VIDA ────────────────────────────────────────────────────
 * "Genérica" acá significa una sola cosa: **cero logo, cero "Cerca Trova", cero
 * dato que permita reconocer de qué inmobiliaria salió**. No significa sobria.
 *
 * El rediseño de esta pantalla parte de ahí: antes era texto gris sobre fondo
 * casi blanco con tarjetas blancas, y se leía como un PDF exportado. Ahora va
 * sobre el verde profundo con textura (`.surface-brand-deepest`, el mismo de la
 * franja de estudiantes y del footer de la landing) con las tarjetas de datos
 * en claro encima: el contraste alto es lo que le da vida, y de paso hace que
 * la información quede MÁS legible que antes, no menos.
 *
 * Todos los colores salen de los tokens ya existentes (`brand-50…950`,
 * `ink-*`). No se inventó ninguno. La variedad viene de usar más pasos de la
 * misma escala —cada sección tiene su propio tono de encabezado— en vez de
 * repetir `brand-700` en todo.
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

/**
 * Tono del encabezado de cada sección.
 *
 * Es lo que da la "variedad" del rediseño: cuatro pasos distintos de la MISMA
 * escala verde, no cuatro colores nuevos. Van aclarándose hacia arriba en
 * importancia (características es el más vivo) y se oscurecen hacia el final,
 * así la página tiene una progresión y no un salteado al azar.
 *
 * ⚠️ El paso más oscuro es `brand-800` (#085031) y NO `brand-900` (#063923).
 * Se probó con 900 y el encabezado de "Descripción" quedaba prácticamente
 * invisible: el fondo de la página es `.surface-brand-deepest`, que arranca en
 * #042a19 — o sea a 3 puntos de luminancia del 900. La barra existía pero no se
 * leía como barra. 800 es el escalón más oscuro que todavía se despega.
 *
 * ⚠️ **El color del texto cambia con el tono, y no es decorativo.** Calculado
 * el contraste contra blanco de cada paso:
 *
 *   brand-500 (#14a366) → 3.25:1   ✗
 *   brand-600 (#0f8b57) → 4.33:1   ✗
 *   brand-700 (#0b7a4b) → 5.44:1   ✓
 *   brand-800 (#085031) → 8.9:1    ✓
 *
 * El mínimo de WCAG AA para texto normal es 4.5:1, y estos rótulos son de
 * 14px: aunque van en negrita, no llegan al umbral de "texto grande" (18.66px
 * en negrita), así que no aplica la excepción. Los dos verdes claros llevan
 * texto `brand-950` (5.2:1 y 6.9:1) en vez de blanco. Efecto colateral bueno:
 * la alternancia clara/oscura suma variedad, que es justo lo que se pedía.
 */
const TONO_SECCION = {
  esmeralda: 'bg-brand-500 text-brand-950',
  bosque:    'bg-brand-600 text-brand-950',
  pino:      'bg-brand-700 text-white',
  noche:     'bg-brand-800 text-white',
} as const;

type TonoSeccion = keyof typeof TONO_SECCION;

/** Dato numérico con ícono. */
function Spec({
  icon: Icon, label, value,
}: {
  icon: React.ElementType; label: string; value: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-brand-700/25 bg-brand-50 px-3 py-4 text-center">
      <Icon size={18} className="text-brand-700" />
      <span className="text-lg leading-none font-bold text-brand-900">{value}</span>
      <span className="text-[10px] font-bold tracking-wider text-brand-700 uppercase">{label}</span>
    </div>
  );
}

/**
 * Atributo booleano. Se listan SIEMPRE los cinco, tengan `true` o `false`:
 * que una propiedad NO tenga escritura es un dato tan relevante como que la
 * tenga, y quien recibe la ficha necesita saberlo sin ambigüedad.
 *
 * El contraste entre los dos estados se subió a propósito: antes "no tiene" era
 * gris clarito sobre gris clarito y había que fijarse en el ícono para
 * distinguirlo. Ahora el sí es verde saturado y el no es rojo suave — el mismo
 * par que ya usa la grilla de Comodidades del detalle público, así que no es un
 * criterio nuevo.
 */
function BoolRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 ${
        value ? 'border-brand-600 bg-brand-50' : 'border-red-300 bg-red-50'
      }`}
    >
      <Icon size={16} className={value ? 'text-brand-700' : 'text-red-500'} />
      <span className={`flex-1 text-sm font-semibold ${value ? 'text-brand-900' : 'text-red-700'}`}>
        {label}
      </span>
      {value
        ? <CheckCircle2 size={16} className="shrink-0 text-brand-600" />
        : <XCircle size={16} className="shrink-0 text-red-400" />}
    </div>
  );
}

/** Fila de ubicación. */
function LocRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-brand-100 py-2.5 last:border-0 odd:bg-brand-50/70">
      <span className="shrink-0 text-xs font-bold tracking-wider text-brand-700 uppercase">{label}</span>
      <span className="text-right text-sm font-semibold wrap-anywhere text-brand-900">
        {value?.trim() ? value : <span className="font-normal text-ink-300">Sin especificar</span>}
      </span>
    </div>
  );
}

/**
 * Tarjeta de sección.
 *
 * El encabezado dejó de ser un renglón de texto verde sobre blanco y pasó a ser
 * una BARRA sólida a todo el ancho, con su propio tono. Es lo que separa una
 * sección de la siguiente de un vistazo cuando se scrollea rápido en el
 * teléfono, que es como se lee una ficha que llega por WhatsApp.
 */
function Section({
  icon: Icon, title, tono, children,
}: {
  icon: React.ElementType; title: string; tono: TonoSeccion; children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_45px_-25px_rgba(0,0,0,0.75)] ring-1 ring-white/10">
      <h2 className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold tracking-wider uppercase ${TONO_SECCION[tono]}`}>
        <Icon size={16} />{title}
      </h2>
      <div className="p-6 sm:p-7">{children}</div>
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
  const ubicacionCorta = [p.barrio, p.localidad].filter(Boolean).join(', ');
  const precio = priceParts(p.price, p.currency);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">

      {/* ── ENCABEZADO ──
          Va directo sobre el verde profundo, sin tarjeta: el título en blanco
          contra ese fondo es el mayor contraste de la página y por eso es lo
          primero que se lee. */}
      <header className="mb-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Operación: la pastilla más viva de las tres — es el dato que
              define de qué se trata el aviso (venta vs alquiler). */}
          <span className="rounded-md bg-brand-500 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-brand-950 uppercase">
            {OPERACION_LABEL[p.operationType] ?? p.operationType}
          </span>
          <span className="rounded-md bg-white/12 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-brand-100 uppercase ring-1 ring-white/20">
            {p.typeOfProperty?.name ?? 'Propiedad'}
          </span>
          <span className="rounded-md bg-white/12 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-brand-100 uppercase ring-1 ring-white/20">
            {ESTADO_LABEL[p.status] ?? p.status}
          </span>
          {/* Número de referencia: sirve para que dos personas hablen de la
              misma propiedad por teléfono sin mandarse el link. */}
          <span className="ml-auto text-[11px] font-semibold text-brand-200/70">
            Ref. #{p.id}
          </span>
        </div>

        <h1 className="text-3xl leading-tight font-bold tracking-tight wrap-anywhere text-white sm:text-4xl">
          {p.title}
        </h1>

        {ubicacionCorta && (
          <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-brand-200">
            <MapPin size={15} className="shrink-0 text-brand-400" />
            {ubicacionCorta}
          </p>
        )}

        {/* ── PRECIO ──
            El elemento más brillante de la ficha, a propósito: es el primer
            dato que busca cualquiera que la reciba. Antes era un texto verde
            más entre otros; ahora es un panel con el gradiente de marca, que no
            compite con nada porque es lo único con ese tratamiento. */}
        <div
          className="mt-6 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-2xl px-6 py-4 shadow-[0_18px_40px_-18px_rgba(20,163,102,0.6)]"
          style={{ background: 'var(--gradient-brand)' }}
        >
          <span className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {precio.amount}
          </span>
          <span className="text-sm font-bold tracking-wide text-white/80">{precio.code}</span>
        </div>
      </header>

      {/* ── GALERÍA ──
          Carrusel deslizable + visor con zoom, arrastre y copiado.
          Ver `FichaGallery`. */}
      <div className="mb-8">
        <FichaGallery images={imagenes} title={p.title} />
      </div>

      <div className="flex flex-col gap-5">

        {/* ── CARACTERÍSTICAS ── */}
        <Section icon={Building2} title="Características" tono="esmeralda">
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

        {/* ── UBICACIÓN COMPLETA — dirección exacta incluida ──
            Sube al 2º lugar: después del precio, "dónde queda" es lo que más
            se pregunta. Antes estaba tercera, detrás de documentación. */}
        <Section icon={MapPin} title="Ubicación" tono="bosque">
          <div className="-mx-2 flex flex-col overflow-hidden rounded-xl">
            <LocRow label="Dirección" value={p.direccion} />
            <LocRow label="Barrio" value={p.barrio} />
            <LocRow label="Zona" value={p.zone} />
            <LocRow label="Localidad" value={p.localidad} />
            <LocRow label="Provincia" value={p.provincia} />
          </div>
        </Section>

        {/* ── DOCUMENTACIÓN ── */}
        <Section icon={ScrollText} title="Documentación" tono="pino">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <BoolRow icon={FileCheck} label="Escritura" value={!!p.property_deed} />
            <BoolRow icon={Landmark} label="Tracto abreviado" value={!!p.tractoAbreviado} />
            <BoolRow icon={ScrollText} label="Boleto" value={!!p.boleto} />
          </div>
        </Section>

        {/* ── DESCRIPCIÓN COMPLETA, sin recortar ── */}
        {p.description?.trim() && (
          <Section icon={Home} title="Descripción" tono="noche">
            {/* `wrap-anywhere`: las descripciones que carga el admin suelen
                traer links pegados, que sin regla de corte desbordan la
                tarjeta. Mismo criterio que el detalle público. */}
            <p className="text-sm leading-relaxed wrap-anywhere whitespace-pre-line text-ink-700">
              {p.description}
            </p>
          </Section>
        )}
      </div>

      {/* ── PIE ──
          Sin marca ni logo. Sólo las fechas de la propiedad, que son parte de
          su información y le dan contexto a quien recibe la ficha. */}
      <footer className="mt-8 border-t border-white/12 pt-5 text-xs text-brand-200/60">
        <p>Publicada el {fechaLarga(p.created_at)}</p>
        {p.updated_at && p.updated_at !== p.created_at && (
          <p className="mt-0.5">Última actualización: {fechaLarga(p.updated_at)}</p>
        )}
      </footer>
    </main>
  );
}

export default FichaContent;
