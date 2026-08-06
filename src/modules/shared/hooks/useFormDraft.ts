'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Guardado automático de borrador para formularios largos del panel.
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 * `PropertyForm` tiene 21 campos y hasta 10 imágenes, y todo vive en `useState`
 * local. Al desmontarse el componente —navegar a otra ruta, un error de render,
 * un click equivocado— React tira ese estado y no queda nada. Un admin perdió
 * las 10 imágenes y todos los campos cargados por un error que además terminó
 * no siendo culpa suya.
 *
 * ── Por qué `sessionStorage` y no `localStorage` ────────────────────────────
 * `sessionStorage` se limpia solo al cerrar la pestaña. Un borrador de una
 * propiedad a medio cargar no es algo que deba sobrevivir semanas en el disco
 * del usuario: si la persona cerró el navegador, dio por terminada la tarea.
 * `localStorage` además haría que un borrador viejo reapareciera meses después
 * pisando un formulario nuevo.
 *
 * ── Qué se guarda y qué NO ──────────────────────────────────────────────────
 * Sólo el objeto de campos del formulario que se le pase. **Nunca** tokens,
 * cookies ni datos de sesión: la sesión vive en una cookie `httpOnly` que el
 * JavaScript ni siquiera puede leer, así que no hay forma de que se filtre acá
 * aunque se quisiera.
 *
 * ⚠️ **Limitación conocida — las imágenes no se pueden guardar.** Los objetos
 * `File` que devuelve un `<input type="file">` no son serializables a JSON:
 * son referencias a un archivo del disco que el navegador sólo mantiene
 * mientras la página vive. Convertirlos a base64 para guardarlos tampoco es
 * viable: `sessionStorage` tiene un tope de ~5 MB por origen y el backend
 * acepta imágenes de hasta 5 MB **cada una** (hasta 10) — una sola foto ya
 * puede desbordar la cuota. Por eso el borrador preserva los 21 campos de
 * texto/número/booleanos y las imágenes hay que volver a seleccionarlas.
 */

/** Clave del borrador. `mode` separa "nueva" de "editando la propiedad N". */
export function draftKey(formName: string, mode: string | number): string {
  return `ct_draft_${formName}_${mode}`;
}

interface UseFormDraftOptions<T> {
  /** Clave completa, normalmente armada con `draftKey()`. */
  key: string;
  /** Estado actual del formulario. Se guarda cuando cambia. */
  value: T;
  /** Aplica el borrador recuperado sobre el estado del formulario. */
  onRestore: (draft: T) => void;
  /**
   * Mientras sea `true` no se guarda ni se restaura. Sirve para el modo
   * edición, que primero tiene que traer la propiedad del backend: sin esto,
   * el borrador se pisaría con el `useState` inicial vacío antes de que llegue
   * la respuesta.
   */
  disabled?: boolean;
  /** Milisegundos de espera antes de escribir. Evita un write por tecla. */
  debounceMs?: number;
}

interface UseFormDraftResult {
  /** `true` si al montar se encontró y aplicó un borrador. */
  restored: boolean;
  /** Borra el borrador y baja `restored`. Para "Descartar borrador" y post-submit. */
  discard: () => void;
}

export function useFormDraft<T>({
  key,
  value,
  onRestore,
  disabled = false,
  debounceMs = 400,
}: UseFormDraftOptions<T>): UseFormDraftResult {
  const [restored, setRestored] = useState(false);

  /**
   * `onRestore` en un ref: si se pasara como dependencia del efecto, cualquier
   * caller que la defina inline (lo normal) la recrearía en cada render y el
   * efecto de restauración correría en bucle, pisando lo que el usuario tipea.
   */
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  /** Evita que el guardado corra antes de haber intentado restaurar. */
  const hydrated = useRef(false);

  // ── Restaurar (una sola vez por clave) ──
  useEffect(() => {
    if (disabled) return;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        onRestoreRef.current(JSON.parse(raw) as T);
        setRestored(true);
      }
    } catch {
      // JSON corrupto o sessionStorage no disponible (SSR, modo privado con
      // cuota en cero): se ignora y el formulario arranca vacío, que es
      // exactamente el comportamiento que había antes de este hook.
    } finally {
      hydrated.current = true;
    }
  }, [key, disabled]);

  // ── Guardar (con debounce) ──
  useEffect(() => {
    if (disabled || !hydrated.current) return;

    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Cuota excedida o storage bloqueado: el borrador es una red de
        // seguridad, no puede romper el formulario. Se ignora en silencio.
      }
    }, debounceMs);

    return () => clearTimeout(t);
  }, [key, value, disabled, debounceMs]);

  const discard = () => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* nada que hacer */
    }
    setRestored(false);
  };

  return { restored, discard };
}
