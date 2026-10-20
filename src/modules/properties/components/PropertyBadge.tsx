import { Star, CalendarCheck, Sparkles, Tag, UsersRound, type LucideIcon } from 'lucide-react';
import type { PromoBadge, PropertyBadgeType } from '../lib/promoBadges';

/**
 * Etiqueta promocional flotante, montada sobre la esquina superior izquierda
 * de una tarjeta (la posición la da `.promo-badge-corner`, que pone cada
 * tarjeta alrededor de este componente).
 *
 * Sin `'use client'` y sin hooks a propósito: la usan tanto tarjetas cliente
 * (`PropertyCard`, `PropertyRow`) como la de la landing, que es Server
 * Component (`FeaturedPropertyCard`).
 *
 * Todo el aspecto (gradiente, relieve, sombra de color, flotación) vive en
 * `globals.css`, bloque "ETIQUETAS PROMOCIONALES FLOTANTES". Acá solo se elige
 * la variante: las cinco comparten geometría y animación, y cambian color,
 * ícono y texto.
 *
 * Qué etiqueta lleva cada propiedad NO se decide acá — eso es
 * `lib/promoBadges.ts`. Este componente solo dibuja.
 */
const BADGE_VARIANTS: Record<PropertyBadgeType, { label: string; icon: LucideIcon; iconFill?: boolean }> = {
  featured: { label: 'Destacada', icon: Star, iconFill: true },
  visits: { label: 'Visitas disponibles', icon: CalendarCheck },
  new: { label: 'Ingreso reciente', icon: Sparkles },
  opportunity: { label: 'Oportunidad', icon: Tag },
  // El texto real se arma con el número medido (ver abajo).
  views: { label: 'Vista por personas', icon: UsersRound },
};

export function PropertyBadge({ badge }: { badge: PromoBadge }) {
  const { label, icon: Icon, iconFill } = BADGE_VARIANTS[badge.type];
  const isViews = badge.type === 'views' && typeof badge.count === 'number';

  // El texto se escribe en minúscula y lo pasa a mayúsculas el CSS: así un
  // lector de pantalla lo lee como palabra ("Destacada") y no deletreado.
  return (
    <span className={`promo-badge promo-badge--${badge.type}`}>
      <span className="promo-badge__body">
        <span className="promo-badge__icon" aria-hidden="true">
          <Icon strokeWidth={2.4} className={iconFill ? 'fill-current' : undefined} />
        </span>
        {isViews ? (
          <span className="promo-badge__label promo-badge__label--stack">
            <span>Vista por {badge.count} {badge.count === 1 ? 'persona' : 'personas'}</span>
            <span className="promo-badge__sub">En los últimos 7 días</span>
          </span>
        ) : (
          <span className="promo-badge__label">{label}</span>
        )}
      </span>
    </span>
  );
}

export default PropertyBadge;
