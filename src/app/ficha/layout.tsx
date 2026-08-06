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
 */
export default function FichaLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface">{children}</div>;
}
