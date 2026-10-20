import { Star, CalendarCheck, Sparkles, Tag, type LucideIcon } from 'lucide-react';
import type { PropertyBadgeType } from '../lib/promoBadges';

/**
 * Etiqueta promocional flotante que va SOBRE LA FOTO de una tarjeta.
 *
 * Sin `'use client'` y sin hooks a propósito: la usan tanto tarjetas cliente
 * (`PropertyCard`, `PropertyRow`) como la de la landing, que es Server
 * Component (`FeaturedPropertyCard`).
 *
 * Todo el aspecto (gradiente, relieve, sombra de color, flotación) vive en
 * `globals.css`, bloque "ETIQUETAS PROMOCIONALES FLOTANTES". Acá solo se elige
 * la variante: las cuatro comparten geometría y animación, y cambian color,
 * ícono y texto.
 *
 * Qué etiqueta lleva cada propiedad NO se decide acá — eso es `getPromoBadge`
 * (`lib/promoBadges.ts`). Este componente solo dibuja.
 */
const BADGE_VARIANTS: Record<PropertyBadgeType, { label: string; icon: LucideIcon; iconFill?: boolean }> = {
  featured: { label: 'Destacada', icon: Star, iconFill: true },
  visits: { label: 'Visitas disponibles', icon: CalendarCheck },
  new: { label: 'Ingreso reciente', icon: Sparkles },
  opportunity: { label: 'Oportunidad', icon: Tag },
};

export function PropertyBadge({ type }: { type: PropertyBadgeType }) {
  const { label, icon: Icon, iconFill } = BADGE_VARIANTS[type];

  // El texto se escribe en minúscula y lo pasa a mayúsculas el CSS: así un
  // lector de pantalla lo lee como palabra ("Destacada") y no deletreado.
  return (
    <span className={`promo-badge promo-badge--${type}`}>
      <span className="promo-badge__body">
        <span className="promo-badge__icon" aria-hidden="true">
          <Icon strokeWidth={2.4} className={iconFill ? 'fill-current' : undefined} />
        </span>
        <span className="promo-badge__label">{label}</span>
      </span>
    </span>
  );
}

export default PropertyBadge;
