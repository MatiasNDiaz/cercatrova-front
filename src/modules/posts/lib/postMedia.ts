import type { Post, PostMedia } from '@/modules/shared/types/api';

/**
 * Límites de los medios — los define el BACKEND (`post-media.constants.ts`) y
 * llegan junto con la firma de subida de video. Estos valores son solo el
 * respaldo para validar ANTES de pedir la firma (ej. al elegir el archivo);
 * si el backend los cambia, manda el backend.
 */
export interface PostMediaLimits {
  maxImageBytes: number;
  maxVideoBytes: number;
  videoFormats: readonly string[];
  maxMediaPerPost: number;
  maxVideosPerPost: number;
}

export const DEFAULT_POST_MEDIA_LIMITS: PostMediaLimits = {
  maxImageBytes: 5 * 1024 * 1024,
  maxVideoBytes: 100 * 1024 * 1024,
  videoFormats: ['mp4', 'webm'],
  maxMediaPerPost: 10,
  maxVideosPerPost: 3,
};

/** Respuesta de `POST /posts/media/video-signature`. Nunca trae el secreto. */
export interface VideoUploadSignature {
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
  limits: PostMediaLimits;
}

/** Lo que interesa de la respuesta de Cloudinary a una subida de video. */
export interface UploadedVideo {
  publicId: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  duration: number | null;
}

const VIDEO_MIME: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm' };

export const isVideoFile = (file: File) => file.type.startsWith('video/');

/**
 * Valida un video ANTES de subirlo. No alcanza con la extensión ni con el
 * MIME por separado (los dos los pone el sistema operativo y se pueden
 * renombrar): se exigen los dos y que coincidan. De todos modos es solo la
 * primera barrera — Cloudinary rechaza otro formato por la firma, y el backend
 * verifica formato y peso reales antes de asociar el video.
 */
export function validateVideoFile(file: File, limits: PostMediaLimits = DEFAULT_POST_MEDIA_LIMITS): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const formatos = limits.videoFormats.map((f) => f.toUpperCase()).join(' o ');

  if (!limits.videoFormats.includes(ext) || VIDEO_MIME[ext] !== file.type) {
    return `"${file.name}" no es un video compatible. Usá ${formatos}.`;
  }
  if (file.size > limits.maxVideoBytes) {
    return `"${file.name}" pesa ${formatBytes(file.size)}. El máximo por video es ${formatBytes(limits.maxVideoBytes)}.`;
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Duración en formato reel: "0:42", "1:05". */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || !Number.isFinite(seconds)) return null;
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Medios de una publicación, listos para dibujar.
 *
 * Si el backend todavía no manda `media` (deploy del front antes que la
 * migración), se arma una galería de un elemento con la portada: la
 * publicación se ve igual que antes, en vez de quedar vacía.
 */
export function postMediaList(post: Pick<Post, 'id' | 'imageUrl' | 'createdAt' | 'media'>): PostMedia[] {
  if (post.media && post.media.length > 0) return post.media;
  return [{
    id: -post.id,
    postId: post.id,
    type: 'image',
    url: post.imageUrl,
    publicId: '',
    order: 0,
    posterUrl: null,
    width: null,
    height: null,
    duration: null,
    createdAt: post.createdAt,
  }];
}

/**
 * Relación de aspecto CSS de un medio, si se conoce. Permite reservar el alto
 * real antes de que cargue (sin saltos de layout) y respetar videos verticales
 * y horizontales sin deformarlos.
 */
export function mediaAspectRatio(m: Pick<PostMedia, 'width' | 'height'>): string | undefined {
  return m.width && m.height ? `${m.width} / ${m.height}` : undefined;
}
