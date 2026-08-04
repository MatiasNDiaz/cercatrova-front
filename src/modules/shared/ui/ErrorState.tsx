'use client';

import { WifiOff, RotateCw } from 'lucide-react';

/**
 * Bloque de error para fetches del CLIENTE que fallaron.
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 * `app/error.tsx` sólo entra cuando una excepción escapa del render. Un `await
 * api.get(...)` que falla dentro de un `useEffect` no es eso: está atrapado por
 * su propio `try/catch`, así que el boundary nunca se entera y la pantalla
 * queda en un estado que **miente**.
 *
 * El caso más grave era el catálogo: su `catch` sólo hacía `console.error`, así
 * que con el backend caído el usuario veía el estado vacío —"No encontramos
 * propiedades. Probá ajustando los filtros"— cuando en realidad no había fallado
 * ninguna búsqueda, había fallado la conexión. El usuario ajustaba filtros para
 * siempre sin entender por qué.
 *
 * Las pantallas que sí mostraban un `toast` estaban mejor, pero el toast se va a
 * los pocos segundos y detrás queda el mismo estado vacío engañoso.
 *
 * ── Cómo se usa ────────────────────────────────────────────────────────────
 * Se renderiza EN LUGAR del contenido y del estado vacío, nunca además:
 *
 *   {error   ? <ErrorState onRetry={cargar} />
 *   : vacío  ? <EstadoVacio />
 *   :          <Contenido />}
 *
 * El orden importa: "falló" tiene que ganarle a "está vacío", porque cuando
 * falla la petición no sabemos si está vacío o no.
 *
 * La geometría (`rounded-2xl`, borde `ink-200/70`, fondo blanco, `py-24`) es la
 * misma de los estados vacíos que ya existen, para que la pantalla no cambie de
 * forma según qué salió mal.
 */
export function ErrorState({
  title = 'Ups, algo salió mal',
  message = 'No pudimos cargar esta información. Puede ser un problema momentáneo de conexión. Probá de nuevo en unos segundos.',
  onRetry,
  compact = false,
}: {
  title?: string;
  message?: string;
  /** Si se pasa, se muestra el botón "Reintentar". */
  onRetry?: () => void;
  /** Versión de menor altura, para bloques dentro de una página (no pantalla completa). */
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-2xl border border-ink-200/70 bg-white text-center ${
        compact ? 'px-6 py-10' : 'px-6 py-24'
      }`}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <WifiOff size={26} strokeWidth={1.75} />
      </span>

      <h3 className="mb-2 text-xl font-bold text-ink-700">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-ink-400">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="group mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(6,57,35,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-800 active:scale-[0.98]"
        >
          <RotateCw size={16} className="transition-transform duration-500 group-hover:rotate-180" />
          Reintentar
        </button>
      )}
    </div>
  );
}

export default ErrorState;
