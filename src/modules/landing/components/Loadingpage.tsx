"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";

/**
 * Loader de TRANSICIÓN.
 *
 * ⚠️ **HOY NO ESTÁ MONTADO.** Vivía en `(public)/loading.tsx`, y ese archivo se
 * eliminó a propósito. Motivo: un `loading.tsx` envuelve su segmento **y todos
 * sus hijos** en un `<Suspense>`, así que Next transmite el shell —con la
 * cabecera HTTP ya escrita, status 200— antes de que la página resuelva. Con esa
 * frontera activa, `/properties/:id` y `/publicaciones/:id` devolvían **200 con
 * la pantalla de "no encontrado"** (soft 404) cuando el recurso no existía, y no
 * había forma de arreglarlo desde la página: se probó mover la búsqueda a
 * `generateMetadata()` y tampoco alcanza, porque el shell sale antes.
 *
 * Como `loading.tsx` no se puede acotar para excluir a una ruta hija (padre e
 * hijo comparten el path), la elección era binaria: loader o status correcto.
 * Se eligió el status.
 *
 * **Para volver atrás** —si se decide que el loader vale más que el 404 real—
 * alcanza con recrear `src/app/(public)/loading.tsx` renderizando este
 * componente. El costo medido de tenerlo es +15/25 ms de TTFB menos en las
 * rutas con fetch, y el de sacarlo es que estas dos rutas vuelvan a dar 200.
 *
 * El componente se conserva íntegro (con su escena 3D en `Escena3D.tsx`) porque
 * sigue sirviendo para cualquier frontera de carga futura que NO tenga rutas
 * hijas capaces de devolver 404.
 *
 * ── Qué cambió y por qué ────────────────────────────────────────────────────
 * Antes esto era una pantalla de carga falsa: `Loadingwrapper` la montaba en
 * cada entrada a la home y un `setTimeout` la mantenía 2s exactos mostrando una
 * barra de progreso que contaba de 0 a 100 sin medir absolutamente nada. Se veía
 * siempre, incluso cuando no había nada que esperar, y era 2s de fricción pura
 * entre el usuario y la landing.
 *
 * Ahora este componente NO decide cuándo mostrarse ni cuándo irse: lo monta y lo
 * desmonta el propio router. Vive en los `loading.tsx` de cada segmento de ruta
 * (App Router), que React monta mientras el segmento está realmente cargando y
 * desmonta apenas termina. Si no hay nada que esperar, no se monta.
 *
 * ── El gate de {APPEAR_DELAY_MS}ms ──────────────────────────────────────────
 * Una navegación cacheada tarda ~50ms. Montar un loader a pantalla completa por
 * 50ms es un flash molesto — peor que no mostrar nada. Por eso el componente se
 * monta transparente y no pinta NADA durante los primeros {APPEAR_DELAY_MS}ms.
 *
 * Ojo con la distinción, porque es justo lo que se pidió evitar: esto NO demora
 * la página. La navegación termina cuando termina; lo único que se demora es la
 * aparición del overlay. Navegación rápida → el loader nunca llega a verse.
 * Navegación lenta → aparece y acompaña.
 *
 * La escena 3D tampoco se inicializa hasta pasado el gate: una transición rápida
 * no paga el costo de levantar un contexto WebGL que nadie va a ver.
 */

const FACTS = [
  { emoji: "🏠", titulo: "Casa propia, sueño argentino", texto: "El 73% de los argentinos prefiere vivir en casa propia antes que alquilar." },
  { emoji: "📈", titulo: "Córdoba en alza", texto: "Los departamentos en Córdoba capital aumentaron un 18% de valor en los últimos 2 años." },
  { emoji: "🌍", titulo: "El metro más caro del mundo", texto: "Hong Kong tiene los metros cuadrados más caros del mundo: USD 28.000/m²." },
  { emoji: "🏗️", titulo: "Tiempo de construcción", texto: "Se tarda en promedio 18 meses construir una casa desde el permiso hasta la entrega." },
  { emoji: "🔑", titulo: "Vendé más rápido", texto: "El 60% de las operaciones inmobiliarias se cierran en los primeros 3 meses de publicación." },
  { emoji: "🌿", titulo: "El poder del verde", texto: "Las casas con jardín se venden un 12% más rápido que las sin espacios verdes." },
  { emoji: "📸", titulo: "Fotos que venden", texto: "Propiedades con fotos profesionales reciben 4x más consultas que las sin fotos." },
  { emoji: "💡", titulo: "Luz = valor", texto: "Una buena iluminación puede aumentar hasta un 10% el valor percibido de una propiedad." },
  { emoji: "🏙️", titulo: "Nueva Córdoba lidera", texto: "Nueva Córdoba es el barrio con mayor demanda de alquiler estudiantil de Argentina." },
  { emoji: "📊", titulo: "Precio en Córdoba", texto: "El precio promedio de un departamento en Córdoba capital es de USD 1.800/m²." },
  { emoji: "🤝", titulo: "El boca a boca funciona", texto: "El 45% de las ventas inmobiliarias se realizan a través de recomendaciones." },
  { emoji: "🏆", titulo: "Vivir cerca de plazas", texto: "Las propiedades cerca de plazas o parques valen entre un 8% y 15% más." },
];

