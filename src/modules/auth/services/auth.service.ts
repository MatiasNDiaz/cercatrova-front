import api from '@/modules/shared/lib/axios';
import { LoginFormData, LoginResponse, RegisterFormData, RegisterResponse, AuthUser } from '../interface/auth.interfaces';

export const authService = {

  async login(data: LoginFormData): Promise<LoginResponse> {
    const response = await api.post('/auth/login', data);
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