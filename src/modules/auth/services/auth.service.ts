import api from '@/modules/shared/lib/axios';
import { LoginFormData, LoginResponse, RegisterFormData, RegisterResponse, AuthUser } from '../interface/auth.interfaces';

export const authService = {

  async login(data: LoginFormData): Promise<LoginResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  /**
   * Login/registro con Google (Bloque H).
   *
   * El backend resuelve login y alta en un solo paso: si el email de la cuenta
   * de Google no existe todavía, crea el usuario (con `profileIncomplete: true`,
   * porque queda sin teléfono ni contraseña local). La respuesta es idéntica a
   * la de `/auth/login`, así que el frontend trata ambos flujos igual.
   *
   * Errores propios del endpoint (los muestra `getErrorMessage` tal cual):
   *  - 400 "El idToken de Google es obligatorio"
   *  - 400 "No se pudo verificar el token de Google"
   *  - 401 "El token no fue emitido para esta aplicación" (client ID distinto)
   *  - 401 "El email de la cuenta de Google no está verificado"
   */
  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  },

  async register(data: RegisterFormData): Promise<RegisterResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async getMe(): Promise<AuthUser> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

};