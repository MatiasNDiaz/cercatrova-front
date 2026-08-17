/**
 * Layout de la ficha compartible.
 *
 * Es la primera ruta "limpia" del proyecto: sin navbar, sin footer, sin sidebar
 * de dashboard. Antes no existía ningún ejemplo de este patrón — `/login` y
 * `/register` se salvan del chrome público, pero tienen el suyo propio
 * (`AuthShell`, con "Volver al inicio"), así que no servían de referencia.
 *
 * ⚠️ Este archivo por sí solo NO alcanza para que la página quede limpia:
 * `NavbarSelector` y `FooterSelector` se montan en el layout RAÍZ y deciden qué
 * renderizar mirando el `pathname`. Hay que excluir `/ficha` en los dos (ya
 * hecho) — si se agrega otra ruta standalone en el futuro, hay que acordarse de
 * los tres lugares.
 *
 * El `<main>` va acá y no en la página para que el fondo cubra el alto completo
 * incluso cuando la ficha es corta.
 *
 * ── El fondo ────────────────────────────────────────────────────────────────
 * `bg-surface-mint` (#dbeee4), el MISMO verde de sección que usan el detalle de
 * propiedad, el catálogo y la landing. Con eso la ficha deja de tener un fondo
 * propio y pasa a compartir el del resto del sistema.
 *
 * ⚠️ Historial, para que no se vuelva atrás sin querer: primero fue
 * `bg-surface` (gris casi blanco), donde las tarjetas blancas no se despegaban
 * de nada; después `.surface-brand-deepest` (verde muy oscuro con textura), que
 * resolvía el contraste pero resultó demasiado fuerte. `surface-mint` es el
 * punto medio y además ya estaba definido: las tarjetas blancas saltan contra
 * él sin que el fondo grite.
 *
 * Sigue siendo genérico: un verde claro no identifica a ninguna inmobiliaria.
 */
export default function FichaLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface-mint">{children}</div>;
}
