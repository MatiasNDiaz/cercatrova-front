import {
  Bed, Bath, Maximize, Home, Hourglass, MapPin, Car, TreePine,
  FileCheck, Landmark, ScrollText, CheckCircle2, XCircle, Building2,
  PawPrint, Receipt, ShieldCheck,
} from 'lucide-react';
import { fechaLarga } from '@/modules/shared/lib/fecha';
import { priceParts, formatExpensas } from '@/modules/shared/lib/money';
import {
  BADGE_BASE, operationBadgeSoft, propertyTypeBadgeSoft, statusBadgeColor, statusDotColor,
} from '@/modules/properties/lib/badgeStyles';
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
 * ── SIN MARCA ≠ SIN VIDA, pero tampoco un lenguaje aparte ───────────────────
 * "Genérica" significa una sola cosa: **cero logo, cero "Cerca Trova", cero
 * dato que permita reconocer de qué inmobiliaria salió**. No significa sobria,
 * pero tampoco justifica inventarle un diseño propio.
 *
 * Por eso esta pantalla ahora reusa las MISMAS piezas visuales que el detalle
 * público —badges suaves, tarjetas de specs con el círculo del ícono, la grilla
 * verde/rojo de comodidades y el fondo `surface-mint`— en vez de tener su
 * versión paralela de cada una. Ninguna de esas piezas identifica a nadie: son
 * verdes, grises y blancos del sistema de tokens.
 *
 * ⚠️ Los estilos de badge se IMPORTAN de `properties/lib/badgeStyles` en lugar
 * de copiarse. Es un cruce de módulo consciente: son strings de clases puros,
 * sin lógica ni dependencias, y duplicarlos garantizaba que el día que alguien
 * cambie la gama de "alquiler" en el sitio, la ficha se quede con la vieja.
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
 * Tono de la barra de encabezado de cada sección.
 *
 * ⚠️ **Los tres arrancan en `brand-700` o más oscuro, y no es capricho.** El
 * título va en BLANCO en las tres —antes dos eran oscuras y dos claras, y esa
 * inconsistencia era justamente lo que se veía mal— así que el fondo tiene que
 * dar el contraste mínimo de WCAG AA (4.5:1) contra blanco. Calculado:
 *
 *   brand-500 (#14a366) → 3.25:1   ✗  quedaba fuera
 *   brand-600 (#0f8b57) → 4.33:1   ✗  quedaba fuera
 *   brand-700 (#0b7a4b) → 5.44:1   ✓
 *   brand-800 (#085031) → 8.9:1    ✓
 *   brand-900 (#063923) → 11.9:1   ✓
 *
 * Son rótulos de 14px: van en negrita pero no llegan al umbral de "texto
 * grande" (18.66px en negrita), así que no aplica la excepción de WCAG.
 *
 * Que ahora el fondo de la página sea claro (`surface-mint`) es lo que permite
 * usar los tres pasos oscuros sin que las barras se pierdan — con el fondo
 * verde oscuro anterior pasaba lo contrario y había que ir hacia los claros.
 */
const TONO_SECCION = {
  bosque: 'bg-brand-700',
  pino:   'bg-brand-800',
  noche:  'bg-brand-900',
} as const;

type TonoSeccion = keyof typeof TONO_SECCION;

/**
 * Dato numérico con ícono.
 *
 * Misma pieza que las tarjetas de "Características" del detalle público:
 * borde `brand-800` sobre fondo `brand-50`, el ícono en un círculo SÓLIDO
 * blanco-sobre-verde y el valor en `brand-900`. Antes acá era un ícono suelto
 * sobre una tarjeta blanca con borde gris — la única grilla del proyecto con
 * ese tratamiento.
 */
function Spec({
  icon: Icon, label, value,
}: {
  icon: React.ElementType; label: string; value: string | number;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-brand-800 bg-brand-50 px-3 py-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-white">
        <Icon size={20} />
      </span>
      <span className="text-lg leading-none font-bold text-brand-900">{value}</span>
      <span className="text-center text-[10px] leading-none font-bold tracking-[0.1em] text-brand-700 uppercase">
        {label}
      </span>
    </div>
  );
}

/**
 * Atributo booleano. Se listan SIEMPRE los seis, tengan `true` o `false`:
 * que una propiedad NO tenga escritura es un dato tan relevante como que la
 * tenga, y quien recibe la ficha necesita saberlo sin ambigüedad.
 *
 * Idéntica a la grilla de comodidades del detalle: el color hace todo el
 * trabajo (verde saturado vs. rojo) y el ícono sólo confirma. El `title` no es
 * decorativo — el color no puede ser el único portador de la información
 * (WCAG 1.4.1), así que quien no distingue rojo de verde sigue teniendo el ✓/✗
 * y el texto del tooltip.
 */
function BoolRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: boolean }) {
  return (
    <div
      title={value ? `Esta propiedad tiene: ${label}` : `Esta propiedad NO tiene: ${label}`}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${
        value ? 'border-brand-800 bg-brand-50 text-brand-900' : 'border-red-600 bg-red-50 text-red-800'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
          value ? 'bg-brand-800' : 'bg-red-600'
        }`}
      >
        <Icon size={16} />
      </span>
      <span className="text-sm font-semibold">{label}</span>
      {value
        ? <CheckCircle2 size={17} className="ml-auto shrink-0 text-brand-800" />
        : <XCircle size={17} className="ml-auto shrink-0 text-red-600" />}
    </div>
  );
}

/** Fila de ubicación. */
function LocRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 py-2.5 odd:bg-brand-50/70">
      <span className="shrink-0 text-xs font-bold tracking-wider text-brand-700 uppercase">{label}</span>
      <span className="text-right text-sm font-semibold wrap-anywhere text-brand-900">
        {value?.trim() ? value : <span className="font-normal text-ink-400">Sin especificar</span>}
      </span>
    </div>
  );
}

/**
 * Tarjeta de sección: barra de encabezado sólida + cuerpo blanco.
 *
 * La barra a todo el ancho es lo que separa una sección de la siguiente de un
 * vistazo cuando se scrollea rápido en el teléfono, que es como se lee una
 * ficha que llega por WhatsApp. El título va SIEMPRE en blanco (ver
 * `TONO_SECCION`).
 */
function Section({
  icon: Icon, title, tono, children,
}: {
  icon: React.ElementType; title: string; tono: TonoSeccion; children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_2px_4px_-2px_rgba(10,12,11,0.06),0_14px_34px_-14px_rgba(10,12,11,0.20)]">
      <h2 className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold tracking-wider text-white uppercase ${TONO_SECCION[tono]}`}>
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
  const disponible = p.status === 'disponible';

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">

      {/* ── ENCABEZADO ── */}
      <header className="mb-7">
        {/* ── BADGES ──
            Las mismas tres píldoras del detalle público, con sus mismas gamas:
            operación (rosa/azul/violeta), tipo (celeste/naranja/…) y estado
            (verde/ámbar/…). Todas con el tratamiento SUAVE —borde saturado de
            2px sobre fondo `-50`— que es el que se usa cuando los badges van
            sobre una tarjeta clara y no sobre una foto.

            Antes acá eran tres rectángulos verdes y grises hechos a mano que no
            distinguían nada entre sí. */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <span className={`${BADGE_BASE} ${operationBadgeSoft(p.operationType)}`}>
            {OPERACION_LABEL[p.operationType] ?? p.operationType}
          </span>
          <span className={`${BADGE_BASE} ${propertyTypeBadgeSoft(p.typeOfProperty?.name)}`}>
            {p.typeOfProperty?.name ?? 'Propiedad'}
          </span>
          <span className={`${BADGE_BASE} gap-1.5 ${statusBadgeColor(p.status)}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusDotColor(p.status)}`} aria-hidden />
            {disponible && <ShieldCheck size={13} />}
            {ESTADO_LABEL[p.status] ?? p.status}
          </span>
          {/* Número de referencia: sirve para que dos personas hablen de la
              misma propiedad por teléfono sin mandarse el link. */}
          <span className="ml-auto text-[11px] font-semibold text-ink-400">
            Ref. #{p.id}
          </span>
        </div>

        <h1 className="text-3xl leading-tight font-bold tracking-tight wrap-anywhere text-ink-900 sm:text-4xl">
          {p.title}
        </h1>

        {ubicacionCorta && (
          <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-ink-500">
            <MapPin size={15} className="shrink-0 text-brand-700" />
            {ubicacionCorta}
          </p>
        )}

        {/* ── PRECIO ──
            El elemento más brillante de la ficha, a propósito: es el primer
            dato que busca cualquiera que la reciba. Es lo único con el
            gradiente de marca, así que no compite con nada. */}
        <div
          className="mt-6 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-2xl px-6 py-4 shadow-[0_18px_40px_-18px_rgba(11,122,75,0.55)]"
          style={{ background: 'var(--gradient-brand)' }}
        >
          <span className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {precio.amount}
          </span>
          <span className="text-sm font-bold tracking-wide text-white/85">{precio.code}</span>
        </div>
      </header>

      {/* ── GALERÍA ──
          Carrusel deslizable + visor con zoom, arrastre y copiado.
          Ver `FichaGallery`. */}
      <div className="mb-8">
        <FichaGallery images={imagenes} title={p.title} />
      </div>

      <div className="flex flex-col gap-5">

        {/* ── CARACTERÍSTICAS + DOCUMENTACIÓN, EN UNA SOLA SECCIÓN ──
            Antes eran dos tarjetas separadas, y la de documentación tenía tres
            filas y nada más: una barra de encabezado entera para tres booleanos.

            Ahora siguen la estructura del detalle público: la grilla de specs
            numéricas arriba, y debajo —bajo un rótulo chico, no bajo otro
            encabezado de sección— las seis comodidades y documentos juntos en
            una sola grilla. Son todos atributos sí/no de la propiedad, así que
            se leen mejor como un bloque que como dos listas iguales separadas
            por un título. */}
        <Section icon={Building2} title="Características" tono="bosque">
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

          <p className="mt-8 mb-4 text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase">
            Comodidades y documentación
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <BoolRow icon={Car} label="Cochera" value={!!p.garage} />
            <BoolRow icon={TreePine} label="Patio" value={!!p.patio} />
            <BoolRow icon={PawPrint} label="Apto mascotas" value={!!p.aptoMascotas} />
            <BoolRow icon={FileCheck} label="Escritura" value={!!p.property_deed} />
            <BoolRow icon={Landmark} label="Tracto abreviado" value={!!p.tractoAbreviado} />
            <BoolRow icon={ScrollText} label="Boleto" value={!!p.boleto} />
          </div>
        </Section>

        {/* ── UBICACIÓN COMPLETA — dirección exacta incluida ──
            Va 2ª: después del precio, "dónde queda" es lo que más se pregunta. */}
        <Section icon={MapPin} title="Ubicación" tono="pino">
          <div className="overflow-hidden rounded-xl border border-brand-100">
            <LocRow label="Dirección" value={p.direccion} />
            <LocRow label="Barrio" value={p.barrio} />
            <LocRow label="Zona" value={p.zone} />
            <LocRow label="Localidad" value={p.localidad} />
            <LocRow label="Provincia" value={p.provincia} />
          </div>
        </Section>

        {/* ── DESCRIPCIÓN COMPLETA, sin recortar ── */}
        {p.description?.trim() && (
          <Section icon={Home} title="Descripción" tono="noche">
            {/* `wrap-anywhere`: las descripciones que carga el admin suelen
                traer links pegados, que sin regla de corte desbordan la
                tarjeta. Mismo criterio que el detalle público. */}
            <p className="text-sm leading-relaxed wrap-anywhere whitespace-pre-line text-ink-600">
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
