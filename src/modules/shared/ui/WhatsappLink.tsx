import { whatsappLinkTo } from '@/modules/shared/lib/contact';

/**
 * Botón de "contactar por WhatsApp" hacia el teléfono de OTRA persona
 * (panel de administración: listado de usuarios, detalle de usuario,
 * solicitudes de publicación).
 *
 * ── Por qué es un componente y no un `href` a mano ──────────────────────────
 * Los tres lugares del panel armaban el link inline con
 * `https://wa.me/${phone.replace(/\D/g, '')}`, y los tres tenían el mismo par
 * de bugs: `https://wa.me/undefined` cuando el teléfono era `null` (los
 * usuarios de Google se crean con `phone: ''`), y números sin código de país
 * que WhatsApp rechaza. Centralizarlo evita que el próximo lugar que necesite
 * un contacto vuelva a copiar el patrón roto.
 *
 * Cuando el teléfono no sirve NO se renderiza un link muerto: se muestra el
 * mismo botón, apagado y no clickeable, explicando por qué. Un botón que
 * desaparece deja al admin preguntándose si la acción existe; uno deshabilitado
 * con motivo le dice qué falta (que ese usuario cargue su teléfono).
 */
export function WhatsappLink({
  phone,
  message,
  className = '',
  style,
  children,
}: {
  phone: string | null | undefined;
  /** Mensaje pre-armado opcional. Se escapa con `encodeURIComponent`. */
  message?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const href = whatsappLinkTo(phone, message);

  if (!href) {
    return (
      <span
        aria-disabled="true"
        title="Este usuario no tiene un teléfono válido cargado"
        className={`cursor-not-allowed opacity-50 grayscale ${className}`}
        style={style}
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`WhatsApp: ${phone}`}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}

export default WhatsappLink;
