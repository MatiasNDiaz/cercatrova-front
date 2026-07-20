/**
 * Datos de contacto centralizados.
 *
 * El número de WhatsApp estaba hardcodeado por separado en Servicios.tsx,
 * servicios/[id]/page.tsx, NavbarPublic.tsx y FooterPublic.tsx. Se centraliza
 * acá para que cambiarlo sea un solo lugar.
 *
 * Formato: código de país + área sin el 0 y sin el 15 (requisito de wa.me).
 */
export const WHATSAPP_NUMBER = '543513872817';

/** Arma un link de wa.me con el mensaje ya escrito y correctamente escapado. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
