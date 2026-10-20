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

/**
 * Extensiones que se reconocen como VIDEO (aunque no todas se acepten): sirve
 * para que un `.mov` reciba el aviso "formato no compatible" y no el de "no es
 * una imagen".
 */
const KNOWN_VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', '3gp', 'avi', 'mkv'];

const extOf = (file: File) => file.name.split('.').pop()?.toLowerCase() ?? '';

/**
 * ⚠️ No alcanza con `file.type`: en Windows, un video bajado de WhatsApp Web
 * (u otro sistema sin la asociación de la extensión) llega con `type === ''`.
 * Antes eso lo clasificaba como imagen y el formulario lo rechazaba.
 */
export const isVideoFile = (file: File) =>
  file.type.startsWith('video/') || KNOWN_VIDEO_EXT.includes(extOf(file));

/** Tipos MIME que no dicen nada: el sistema no supo identificar el archivo. */
const GENERIC_MIME = ['', 'application/octet-stream'];

/**
 * Valida un video ANTES de subirlo — primera barrera, para avisar rápido.
 *
 * Manda la EXTENSIÓN (MP4/WebM). El MIME se usa solo para rechazar algo que
 * claramente no es video: se acepta vacío o genérico (WhatsApp Web en Windows
 * los manda así) y cualquier `video/*`. Antes se exigía que coincidiera
 * exactamente con la extensión, y eso rechazaba videos válidos.
 *
 * La verificación REAL no está acá: Cloudinary rechaza otro formato por la
 * firma (`allowed_formats`), y el backend comprueba formato y peso del archivo
 * subido antes de asociarlo a la publicación.
 */
export function validateVideoFile(file: File, limits: PostMediaLimits = DEFAULT_POST_MEDIA_LIMITS): string | null {
  const ext = extOf(file);
  const formatos = limits.videoFormats.map((f) => f.toUpperCase()).join(' o ');
  const mimeOk = GENERIC_MIME.includes(file.type) || file.type.startsWith('video/');

  if (!limits.videoFormats.includes(ext) || !mimeOk) {
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
