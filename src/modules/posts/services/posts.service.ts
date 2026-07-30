import api from '@/modules/shared/lib/axios';
import type {
  Post, PostComment, PostSortBy, ToggleLikeResponse,
} from '@/modules/shared/types/api';

/**
 * Cliente de la API de Publicaciones.
 *
 * `GET /posts` y `GET /posts/:id/comments` son públicos, pero el backend usa
 * `OptionalJwtAuthGuard`: si la cookie de sesión viaja (axios va con
 * `withCredentials`), la respuesta incluye `likedByMe` y, para el admin,
 * también los comentarios ocultos.
 */
export const postsService = {
  getAll: async (sortBy: PostSortBy = 'recent'): Promise<Post[]> => {
    const { data } = await api.get('/posts', { params: { sortBy } });
    return Array.isArray(data) ? data : [];
  },

  getOne: async (id: number): Promise<Post> => {
    const { data } = await api.get(`/posts/${id}`);
    return data;
  },

  /** Multipart: el DTO va como JSON en el campo `data` y la imagen en `image`. */
  create: async (description: string, image: File): Promise<Post> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({ description }));
    formData.append('image', image);
    // El Content-Type lo setea el browser (con el boundary del multipart); hay
    // que pisar el 'application/json' que trae la instancia de axios.
    const { data } = await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  remove: async (id: number): Promise<{ message: string }> => {
    const { data } = await api.delete(`/posts/${id}`);
    return data;
  },

  toggleLike: async (id: number): Promise<ToggleLikeResponse> => {
    const { data } = await api.post(`/posts/${id}/like`);
    return data;
  },

  getComments: async (postId: number): Promise<PostComment[]> => {
    const { data } = await api.get(`/posts/${postId}/comments`);
    return Array.isArray(data) ? data : [];
  },

  addComment: async (postId: number, content: string): Promise<PostComment> => {
    const { data } = await api.post(`/posts/${postId}/comments`, { content });
    return data;
  },

  // ── Solo admin ──
  replyComment: async (commentId: number, content: string): Promise<PostComment> => {
    const { data } = await api.post(`/posts/comments/${commentId}/reply`, { content });
    return data;
  },

  toggleHideComment: async (
    commentId: number,
  ): Promise<{ id: number; isHidden: boolean; message: string }> => {
    const { data } = await api.patch(`/posts/comments/${commentId}/hide`);
    return data;
  },

  removeComment: async (commentId: number): Promise<{ message: string }> => {
    const { data } = await api.delete(`/posts/comments/${commentId}`);
    return data;
  },
};
