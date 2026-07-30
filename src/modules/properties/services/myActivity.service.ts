import api from '@/modules/shared/lib/axios';
import type { Property } from '@/modules/shared/types/api';

/**
 * "Mi actividad": las propiedades con las que el usuario logueado interactuó.
 *
 * El id del usuario nunca viaja en la URL — sale del token en el backend.
 */

export interface MyRating {
  id: number;
  score: number;
  property: Property;
}

export interface MyComment {
  id: number;
  message: string;
  isHidden: boolean;
  created_at: string;
  property: Property;
}

export const myActivityService = {
  /** Propiedades que el usuario valoró (`GET /ratings/mine`). */
  getMyRatings: async (): Promise<MyRating[]> => {
    const { data } = await api.get('/ratings/mine');
    return Array.isArray(data) ? data : [];
  },

  /** Propiedades que el usuario comentó (`GET /my-comments`). */
  getMyComments: async (): Promise<MyComment[]> => {
    const { data } = await api.get('/my-comments');
    return Array.isArray(data) ? data : [];
  },
};
