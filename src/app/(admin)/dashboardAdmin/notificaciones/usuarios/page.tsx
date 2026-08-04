'use client';

import { UserPlus } from 'lucide-react';
import { CategoriaNotificaciones } from '../CategoriaNotificaciones';

export default function Page() {
  return (
    <CategoriaNotificaciones
      tipo="nuevo_usuario"
      titulo="Usuarios registrados"
      descripcion="Cada vez que alguien crea una cuenta en el sitio, el aviso aparece acá."
      icono={<UserPlus size={20} />}
      colorFondo="bg-white text-[#0b7a4b]"
    />
  );
}
