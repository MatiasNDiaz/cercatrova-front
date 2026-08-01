'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { DashboardBackLink } from './DashboardBackLink';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEMA DE LAYOUT DEL DASHBOARD (admin y usuario)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El problema que resuelve: cada página se definía su propio contenedor. El
 * listado de Propiedades heredaba el `max-w-7xl` del layout, el de
 * Publicaciones se pisaba con `max-w-5xl`, "Nueva publicación" usaba
 * `max-w-3xl` y "Nueva propiedad" ninguno (7xl otra vez). Cuatro anchos
 * distintos en cuatro pantallas del mismo panel: al navegar entre ellas el
 * contenido saltaba de ancho y parecían sitios distintos.
 *
 * Ahora el ancho NO se decide por página: se elige una de dos categorías.
 *
 *   `list` → 80rem. Listados, grillas, tableros, detalle. Todas las páginas de
 *            listado miden exactamente lo mismo entre sí.
 *   `form` → 56rem. Formularios. Más angosto porque una fila de input de 80rem
 *            de ancho es incómoda de leer y de completar; 56rem mantiene la
 *            línea en un largo cómodo sin ahogar a `PropertyForm`, que es el
 *            más denso (grilla de imágenes + ~20 campos).
 *
 * Los layouts (`dashboard/layout.tsx` y `dashboardAdmin/layout.tsx`) ya no
 * imponen ancho: solo aportan el padding lateral y el área scrolleable. El
 * ancho es responsabilidad de este componente, en un solo lugar.
 */

export type DashboardPageWidth = 'list' | 'form';

const MAX_WIDTH: Record<DashboardPageWidth, string> = {
  list: 'max-w-7xl',
  form: 'max-w-4xl',
};

export function DashboardPage({
  width = 'list',
  className = '',
  children,
}: {
  width?: DashboardPageWidth;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto flex w-full flex-col gap-6 ${MAX_WIDTH[width]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Encabezado estándar: volver + ícono + título + bajada + acciones.
 *
 * Antes cada página lo armaba a mano y no coincidían: unas ponían el link de
 * volver arriba de todo, otras al lado del título; unas tenían ícono en
 * pastilla y otras no; los `h1` alternaban entre `text-gray-900` y el verde de
 * marca. Con esto, el bloque superior es idéntico en las 26 pantallas.
 */
export function DashboardHeader({
  back,
  icon: Icon,
  iconNode,
  iconClassName = 'bg-brand-700/10 text-brand-700',
  title,
  subtitle,
  actions,
}: {
  /** `false` para las pantallas raíz (Inicio), que no vuelven a ningún lado. */
  back?: { href?: string; label?: string; onClick?: () => void } | false;
  /** Componente de ícono (lo normal). */
  icon?: React.ElementType;
  /**
   * Ícono ya renderizado. Para los casos donde el ícono llega por props como
   * elemento y no como componente — las páginas de categoría de notificaciones
   * reciben `icono: React.ReactNode` desde cada ruta.
   */
  iconNode?: ReactNode;
  /** Color de la pastilla del ícono, si la pantalla usa uno propio. */
  iconClassName?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {back !== false && <DashboardBackLink {...(back ?? {})} />}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {(Icon || iconNode) && (
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
              {Icon ? <Icon size={20} /> : iconNode}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Tarjeta/panel del dashboard.
 *
 * Radio `rounded-xl` — el mismo de `FeaturedPropertyCard` y de las tarjetas del
 * catálogo. El dashboard venía con `rounded-3xl`/`rounded-2xl`, bastante más
 * redondeado que el resto del sitio, y leía más "app de redes" que panel de
 * gestión.
 *
 * La sombra en dos capas (una corta de contacto + una larga difusa) es lo que
 * saca al panel de la sensación de plano: con `shadow-sm` sola, las tarjetas
 * blancas sobre el fondo claro casi no se despegaban.
 */
export const CARD =
  'rounded-xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(10,12,11,0.04),0_8px_24px_-12px_rgba(10,12,11,0.12)]';

/** `CARD` + elevación al pasar el mouse. Para tarjetas que son link o botón. */
export const CARD_INTERACTIVE = `${CARD} transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-700/25 hover:shadow-[0_2px_4px_rgba(10,12,11,0.05),0_18px_40px_-16px_rgba(6,57,35,0.28)]`;

/* ── Animación de entrada de listas ─────────────────────────────────────────
   Un `fade` + desplazamiento chico, escalonado entre hijos. Deliberadamente
   corto (0.3s, 0.04s de stagger): el objetivo es que la lista "aterrice", no
   que el usuario espere una coreografía cada vez que entra a una pantalla.
   `once` no hace falta porque las listas del dashboard no se re-montan al
   scrollear. */
const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

/** Envolvé la lista; cada hijo directo tiene que ser un `<ListReveal.Item>`. */
export function ListReveal({
  as = 'div',
  className = '',
  children,
}: {
  as?: 'div' | 'ul';
  className?: string;
  children: ReactNode;
}) {
  const Comp = as === 'ul' ? motion.ul : motion.div;
  return (
    <Comp variants={listContainer} initial="hidden" animate="show" className={className}>
      {children}
    </Comp>
  );
}

ListReveal.Item = function ListRevealItem({
  as = 'div',
  className = '',
  children,
}: {
  as?: 'div' | 'li';
  className?: string;
  children: ReactNode;
}) {
  const Comp = as === 'li' ? motion.li : motion.div;
  return (
    <Comp variants={listItem} className={className}>
      {children}
    </Comp>
  );
};

export default DashboardPage;
