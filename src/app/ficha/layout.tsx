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
 * Pasó de `bg-surface` (un gris casi blanco) a `.surface-brand-deepest`: verde
 * muy oscuro con textura —gradiente diagonal, halo radial y trama de puntos—,
 * la misma clase que usan la franja de estudiantes del hero y el footer de la
 * landing. No es un color nuevo: es el token más oscuro de la escala de marca.
 *
 * El cambio es lo que le da vida a la ficha, porque convierte cada tarjeta de
 * datos en un bloque claro que salta contra el fondo, en vez de blanco sobre
 * gris clarito donde nada se despegaba. Y sigue siendo genérico: un verde
 * oscuro no identifica a ninguna inmobiliaria.
 *
 * ⚠️ `relative` + `isolate`: `.surface-brand-deepest` dibuja su trama en un
 * `::before` posicionado con `inset: 0`. Sin contexto de apilamiento propio,
 * esa capa podía quedar por encima del contenido en vez de detrás.
 */
export default function FichaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-brand-deepest relative isolate min-h-screen">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
