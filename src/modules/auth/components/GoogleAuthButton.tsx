'use client';

import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { GOOGLE_CLIENT_ID } from './GoogleProvider';

/**
 * Botón "Continuar con Google" (Bloque H).
 *
 * ⚠️ POR QUÉ SE USA EL BOTÓN PREARMADO Y NO UNO CUSTOM CON `useGoogleLogin`:
 * el backend (`POST /auth/google`) espera un **idToken** (un JWT de OpenID que
 * verifica con google-auth-library). Según los tipos de la propia librería:
 *   - `GoogleLogin` → `CredentialResponse.credential` = "the returned ID token" ✅
 *   - `useGoogleLogin({ flow: 'implicit' })`  → `access_token`  ❌ (no sirve)
 *   - `useGoogleLogin({ flow: 'auth-code' })` → `code`, que requiere un
 *     intercambio server-side que este frontend no hace ❌
 * O sea que un botón totalmente custom es **técnicamente incompatible** con el
 * contrato actual, no una preferencia estética. Se usa `GoogleLogin` y se lo
 * configura con las opciones que sí expone (tema, forma, ancho, texto, locale).
 *
 * Como Google renderiza ese botón dentro de un iframe, su alto/tipografía no
 * se pueden pisar con CSS: el contenedor de abajo iguala el ancho al del resto
 * del formulario para que no quede desalineado.
 *
 * Maneja los 4 errores propios del endpoint vía `getErrorMessage`, igual que el
 * login tradicional: 400 idToken obligatorio / 400 no se pudo verificar /
 * 401 token de otra aplicación / 401 email no verificado.
 */

interface GoogleAuthButtonProps {
  /** Texto del botón de Google. */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  /** Se llama cuando arranca o termina el intercambio, para bloquear el form. */
  onLoadingChange?: (loading: boolean) => void;
}

export function GoogleAuthButton({
  text = 'continue_with',
  onLoadingChange,
}: GoogleAuthButtonProps) {
  const { loginWithGoogle } = useAuth();
  const [isExchanging, setIsExchanging] = useState(false);

  // Sin client ID configurado el botón no se monta; el formulario tradicional
  // sigue funcionando igual.
  if (!GOOGLE_CLIENT_ID) return null;

  const handleSuccess = async (credential?: string) => {
    if (!credential) {
      toast.error('Google no devolvió un token válido. Intentá de nuevo.');
      return;
    }

    setIsExchanging(true);
    onLoadingChange?.(true);
    try {
      await loginWithGoogle(credential);
      // El redirect por rol y el aviso de perfil incompleto los hace
      // AuthContext, igual que en el login tradicional.
      toast.success('¡Bienvenido! Iniciaste sesión con Google.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsExchanging(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* `colorScheme: 'light'` evita que el iframe de Google herede un tema
          oscuro del sistema y quede ilegible sobre la tarjeta blanca. */}
      <div
        className="flex w-full justify-center [&>div]:w-full [&_iframe]:mx-auto"
        style={{ colorScheme: 'light' }}
      >
        {/* Nota: esta versión de la librería no expone `locale`; el botón toma
            el idioma del navegador, que para el público objetivo es español. */}
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            handleSuccess(credentialResponse.credential);
          }}
          onError={() => {
            toast.error('No se pudo conectar con Google. Intentá de nuevo.');
          }}
          text={text}
          theme="outline"
          size="large"
          shape="rectangular"
          width="380"
        />
      </div>

      {/* Overlay mientras se canjea el token contra nuestro backend. */}
      {isExchanging && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-white/80 text-sm font-semibold text-ink-600 backdrop-blur-[1px]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-brand-700" />
          Verificando con Google...
        </div>
      )}
    </div>
  );
}

export default GoogleAuthButton;
