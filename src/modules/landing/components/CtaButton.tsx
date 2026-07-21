import Link from 'next/link';

/**
 * Botón de acción unificado de la landing (Bloque LANDING §3 y §4).
 *
 * Antes cada sección definía su propio CTA: el hero usaba el gradiente de marca
 * con un barrido de brillo permanente, "Ver todas las propiedades" repetía ese
 * gradiente, y "Ver detalle" de servicios era negro (`ink-900`). Resultado:
 * tres lenguajes distintos de botón en la misma página.
 *
 * Ahora hay una sola definición con tres variantes:
 *  - `primary`     → verde sólido `brand-700`. Sin gradiente ni brillo permanente:
 *                    el barrido de luz existe pero SOLO se dispara en hover.
 *  - `outlineLight`→ contorno blanco, para fondos oscuros (hero, verde profundo).
 *  - `outlineDark` → contorno verde, para fondos claros.
 *
 * Todos comparten geometría (más anchos que altos, `rounded-xl`), peso `bold`
 * y la misma respuesta al hover (elevación + sombra + `active:scale`).
 *
 * ⚠️ El `border-2` va en la clase BASE (no en cada variante) a propósito: las
 * variantes outline tienen borde visible y la primary lo tiene transparente,
 * pero **las tres reservan los mismos 2px de borde por lado**. Así los botones
 * miden exactamente lo mismo aunque estén en la misma fila con distinta variante
 * (era el bug del hero: "Iniciar sesión" se veía 4px más grande que "Ver
 * propiedades" porque solo el primero tenía borde). La primary solo sobreescribe
 * el color a `border-transparent`; no se resta padding a mano, así que si algún
 * día cambia el grosor del borde sigue quedando parejo solo.
 */

type CtaVariant = 'primary' | 'outlineLight' | 'outlineDark';

const BASE =
  'group/cta relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-xl border-2 px-8 py-4 text-base font-bold tracking-tight transition-all duration-300 active:scale-[0.98]';

const VARIANTS: Record<CtaVariant, string> = {
  primary:
    'border-transparent bg-brand-700 text-white shadow-[0_8px_20px_-6px_rgba(6,57,35,0.55)] hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-[0_14px_30px_-8px_rgba(6,57,35,0.7)]',
  outlineLight:
    'border-white/75 bg-white/5 text-white backdrop-blur-sm hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-brand-800 hover:shadow-[0_14px_30px_-10px_rgba(0,0,0,0.5)]',
  outlineDark:
    'border-brand-700 bg-white text-brand-700 hover:-translate-y-0.5 hover:bg-brand-700 hover:text-white hover:shadow-[0_14px_30px_-10px_rgba(6,57,35,0.5)]',
};

interface CtaButtonProps {
  href: string;
  variant?: CtaVariant;
  children: React.ReactNode;
  /** Ícono a la derecha del texto. */
  icon?: React.ReactNode;
  /** Abre en pestaña nueva (links externos tipo WhatsApp). */
  external?: boolean;
  className?: string;
}

export function CtaButton({
  href,
  variant = 'primary',
  children,
  icon,
  external = false,
  className = '',
}: CtaButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  const content = (
    <>
      {/* Barrido de luz: parte fuera del botón y solo cruza al hacer hover.
          En reposo el botón es verde plano, sin brillo. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover/cta:translate-x-full"
      />
      <span className="relative flex items-center gap-2.5">
        {children}
        {icon}
      </span>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

export default CtaButton;
