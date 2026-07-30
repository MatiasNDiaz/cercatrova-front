/**
 * Marca de "ya mostré el toast de pendientes en esta sesión".
 *
 * Vive en su propio archivo para romper el ciclo de imports: el toast necesita
 * `useAuth()` de `AuthContext`, y `AuthContext.logout()` necesita limpiar la
 * marca. Si la constante viviera en el componente, se importarían mutuamente.
 */

export const PENDING_TOAST_KEY_PREFIX = 'ct_pending_notif_';

/** Borra la marca de todos los usuarios. Se llama al cerrar sesión. */
export function clearPendingNotifMarks() {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PENDING_TOAST_KEY_PREFIX))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* sessionStorage puede no estar disponible (SSR, modo privado). */
  }
}
