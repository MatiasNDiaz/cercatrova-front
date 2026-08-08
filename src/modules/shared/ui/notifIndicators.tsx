/**
 * Los DOS indicadores visuales de la sección Notificaciones.
 *
 * Viven juntos y acá (y no dentro de `dashboard/` o `dashboardAdmin/`) porque
 * los usan las dos áreas: el panel de admin y el dashboard de usuario tienen
 * cada uno su propia pantalla de notificaciones y su propio sidebar, y antes de
 * esto cada archivo dibujaba su badge a mano con clases levemente distintas
 * (`h-4.5` en un lado, `h-4` en otro, rojo en tres lugares).
 *
 * Son dos piezas DISTINTAS y no se pisan:
 *  - `PulseDot`     → va en la esquina de UNA tarjeta de notificación, y dice
 *                     "esta está sin leer".
 *  - `NotifCountBadge` → va en un tab o en un ítem del sidebar, y dice "esta
 *                     categoría tiene N sin leer".
 *
 * ⚠️ Ámbito: ambos son EXCLUSIVOS de la sección Notificaciones. No usarlos en
 * Usuarios, Solicitudes, Propiedades ni ninguna otra: el punto titilante es una
 * señal fuerte y pierde todo su valor si aparece en media aplicación.
 */

/**
 * Punto verde titilante — señal de "sin leer" en la tarjeta de una notificación.
 *
 * Es el MISMO indicador que acompaña al texto "conectado como" en el panel de
 * usuario del navbar (`NavbarPrivate.tsx`): dos capas, un `animate-ping` que se
 * expande y se desvanece (`green-400`) sobre un núcleo sólido (`green-500`).
 * Se replica el patrón exacto —no un `animate-pulse`, que sólo cambia la
 * opacidad de un único círculo— para que el sitio tenga un solo lenguaje de
 * "esto está vivo / es nuevo".
 *
 * Único cambio respecto del navbar: 8px en vez de 6px. Ahí el punto va pegado a
 * un texto que lo contextualiza; acá está solo en la esquina de una tarjeta
 * ancha y a 6px no se registraba.
 *
 * `aria-hidden`: es decorativo. Que la notificación esté sin leer ya se
 * comunica en texto (la etiqueta de prioridad y el botón "Leída"), así que
 * anunciarlo de nuevo sería ruido para un lector de pantalla.
 */
export function PulseDot({ className = '' }: { className?: string }) {
  return (
    /* ── DOS spans, y no uno ──────────────────────────────────────────────
       El de afuera es SÓLO posicionamiento y lo controla quien lo usa; el de
       adentro es el `relative` que le sirve de ancla al anillo del ping.

       No es cosmético: la primera versión tenía un único span con
       `relative` fijo más el `className` del caller concatenado, y al pasarle
       `absolute top-3 right-3` el punto aparecía a la IZQUIERDA de la tarjeta.
       El motivo es la trampa que este repo ya tiene documentada — no se usa
       `tailwind-merge`, así que `relative` y `absolute` (la misma propiedad
       CSS) conviven en el atributo y **gana el orden del stylesheet
       generado, no el del string**. Tailwind emite `.relative` después de
       `.absolute`, así que ganaba `relative` siempre y el punto quedaba como
       un ítem más del flex, alineado a la izquierda.

       Separándolos, cada span tiene una única declaración de `position` y no
       hay conflicto posible. */
    <span aria-hidden className={className}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
    </span>
  );
}

/** Dónde se está dibujando el badge — sólo cambia tamaño y tipografía. */
type BadgeVariant = 'sidebar' | 'sidebarSub' | 'tab';

const VARIANT: Record<BadgeVariant, string> = {
  // Ítem de primer nivel del sidebar (el grupo "Notificaciones").
  sidebar: 'h-4.5 min-w-4.5 px-1 text-[10px]',
  // Subítem dentro del grupo desplegado.
  sidebarSub: 'h-4 min-w-4 px-1 text-[9px]',
  // Chip de la fila de filtros de la pantalla de notificaciones.
  tab: 'h-4 min-w-4 px-1.5 text-[10px]',
};

/**
 * Badge numérico verde con la cantidad de pendientes de una categoría.
 *
 * ── Por qué verde y no rojo ────────────────────────────────────────────────
 * Estaba en `bg-red-500` en los tres lugares donde aparecía. El rojo en este
 * sistema ya significa otra cosa —error, "no tiene", eliminar— y una campanita
 * con un número rojo se lee como "algo salió mal" cuando en realidad dice
 * "tenés cosas nuevas". Pasa al verde institucional, que es el color con el que
 * el resto del panel comunica actividad normal.
 *
 * ── `onDark` ───────────────────────────────────────────────────────────────
 * Sobre un fondo ya verde (un tab activo, un ítem de sidebar seleccionado) un
 * badge verde es invisible. En ese caso se invierte a blanco translúcido. NO es
 * una excepción al "todos verdes": es lo que hace que el número siga siendo
 * legible, que es el punto de tener un badge.
 *
 * ── Devuelve `null` con 0 ──────────────────────────────────────────────────
 * La regla "si no hay pendientes, no hay badge" se resuelve acá y no en cada
 * call-site, para que no se escape en ninguno. Nueve lugares distintos tenían
 * que acordarse de escribir `count > 0 && ...`.
 */
export function NotifCountBadge({
  count,
  variant = 'tab',
  onDark = false,
}: {
  count: number;
  variant?: BadgeVariant;
  onDark?: boolean;
}) {
  if (!count || count < 1) return null;

  return (
    <span
      className={`flex items-center justify-center rounded-full leading-none font-black tabular-nums ${VARIANT[variant]} ${
        onDark ? 'bg-white/25 text-white' : 'bg-[#0b7a4b] text-white'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
