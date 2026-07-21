import { z } from 'zod';

/**
 * Schemas de validación de los formularios de auth (Bloque H §3).
 *
 * ⚠️ REGLA QUE NO SE TOCA: `password` sigue en **mínimo 5 caracteres**, porque
 * ese es el mínimo real que acepta el backend. Subirlo acá haría que el
 * frontend rechace contraseñas que la API considera válidas — y dejaría fuera
 * a los usuarios ya registrados con 5.
 *
 * Todo lo demás es validación de forma: sirve para dar feedback inmediato, no
 * reemplaza la del backend (que es la que manda).
 */

// Letras (con acentos y ñ) + espacios, apóstrofes y guiones SOLO entre palabras.
// Cubre nombres reales tipo "José María", "D'Angelo", "García-López", y rechaza
// números y símbolos raros. No permite espacios al principio ni al final.
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Dígitos con separadores opcionales: +, espacios, guiones y paréntesis.
const PHONE_SHAPE_REGEX = /^\+?[\d\s\-()]+$/;

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(NAME_REGEX, `El ${label} solo puede contener letras`);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu email')
    .email('Email inválido'),
  password: z.string().min(5, 'Mínimo 5 caracteres'),
});

export const registerSchema = z.object({
  name: nameField('nombre'),
  surname: nameField('apellido'),
  phone: z
    .string()
    .trim()
    .min(1, 'Ingresá tu teléfono')
    .regex(PHONE_SHAPE_REGEX, 'Solo números, espacios, guiones y +')
    // Se cuentan los dígitos reales, ignorando separadores: así "+54 351 387 2817"
    // (12 dígitos) pasa, pero "----" o "+" solo no. El tope de 15 es el máximo
    // de E.164, el estándar internacional de numeración telefónica.
    .refine((v) => {
      const digits = v.replace(/\D/g, '').length;
      return digits >= 8 && digits <= 15;
    }, 'El teléfono debe tener entre 8 y 15 dígitos'),
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu email')
    .email('Email inválido'),
  password: z.string().min(5, 'Mínimo 5 caracteres'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
