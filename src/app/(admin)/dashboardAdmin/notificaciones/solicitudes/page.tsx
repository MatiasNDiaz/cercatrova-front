'use client';

import { ClipboardList } from 'lucide-react';
import { CategoriaNotificaciones } from '../CategoriaNotificaciones';

export default function Page() {
  return (
    <CategoriaNotificaciones
      tipo="nueva_solicitud"
      titulo="Solicitudes de publicación"
      descripcion="Usuarios que enviaron una propiedad para que la publiques. Gestionalas desde la sección Solicitudes."
      icono={<ClipboardList size={20} />}
      colorFondo="bg-blue-50 text-blue-600"
    />
  );
}
