'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RotateCw, WifiOff } from 'lucide-react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import { loginUrlFromHere, withExpiredFlag } from '@/modules/shared/lib/returnTo';

/** Pantalla centrada de los estados intermedios del panel. */
function GateScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">{children}</div>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <GateScreen>
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0b7a4b]/10 border-t-[#0b7a4b]" />
      <p className="text-sm font-medium text-gray-500" role="status">{label}</p>
    </GateScreen>
  );
}

/**
 * Guardia de sesión de los paneles (`/dashboard` y `/dashboardAdmin`).
 *
 * Reemplaza los `if (!user) return null` que dejaban la pantalla EN BLANCO:
 * ahora cada estado de la sesión tiene una pantalla con salida.
 *
 *  - `loading` → spinner.
 *  - `error` (el backend no respondió: red, timeout, 5xx, 429) → "No pudimos
 *    conectar" con Reintentar. NO cierra la sesión: puede estar perfecta.
 *  - `unauthenticated` → manda al login (con "Tu sesión expiró" si el backend
 *    avisó que la sesión guardada ya no servía) y mientras tanto lo dice.
 *  - Rol equivocado (un usuario común en el panel admin) → al panel de usuario.
 */
export function SessionGate({
  requireRole,
  loadingLabel,
  children,
}: {
  requireRole?: 'admin';
  loadingLabel: string;
  children: React.ReactNode;
}) {
  const { user, status, sessionExpired, retrySession } = useAuth();
  const router = useRouter();
  const wrongRole = !!user && !!requireRole && user.role !== requireRole;

  useEffect(() => {
    if (status === 'unauthenticated') {
      const url = loginUrlFromHere();
      router.replace(sessionExpired ? withExpiredFlag(url) : url);
    } else if (status === 'authenticated' && wrongRole) {
      router.replace('/dashboard');
    }
  }, [status, sessionExpired, wrongRole, router]);

  if (status === 'loading') return <Spinner label={loadingLabel} />;

  if (status === 'error') {
    return (
      <GateScreen>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <WifiOff size={26} />
        </span>
        <h1 className="text-lg font-bold text-gray-900">No pudimos conectar</h1>
        <p className="text-sm leading-relaxed text-gray-500">
          El servidor no respondió. Puede ser un problema momentáneo de conexión: tu sesión sigue
          abierta, probá de nuevo en unos segundos.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={retrySession}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0b7a4b] px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0f8b57]"
          >
            <RotateCw size={16} />Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:border-[#0b7a4b]/40 hover:text-[#0b7a4b]"
          >
            Volver al inicio
          </Link>
        </div>
      </GateScreen>
    );
  }

  if (status === 'unauthenticated') {
    return <Spinner label={sessionExpired ? 'Tu sesión expiró. Llevándote al inicio de sesión…' : 'Llevándote al inicio de sesión…'} />;
  }

  if (wrongRole) return <Spinner label="Llevándote a tu panel…" />;

  return <>{children}</>;
}

export default SessionGate;