/** Halos verdes de fondo. Decorativos: flotan desfasados entre sí. */
const HALOS = [
  { size: 320, top: "-10%", left: "-8%", opacity: 0.15, delay: "0s", dur: "7s" },
  { size: 180, top: "5%", left: "70%", opacity: 0.12, delay: "1s", dur: "5s" },
  { size: 240, top: "65%", left: "78%", opacity: 0.12, delay: "0.5s", dur: "6s" },
  { size: 140, top: "72%", left: "-4%", opacity: 0.12, delay: "1.5s", dur: "4.5s" },
  { size: 90, top: "40%", left: "88%", opacity: 0.1, delay: "2s", dur: "5.5s" },
  { size: 60, top: "20%", left: "15%", opacity: 0.1, delay: "0.8s", dur: "6.5s" },
  { size: 200, top: "80%", left: "40%", opacity: 0.1, delay: "1.2s", dur: "8s" },
];

const APPEAR_DELAY_MS = 250;

/**
 * La escena 3D se carga aparte y sólo cuando hace falta.
 *
 * `three` pesa ~130 kB y entraba en el First Load JS de TODAS las rutas
 * públicas por un import estático (ver la cabecera de `Escena3D.tsx`). Con
 * `next/dynamic` el chunk se descarga recién al montar el componente — y abajo
 * se monta sólo si el gate de aparición ya se abrió.
 *
 * `ssr: false` porque la escena necesita `window` y un `<canvas>` reales.
 */
const Escena3D = dynamic(() => import("./Escena3D"), { ssr: false });

export default function LoadingPage() {
  const [visible, setVisible] = useState(false);
  const [factIndex, setFactIndex] = useState(0);

  // Gate de aparición — ver el comentario de arriba.
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const nextFact = useCallback(() => setFactIndex((i) => (i + 1) % FACTS.length), []);


  // Antes del gate no se pinta nada — ni un fondo, ni un flash blanco.
  if (!visible) return null;

  const fact = FACTS[factIndex];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden bg-surface [animation:loader-in_.28s_ease-out_both]"
    >
      {/* Halos decorativos */}
      {HALOS.map((h, i) => (
        <span
          key={i}
          aria-hidden
          className="loader-halo pointer-events-none absolute rounded-full bg-brand-700"
          style={{
            width: h.size,
            height: h.size,
            top: h.top,
            left: h.left,
            opacity: h.opacity,
            animation: `loader-float ${h.dur} ease-in-out infinite`,
            animationDelay: h.delay,
          }}
        />
      ))}

      {/* ── COLUMNA CENTRAL ──
          Un único contenedor con ancho común para TODOS los bloques (escena,
          textos, barra y tarjeta). Antes cada bloque tenía su propio ancho
          (520 / 460 / 500px) y ninguno coincidía con el de al lado: por eso la
          tarjeta de datos se leía descentrada respecto de la isla. Ahora
          comparten eje y ancho, y el `min-h-0` deja que la columna se comprima
          en pantallas bajas en vez de desbordar. */}
      <div className="relative z-10 flex w-full min-h-0 max-w-[420px] flex-col items-center px-5">

        {/* Escena 3D — se centra sola porque el contenedor la limita. */}
        {visible && <Escena3D className="flex w-full shrink justify-center" />}

        <h1 className="mt-1 text-center text-xl font-extrabold tracking-tight text-brand-800">
          Cargando tu experiencia
        </h1>
        <p className="mt-1 text-center text-[13px] font-medium text-ink-500">
          Preparando todo para vos…
        </p>

        {/* Barra indeterminada — no miente un porcentaje. */}
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
          <div
            className="loader-bar h-full w-full rounded-full [animation:loader-indeterminate_1.4s_cubic-bezier(.65,.05,.36,1)_infinite]"
            style={{ background: "var(--gradient-brand)" }}
          />
        </div>

        {/* ── Tarjeta de datos rotativos ── */}
        <button
          type="button"
          onClick={nextFact}
          aria-label="Ver el siguiente dato"
          className="group mt-6 w-full cursor-pointer overflow-hidden rounded-2xl border border-ink-200 bg-white text-left shadow-[0_4px_20px_-6px_rgba(10,12,11,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-700/40 hover:shadow-[0_14px_34px_-12px_rgba(6,57,35,0.3)] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2 bg-brand-700 px-4 py-2">
            <span className="text-[10px] font-black tracking-[0.16em] text-white uppercase">
              ¿Sabías que…?
            </span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white">
              {factIndex + 1} / {FACTS.length}
            </span>
          </div>

          {/* `key` en el contenido: al cambiar de dato React reemplaza el nodo y
              la animación de entrada se vuelve a disparar sola. Antes esto se
              hacía con dos `setTimeout` encadenados y un flag de opacidad. */}
          <div
            key={factIndex}
            className="flex items-start gap-3.5 px-4 py-4 [animation:loader-fact-in_.3s_ease-out_both]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-2xl">
              {fact.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-ink-900">{fact.titulo}</span>
              <span className="mt-1 block text-xs leading-relaxed font-medium text-ink-500">
                {fact.texto}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-2.5">
            <span className="flex items-center gap-1" aria-hidden>
              {FACTS.map((_, i) => (
                <span
                  key={i}
                  className={`block h-1 rounded-full transition-all duration-300 ${
                    i === factIndex ? "w-4 bg-brand-700" : "w-1 bg-ink-200"
                  }`}
                />
              ))}
            </span>
            <span className="text-[11px] font-semibold text-ink-400 transition-colors group-hover:text-brand-700">
              Tocá para siguiente
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
