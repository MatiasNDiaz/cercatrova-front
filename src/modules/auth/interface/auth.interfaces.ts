// Tipos de auth — los shapes que devuelve el backend viven en el archivo
// canónico del contrato (@/modules/shared/types/api); acá se re-exportan
// con los nombres que ya usa el resto del código, más los tipos de formulario.
import type { User, LoginResponse, RegisterResponse } from '@/modules/shared/types/api';

// Datos que llegan del backend en /auth/me y /auth/login
export type AuthUser = User;

// Lo que retorna el login
export type { LoginResponse };

// Lo que retorna el register (el backend devuelve el User completo, sin password)
export type { RegisterResponse };

// Los datos del formulario de login (solo lo que acepta LoginDto — el backend
// rechaza con 400 cualquier campo extra por forbidNonWhitelisted)
export interface LoginFormData {
  email: string;
  password: string;
}

// Los datos del formulario de registro
export interface RegisterFormData {
  name: string;
  surname: string;
  phone: string;
  email: string;
  password: string;
}
