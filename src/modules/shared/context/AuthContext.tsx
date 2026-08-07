'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/modules/auth/services/auth.service';
import { setOnUnauthorized } from '@/modules/shared/lib/authEvents';
import { clearPendingNotifMarks } from '@/modules/shared/lib/pendingNotifSession';
import { getErrorStatus } from '@/modules/shared/lib/apiError';
import { getCurrentReturnPath, loginUrlFromHere, withCurrentReturn } from '@/modules/shared/lib/returnTo';
import type { AuthUser, LoginFormData, RegisterFormData } from '@/modules/auth/interface/auth.interfaces';

// 1. DEFINIMOS QUÉ TIENE EL CONTEXTO
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<AuthUser>;
  /** Login/registro con Google (Bloque H). Recibe el idToken de Google. */
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  logout: (redirectTo?: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}

// 2. CREAMOS EL CONTEXTO
const AuthContext = createContext<AuthContextType | null>(null);

// 3. EL PROVIDER — envuelve toda la app y provee el estado
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 👈 true por defecto, mientras verifica la sesión
  const router = useRouter();

  // Al montar la app, verificamos si hay sesión activa
  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await authService.getMe();
        setUser(userData);
      } catch {
        setUser(null); // 401 → no logueado
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Sesión expirada/revocada detectada por el interceptor de axios (401 en
  // cualquier endpoint que no sea /auth/*): limpiamos el estado y vamos a /login.
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      toast.error('Tu sesión expiró. Iniciá sesión de nuevo.');
      // Se recuerda dónde estaba: una sesión que vence en medio de algo es
      // justamente el caso donde volver al mismo lugar más importa.
      router.push(loginUrlFromHere());
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
    setUser(authUser);

    /**
     * Si el usuario llegó al login porque quiso hacer algo que requiere sesión
     * (dar favorito, valorar, comentar, publicar…), vuelve EXACTAMENTE ahí en
     * vez de aterrizar en el dashboard.
     *
     * El destino se lee de la URL en el momento de resolver el login —no del
     * `useSearchParams` del render— para que valga igual en el flujo de email +
     * contraseña y en el de Google, sin duplicar la lógica en cada uno.
     *
     * `getCurrentReturnPath` valida que sea una ruta interna; eso es lo que
     * evita que esto sea un open redirect. Ver la nota en `returnTo.ts`.
     *
     * ⚠️ EL DESTINO GANA SIEMPRE, TAMBIÉN PARA EL ADMIN.
     *
     * Antes había un `if (role === 'admin')` ANTES de mirar el `callbackUrl`:
     * cualquier admin que llegara al login desde una acción protegida terminaba
     * en `/dashboardAdmin/` y perdía el destino, aunque el parámetro estuviera
     * perfectamente seteado. Se veía como "el callbackUrl no funciona para
     * /publicar" —el síntoma reportado—, pero en realidad fallaba para TODA
     * ruta cuando el que se logueaba era admin, incluidos los enlaces profundos
     * al propio panel (ej. `/dashboardAdmin/propiedades/nueva`).
     *
     * Que un admin siga un `callbackUrl` a una ruta de usuario no abre ningún
     * agujero: el middleware conserva su CAPA 2 (rol) y el backend valida cada
     * request. El rol solo decide el destino POR DEFECTO, cuando no hay ningún
     * lugar al que volver.
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
      // limpiamos el estado local igual.
      if (getErrorStatus(error) !== 401) {
        console.error('Error al cerrar sesión en el servidor:', error);
      }
    }
    // Si el usuario vuelve a entrar en esta misma pestaña, el aviso de
    // notificaciones pendientes tiene que mostrarse otra vez.
    clearPendingNotifMarks();

    setUser(null);
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
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. EL HOOK — para consumir el contexto fácil desde cualquier componente
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
