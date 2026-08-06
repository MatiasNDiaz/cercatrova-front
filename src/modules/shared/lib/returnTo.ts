/**
 * Vuelta al lugar de origen después de iniciar sesión.
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 * Antes, cuando alguien sin sesión intentaba una acción que la requiere —dar
 * favorito, valorar, comentar, publicar una propiedad— se lo mandaba a
 * `/login` a secas. Al autenticarse aterrizaba en `/dashboard`, lejos de lo que
 * estaba haciendo, y tenía que volver a buscar la propiedad a mano. El
 * middleware ya armaba `?callbackUrl=`, pero **nadie lo leía**: se escribía y
 * se ignoraba.
 *
 * Ahora el destino viaja en la query y `AuthContext` lo consume al terminar el
 * login, venga por email + contraseña o por Google.
 */

/** Nombre del parámetro. Es el que ya usaba `middleware.ts`. */
export const RETURN_PARAM = 'callbackUrl';

/**
 * Valida que el destino sea una ruta **interna**.
 *
 * Sin este chequeo el parámetro sería un *open redirect*: bastaría con mandar
 * `/login?callbackUrl=https://sitio-falso.com` para que, después de un login
 * legítimo, el usuario terminara en un sitio ajeno — con la confianza de venir
 * de un flujo de autenticación real. Es una vía clásica de phishing.
 *
 * Se exige que empiece con una sola `/` y se rechaza `//` y `/\`, que los
 * navegadores interpretan como URL protocol-relative hacia otro host.
 */
export function isSafeReturnPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//') || path.startsWith('/\\')) return false;
  return true;
}

/**
 * Arma el link al login conservando dónde estaba el usuario.
 *
 * @param currentPath ruta actual, con su query string si la tiene.
 */
export function loginUrlWithReturn(currentPath: string): string {
  if (!isSafeReturnPath(currentPath)) return '/login';
  return `/login?${RETURN_PARAM}=${encodeURIComponent(currentPath)}`;
}

/**
 * Ruta actual completa (path + query), tal como hay que guardarla para volver.
 * Devuelve `null` en el servidor, donde no existe `window`.
 */
export function currentPathWithQuery(): string | null {
  if (typeof window === 'undefined') return null;
  return window.location.pathname + window.location.search;
}
