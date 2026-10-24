'use client';

import { SessionErrorFallback } from '@/modules/shared/ui/SessionErrorFallback';

/**
 * Error dentro del panel del usuario: pantalla con "Reintentar" y "Volver a
 * iniciar sesión" en vez de una pantalla en blanco. Ver `SessionErrorFallback`.
 */
export default function UserDashboardError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <SessionErrorFallback {...props} />;
}
