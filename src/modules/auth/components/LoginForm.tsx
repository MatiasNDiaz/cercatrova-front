'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { loginSchema, type LoginFormValues } from '@/modules/auth/schemas/auth.schemas';
import { AuthShell } from './AuthShell';
import { AuthField, authInput } from './AuthField';
import { GoogleAuthButton } from './GoogleAuthButton';

/**
 * Login (Bloque H).
 *
 * Rediseñado sobre los tokens de la landing y con "Continuar con Google".
 * La lógica de validación (react-hook-form + zod) y el manejo de errores
 * (`getErrorMessage`) se mantienen; los schemas se movieron a
 * `auth/schemas/auth.schemas.ts` para compartirlos con el registro.
 */
export function LoginForm() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const busy = isLoading || googleLoading;

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const loggedUser = await login(data);
      toast.success(`¡Bienvenido de nuevo, ${loggedUser?.name || 'Usuario'}!`);
    } catch (error) {
      // Mensaje real del backend: 401 "Credenciales inválidas",
      // 429 "Demasiados intentos..." (rate limit 5/min), o error de red.
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      image="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop"
      imageAlt="Llaves de una casa nueva sobre una mesa"
      panelTitle={<>Bienvenido de nuevo a <span className="text-brand-500">Cerca Trova</span></>}
      panelText="Accedé a tus favoritos, seguí el estado de tus solicitudes y gestioná tu perfil desde un solo lugar."
      title="Iniciar sesión"
      subtitle="Ingresá tus datos para continuar"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>

        <AuthField label="Email" icon={Mail} error={errors.email?.message} htmlFor="login-email">
          <input
            id="login-email"
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="tucorreo@email.com"
            className={authInput(!!errors.email)}
          />
        </AuthField>

        <AuthField
          label="Contraseña"
          icon={Lock}
          error={errors.password?.message}
          htmlFor="login-password"
          action={
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          }
        >
          <input
            id="login-password"
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Tu contraseña"
            className={authInput(!!errors.password, 'pr-11')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-ink-400 transition-colors hover:text-ink-700"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </AuthField>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-brand-700 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(6,57,35,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-[0_14px_30px_-8px_rgba(6,57,35,0.7)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Iniciando sesión...
            </>
          ) : (
            <>
              <LogIn size={17} />
              Iniciar sesión
            </>
          )}
        </button>

        {/* ── Separador ── */}
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-ink-200" />
          <span className="text-xs font-semibold tracking-wide text-ink-400 uppercase">o</span>
          <span className="h-px flex-1 bg-ink-200" />
        </div>

        <GoogleAuthButton text="signin_with" onLoadingChange={setGoogleLoading} />

        <p className="text-center text-sm text-ink-500">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="font-bold text-brand-700 transition-colors hover:text-brand-800 hover:underline">
            Registrate gratis
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
