'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/modules/auth/services/auth.service';
import { setOnUnauthorized } from '@/modules/shared/lib/authEvents';
import { getErrorStatus } from '@/modules/shared/lib/apiError';
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
      router.push('/login');
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

    if (authUser.role === 'admin') {
      router.push('/dashboardAdmin/');
    } else {
      router.push('/dashboard');
    }

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
    setUser(null);
    router.push(redirectTo);
  };

  const register = async (data: RegisterFormData) => {
    await authService.register(data);
    router.push('/login'); // después de registrarse, va al login
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
