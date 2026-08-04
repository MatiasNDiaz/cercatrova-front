import type { Metadata } from 'next';
import { ArrowRight, Building2, Compass } from 'lucide-react';
import { CtaButton } from '@/modules/landing/components/CtaButton';
import { StatusScreen } from '@/modules/shared/ui/StatusScreen';

/**
 * 404 global — convención de Next.js (`app/not-found.tsx`).
 *
 * Cubre dos casos:
 *  · Una URL que no corresponde a ninguna ruta (`/cualquier-cosa`).
 *  · Un `notFound()` disparado desde una página — por ejemplo una propiedad
 *    borrada o una publicación vencida (ver `generateMetadata` en
 *    `properties/[id]` y `publicaciones/[id]`, que son las que además se
 *    encargan de que el status HTTP sea 404 de verdad y no un soft 404).
 *
 * Antes no existía este archivo, así que Next servía su pantalla por defecto:
 * "404 | This page could not be found", en inglés, sin estilos y sin ninguna
 * salida más que el botón de atrás del navegador.
 *
 * `robots: noindex` para que un 404 que llegue a ser rastreado no compita en el
 * índice con las páginas reales.
 */
export const metadata: Metadata = {
  title: 'Página no encontrada | Cerca Trova',
  description: 'La página que buscás no existe o fue movida.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      eyebrow="Página no encontrada"
      icon={<Compass size={34} strokeWidth={1.75} />}
      title={
        <>
          Esta página <span className="text-brand-700">no existe</span>
        </>
      }
      message="Puede que el link esté mal escrito, que la propiedad ya no esté publicada, o que la publicación haya vencido. Desde acá volvés al camino."
      actions={
        <>
          <CtaButton
            href="/"
            variant="primary"
            icon={<ArrowRight size={18} className="transition-transform duration-300 group-hover/cta:translate-x-1" />}
          >
            Volver al inicio
          </CtaButton>
          <CtaButton href="/properties" variant="outlineDark" icon={<Building2 size={18} />}>
            Ver propiedades
          </CtaButton>
        </>
      }
      footer="Las publicaciones del feed se eliminan automáticamente a los 7 días."
    />
  );
}
