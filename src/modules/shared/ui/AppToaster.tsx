'use client';

import { Toaster } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

/**
 * Toaster del sitio — configuración única para los ~125 avisos del proyecto.
 *
 * ── Qué tenía antes ─────────────────────────────────────────────────────────
 * La config vivía inline en el layout raíz con estilos sueltos: una caja blanca
 * con `padding: 14px 18px` y, como única señal de tipo, un borde izquierdo de
 * color en `error` y `success`. `info` y `warning` no tenían ninguna marca —
 * salían idénticos a un aviso neutro — y el ícono que sonner pone por defecto
 * quedaba pegado al texto, sin jerarquía entre el mensaje y su descripción.
 *
 * ── Qué cambia ──────────────────────────────────────────────────────────────
 * 1. **Composición**: ícono en pastilla circular a la izquierda, luego título y
 *    descripción como bloque de texto, y el cierre al extremo derecho. Cada
 *    cosa en su lugar, con aire propio.
 * 2. **Los 4 tipos se distinguen** por ícono Y por color (antes solo dos, y
 *    solo por un filete). Barra de acento a la izquierda + ícono tintado.
 * 3. **Hover real** en cierre y acción: el botón de cerrar estaba sin estado.
 *
 * ── Por qué es un componente y no config inline ─────────────────────────────
 * `icons` recibe elementos JSX. Manteniéndolo en un componente cliente propio,
 * el layout raíz (que es server component) no tiene que pasar JSX a través del
 * borde RSC, y toda la configuración del toast queda en un solo archivo.
 */

/** Pastilla del ícono: círculo tintado, mismo gesto que el resto del sitio. */
function ToastIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
      {children}
    </span>
  );
}

/**
 * Piel visual del toast — geometría, sombra y la barra de acento izquierda.
 *
 * ⚠️ POR QUÉ EL COLOR POR TIPO VA CON `data-[type=…]:` Y NO EN
 * `classNames.success` / `.error` / …
 *
 * Sonner compone la clase del toast así (`dist/index.mjs`, línea 647):
 *
 *     cn(className, toastClassname, classNames.toast, …,
 *        classNames.default,          ← se aplica a TODOS los toasts
 *        classNames[toastType])       ← y encima el del tipo
 *
 * O sea que un toast de éxito recibe `classNames.default` **y**
 * `classNames.success` al mismo tiempo. Como las dos son utilidades de Tailwind
 * con `!important` y la misma especificidad (0,1,0), no gana la que va última
 * en el atributo `class` sino la que Tailwind emite última en la hoja de
 * estilos — y ahí `!bg-white`/`!border-ink-200` de `default` le ganaban a
 * `!bg-emerald-50`/`!border-emerald-400` de `success`. Resultado: todos los
 * toasts salían blancos con borde gris, sin importar el tipo.
 *
 * La solución no es reordenar (el orden de Tailwind no se controla desde acá)
 * sino subir la especificidad: sonner pone `data-type="success"` en el
 * elemento, así que `data-[type=success]:!bg-emerald-50` compila a
 * `.clase[data-type="success"]` → (0,2,0), que sí le gana a la clase pelada.
 * Por eso toda la piel vive en `default` y no hay claves por tipo.
 */
const PIEL =
  '!rounded-xl !border !p-4 ' +
  '!shadow-[0_2px_6px_rgba(10,12,11,0.06),0_18px_44px_-16px_rgba(10,12,11,0.35)] ' +
  'before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-xl before:content-[""]';

/**
 * Color por tipo: borde intenso (400) + fondo apenas teñido (50).
 * El fondo tiene que ser casi blanco — el toast lleva texto oscuro encima y
 * un tinte fuerte le come contraste; la señal de color la da el borde.
 */
