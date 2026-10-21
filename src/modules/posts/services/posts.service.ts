import axios from 'axios';
import api from '@/modules/shared/lib/axios';
import type {
  Post, PostComment, PostSortBy, ToggleLikeResponse,
} from '@/modules/shared/types/api';
import type { UploadedVideo, VideoUploadSignature } from '../lib/postMedia';

/**
 * Un lugar de la galería, tal como lo espera el backend (`PostMediaSlotDto`).
 * La lista completa describe el resultado final, en orden.
 */
export type PostMediaSlot =
  | { kind: 'existing'; id: number }
  | { kind: 'image'; index: number }
  | { kind: 'video'; publicId: string };

/**
 * Arma el multipart de crear/editar: las imágenes NUEVAS van como archivos en
 * `images` (en el orden de `newImages`) y la galería en `data.media`, donde
 * cada `{ kind: 'image', index }` apunta a una de ellas.
 */
function mediaFormData(data: Record<string, unknown>, newImages: File[]) {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));
  for (const file of newImages) formData.append('images', file);
  return formData;
}

/**
 * Sin `Content-Type` propio: lo pone el browser, con el boundary del
 * multipart. Hay que borrar el 'application/json' que trae la instancia (ver
 * la nota de multipart en CLAUDE.md). Y sin el timeout de 15s de la instancia:
 * subir 10 imágenes a Cloudinary desde el backend puede llevar más que eso.
 */
const MULTIPART = { headers: { 'Content-Type': undefined }, timeout: 120_000 };

/** Campos del formulario de comentario de un visitante sin sesión. */
export interface GuestFields {
  guestName?: string;
  /** Honeypot anti-bots (campo oculto). Vacío en un envío humano. */
  website?: string;
}

/** Solo se mandan los campos con contenido (el backend rechaza campos desconocidos, no vacíos). */
const guestBody = (g?: GuestFields) => ({
  ...(g?.guestName?.trim() ? { guestName: g.guestName.trim() } : {}),
  ...(g?.website ? { website: g.website } : {}),
});

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

  /** Crear. Multipart: `data` = { description, media } + archivos en `images`. */
  create: async (description: string, media: PostMediaSlot[], newImages: File[]): Promise<Post> => {
    const { data } = await api.post('/posts', mediaFormData({ description, media }, newImages), MULTIPART);
    return data;
  },

  /**
   * Editar. `media` es la galería FINAL completa: un medio existente que no
   * figure se elimina (de la base y de Cloudinary).
   */
  update: async (id: number, description: string, media: PostMediaSlot[], newImages: File[]): Promise<Post> => {
    const { data } = await api.patch(`/posts/${id}`, mediaFormData({ description, media }, newImages), MULTIPART);
    return data;
  },

  /** Firma de un solo uso para subir UN video directo a Cloudinary (solo admin). */
  getVideoSignature: async (): Promise<VideoUploadSignature> => {
    const { data } = await api.post('/posts/media/video-signature');
    return data;
  },

  /**
   * Sube un video DIRECTO a Cloudinary, sin pasar por nuestro backend: así no
   * lo frenan el proxy de Vercel, el timeout de 15s de la instancia ni la
   * memoria del servidor. Usa `axios` pelado (no la instancia `api`) porque va
   * a otro dominio, sin cookies y sin límite de tiempo.
   *
   * `onProgress` recibe 0..100. `signal` permite cancelar la subida.
   */
  uploadVideo: async (
    file: File,
    sig: VideoUploadSignature,
    onProgress: (pct: number) => void,
    signal: AbortSignal,
  ): Promise<UploadedVideo> => {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', sig.apiKey);
    form.append('timestamp', String(sig.timestamp));
    form.append('signature', sig.signature);
    // Tienen que ser EXACTAMENTE los parámetros firmados, o Cloudinary
    // rechaza la subida ("Invalid Signature").
    form.append('folder', sig.folder);
    form.append('allowed_formats', sig.allowedFormats);

    const { data } = await axios.post(sig.uploadUrl, form, {
      signal,
      onUploadProgress: (e) => {
        if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return {
      publicId: data.public_id,
      secureUrl: data.secure_url,
      width: typeof data.width === 'number' ? data.width : null,
      height: typeof data.height === 'number' ? data.height : null,
      duration: typeof data.duration === 'number' ? data.duration : null,
    };
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

  /**
   * Comentar — con o sin sesión. `guest` solo aplica sin sesión: nombre
   * opcional del visitante y el honeypot (`website`) del formulario.
   */
  addComment: async (postId: number, content: string, guest?: GuestFields): Promise<PostComment> => {
    const { data } = await api.post(`/posts/${postId}/comments`, { content, ...guestBody(guest) });
    return data;
  },

  /** Responder un comentario — abierto a usuarios logueados y a visitantes. */
  replyComment: async (commentId: number, content: string, guest?: GuestFields): Promise<PostComment> => {
    const { data } = await api.post(`/posts/comments/${commentId}/reply`, { content, ...guestBody(guest) });
    return data;
  },

  // ── Solo admin ──

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
