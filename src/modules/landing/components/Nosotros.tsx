'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Award, ShieldCheck, HeartHandshake, Handshake, Crown } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';

/**
 * Presentación del agente (Bloque LANDING §5, reformada en la tanda "Conocenos").
 *
 * ⚠️ El efecto de deslizamiento en hover (la tarjeta angosta que se expande y
 * revela la biografía) SE CONSERVA a pedido — es la interacción que define esta
 * sección. Lo que cambió alrededor:
 *
 *  - **Altura compacta (580px).** Venía de 660px y ocupaba demasiado alto. La
 *    altura se recortó SIN apretar el contenido: el panel se ensanchó
 *    (760 → 820px), y con más ancho los párrafos ocupan menos renglones — que es
 *    de donde salía la altura. Expandida mide 1220px = 400 (foto) + 820 (bio).
 *  - **Marca de agua de rey de ajedrez** dentro de la tarjeta de la frase, en
 *    SVG inline (lucide no tiene la pieza), al 7% de opacidad y COMPLETA (no
 *    sangrada contra el borde: recortada perdía la base y dejaba de leerse como
 *    un rey). Mismo patrón que la marca "CT" de `Confianza.tsx`.
 *  - **Los 4 atributos pasaron de píldoras a tarjetas.** Antes eran `flex-wrap`
 *    con anchos distintos según el largo del texto ("Empatía" vs
 *    "Profesionalismo"), así que nunca quedaban alineadas ni parejas. Ahora son
 *    una grilla pareja: 4 columnas en desktop, 2×2 en mobile.
 *  - **Mobile deja de ser una foto muda.** El panel de bio era `hidden lg:flex`,
 *    y como en touch no hay hover, la frase y los 4 atributos eran directamente
 *    inaccesibles abajo de `lg` (se veía la foto y una pastilla "Conoceme" que
 *    no se podía activar). Ahora, debajo de `lg`, la tarjeta es una columna
 *    normal con todo desplegado; el efecto de expansión existe solo en desktop.
 *  - Ancho fijo del panel de bio (`lg:w-[820px] lg:shrink-0`) — ver nota extensa
 *    abajo, es el fix del "cabeceo escalonado" y NO hay que volver a `min-w`.
 */

const imagenes = [
  '/imagenesPapucho/papucho1.jpg',
  '/imagenesPapucho/papucho2.jpg',
  '/imagenesPapucho/papucho3.jpg',
  '/imagenesPapucho/papucho5.jpg',
  '/imagenesPapucho/papucho9.jpg',
  '/imagenesPapucho/papucho6.jpg',
  '/imagenesPapucho/papucho7.jpg',
  '/imagenesPapucho/papucho8.jpg',
];

const tags = [
  { label: 'Empatía', Icon: HeartHandshake },
  { label: 'Carácter', Icon: Award },
  { label: 'Profesionalismo', Icon: ShieldCheck },
  { label: 'Cercanía', Icon: Handshake },
];

