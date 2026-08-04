import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/modules/landing/components/Reveal';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BLOQUES REUTILIZABLES DE LAS PÁGINAS DE SERVICIO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Los 5 servicios (venta, alquiler, tasaciones, asesoramiento,
 * comercialización) comparten la MISMA estructura visual y cambian solo el
 * contenido. Por eso acá no hay nada hardcodeado de ningún servicio: todo
 * entra por props.
 *
 * Para dar de alta el contenido de otro servicio no se toca este archivo — se
 * arma su objeto de contenido y se pasa a los mismos componentes.
 *
 * ── Paleta ──────────────────────────────────────────────────────────────────
 * Todo sale de los tokens del proyecto (`globals.css`), no de valores sueltos:
 *   verde de marca     → `brand-700` (#0b7a4b)
 *   fondo de sección   → `surface-mint` — es el "gris/verde muy claro" del
 *                        sitio; se usa este y no un gris neutro para no
 *                        romper la alternancia que ya tienen la landing, el
 *                        catálogo y el detalle de propiedad
 *   fondo profundo     → `.surface-brand-deep` (verde oscuro con textura), el
 *                        mismo del footer y de la franja de Trayectoria
 * La tipografía es la del sitio (`--font-primary`), heredada del layout raíz.
 */

/* ── Tipos de contenido ─────────────────────────────────────────────────── */

export type ServiceTone = 'white' | 'soft' | 'deep';

/**
 * Tipo de entrada de un bloque.
 *
 * Las 5 páginas comparten el lenguaje de animación del sitio (misma curva,
 * misma duración: lo define `Reveal`); lo único que varía entre páginas es
 * cuánto se desplaza el bloque al entrar. Alcanza para que no se sientan
 * calcadas sin que ninguna se salga del sistema.
 */
export type ServiceReveal = 'fade' | 'slide';


/** Desplazamiento vertical de entrada, en px, por tipo. */
const REVEAL_Y: Record<ServiceReveal, number> = {
  fade: 0,   // solo opacidad
  slide: 28, // opacidad + desplazamiento
};

export interface ServiceAction {
  label: string;
  href: string;
  variant?: 'primary' | 'outline';
  /** `true` para links externos (WhatsApp): abre en pestaña nueva. */
  external?: boolean;
  icon?: React.ReactNode;
}

export interface ServiceImage {
  /** Sin `src` se dibuja el marco vacío con la proporción final. */
  src?: string;
  alt: string;
  /** Proporción del marco. Por defecto 4/3. */
  ratio?: string;
  /** Texto de referencia mientras no está la foto definitiva. */
  nota?: string;
}

/* ── Piezas base ────────────────────────────────────────────────────────── */

const TONE: Record<ServiceTone, string> = {
  white: 'bg-white',
  soft: 'bg-surface-mint',
  deep: 'surface-brand-deep relative overflow-hidden',
};

/** Contenedor de sección: fondo + ritmo vertical iguales en toda la página. */
export function ServiceSection({
  tone = 'white',
  className = '',
  children,
}: {
  tone?: ServiceTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${TONE[tone]} py-16 md:py-24 ${className}`}>
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

/**
 * Marco de imagen.
 *
 * Mientras no llega la foto definitiva dibuja un placeholder con la proporción
 * exacta, así el layout ya se puede evaluar y después solo se cambia el `src`
 * sin que se mueva nada.
 */
function ServiceFigure({ image }: { image: ServiceImage }) {
  const ratio = image.ratio ?? '4/3';

  return (
    /* `group` + `overflow-hidden`: el zoom del hover se recorta contra el
       marco. Es el mismo gesto que ya usan `PropertyCard` y
       `FeaturedPropertyCard` — 700ms con `ease-out` — así que la página de
       servicio se mueve igual que el catálogo y la landing. */
    <div
      className="group relative w-full overflow-hidden rounded-xl border border-ink-100 bg-ink-50 shadow-[0_2px_6px_rgba(10,12,11,0.05),0_24px_50px_-24px_rgba(10,12,11,0.3)] transition-shadow duration-500 hover:shadow-[0_4px_10px_rgba(10,12,11,0.06),0_34px_66px_-26px_rgba(6,57,35,0.42)]"
      style={{ aspectRatio: ratio }}
    >
      {image.src ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="rounded-full bg-brand-700/10 px-3 py-1 text-[10px] font-bold tracking-widest text-brand-700 uppercase">
            Imagen pendiente
          </span>
          <p className="text-sm font-semibold text-ink-700">{image.alt}</p>
          {image.nota && <p className="text-xs text-ink-500">{image.nota}</p>}
        </div>
      )}
    </div>
  );
}

/** Botón de acción. Mismo lenguaje que `CtaButton` de la landing. */
function ServiceButton({ action, onDark = false }: { action: ServiceAction; onDark?: boolean }) {
  const base =
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-7 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]';

  const styles = onDark
    ? 'bg-white text-brand-800 shadow-lg hover:shadow-xl'
    : action.variant === 'outline'
      ? 'border-2 border-brand-700 text-brand-700 hover:bg-brand-700 hover:text-white'
      : 'bg-brand-700 text-white shadow-[0_10px_24px_-10px_rgba(6,57,35,0.7)] hover:bg-brand-800';

  const content = (
    <>
      {action.icon}
      {action.label}
    </>
  );

  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={`${base} ${styles}`}>
        {content}
      </a>
    );
  }
  return (
    <Link href={action.href} className={`${base} ${styles}`}>
      {content}
    </Link>
  );
}

/* ── BLOQUES 1 / 3 / 5 — imagen + texto alternado ───────────────────────── */

/**
 * Dos columnas: imagen de un lado, texto del otro. SIN superposición — la
 * imagen nunca va de fondo con el texto encima.
 *
 * Es el mismo componente para el bloque de presentación (con `as="h1"`) y para
 * los dos bloques alternados de más abajo; lo único que cambia es de qué lado
 * va la imagen (`reverse`) y el fondo de la sección.
 */
export function ServiceSplit({
  eyebrow,
  title,
  as = 'h2',
  paragraphs = [],
  highlight,
  actions = [],
  image,
  reverse = false,
  tone = 'white',
  reveal = 'slide',
}: {
  eyebrow?: string;
  title: string;
  as?: 'h1' | 'h2';
  paragraphs?: string[];
  /** Frase destacada, sobre fondo verde suave con barra lateral. */
  highlight?: string;
  actions?: ServiceAction[];
  image: ServiceImage;
  /** `true` → imagen a la izquierda, texto a la derecha. */
  reverse?: boolean;
  tone?: ServiceTone;
  reveal?: ServiceReveal;
}) {
  const Title = as;
  const y = REVEAL_Y[reveal];

  return (
    <ServiceSection tone={tone}>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* `order` solo desde `lg`: en mobile la imagen va SIEMPRE arriba, sin
            importar de qué lado cae en escritorio. Alternar el orden en una
            sola columna haría que unos bloques abran con imagen y otros con
            texto, sin ningún patrón perceptible. */}
        <Reveal y={y} className={reverse ? 'lg:order-2' : ''}>
          <div className="flex flex-col gap-5">
            {eyebrow && (
              <span className="text-sm font-bold tracking-wide text-brand-700">{eyebrow}</span>
            )}

            <Title
              className={`font-bold tracking-tight text-ink-900 ${
                as === 'h1' ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl sm:text-3xl lg:text-4xl'
              }`}
            >
              {title}
            </Title>

            {paragraphs.map((par, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-ink-600 sm:text-base">
                {par}
              </p>
            ))}

            {highlight && (
              <p className="rounded-xl border-l-4 border-brand-700 bg-brand-50 px-5 py-4 text-[15px] leading-relaxed font-semibold text-brand-800">
                {highlight}
              </p>
            )}

            {actions.length > 0 && (
              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {actions.map((a) => (
                  <ServiceButton key={a.label} action={a} />
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal y={y} delay={0.1} className={reverse ? 'lg:order-1' : ''}>
          <ServiceFigure image={image} />
        </Reveal>
      </div>
    </ServiceSection>
  );
}

/* ── BLOQUE 2 — beneficios ──────────────────────────────────────────────── */

export interface ServiceFeature {
  icon: React.ElementType;
  title: string;
  /** Opcional: varios servicios traen el beneficio como una sola línea. */
  text?: string;
}

/**
 * Disposición del bloque de beneficios.
 *
 * `cards`  → 3 tarjetas centradas, ícono grande arriba. Para beneficios con
 *            título + explicación.
 * `grid4`  → 4 tarjetas más chicas. Para listas de 4 beneficios de una línea.
 * `list`   → filas con el ícono a la izquierda. Se lee más rápido cuando los
 *            beneficios son etiquetas cortas y no párrafos.
 */
export type ServiceFeaturesVariant = 'cards' | 'grid4' | 'list';

export function ServiceFeatures({
  title,
  items,
  tone = 'soft',
  variant = 'cards',
  reveal = 'slide',
}: {
  title: string;
  items: ServiceFeature[];
  tone?: ServiceTone;
  variant?: ServiceFeaturesVariant;
  reveal?: ServiceReveal;
}) {
  const y = REVEAL_Y[reveal];

  const CARD_BASE =
    'rounded-xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(10,12,11,0.04),0_14px_34px_-18px_rgba(10,12,11,0.24)] transition-all duration-300 hover:border-brand-700/25 hover:shadow-[0_2px_4px_rgba(10,12,11,0.05),0_24px_50px_-20px_rgba(6,57,35,0.32)]';

  const grid =
    variant === 'list'
      ? 'mt-12 grid gap-4 sm:grid-cols-2'
      : variant === 'grid4'
        ? 'mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'
        : 'mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <ServiceSection tone={tone}>
      <Reveal y={y}>
        <h2 className="mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl lg:text-4xl">
          {title}
        </h2>
      </Reveal>

      <div className={grid}>
        {items.map((item, i) => {
          const Icon = item.icon;

          if (variant === 'list') {
            return (
              <Reveal key={item.title} y={y} delay={0.06 * i}>
                <div className={`${CARD_BASE} flex h-full items-center gap-4 px-5 py-5 hover:-translate-y-0.5`}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-700/10 text-brand-700">
                    <Icon size={22} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold tracking-tight text-ink-900">{item.title}</h3>
                    {item.text && (
                      <p className="mt-1 text-sm leading-relaxed text-ink-600">{item.text}</p>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          }

          const compact = variant === 'grid4';
          return (
            <Reveal key={item.title} y={y} delay={0.07 * i}>
              <div
                className={`${CARD_BASE} flex h-full flex-col items-center gap-3 text-center hover:-translate-y-1 ${
                  compact ? 'px-5 py-6' : 'gap-4 px-6 py-8'
                }`}
              >
                <span
                  className={`flex items-center justify-center rounded-xl bg-brand-700/10 text-brand-700 ${
                    compact ? 'h-12 w-12' : 'h-14 w-14'
                  }`}
                >
                  <Icon size={compact ? 22 : 26} />
                </span>
                <h3
                  className={`font-bold tracking-tight text-ink-900 ${
                    compact ? 'text-[15px]' : 'text-lg'
                  }`}
                >
                  {item.title}
                </h3>
                {item.text && (
                  <p className="text-sm leading-relaxed text-ink-600">{item.text}</p>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </ServiceSection>
  );
}

/* ── Bloques distintivos (opcionales, uno por página como mucho) ─────────── */

/**
 * Dato duro destacado. Se usa SOLO cuando el número sale del contenido real
 * del servicio — no se inventa una métrica para llenar el bloque.
 */
export function ServiceStat({
  value,
  label,
  text,
  tone = 'deep',
}: {
  value: string;
  label: string;
  text?: string;
  tone?: ServiceTone;
}) {
  const onDark = tone === 'deep';
  return (
    <ServiceSection tone={tone}>
      <Reveal>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
          <span
            className={`text-5xl font-black tracking-tight tabular-nums sm:text-6xl ${
              onDark ? 'text-white' : 'text-brand-700'
            }`}
          >
            {value}
          </span>
          <span
            className={`text-sm font-bold tracking-[0.18em] uppercase ${
              onDark ? 'text-white/70' : 'text-brand-700/70'
            }`}
          >
            {label}
          </span>
          {text && (
            <p className={`mt-1 text-[15px] leading-relaxed ${onDark ? 'text-white/80' : 'text-ink-600'}`}>
              {text}
            </p>
          )}
        </div>
      </Reveal>
    </ServiceSection>
  );
}

/** Cita textual. Para contenido que ya viene escrito como frase de un cliente. */
export function ServiceQuote({
  quote,
  attribution,
  tone = 'soft',
}: {
  quote: string;
  attribution?: string;
  tone?: ServiceTone;
}) {
  return (
    <ServiceSection tone={tone}>
      <Reveal>
        <figure className="mx-auto max-w-3xl text-center">
          <span aria-hidden className="block text-6xl leading-none font-black text-brand-700/25">
            &ldquo;
          </span>
          <blockquote className="-mt-4 text-xl leading-relaxed font-semibold text-ink-800 sm:text-2xl">
            {quote}
          </blockquote>
          {attribution && (
            <figcaption className="mt-5 text-sm font-bold tracking-wide text-brand-700">
              {attribution}
            </figcaption>
          )}
        </figure>
      </Reveal>
    </ServiceSection>
  );
}

/** CTA intermedio, más directo que el del cierre. */
export function ServiceInlineCta({
  title,
  text,
  action,
  tone = 'soft',
}: {
  title: string;
  text?: string;
  action: ServiceAction;
  tone?: ServiceTone;
}) {
  return (
    <ServiceSection tone={tone}>
      <Reveal>
        <div className="flex flex-col items-center gap-5 rounded-xl border border-brand-700/20 bg-white px-6 py-8 text-center shadow-[0_2px_6px_rgba(10,12,11,0.05),0_20px_44px_-22px_rgba(6,57,35,0.3)] sm:flex-row sm:justify-between sm:text-left">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">{title}</h2>
            {text && <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{text}</p>}
          </div>
          <div className="shrink-0">
            <ServiceButton action={action} />
          </div>
        </div>
      </Reveal>
    </ServiceSection>
  );
}

/* ── BLOQUE 4 — pasos ───────────────────────────────────────────────────── */

export interface ServiceStep {
  titulo: string;
  desc: string;
}

export function ServiceSteps({
  title,
  steps,
  tone = 'soft',
  reveal = 'slide',
}: {
  title: string;
  steps: ServiceStep[];
  tone?: ServiceTone;
  reveal?: ServiceReveal;
}) {
  const y = REVEAL_Y[reveal];
  return (
    <ServiceSection tone={tone}>
      <Reveal y={y}>
        <h2 className="mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl lg:text-4xl">
          {title}
        </h2>
      </Reveal>

      {/* El número se numera solo (`index + 1`): el contenido de cada servicio
          define solo título y descripción, sin arrastrar el "01/02/03". */}
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => (
          <Reveal key={step.titulo} y={y} delay={0.06 * i}>
            {/* Mismo hover que las tarjetas de beneficios: elevación + borde
                verde. Antes los pasos eran las únicas tarjetas de la página
                que no reaccionaban al mouse. */}
            <div className="group relative h-full overflow-hidden rounded-xl border border-ink-100 bg-white p-6 pt-7 shadow-[0_1px_2px_rgba(10,12,11,0.04),0_14px_34px_-18px_rgba(10,12,11,0.24)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-700/25 hover:shadow-[0_2px_4px_rgba(10,12,11,0.05),0_24px_50px_-20px_rgba(6,57,35,0.32)]">
              {/* Número grande, decorativo, detrás del texto. Se intensifica en
                  hover para que la tarjeta "responda" sin moverse de más. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-3 right-3 text-6xl font-black text-brand-700/10 tabular-nums transition-colors duration-300 select-none group-hover:text-brand-700/20"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-sm font-black text-white tabular-nums transition-transform duration-300 group-hover:scale-110">
                {i + 1}
              </span>
              <h3 className="relative mt-4 text-base font-bold tracking-tight text-ink-900">
                {step.titulo}
              </h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-ink-600">{step.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </ServiceSection>
  );
}

/* ── BLOQUE 7 — CTA final ───────────────────────────────────────────────── */

export function ServiceCta({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action: ServiceAction;
}) {
  return (
    /* Fondo BLANCO, no verde profundo.
       El cierre iba sobre `surface-brand-deep` y quedaba pegado al footer, que
       también es verde oscuro: los dos bloques se fundían en una única mancha
       oscura al final de la página. Con el cierre en claro, el footer vuelve a
       leerse como el remate y no como una continuación. */
    <ServiceSection tone="white">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl lg:text-4xl">
            {title}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-600">{text}</p>
        </Reveal>
        <Reveal delay={0.14}>
          <div className="mt-8 flex justify-center">
            <ServiceButton action={action} />
          </div>
        </Reveal>
      </div>
    </ServiceSection>
  );
}
