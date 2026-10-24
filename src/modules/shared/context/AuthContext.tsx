'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { authService } from '@/modules/auth/services/auth.service';
import { setOnUnauthorized } from '@/modules/shared/lib/authEvents';
import { clearPendingNotifMarks } from '@/modules/shared/lib/pendingNotifSession';
import { getErrorStatus } from '@/modules/shared/lib/apiError';
import {
  getCurrentReturnPath, loginUrlFromHere, withCurrentReturn, withExpiredFlag,
} from '@/modules/shared/lib/returnTo';
import type { AuthUser, LoginFormData, RegisterFormData } from '@/modules/auth/interface/auth.interfaces';

/**
 * Estado de la sesión.
 *
 *  - `loading`: todavía no respondió `/auth/me`.
 *  - `authenticated`: hay usuario.
 *  - `unauthenticated`: el backend dijo 401 — no hay sesión o la que había ya
 *    no sirve (vencida/revocada). En ese caso el backend también BORRÓ la
 *    cookie (ver `stale-session.ts` en el backend).
 *  - `error`: el backend NO respondió bien (red caída, timeout, 5xx, 429). NO
 *    es "sin sesión": la sesión puede estar perfecta. Los paneles muestran
 *    "No pudimos conectar" con Reintentar, sin cerrar la sesión.
 *
 * ── El bug que resuelve (pantalla en blanco del admin) ──────────────────────
 * Antes `checkSession` trataba CUALQUIER error de `/auth/me` como "no
 * logueado". Con una cookie revocada (cerró sesión en otro dispositivo) o con
 * el backend lento/caído, el panel recibía `user = null`, no dibujaba NADA
 * (`return null`) y mandaba a `/login`; el middleware, que solo decodifica la
 * cookie, lo rebotaba de vuelta al panel. Pantalla en blanco hasta borrar las
 * cookies a mano.
 */
export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthContextType {
  user: AuthUser | null;
  /** `true` solo mientras `status === 'loading'` (compatibilidad con el código existente). */
  isLoading: boolean;
  status: SessionStatus;
  /**
   * `true` si el backend avisó que la sesión que traía el navegador ya no sirve
   * (cabecera `X-Session-Expired`). Los paneles mandan al login con el
   * mensaje "Tu sesión expiró".
   */
  sessionExpired: boolean;
  /** Vuelve a consultar `/auth/me` (botón "Reintentar" de "No pudimos conectar"). */
  retrySession: () => Promise<void>;
  login: (data: LoginFormData) => Promise<AuthUser>;
  /** Login/registro con Google (Bloque H). Recibe el idToken de Google. */
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  logout: (redirectTo?: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Solo en desarrollo: deja rastro en consola de por qué falló la sesión. */
function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV !== 'production') console.warn('[auth]', ...args);
}

/**
 * Limpia TODO lo de la sesión anterior que vive en el navegador (además de la
 * cookie, que la borra el backend): marcas del aviso de notificaciones
 * pendientes y demás `sessionStorage` de la app (borradores de formularios).
 * Se usa al cerrar sesión y al iniciar sesión con OTRA cuenta.
 */
