'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import Link from 'next/link';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(5, 'Mínimo 5 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success(`¡Bienvenido de nuevo! ${user?.name || 'Usuario'} Has iniciado sesión exitosamente.`);
    } catch (e) {
      console.assert(e instanceof Error, 'Error desconocido');
      toast.error('Error al iniciar sesión. Verificá tus credenciales e intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    'w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-100';

  return (
    <div className="flex min-h-screen w-full bg-gray-100">

      {/* ── PANEL IZQUIERDO — imagen de fondo ── */}
      <div
        className="hidden  lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          backgroundImage: 'url(/imagenLogin.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Círculos decorativos */}
        <div className="absolute w-96 h-96 rounded-full border border-[#116743] -top-15 -left-15" />
        <div className="absolute w-72 h-72 rounded-full border border-[#1b9763] -top-5 -left-5" />
        <div className="absolute w-80 h-80 rounded-full border border-[#28a16f] -bottom-10 -right-10" />
        <div className="absolute w-56 h-56 rounded-full border border-[#1b9763] bottom-0 right-0" />
        <div className="absolute w-40 h-40 rounded-full bg-[#14965f]/15 top-1/3 right-12" />
        <div className="absolute w-24 h-24 rounded-full bg-[#14965f]/30 bottom-1/4 left-16" />
        <div className="absolute w-16 h-16 rounded-full bg-[#14965f]/10 top-1/4 left-1/3" />

        {/* Contenido centrado */}
        <div></div>
      </div>

      {/* ── PANEL DERECHO — formulario ── */}
      <div className="w-full lg:w-1/2 bg-gray-100 flex items-center justify-center px-6 py-10">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Header */}
          <div className="mb-7 flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold text-[#14965f] tracking-tight">Iniciar sesión</h1>
            <p className="text-sm text-gray-500">Ingresá tu email y contraseña para continuar</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {/* ── Email ── */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-[#14965f] tracking-wide">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </span>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="tucorreo@email.com"
                  className={`${inputBase} ${errors.email ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100' : 'border-gray-200'}`}
                />
              </div>
              {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}
            </div>

            {/* ── Contraseña ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#14965f] tracking-wide">Contraseña</label>
                <Link href="/forgot-password" className="text-xs text-green-600 hover:underline font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                {/* Ícono candado izquierda */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </span>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  className={`${inputBase} pr-10 ${errors.password ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100' : 'border-gray-200'}`}
                />
                {/* Botón ojito derecha */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="text-sm text-red-500">{errors.password.message}</span>}
            </div>

       
            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mt-1 shadow-sm hover:brightness-110 hover:shadow-md active:scale-[0.99]"
              style={{
                background: isLoading ? '#14965f' : 'linear-gradient(135deg, #16a34a, #15803d)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Iniciando sesión...
                </>
              ) : 'Iniciar sesión'}
            </button>

            {/* ── Divider ── */}
            <div className="relative flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400 font-medium">o</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* ── Link registro ── */}
            <p className="text-center text-sm text-gray-500">
              ¿No tenés cuenta?{' '}
              <Link href="/register" className="text-[#14965f] font-semibold hover:underline">
                Registrate gratis
              </Link>
            </p>

          </form>
        </div>
      </div>

    </div>
  );
}