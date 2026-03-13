// Datos que llegan del backend en /auth/me y /auth/login
export interface AuthUser {
  id: number;
  email: string;
  role: 'user' | 'admin';
  name: string;
  surname: string;
  phone: string;
  photo?: string;
}

// Lo que retorna el login
export interface LoginResponse {
  message: string;
  user: AuthUser;
}

// Lo que retorna el register
export interface RegisterResponse {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  photo?: string;
}

// Los datos del formulario de login
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