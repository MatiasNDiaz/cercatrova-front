'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID as CLIENT_ID } from '@/modules/shared/lib/env';

/**
 * Provider de Google OAuth (Bloque H).
 *
 * Se monta SOLO en el grupo de rutas `(auth)` — no en el layout raíz — porque
 * el login con Google se usa únicamente en `/login` y `/register`. Envolver
 * toda la app cargaría el script de Google Identity Services en cada página
 * (incluida la landing), sin ninguna necesidad.
 *
 * Está separado del `layout.tsx` para que ese layout pueda seguir siendo Server
 * Component: `GoogleOAuthProvider` usa hooks y necesita ejecutarse en el cliente.
 *
 * Si `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no está definida, igual se renderizan los
 * hijos: los formularios siguen funcionando con email + contraseña y el botón
 * de Google simplemente no aparece (ver `GoogleAuthButton`).
 */

/** Re-export para no romper los imports existentes; la fuente es `shared/lib/env`. */
export const GOOGLE_CLIENT_ID = CLIENT_ID;

export function GoogleProvider({ children }: { children: React.ReactNode }) {
  if (!GOOGLE_CLIENT_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID no está definida: el botón "Continuar con Google" no se va a mostrar.'
      );
    }
    return <>{children}</>;
  }

  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}

export default GoogleProvider;
