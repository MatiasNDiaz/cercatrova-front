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

/** Cáscara de la barra: pastilla flotante, blanca translúcida con blur. */
export const NAV_SHELL =
  'fixed top-2 right-0 left-0 z-50 mx-auto flex w-[95%] flex-row items-center justify-between rounded-full border border-white/60 bg-white/75 p-2.5 shadow-[0_2px_6px_-2px_rgba(10,12,11,0.08),0_16px_40px_-16px_rgba(10,12,11,0.25)] backdrop-blur-xl backdrop-saturate-150 transition-transform duration-300 ease-in-out md:justify-start';

/** Ítem de navegación en reposo. */
export const NAV_ITEM =
  'group relative inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-[15px] font-semibold text-ink-700 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-800';

/** Ítem de navegación cuando la ruta actual le corresponde. */
export const NAV_ITEM_ACTIVE =
  'group relative inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-700 px-3.5 py-2 text-[15px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(6,57,35,0.8)] transition-all duration-300 ease-out';

/** Devuelve las clases del ítem según si su ruta está activa. */
export const navItemClass = (active: boolean) => (active ? NAV_ITEM_ACTIVE : NAV_ITEM);

/** Panel de los desplegables (propiedades / servicios / avatar). */
export const NAV_DROPDOWN =
  'invisible absolute left-0 z-20 mt-2 overflow-hidden rounded-2xl border border-ink-100 bg-white/95 opacity-0 shadow-[0_12px_40px_-12px_rgba(10,12,11,0.3)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100';

/** Ítem dentro de un desplegable. */
export const NAV_DROPDOWN_ITEM =
  'block px-4 py-3 text-sm font-medium text-ink-700 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-800';

/** Botón principal (iniciar sesión / CTA). */
export const NAV_CTA =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-700 px-6 py-2.5 text-[15px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(6,57,35,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-800 active:scale-95';

/** Ítem del menú mobile (drawer). */
export const NAV_MOBILE_ITEM =
  'flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-lg font-semibold text-ink-700 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-800';
