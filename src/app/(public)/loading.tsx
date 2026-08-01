import LoadingPage from '@/modules/landing/components/Loadingpage';

/**
 * Frontera de carga de TODA la zona pública (`/`, `/properties`,
 * `/properties/:id`, `/servicios/:id`, `/publicaciones`).
 *
 * Esto es lo que convierte al loader en un loader de verdad. Un `loading.tsx`
 * de App Router es un `<Suspense>` que React monta mientras el segmento está
 * realmente resolviéndose (el fetch server-side de `page.tsx`, el streaming del
 * HTML) y desmonta apenas termina. No hay temporizador, no hay duración fija:
 * dura exactamente lo que tarda la navegación.
 *
 * Reemplaza al `LoadingWrapper` que envolvía la landing y mostraba la pantalla
 * de carga 2s fijos en cada visita, hubiera algo cargando o no.
 *
 * El propio `LoadingPage` no pinta nada durante sus primeros 250ms, así que las
 * navegaciones rápidas (que son casi todas, con el router cacheado) no llegan a
 * mostrarlo. Ver el comentario de cabecera de ese archivo.
 *
 * ── El `min-h-screen` NO es decorativo ──────────────────────────────────────
 * Arregla el "pantallazo del footer" al cambiar de página.
 *
 * El layout raíz es `<Navbar />{children}<Footer />`. Durante una navegación,
 * `children` pasa a ser este archivo. Y como `LoadingPage` devuelve `null`
 * mientras corre su gate de 250ms — y cuando por fin se muestra es `fixed`, que
 * tampoco ocupa lugar en el flujo — el hueco del contenido quedaba con altura
 * CERO. Resultado: el footer saltaba hasta abajo de la navbar y se veía un
 * instante antes de que apareciera el loader o la página nueva.
 *
 * Este contenedor reserva el alto de la ventana durante toda la transición, así
 * el footer se queda donde estaba: fuera de la pantalla.
 */
export default function PublicLoading() {
  return (
    <div className="min-h-screen">
      <LoadingPage />
    </div>
  );
}
