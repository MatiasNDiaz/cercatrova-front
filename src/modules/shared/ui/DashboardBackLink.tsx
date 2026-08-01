import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Link "volver" de las páginas de dashboard (usuario y admin).
 *
 * Unifica tres variantes que convivían copiadas a mano en ~9 páginas:
 *  - flecha dentro de un círculo blanco, SIN texto (favoritos, mis-solicitudes,
 *    notificaciones, perfil, preferencias, admin/propiedades, admin/estadísticas)
 *  - flecha suelta + "Volver al panel" (comentadas, valoradas)
 *  - dos definiciones locales de `BackLink`, idénticas entre sí, en dos archivos
 *    distintos del panel admin
 *
 * Se queda con el círculo (da un área de click decente) Y con la etiqueta: una
 * flecha sola, sin texto, no dice a dónde vuelve — que era el caso en 7 de las 9
 * pantallas.
 *
 * Va SIEMPRE como primer elemento de la página, antes del encabezado.
 *
 * Con `onClick` renderiza un `<button>` en vez de un `<Link>`, con el mismo
 * aspecto. Es para el detalle de usuario, que vuelve con `router.back()` porque
 * se puede llegar desde varias pantallas distintas: se unifica cómo se VE sin
 * cambiar a dónde va.
 */
const STYLES =
  'group inline-flex w-fit cursor-pointer items-center gap-2.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800';

const ICON = (
  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white shadow-sm transition-transform group-hover:-translate-x-0.5">
    <ArrowLeft size={14} />
  </span>
);

export function DashboardBackLink({
  href = '/dashboard',
  label = 'Volver al panel',
  onClick,
}: {
  href?: string;
  label?: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={STYLES}>
        {ICON}
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={STYLES}>
      {ICON}
      {label}
    </Link>
  );
}

export default DashboardBackLink;
