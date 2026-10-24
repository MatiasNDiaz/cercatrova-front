'use client';

import { SessionErrorFallback } from '@/modules/shared/ui/SessionErrorFallback';

/**
 * Error dentro del panel de administración: pantalla con "Reintentar" y
 * "Volver a iniciar sesión" (que limpia la sesión de este navegador) en vez de
 * una pantalla en blanco. Ver `SessionErrorFallback`.
 */
export default function AdminDashboardError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <SessionErrorFallback {...props} />;
}
