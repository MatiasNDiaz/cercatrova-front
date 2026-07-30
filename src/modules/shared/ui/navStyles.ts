/**
 * Estilos compartidos por las dos navbars (pública y privada).
 *
 * Antes cada una repetía sus clases con hex hardcodeado (`#0b7a4b`) y el hover
 * era un subrayado animado ("el renglón"). Ahora:
 *
 *  · La barra es blanca TRANSLÚCIDA con desenfoque (`bg-white/75 backdrop-blur`),
 *    así el contenido se ve pasar por detrás y acompaña al resto de la página
 *    en vez de ser un bloque blanco opaco pegado arriba.
 *  · El hover ya no subraya: el ítem se rellena como una píldora
 *    (`bg-brand-50` + texto `brand-800`) y sube 0.5. Es el mismo gesto que usan
 *    los accesos rápidos del detalle de propiedad y `CtaButton`.
 *  · La ruta activa queda marcada en verde sólido, que antes no existía.
 */

/**
 * Cáscara de la barra: rectangular (`rounded-xl`), BLANCA SÓLIDA y con un
 * borde/sombra discretos. Antes era una pastilla (`rounded-full`) blanca
 * translúcida con blur; se cambió a este formato para un tono más sobrio.
 */
export const NAV_SHELL =
  'fixed top-3 right-0 left-0 z-50 mx-auto flex w-[96%] max-w-350 flex-row items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(10,12,11,0.04),0_10px_30px_-12px_rgba(10,12,11,0.22)] transition-transform duration-300 ease-in-out lg:justify-start';

/**
 * Ítem de navegación — hover SOBRIO.
 *
 * Se descartaron las dos versiones anteriores: el subrayado animado y, después,
 * el relleno con gradiente + barrido de luz + glow (demasiado estridente para
 * una inmobiliaria). Queda un hover discreto y profesional: fondo verde muy
 * suave, el texto y el ícono toman el verde de marca, y nada se mueve de lugar.
 */
export const NAV_ITEM =
  'group relative inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold whitespace-nowrap text-ink-600 transition-colors duration-200 ease-out hover:bg-brand-50 hover:text-brand-700';

/** Ruta activa: fondo verde suave permanente + texto de marca. */
export const NAV_ITEM_ACTIVE =
  'group relative inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-[14px] font-semibold whitespace-nowrap text-brand-700 transition-colors duration-200 ease-out';

/** Devuelve las clases del ítem según si su ruta está activa. */
export const navItemClass = (active: boolean) => (active ? NAV_ITEM_ACTIVE : NAV_ITEM);

/** Panel de los desplegables (propiedades / servicios / avatar). */
export const NAV_DROPDOWN =
  'invisible absolute left-0 z-20 mt-2 translate-y-1 overflow-hidden rounded-xl border border-ink-100 bg-white opacity-0 shadow-[0_16px_44px_-14px_rgba(10,12,11,0.32)] transition-all duration-200 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100';

/** Ítem dentro de un desplegable — mismo criterio sobrio que `NAV_ITEM`. */
export const NAV_DROPDOWN_ITEM =
  'block px-4 py-2.5 text-sm font-medium text-ink-600 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700';

/** Botón principal (iniciar sesión / CTA) — verde sólido, sin gradiente. */
export const NAV_CTA =
  'group inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-[14px] font-bold whitespace-nowrap text-white transition-colors duration-200 hover:bg-brand-800 active:scale-95';

/** Ítem del menú mobile (drawer). */
export const NAV_MOBILE_ITEM =
  'flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-base font-semibold text-ink-700 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700';
