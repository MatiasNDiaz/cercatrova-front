import type { ReactNode } from 'react';

/**
 * Pantalla de estado a página completa — la base visual de `not-found.tsx` y
 * `error.tsx`.
 *
 * Existe para que las dos pantallas que el usuario ve cuando algo sale mal se
 * sientan parte del sitio y no del framework. Antes no había ninguna de las
 * dos, así que Next servía su 404 por defecto: fondo blanco, Helvetica del
 * sistema, "404 | This page could not be found" — en inglés y sin ninguna
 * relación con el resto de la marca.
 *
 * Reusa el lenguaje de la Landing: fondo `surface-mint` (el mismo verde de
 * sección que alternan la landing, el catálogo y publicaciones), eyebrow en
 * píldora verde sólida (patrón de `SectionHeading`), `h1` en `ink-900` y
 * `CtaButton` para las acciones.
 *
 * Es un Server Component sin estado: `error.tsx` —que sí tiene que ser cliente
 * por el `reset()`— puede renderizarlo igual, porque los componentes cliente
 * pueden componer server components recibidos como `children`.
 */
export function StatusScreen({
  eyebrow,
  code,
  title,
  message,
  icon,
  actions,
  footer,
}: {
  /** Píldora superior. Ej: "Página no encontrada". */
  eyebrow: string;
  /** Número grande de fondo (404, 500). Decorativo. */
  code?: string;
  title: ReactNode;
  message: ReactNode;
  /** Ícono dentro del círculo, sobre el número. */
  icon: ReactNode;
  /** Botonera. */
  actions: ReactNode;
  /** Línea chica al pie, opcional (detalle técnico, id de error). */
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-mint px-4 py-24">
      <div className="relative mx-auto w-full max-w-2xl text-center">
        {/* Número gigante de fondo. `aria-hidden` + `select-none`: es textura,
            no contenido — un lector de pantalla no debería anunciarlo, y el
            texto real ya dice lo mismo en el eyebrow. */}
        {code && (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 select-none text-[11rem] leading-none font-black tracking-tighter text-brand-700/8 sm:text-[15rem]"
          >
            {code}
          </span>
        )}

        <div className="relative">
          {/* Ícono en círculo, con halo suave */}
          <span className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-white text-brand-700 shadow-[0_2px_6px_rgba(10,12,11,0.06),0_18px_40px_-18px_rgba(6,57,35,0.45)] ring-1 ring-brand-700/10">
            {icon}
          </span>

          <span className="inline-block rounded-full bg-brand-700 px-4 py-1.5 text-xs font-bold tracking-[0.22em] text-white uppercase shadow-[0_4px_12px_-4px_rgba(11,122,75,0.6)]">
            {eyebrow}
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
            {title}
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ink-500 md:text-lg">
            {message}
          </p>

          {/* `flex-col` en mobile: dos CtaButton de `px-8` uno al lado del otro
              no entran en 375px sin desbordar. */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            {actions}
          </div>

          {footer && (
            <p className="mt-8 text-xs leading-relaxed text-ink-400">{footer}</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default StatusScreen;
