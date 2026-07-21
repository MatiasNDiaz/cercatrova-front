'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, User, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { registerSchema, type RegisterFormValues } from '@/modules/auth/schemas/auth.schemas';
import { AuthShell } from './AuthShell';
import { AuthField, authInput } from './AuthField';
import { GoogleAuthButton } from './GoogleAuthButton';

/**
 * Registro (Bloque H).
 *
 * El botón de Google también va acá **a propósito**: el backend resuelve login
 * y alta en un solo paso (`POST /auth/google` crea el usuario si el email no
 * existe), así que desde esta pantalla crear la cuenta con Google es un camino
 * legítimo y más corto que completar los 5 campos. La diferencia con el login
 * es solo el texto del botón ("Registrarse con Google").
 *
 * ⚠️ Diferencia de flujo que conviene tener presente: el registro tradicional
 * NO autologuea (AuthContext.register redirige a /login), mientras que el alta
 * con Google sí deja la sesión iniciada y va directo al dashboard. Es el
 * comportamiento del backend, no una inconsistencia del frontend.
 */
export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const busy = isLoading || googleLoading;

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await registerUser(data);
      toast.success('¡Cuenta creada! Ya podés iniciar sesión.');
    } catch (error) {
      // Mensaje real del backend: 400 de validación, 409 email en uso,
      // 429 por rate limit (5/min), o error de red.
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      image="https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1600&auto=format&fit=crop"
      imageAlt="Casa moderna iluminada al atardecer"
      panelTitle={<>Tu próximo hogar <span className="text-brand-300">empieza acá</span></>}
      panelText="Creá tu cuenta para guardar propiedades favoritas, enviar solicitudes de publicación y recibir avisos cuando entre lo que buscás."
      title="Crear cuenta"
      subtitle="Completá tus datos para comenzar"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

        {/* ── Nombre + Apellido ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField label="Nombre" icon={User} error={errors.name?.message} htmlFor="reg-name">
            <input
              id="reg-name"
              {...register('name')}
              autoComplete="given-name"
              placeholder="Tu nombre"
              className={authInput(!!errors.name)}
            />
          </AuthField>

          <AuthField label="Apellido" icon={User} error={errors.surname?.message} htmlFor="reg-surname">
            <input
              id="reg-surname"
              {...register('surname')}
              autoComplete="family-name"
              placeholder="Tu apellido"
              className={authInput(!!errors.surname)}
            />
          </AuthField>
        </div>

        <AuthField label="Teléfono" icon={Phone} error={errors.phone?.message} htmlFor="reg-phone">
          <input
            id="reg-phone"
            {...register('phone')}
            type="tel"
            autoComplete="tel"
            placeholder="+54 351 000 0000"
            className={authInput(!!errors.phone)}
          />
        </AuthField>

        <AuthField label="Email" icon={Mail} error={errors.email?.message} htmlFor="reg-email">
          <input
            id="reg-email"
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="tucorreo@email.com"
            className={authInput(!!errors.email)}
          />
        </AuthField>

        <AuthField label="Contraseña" icon={Lock} error={errors.password?.message} htmlFor="reg-password">
          <input
            id="reg-password"
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Mínimo 5 caracteres"
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
              Creando cuenta...
            </>
          ) : (
            <>
              <UserPlus size={17} />
              Crear cuenta
            </>
          )}
        </button>

        {/* ── Separador ── */}
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-ink-200" />
          <span className="text-xs font-semibold tracking-wide text-ink-400 uppercase">o</span>
          <span className="h-px flex-1 bg-ink-200" />
        </div>

        <GoogleAuthButton text="signup_with" onLoadingChange={setGoogleLoading} />

        <p className="text-center text-sm text-ink-500">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-bold text-brand-700 transition-colors hover:text-brand-800 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
