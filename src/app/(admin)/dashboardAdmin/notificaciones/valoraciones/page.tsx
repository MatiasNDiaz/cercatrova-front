'use client';

import { Star } from 'lucide-react';
import { CategoriaNotificaciones } from '../CategoriaNotificaciones';

export default function Page() {
  return (
    <CategoriaNotificaciones
      tipo="valoracion"
      titulo="Valoraciones"
      descripcion="Puntuaciones que los usuarios le pusieron a las propiedades."
      icono={<Star size={20} />}
      colorFondo="bg-amber-50 text-amber-500"
    />
  );
}
