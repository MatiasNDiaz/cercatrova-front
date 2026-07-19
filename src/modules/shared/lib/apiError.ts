import { isAxiosError } from 'axios';

const NETWORK_ERROR_MESSAGE = 'No pudimos conectar con el servidor, intentá de nuevo.';
const GENERIC_ERROR_MESSAGE = 'Ocurrió un error inesperado. Intentá de nuevo.';
const THROTTLE_MESSAGE = 'Demasiados intentos, esperá un momento e intentá de nuevo.';

/**
 * Convierte cualquier error de una llamada a la API en un string listo para mostrar en un toast.
 * - message string del backend → se muestra tal cual (los mensajes 1.a del contrato ya vienen en español).
 * - message array (class-validator) → une los primeros 3 de forma legible.
 * - 429 → mensaje propio (el del backend es "ThrottlerException: Too Many Requests", no apto para mostrar).
 * - Sin response (error de red) → mensaje de conexión.
 */
export function getErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return GENERIC_ERROR_MESSAGE;
  if (!error.response) return NETWORK_ERROR_MESSAGE;

  if (error.response.status === 429) return THROTTLE_MESSAGE;

  const message = (error.response.data as { message?: string | string[] } | undefined)?.message;

  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message) && message.length > 0) {
    return message.slice(0, 3).join(' · ');
  }
  return GENERIC_ERROR_MESSAGE;
}

/** Status HTTP del error, o undefined si no es un error de API con respuesta. */
export function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}
