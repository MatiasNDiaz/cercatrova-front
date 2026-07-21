import { GoogleProvider } from '@/modules/auth/components/GoogleProvider';

/**
 * Layout del grupo de rutas `(auth)` — /login y /register.
 *
 * Su única responsabilidad es montar el provider de Google OAuth acá y no en el
 * layout raíz, para que el script de Google Identity Services se cargue solo en
 * las dos páginas que lo usan.
 *
 * El navbar y el footer se ocultan en estas rutas desde `NavbarSelector` y
 * `FooterSelector` (ver Bloque H): una pantalla de login a dos columnas no
 * quiere el footer completo debajo, y los links del navbar público hacen scroll
 * a secciones que solo existen en la landing.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <GoogleProvider>{children}</GoogleProvider>;
}
