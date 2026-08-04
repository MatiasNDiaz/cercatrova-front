// ✅ Server Component puro — sin "use client", sin async issues
import { PropertySlider } from '@/modules/landing/components/Slider';
import FeaturedProperties from '@/modules/landing/components/Featuredproperties';
import PublicarPropiedad from '@/modules/landing/components/PublicarPropiedad';
import Servicios from '@/modules/landing/components/Servicios';
import Confianza from '@/modules/landing/components/Confianza';
import Resenas from '@/modules/landing/components/Reseñas';
import Nosotros from '@/modules/landing/components/Nosotros';
import RealEstateFAQ from '@/modules/landing/components/RealEstateFAQ';

/**
 * Regeneración incremental (ISR) — cada 5 minutos.
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 * Esta página se prerenderizaba como estática pura. `FeaturedProperties` hace
 * su fetch en tiempo de BUILD y el resultado quedaba horneado en el HTML para
 * siempre: si la API estaba caída en ese momento, el `catch` devolvía `[]` y el
 * sitio servía "No hay propiedades disponibles en este momento" de forma
 * permanente, aunque el backend estuviera perfecto en producción. Y en el mejor
 * caso, las destacadas quedaban congeladas en los valores del build: no
 * reflejaban altas, bajas ni cambios de valoración hasta el próximo deploy.
 *
 * ── Por qué `revalidate` y no `force-dynamic` ───────────────────────────────
 * `force-dynamic` haría SSR en CADA request: la landing es la ruta de más
 * tráfico del sitio, así que cada visitante pagaría una llamada a la API y la
 * página iría tan lenta como el backend. El contenido dinámico son 4
 * propiedades destacadas que cambian cuando se carga, se vende o se valora una
 * propiedad — no necesita ser fresco al segundo.
 *
 * Con ISR se sirve desde caché (rápido y barato) y se regenera en segundo plano
 * como mucho cada 5 minutos. El efecto secundario importante: un build hecho
 * con la API caída **se corrige solo** en la primera revalidación, en vez de
 * quedar roto hasta el próximo deploy.
 */
export const revalidate = 300;

/**
 * Landing (Bloque LANDING).
 *
 * Ritmo vertical: cada sección define su propio `py-24 md:py-28` (padding
 * simétrico arriba y abajo) en vez de que la página imponga márgenes entre
 * hermanas. Es la práctica estándar hoy y tiene dos ventajas concretas:
 *  - la separación entre dos secciones cualesquiera es siempre la misma,
 *    porque resulta de sumar el padding inferior de una y el superior de la
 *    siguiente — no depende del orden en que estén montadas;
 *  - cada sección es autocontenida: se puede reordenar, quitar o reutilizar
 *    sin arrastrar márgenes ajenos ni dejar huecos.
 *
 * Los fondos alternan blanco / `surface-mint` (y el verde profundo en Confianza)
 * para que cada bloque se lea como una unidad distinta sin necesidad de líneas
 * divisorias. Por eso `main` no lleva color de fondo propio.
 *
 * La landing ya NO va envuelta en `LoadingWrapper`: esa pantalla de carga se
 * mostraba 2s fijos en cada visita sin que hubiera nada cargando. El loader
 * ahora vive en `(public)/loading.tsx` y lo controla el router.
 */
export default function LandingPage() {
  return (
    <main id="inicio" className="min-h-screen">
      <PropertySlider />
      <FeaturedProperties />
      <PublicarPropiedad />
      <Servicios />
      <Confianza />
      <Resenas />
      <Nosotros />
      <RealEstateFAQ />
    </main>
  );
}
