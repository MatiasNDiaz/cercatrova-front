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

/** Código de país de Argentina, sin el `+`. */
const AR_COUNTRY_CODE = '54';

/** Arma un link de wa.me con el mensaje ya escrito y correctamente escapado. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Normaliza un teléfono cargado por un usuario al formato que exige `wa.me`:
 * sólo dígitos, con código de país y sin el 0 de área ni el 15 de celular.
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 * El panel de administración armaba los links a mano con
 * `https://wa.me/${phone.replace(/\D/g, '')}`, y eso fallaba de dos formas:
 *
 *  1. `User.phone` es `string | null` en el contrato, y los usuarios creados
 *     por Google llegan con `phone: ''`. El optional chaining devolvía
 *     `undefined` y el template literal generaba literalmente
 *     **`https://wa.me/undefined`**.
 *  2. `wa.me` exige formato internacional. Alguien que se registró escribiendo
 *     "351 387 2817" producía `3513872817`, sin el `54`: WhatsApp no encuentra
 *     el número y muestra "el número de teléfono no es válido".
 *
 * ── Reglas ─────────────────────────────────────────────────────────────────
 * · Se descarta todo lo que no sea dígito (espacios, guiones, paréntesis, `+`).
 * · Si ya empieza con `54`, se respeta tal cual.
 * · Si empieza con `0` (prefijo interurbano nacional), se le saca.
 * · Si después del área lleva `15` (celular en formato local), se le saca.
 * · Se antepone `54`.
 * · Si no quedan al menos 10 dígitos (área + número en Argentina), se devuelve
 *   `null` — es preferible no ofrecer el botón que ofrecer uno roto.
 *
 * @returns el número listo para `wa.me`, o `null` si no es utilizable.
 */
export function normalizePhoneForWhatsapp(phone: string | null | undefined): string | null {
  if (!phone) return null;

  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith(AR_COUNTRY_CODE)) {
    // Ya viene internacional: 54 + (10 dígitos) = 12 como mínimo.
    return digits.length >= 12 ? digits : null;
  }

  if (digits.startsWith('0')) digits = digits.slice(1);

  // El `15` va después del código de área (2 a 4 dígitos). Se busca en esa
  // ventana en vez de asumir una posición fija, porque el área varía:
  // 11 (CABA), 351 (Córdoba), 2954 (Santa Rosa)…
  for (const areaLen of [2, 3, 4]) {
    if (digits.length > areaLen + 2 && digits.slice(areaLen, areaLen + 2) === '15') {
      digits = digits.slice(0, areaLen) + digits.slice(areaLen + 2);
      break;
    }
  }

  if (digits.length < 10) return null;

  return AR_COUNTRY_CODE + digits;
}

/**
 * Link de WhatsApp hacia el teléfono de otra persona (usado en el panel admin).
 *
 * Devuelve `null` cuando el teléfono no sirve, para que quien llama pueda
 * ocultar o deshabilitar el botón en vez de renderizar un link roto.
 */
export function whatsappLinkTo(phone: string | null | undefined, message?: string): string | null {
  const normalized = normalizePhoneForWhatsapp(phone);
  if (!normalized) return null;
  return message
    ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${normalized}`;
}
