'use client';

import { MessageSquare } from 'lucide-react';
import { CategoriaNotificaciones } from '../CategoriaNotificaciones';

export default function Page() {
  return (
    <CategoriaNotificaciones
      tipo="comentario"
      titulo="Comentarios"
      descripcion="Comentarios que los usuarios dejaron en las propiedades del catálogo."
      icono={<MessageSquare size={20} />}
      colorFondo="bg-purple-50 text-purple-600"
    />
  );
}
