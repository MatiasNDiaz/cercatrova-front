'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, LogIn, RotateCw } from 'lucide-react';
import { isChunkLoadError, reloadOnceForChunkError } from '@/modules/shared/lib/chunkRecovery';
import { API_URL } from '@/modules/shared/lib/env';

/**
 * Pantalla de error de los paneles (y del layout raíz). Nunca más pantalla en
 * blanco: siempre hay una explicación y dos salidas.
 *
 *  - "Reintentar": vuelve a montar la sección que falló.
 *  - "Volver a iniciar sesión": borra la cookie de sesión (vía
 *    `POST /auth/clear-session`, porque es httpOnly), limpia los datos locales
 *    de la app y va al login. Es lo que antes había que hacer A MANO borrando
 *    cookies y storage desde las herramientas de Chrome.
 *
 * Si el error es un chunk viejo de un deploy anterior, recarga sola una vez.
 *
 * Usa `fetch` y no la instancia de axios a propósito: si lo que se rompió es
 * justo el estado de la app, esta pantalla no debe depender de él.
 */
export function SessionErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (isChunkLoadError(error) && reloadOnceForChunkError()) return;
    console.error('[error boundary]', error.digest ?? '(sin digest)', error);
  }, [error]);

  const resetSession = async () => {
    setLeaving(true);
    try {
      await fetch(`${API_URL}/auth/clear-session`, { method: 'POST', credentials: 'include' });
    } catch {
      /* Sin red: igual se limpia lo local y se va al login. */
    }
    try {
      sessionStorage.clear();
    } catch {
      /* sessionStorage puede no estar disponible. */
    }
    window.location.href = '/login?expired=1';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <AlertTriangle size={26} />
        </span>
        <h1 className="text-lg font-bold text-gray-900">Algo salió mal al cargar esta pantalla</h1>
        <p className="text-sm leading-relaxed text-gray-500">
          Probá de nuevo. Si sigue fallando, volvé a iniciar sesión: limpiamos los datos de la sesión
          de este navegador por vos, sin que tengas que borrar nada a mano.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0b7a4b] px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0f8b57]"
          >
            <RotateCw size={16} />Reintentar
          </button>
          <button
            type="button"
            onClick={resetSession}
            disabled={leaving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:border-[#0b7a4b]/40 hover:text-[#0b7a4b] disabled:opacity-60"
          >
            <LogIn size={16} />Volver a iniciar sesión
          </button>
        </div>
        {error.digest && <p className="text-xs text-gray-400">Código: {error.digest}</p>}
      </div>
    </div>
  );
}

export default SessionErrorFallback;
