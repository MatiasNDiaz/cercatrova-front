'use client';

import { SessionErrorFallback } from '@/modules/shared/ui/SessionErrorFallback';
import './globals.css';

/**
 * Error en el LAYOUT RAÍZ (donde `app/error.tsx` no llega: por ejemplo, si
 * falla el `AuthProvider` o la navbar). Reemplaza todo el documento, por eso
 * tiene su propio `<html>`/`<body>`. Sin este archivo, ese caso era la pantalla
 * en blanco de Next. Ver `SessionErrorFallback`.
 */
export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <SessionErrorFallback {...props} />
      </body>
    </html>
  );
}
