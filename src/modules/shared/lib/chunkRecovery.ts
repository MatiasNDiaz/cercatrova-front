/**
 * Recuperación de "chunks viejos" después de un deploy.
 *
 * Si alguien tiene la página abierta y se publica una versión nueva, al navegar
 * el navegador puede pedir un archivo JS de la versión anterior que ya no
 * existe ("ChunkLoadError", "Loading chunk failed"…). Recargar la página trae
 * la versión nueva y lo resuelve.
 *
 * Se recarga UNA sola vez por minuto como máximo (marca en `sessionStorage`):
 * si el error persiste después de recargar, no es un chunk viejo y se muestra
 * la pantalla de error en vez de entrar en un bucle de recargas.
 */
const KEY = 'ct_chunk_reload_at';

export function isChunkLoadError(error: unknown): boolean {
  const e = error as { name?: string; message?: string } | null;
  const text = `${e?.name ?? ''} ${e?.message ?? String(error ?? '')}`;
  return /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    text,
  );
}

/** Recarga si no se recargó en el último minuto. Devuelve `true` si recargó. */
export function reloadOnceForChunkError(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Sin sessionStorage no hay forma segura de evitar el bucle: no recargar.
    return false;
  }
  window.location.reload();
  return true;
}
