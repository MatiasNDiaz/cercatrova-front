'use client';

import PostForm from '../PostForm';

/**
 * Alta de una Publicación.
 *
 * El formulario vive en `PostForm` (compartido con la edición): galería de
 * imágenes y videos con orden, más el texto. Antes esta página era el
 * formulario completo, limitado a UNA sola imagen.
 */
export default function NuevaPublicacionPage() {
  return <PostForm />;
}
