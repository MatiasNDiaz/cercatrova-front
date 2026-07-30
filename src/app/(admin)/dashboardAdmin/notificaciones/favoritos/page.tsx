'use client';

import { Heart } from 'lucide-react';
import { CategoriaNotificaciones } from '../CategoriaNotificaciones';

export default function Page() {
  return (
    <CategoriaNotificaciones
      tipo="favorito"
      titulo="Guardadas en favoritos"
      descripcion="Propiedades que los usuarios guardaron en sus favoritos."
      icono={<Heart size={20} />}
      colorFondo="bg-pink-50 text-pink-500"
    />
  );
}
