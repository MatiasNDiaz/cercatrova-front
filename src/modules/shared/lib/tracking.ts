import api from './axios';
import { API_URL } from './env';

/**
 * Cliente de telemetría (Fase 0 de Estadísticas).
 *
 * El identificador de visitante NO se maneja acá: lo setea el backend en una
 * cookie httpOnly y viaja solo (`withCredentials: true`). El frontend nunca lo
 * lee ni lo genera.
 */

// `sendBeacon` necesita URL absoluta (no pasa por la instancia de axios).
const API_BASE = API_URL;

/** Registra una visita y devuelve el id con el que después se cierra. */
export async function recordVisit(path: string): Promise<number | null> {
  try {
    const { data } = await api.post('/tracking/visit', { path });
    return data?.visitId ?? null;
  } catch {
    // La telemetría nunca debe molestar al usuario: si falla, se ignora.
    return null;
  }
}

/**
 * Informa cuánto duró una visita.
 *
 * Usa `navigator.sendBeacon` porque se dispara cuando la pestaña se está
 * ocultando o cerrando: un `fetch` normal en ese momento suele ser cancelado
 * por el navegador. `sendBeacon` se encola y el navegador lo entrega igual.
 *
 * Nota: `sendBeacon` no permite headers custom, pero sí manda las cookies del
 * sitio, que es todo lo que el backend necesita para validar el visitante.
 */
export function sendDuration(visitId: number, durationMs: number): void {
  if (!visitId || durationMs <= 0) return;

  const url = `${API_BASE}/tracking/duration`;
  const payload = JSON.stringify({ visitId, durationMs: Math.round(durationMs) });

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      return;
    }
    // Fallback para navegadores sin sendBeacon.
    void api.post('/tracking/duration', { visitId, durationMs: Math.round(durationMs) });
  } catch {
    /* la telemetría nunca rompe la navegación */
  }
}
