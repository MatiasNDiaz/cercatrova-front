'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/modules/auth/services/auth.service';
import type { AuthUser, LoginFormData, RegisterFormData } from '@/modules/auth/interface/auth.interfaces';

// 1. DEFINIMOS QUÉ TIENE EL CONTEXTO
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  logout: () => Promise<void>;
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

  const login = async (data: LoginFormData) => {
    const response = await authService.login(data);
    setUser(response.user);
    router.push('/'); // redirige al home después del login
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    router.push('/'); // redirige al home después del logout
  };

  const register = async (data: RegisterFormData) => {
    await authService.register(data);
    router.push('/login'); // después de registrarse, va al login
  };

  const updateUser = (data: Partial<AuthUser>) => {
  setUser(prev => prev ? { ...prev, ...data } : null);
};

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, updateUser  }}>
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