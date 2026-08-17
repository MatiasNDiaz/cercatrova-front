// Server Component: esta sección no tiene estado, ni efectos, ni handlers — es
// markup con dos hijos que sí son cliente (`Reveal`, por framer-motion). Un
// Server Component puede renderizar componentes cliente sin problema, así que
// el `'use client'` que tenía sólo servía para mandar este JSX al bundle sin
// necesidad. La landing la monta directo, así que el ahorro es real.
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Reveal } from './Reveal';
import { CtaButton } from './CtaButton';

const badges = [
  'Publicación rápida',
  'Revisión profesional',
  'Mayor visibilidad',
];

/**
 * ── RITMO EN MOBILE: por qué esta sección estaba descolgada ─────────────────
 *
 * Hasta ahora era la ÚNICA sección de la landing que no seguía la escala común:
 * llevaba `py-28` plano donde las otras siete usan `py-24 md:py-28`, y un `h2`
 * de `text-5xl` fijo donde el `SectionHeading` compartido —el que usan
 * Featuredproperties, Servicios, Reseñas, Nosotros y FAQ— usa
 * `text-3xl sm:text-4xl md:text-5xl`.
 *
 * En escritorio no se notaba porque ahí los valores coinciden. En mobile sí: la
 * sección respiraba distinto del resto de la página y el título entraba con
 * 48px cuando todos los demás entran con 30px.
 *
 * Además el bloque de texto era el único sin centrar. La foto tenía `mx-auto`,
 * el texto no, y como en mobile el grid colapsa a una sola columna el resultado
 * era una foto centrada con el título, el párrafo y el CTA pegados a la
 * izquierda.
 *
 * Los cambios de abajo son todos `< lg`; de `lg` para arriba (que es donde el
 * grid pasa a dos columnas y el texto DEBE ir alineado a la izquierda, al lado
 * de la foto) queda exactamente como estaba.
 */
export default function PublicarPropiedad() {
  return (
    <section className="overflow-hidden bg-surface-mint py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">

        {/* Badge superior */}
        <div className="mb-10 flex justify-center lg:mb-18">
          <span className="rounded-full bg-brand-700 px-6 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white shadow-[0_10px_25px_-10px_rgba(11,122,75,.45)]">
            ¿TENÉS UNA PROPIEDAD?
          </span>
        </div>

        {/* ⚠️ `gap-38` son **152px**. En dos columnas es la separación
            horizontal entre la foto y el texto, y ahí está bien. Pero en mobile
            el grid colapsa a una columna y ese mismo valor pasa a ser separación
            VERTICAL: 152px de vacío entre la foto y el título — el hueco que se
            veía en la captura. `gap-10` (40px) en mobile lo cierra sin pegarlos. */}
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-38">

          {/* ==================== IMAGEN ==================== */}

          <Reveal>
            <div className="relative mx-auto w-full max-w-xl">

              <div className="relative h-[500px] overflow-hidden rounded-[36px] shadow-[0_35px_80px_-30px_rgba(0,0,0,.28)]">
                <Image
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1600&auto=format&fit=crop"
                  alt="Dos personas cerrando un acuerdo para publicar una propiedad"
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px)100vw,50vw"
                />
              </div>

              {/* ── Badges flotantes — SOLO desde `md` ──
                  Están posicionados `absolute right-[-96px]`, o sea 96px FUERA
                  del borde derecho de la foto. Ese voladizo funciona cuando
                  sobra ancho al costado (dos columnas, de `lg` para arriba),
                  pero en mobile la foto ya ocupa todo el ancho disponible: las
                  tres pastillas caían encima de la imagen, montadas entre sí y
                  cortadas por el `overflow-hidden` de la sección.

                  Se ocultan por debajo de `md` en vez de reacomodarlas: son un
                  refuerzo decorativo del mensaje ("publicación rápida",
                  "revisión profesional", "mayor visibilidad"), no información
                  que el visitante necesite para entender la sección ni para
                  llegar al CTA. Apilarlas debajo de la foto sólo habría alargado
                  la sección en el formato donde menos espacio hay. */}

              <div className="absolute right-[-96px] top-1/2 hidden -translate-y-1/2 flex-col gap-7 md:flex">

                {badges.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-1.5 rounded-full bg-white px-2 py-3 shadow-[0_20px_45px_-20px_rgba(0,0,0,.25)]"
                  >
                    <CheckCircle2
                      size={22}
                      className="text-brand-700 shrink-0"
                    />

                    <span className="font-semibold text-brand-700 whitespace-nowrap">
                      {item}
                    </span>
                  </div>
                ))}

              </div>

            </div>
          </Reveal>

          {/* ==================== TEXTO ==================== */}

          <Reveal delay={0.1}>
            {/* `mx-auto` + `text-center` mientras el grid es de una sola columna:
                la foto ya venía centrada por su propio `mx-auto` y este bloque
                no, así que el texto quedaba pegado a la izquierda debajo de una
                imagen centrada. De `lg` para arriba vuelve a alinearse a la
                izquierda, que es lo correcto cuando va al lado de la foto.

                El `text-center` también centra el CTA: `CtaButton` es
                `inline-flex`, o sea que lo alinea el `text-align` del padre — no
                hace falta un flex extra. */}
            <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">

              {/* "Publicamos", no "Publicá": el mensaje es que la inmobiliaria
                  se encarga del trabajo, no que el propietario haga el trámite.
                  El párrafo de abajo se reescribió entero por lo mismo — decía
                  "Publicala en pocos minutos", que devolvía la tarea al dueño y
                  contradecía el título nuevo.

                  ⚠️ La escala tipográfica es LA MISMA que la de
                  `SectionHeading` (`text-3xl sm:text-4xl md:text-5xl`), el
                  encabezado que usan las otras cinco secciones. Acá estaba
                  clavada en `text-5xl`: en escritorio coincidía, pero en mobile
                  este título entraba con 48px mientras todos los demás de la
                  landing entraban con 30px, y encima comía casi 200px de alto.
                  Igual el párrafo, que ahora sigue el `text-base md:text-lg` del
                  mismo componente y recupera su `text-xl` recién en `lg`. */}
              <h2 className="text-3xl leading-[1.08] font-bold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">

                Publicamos tu propiedad para

                <br />

                <span className="text-brand-700">
                  alquiler o venta
                </span>

              </h2>

              <p className="mt-4 text-base leading-relaxed text-ink-600 md:text-lg lg:mt-8 lg:text-xl">
                Contanos qué querés vender o alquilar y nos ocupamos del resto:
                armamos el aviso, lo revisamos y lo mostramos a compradores e
                inquilinos reales para aumentar tus posibilidades.
              </p>

              <div className="mt-8 lg:mt-10">
                <CtaButton
                  href="/publicar"
                  variant="primary"
                  icon={
                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover/cta:translate-x-1"
                    />
                  }
                >
                  Quiero publicar mi propiedad
                </CtaButton>
              </div>

            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}