// Se escriben literales (y no armadas con un `.map()`) a propósito: Tailwind
// escanea el archivo como texto plano, no lo ejecuta — una clase construida por
// concatenación nunca se generaría.
const COLOR_POR_TIPO =
  'data-[type=success]:!border-emerald-400 data-[type=success]:!bg-emerald-50 data-[type=success]:before:!bg-emerald-500 ' +
  'data-[type=error]:!border-red-400 data-[type=error]:!bg-red-50 data-[type=error]:before:!bg-red-500 ' +
  'data-[type=warning]:!border-amber-400 data-[type=warning]:!bg-amber-50 data-[type=warning]:before:!bg-amber-500 ' +
  'data-[type=info]:!border-blue-400 data-[type=info]:!bg-blue-50 data-[type=info]:before:!bg-blue-500 ' +
  'data-[type=loading]:!border-brand-400 data-[type=loading]:!bg-brand-50 data-[type=loading]:before:!bg-brand-500';

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      offset={20}
      duration={4000}
      closeButton
      // `gap` un poco mayor que el default: con la pastilla del ícono, los
      // toasts apilados quedaban muy pegados entre sí.
      gap={12}
      icons={{
        success: (
          <ToastIcon className="bg-white text-emerald-600 ring-1 ring-emerald-200">
            <CheckCircle2 size={19} />
          </ToastIcon>
        ),
        error: (
          <ToastIcon className="bg-white text-red-600 ring-1 ring-red-200">
            <XCircle size={19} />
          </ToastIcon>
        ),
        warning: (
          <ToastIcon className="bg-white text-amber-600 ring-1 ring-amber-200">
            <AlertTriangle size={19} />
          </ToastIcon>
        ),
        info: (
          <ToastIcon className="bg-white text-blue-600 ring-1 ring-blue-200">
            <Info size={19} />
          </ToastIcon>
        ),
        loading: (
          <ToastIcon className="bg-white text-brand-700 ring-1 ring-brand-200">
            <Loader2 size={19} className="animate-spin" />
          </ToastIcon>
        ),
      }}
      toastOptions={{
        // `unstyled: false` + classNames: se conserva el posicionamiento y las
        // animaciones de sonner, y se reemplaza solo la piel.
        classNames: {
          // ⚠️ `toast` aplica a TODOS los toasts, incluidos los `toast.custom`.
          // Por eso acá va solo lo estructural (alineación), NUNCA la piel:
          // cuando el fondo blanco + borde + padding vivían en esta clase, un
          // toast custom quedaba encerrado en una caja blanca que no le
          // correspondía. La piel se aplica por TIPO, más abajo.
          toast: 'group !w-full !items-start !gap-3.5',

          title: '!text-[14px] !font-bold !leading-snug !text-ink-900',
          description: '!mt-0.5 !text-[13px] !leading-relaxed !text-ink-500',

          // El ícono ya viene envuelto en su pastilla: sonner no debe agregarle
          // margen ni tamaño propios.
          icon: '!m-0 !h-9 !w-9 !shrink-0',

          actionButton:
            '!rounded-lg !bg-brand-700 !px-3 !py-1.5 !text-xs !font-bold !text-white ' +
            '!transition-all !duration-200 hover:!bg-brand-800 hover:!-translate-y-0.5 active:!scale-95',
          cancelButton:
            '!rounded-lg !bg-ink-100 !px-3 !py-1.5 !text-xs !font-bold !text-ink-600 ' +
            '!transition-colors !duration-200 hover:!bg-ink-200',

          // Cierre: invisible hasta el hover del toast (menos ruido), con su
          // propio estado al pasarle por encima. Antes no tenía ninguno.
          closeButton:
            '!left-auto !right-3 !top-3 !h-7 !w-7 !translate-x-0 !translate-y-0 !rounded-lg ' +
            '!border-none !bg-transparent !text-ink-400 !opacity-0 !transition-all !duration-200 ' +
            'group-hover:!opacity-100 hover:!bg-ink-100 hover:!text-ink-700',

          // Toda la piel en `default` (que sonner aplica a TODOS los toasts) +
          // el color por tipo vía `data-[type=…]` — ver la nota larga arriba.
          // No hay claves `success`/`error`/… a propósito: competían con esta.
          default: `${PIEL} !border-ink-200 !bg-white before:!bg-ink-300 ${COLOR_POR_TIPO}`,
        },
      }}
    />
  );
}

export default AppToaster;
