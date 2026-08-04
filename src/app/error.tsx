'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw, ArrowRight } from 'lucide-react';
import { CtaButton } from '@/modules/landing/components/CtaButton';
import { StatusScreen } from '@/modules/shared/ui/StatusScreen';

/**
 * Pantalla de error global — convención de Next.js (`app/error.tsx`).
 *
 * Next monta este componente cuando una excepción no capturada escapa del
 * render de cualquier página o layout hijo. Sin este archivo, el usuario veía
 * la pantalla por defecto del framework ("Application error: a client-side
 * exception has occurred"), que no dice nada útil y no ofrece salida.
 *
 * ⚠️ **Tiene que ser Client Component**: Next le pasa `reset()`, una función
 * que vuelve a montar el segmento que falló. Es la diferencia importante con
 * `not-found.tsx` — acá el error puede ser transitorio (la API tardó de más, se
 * cortó la red), así que "Reintentar" muchas veces alcanza y el usuario no
 * pierde dónde estaba.
 *
 * `error.tsx` NO captura errores del layout raíz (para eso haría falta
 * `global-error.tsx`), ni errores dentro de handlers asincrónicos de
 * componentes cliente — los fetch que fallan a mano se manejan con
 * `<ErrorState />`, ver ese componente.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // El `digest` es el identificador que Next genera para correlacionar este
    // error con el stack real del servidor (que a propósito NO se expone al
    // cliente). Queda en consola para poder rastrearlo en los logs.
    console.error('[error boundary]', error.digest ?? '(sin digest)', error);
  }, [error]);

  return (
    <StatusScreen
      code="500"
      eyebrow="Algo salió mal"
      icon={<AlertTriangle size={34} strokeWidth={1.75} />}
      title={
        <>
          Ups, <span className="text-brand-700">algo salió mal</span>
        </>
      }
      message="No pudimos cargar esta página. Puede ser un problema momentáneo de conexión con el servidor. Probá de nuevo en unos segundos."
      actions={
        <>
          {/* No es `CtaButton` porque este dispara una función, no navega.
              Replica exactamente la geometría y el estilo de la variante
              `primary` para que la fila se vea pareja. */}
          <button
            type="button"
            onClick={reset}
            className="group/cta relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-xl border-2 border-transparent bg-brand-700 px-8 py-4 text-base font-bold tracking-tight text-white shadow-[0_8px_20px_-6px_rgba(6,57,35,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-[0_14px_30px_-8px_rgba(6,57,35,0.7)] active:scale-[0.98]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover/cta:translate-x-full"
            />
            <span className="relative flex items-center gap-2.5">
              Reintentar
              <RotateCw size={18} className="transition-transform duration-500 group-hover/cta:rotate-180" />
            </span>
          </button>

          <CtaButton
            href="/"
            variant="outlineDark"
            icon={<ArrowRight size={18} className="transition-transform duration-300 group-hover/cta:translate-x-1" />}
          >
            Volver al inicio
          </CtaButton>
        </>
      }
      footer={
        <>
          Si el problema sigue,{' '}
          <Link href="/" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
            escribinos
          </Link>
          {error.digest ? ` y pasanos este código: ${error.digest}` : '.'}
        </>
      }
    />
  );
}