function clearLocalSessionData() {
  clearPendingNotifMarks();
  try {
    sessionStorage.clear();
  } catch {
    /* sessionStorage puede no estar disponible (modo privado estricto). */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();
  /** Evita bucles de redirección si llegan varios 401 seguidos. */
  const lastUnauthorizedAt = useRef(0);

  const checkSession = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      setSessionExpired(false);
      setStatus('authenticated');
    } catch (error) {
      const code = getErrorStatus(error);
      if (code === 401 || code === 403) {
        // Sin sesión, o sesión vencida/revocada (que el backend ya borró).
        const expired =
          isAxiosError(error) && error.response?.headers?.['x-session-expired'] === '1';
        if (expired) devLog('El backend rechazó la sesión guardada y borró la cookie.');
        setUser(null);
        // "Pegajoso": si dos consultas salen juntas, la primera borra la cookie
        // y la segunda vuelve sin la cabecera; no debe pisar el aviso.
        setSessionExpired((prev) => prev || expired);
        setStatus('unauthenticated');
      } else {
        // Red caída, timeout, 5xx o 429: NO es "sin sesión".
        devLog('No se pudo verificar la sesión (no es un 401):', code ?? error);
        setUser(null);
        setStatus('error');
      }
    }
  }, []);

  // Al montar la app, verificamos si hay sesión activa.
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const retrySession = useCallback(async () => {
    setStatus('loading');
    await checkSession();
  }, [checkSession]);

  // Sesión expirada/revocada detectada por el interceptor de axios (401 en
  // cualquier endpoint que no sea /auth/*): limpiamos el estado y vamos a /login.
  useEffect(() => {
    setOnUnauthorized(() => {
      // Protección contra bucles: varios requests en paralelo pueden dar 401 a
      // la vez; se redirige una sola vez, y nunca estando ya en el login.
      const now = Date.now();
      if (now - lastUnauthorizedAt.current < 3000) return;
      lastUnauthorizedAt.current = now;

      setUser(null);
      setSessionExpired(true);
      setStatus('unauthenticated');
      if (window.location.pathname.startsWith('/login')) return;
      toast.error('Tu sesión expiró. Iniciá sesión de nuevo.');
      // Se recuerda dónde estaba: una sesión que vence en medio de algo es
      // justamente el caso donde volver al mismo lugar más importa.
      router.push(withExpiredFlag(loginUrlFromHere()));
    });
    return () => setOnUnauthorized(null);
  }, [router]);

  /**
   * Todo lo que pasa después de una autenticación exitosa, sin importar por qué
   * vía se logueó el usuario: setear el estado, redirigir según el rol y avisar
   * si el perfil quedó incompleto.
   *
   * Está extraído a propósito para que `login` (email + password) y
   * `loginWithGoogle` no puedan divergir: cualquier cambio de comportamiento
   * post-login aplica a los dos flujos automáticamente.
   */
  const handleAuthSuccess = (authUser: AuthUser) => {
    // Si antes había OTRA cuenta en este navegador, no arrastrar nada suyo.
    if (user && user.id !== authUser.id) clearLocalSessionData();
    clearPendingNotifMarks();

    setUser(authUser);
    setSessionExpired(false);
    setStatus('authenticated');

    /**
     * Si el usuario llegó al login porque quiso hacer algo que requiere sesión
     * (dar favorito, publicar…), vuelve EXACTAMENTE ahí en vez de aterrizar en
     * el dashboard. `getCurrentReturnPath` valida que sea una ruta interna; eso
     * es lo que evita que esto sea un open redirect. Ver `returnTo.ts`.
     *
     * ⚠️ EL DESTINO GANA SIEMPRE, TAMBIÉN PARA EL ADMIN (el rol solo decide el
     * destino POR DEFECTO). El middleware conserva su chequeo de rol y el
     * backend valida cada request.
     */
    const returnTo = getCurrentReturnPath();
    const dashboardPorRol = authUser.role === 'admin' ? '/dashboardAdmin/' : '/dashboard';

    router.push(returnTo ?? dashboardPorRol);

    // Usuario creado vía Google: queda sin teléfono ni contraseña local.
    if (authUser.profileIncomplete) {
      toast.info('Tu perfil está incompleto: agregá tu teléfono y una contraseña desde "Editar Perfil".', {
        duration: 8000,
      });
    }

    return authUser;
  };

  const login = async (data: LoginFormData) => {
    const response = await authService.login(data);
    return handleAuthSuccess(response.user);
  };

  const loginWithGoogle = async (idToken: string) => {
    const response = await authService.loginWithGoogle(idToken);
    return handleAuthSuccess(response.user);
  };

  const logout = async (redirectTo: string = '/') => {
    try {
      await authService.logout();
    } catch (error) {
      // 401 = la sesión ya estaba cerrada/revocada en el backend → éxito silencioso.
      // Cualquier otro error tampoco debe dejar al usuario "atrapado" logueado:
      // se limpia igual, y se intenta al menos borrar la cookie local.
      if (getErrorStatus(error) !== 401) {
        console.error('Error al cerrar sesión en el servidor:', error);
        await authService.clearSession().catch(() => {});
      }
    }
    // Logout completo: nada de la sesión anterior queda en el navegador.
    clearLocalSessionData();

    setUser(null);
    setSessionExpired(false);
    setStatus('unauthenticated');
    router.push(redirectTo);
  };

  const register = async (data: RegisterFormData) => {
    await authService.register(data);
    // Después de registrarse va al login, arrastrando el destino: si llegó acá
    // desde "dar favorito" y no tenía cuenta, tiene que volver a la propiedad
    // al terminar, no aterrizar en el dashboard.
    router.push(withCurrentReturn('/login'));
  };

  const updateUser = (data: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === 'loading',
        status,
        sessionExpired,
        retrySession,
        login,
        loginWithGoogle,
        logout,
        register,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// EL HOOK — para consumir el contexto fácil desde cualquier componente
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
