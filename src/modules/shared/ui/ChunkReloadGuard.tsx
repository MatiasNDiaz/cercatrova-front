'use client';

import { useEffect } from 'react';
import { isChunkLoadError, reloadOnceForChunkError } from '@/modules/shared/lib/chunkRecovery';

/**
 * Escucha errores de carga de chunks fuera del render (navegaciones,
 * `import()` dinámicos) y recarga la página una sola vez. Los errores DENTRO
 * del render los resuelven las pantallas de error (`error.tsx`), que usan la
 * misma lógica. No renderiza nada. Ver `chunkRecovery.ts`.
 */
export function ChunkReloadGuard() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (isChunkLoadError(e.error ?? e.message)) reloadOnceForChunkError();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isChunkLoadError(e.reason)) reloadOnceForChunkError();
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}

export default ChunkReloadGuard;
