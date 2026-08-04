import { notFound } from 'next/navigation';
import PreviewUi from './PreviewUi';

/**
 * `/preview-ui` — vitrina interna del sistema de diseño. **No es parte del
 * producto**: se usó para ver en vivo tokens, `ConfirmDialog` y
 * `Field`/`Input`/`Select` mientras se construían.
 *
 * Estaba saliendo publicada en el sitio real: cualquiera podía abrir
 * `https://<dominio>/preview-ui` y, sin `robots.txt`, Google podía indexarla.
 *
 * Este archivo es un Server Component cuyo único trabajo es cerrar la puerta en
 * producción. `process.env.NODE_ENV` se resuelve en tiempo de build, así que en
 * el bundle de producción esto queda como un `notFound()` incondicional: la
 * ruta responde 404 y nunca llega a renderizar la vitrina.
 *
 * En desarrollo sigue funcionando igual que siempre.
 *
 * Si el rediseño ya está cerrado y no se piensa volver a usar, borrar la
 * carpeta entera es perfectamente válido — este guard sólo la conserva para
 * trabajar localmente.
 */
export default function PreviewUiRoute() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <PreviewUi />;
}