export default function Nosotros() {
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % imagenes.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="nosotros" className="overflow-hidden bg-white py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Nuestra historia"
          title={<>Tu aliado en cada <span className="text-brand-700">inversión</span></>}
          subtitle="Pasá el cursor sobre la tarjeta para conocer a quien te acompaña."
        />

        <Reveal>
          {/* `py-4` para que la sombra de la tarjeta y su leve elevación en hover
              tengan lugar donde dibujarse sin que el `overflow-hidden` de la
              sección las recorte. */}
          <div className="flex justify-center py-4">
            {/* ── TARJETA EXPANSIBLE (efecto conservado) ──
                Ancho expandido = 420 (foto en hover) + 760 (bio) = 1180px exactos,
                así no queda ni un píxel de blanco muerto a la derecha. */}
            {/* Debajo de `lg` la tarjeta NO se expande: es una columna normal
                (foto arriba, biografía abajo, todo siempre visible). El efecto
                de hover no existe en touch, así que antes el contenido quedaba
                directamente inaccesible en mobile — se veía solo la foto y una
                pastilla "Conoceme" que no se podía activar. */}
            <div className="group relative flex h-auto w-full max-w-[460px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_-20px_rgba(10,12,11,0.35)] ring-1 ring-ink-100 transition-[max-width,box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:h-[580px] lg:cursor-pointer lg:flex-row lg:hover:max-w-[1220px] lg:hover:shadow-[0_34px_90px_-28px_rgba(6,57,35,0.45)]">

              {/* ── LADO IZQUIERDO: carrusel de fotos ── */}
              <div className="relative h-[400px] w-full shrink-0 overflow-hidden transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:h-full lg:w-[460px] lg:group-hover:w-[400px]">
                {imagenes.map((img, index) => (
                  <div
                    key={img}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === currentImg ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Edgar Díaz — foto ${index + 1}`}
                      fill
                      priority={index === 0}
                      sizes="460px"
                      className="scale-105 object-cover object-center grayscale-[15%] transition-all duration-700 group-hover:scale-100 group-hover:grayscale-0"
                    />
                  </div>
                ))}

                {/* Nombre — en mobile siempre visible (no hay hover); en desktop
                    aparece al expandir la tarjeta. */}
                <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-brand-950/90 via-transparent to-transparent p-9 opacity-100 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100">
                  <h4 className="text-2xl leading-tight font-bold tracking-tight text-white">
                    Edgar Alberto Díaz
                  </h4>
                  <p className="mt-1.5 text-sm font-medium text-white/90">
                    Martillero Público &amp; Corredor Inmobiliario
                  </p>
                </div>

                {/* Pista "Conoceme" — se va en hover. Solo en desktop: en mobile
                    no hay nada que revelar (la bio ya está abajo, desplegada) y
                    la pastilla invitaba a una interacción que no existe. */}
                <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 transition-opacity duration-300 group-hover:opacity-0 lg:block">
                  <span className="rounded-full border border-ink-100 bg-white px-6 py-2.5 text-[11px] font-bold tracking-[0.28em] text-brand-700 uppercase shadow-lg">
                    Conoceme
                  </span>
                </div>
              </div>

              {/* ── LADO DERECHO: biografía ──
                  ⚠️ NO cambiar `w-[760px] shrink-0` por `min-w-*`. Con `min-w` el
                  panel arranca comprimido (la tarjeta mide 460px) y se va
                  ensanchando hasta su ancho natural mientras el contenedor anima:
                  los párrafos se re-wrapean frame a frame, la altura del bloque
                  cambia y `justify-center` lo re-centra en cada recálculo → el
                  texto "cae de a pasos". Con ancho fijo el layout interno es
                  estable desde el primer frame (queda recortado por el
                  `overflow-hidden` del padre hasta que la tarjeta se abre).
                  El delay va solo en `group-hover:` para que al salir el texto se
                  desvanezca de inmediato en vez de quedar colgado mientras la
                  tarjeta ya se está cerrando. */}
              <div className="flex w-full flex-col justify-center gap-5 px-7 py-9 transition-[opacity,transform] delay-0 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-9 lg:w-[820px] lg:shrink-0 lg:translate-x-6 lg:px-14 lg:py-10 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-hover:delay-150">
                <header className="relative">
                  <span className="absolute -left-4 top-0 h-full w-1.5 rounded-full bg-brand-700 lg:-left-7" />
                  <h3 className="text-[1.75rem] leading-[1.12] font-black tracking-tight text-brand-700 lg:text-[2.1rem]">
                    Uniendo familias
                    <br />
                    <span className="text-ink-900">con hogares.</span>
                  </h3>
                </header>

                <div className="space-y-4">
                  <p className="text-[15px] leading-[1.6] text-ink-600">
                    Soy <strong className="font-bold text-ink-900">Edgar Díaz</strong>, Martillero
                    Público y Corredor Inmobiliario graduado en la Universidad{' '}
                    <span className="font-bold text-brand-700">Siglo 21</span>. Elegí esta profesión
                    porque detrás de cada operación hay una historia de vida, y eso merece el máximo
                    compromiso.
                  </p>
                  <p className="text-[15px] leading-[1.6] text-ink-600">
                    Con <strong className="font-bold text-ink-900">más de 7 años en el mercado
                    cordobés</strong>, acompañé a cientos de familias e inversores a tomar decisiones
                    seguras, transparentes y con resultados reales.
                  </p>
                </div>

                {/* ── TARJETA DE LA FRASE ──
                    `overflow-hidden` para que el rey de ajedrez se recorte limpio
                    contra el borde redondeado en vez de desbordar la tarjeta.
                    El hover es sutil y sin desplazamiento: solo se intensifican
                    el fondo, el borde y la marca de agua. Nada de `scale` ni
                    `translate` acá — la tarjeta vive dentro de otra que ya se
                    está animando, y encimar dos transforms se ve nervioso. */}
                <blockquote className="group/quote relative overflow-hidden rounded-2xl border border-brand-100 bg-linear-to-br from-brand-50 to-white py-7 pr-9 pl-7 transition-colors sm:py-7 sm:pr-36 sm:pl-9 duration-500 hover:border-brand-200">
                  {/* Barra de acento */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1.5 rounded-r-full"
                    style={{ background: 'var(--gradient-brand)' }}
                  />

                  {/* Marca de agua: corona (lucide `Crown`).
                      Reemplaza al rey de ajedrez, que era un SVG a medida y
                      terminaba mal: silueta maciza, ajena al trazo del resto de
                      la iconografía. La corona conserva la idea de realeza/premium
                      con el mismo trazo lucide que usa toda la Landing. Va a más
                      opacidad que el rey (12% vs 7%) porque es de TRAZO, no
                      sólida: al 7% no se veía. `sm:pr-36` en la cita le reserva
                      la franja derecha para que nunca se cruce con el texto. */}
                  <Crown
                    aria-hidden
                    size={104}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute top-1/2 right-10 hidden -translate-y-1/2 text-brand-700/12 transition-all duration-500 select-none group-hover/quote:scale-105 group-hover/quote:text-brand-700/20 sm:block"
                  />

                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-5 left-4 font-serif text-[110px] leading-none text-brand-700/10 select-none"
                  >
                    &ldquo;
                  </span>

                  <p className="relative text-lg leading-relaxed font-semibold text-ink-800 italic">
                    Tu tranquilidad es mi trabajo.
                  </p>
                  <footer className="relative mt-2 text-xs font-bold tracking-[0.18em] text-brand-700 uppercase not-italic">
                    Edgar Díaz
                  </footer>
                </blockquote>

                {/* ── 4 ATRIBUTOS — píldoras en una sola fila ──
                    Antes eran tarjetas cuadradas en grilla de 4. Ahora son
                    píldoras `rounded-full`, más anchas que altas, en una única
                    fila (`flex` + `flex-wrap`, así que en mobile bajan solas a 2
                    filas sin romperse). Los 4 labels entran holgados en el ancho
                    del panel, así que en desktop nunca wrapean.
                    El hover eleva 2px y rellena la píldora de verde — solo
                    `transform`/`box-shadow`/color, que no reflowean: sin saltos
                    de layout ni cortes. */}
                <div className="flex flex-wrap justify-center gap-2.5 border-t border-ink-100 pt-6 lg:justify-start">
                  {tags.map(({ label, Icon }) => (
                    <span
                      key={label}
                      className="group/tag inline-flex cursor-default items-center gap-2 rounded-full border border-ink-200 bg-white py-2 pr-5 pl-2 text-[11px] font-bold tracking-widest text-ink-700 uppercase transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-700 hover:bg-brand-700 hover:text-white hover:shadow-[0_10px_24px_-10px_rgba(11,122,75,0.55)]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-colors duration-300 group-hover/tag:bg-white/20 group-hover/tag:text-white">
                        <Icon size={14} />
                      </span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
