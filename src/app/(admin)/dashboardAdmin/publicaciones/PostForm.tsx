'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  ImagePlus, Loader2, Send, Trash2, Megaphone, Film, ImageIcon, ChevronLeft, ChevronRight,
  X, AlertTriangle, Save,
} from 'lucide-react';
import { postsService, type PostMediaSlot } from '@/modules/posts/services/posts.service';
import {
  DEFAULT_POST_MEDIA_LIMITS, formatBytes, formatDuration, isVideoFile, validateVideoFile,
  type PostMediaLimits, type UploadedVideo,
} from '@/modules/posts/lib/postMedia';
import { validateImageFile } from '@/modules/shared/lib/validateImage';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { DashboardPage, DashboardHeader } from '@/modules/shared/ui/DashboardPage';
import type { PostMedia } from '@/modules/shared/types/api';
import { isAxiosError } from 'axios';

const MAX_DESCRIPTION = 1000;

/**
 * Un lugar de la galería mientras se edita el formulario.
 *  - `existing`: medio que la publicación ya tenía (solo al editar).
 *  - `image`: imagen nueva — se sube recién al guardar, junto con el resto.
 *  - `video`: video nuevo — se sube APENAS se elige, directo a Cloudinary,
 *    para que al apretar "Publicar" ya esté listo (y para poder mostrar el
 *    progreso de lo que más tarda).
 */
type DraftItem =
  | { key: string; kind: 'existing'; media: PostMedia }
  | { key: string; kind: 'image'; file: File; preview: string }
  | {
      key: string;
      kind: 'video';
      file: File;
      preview: string;
      status: 'uploading' | 'done' | 'error';
      progress: number;
      uploaded?: UploadedVideo;
      error?: string;
      abort: AbortController;
    };

let keySeq = 0;
const nextKey = () => `m${++keySeq}`;

const isVideoItem = (it: DraftItem) =>
  it.kind === 'video' || (it.kind === 'existing' && it.media.type === 'video');

/** Mensaje legible de un fallo de subida a Cloudinary (o de la firma). */
function uploadErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.code === 'ERR_CANCELED') return 'Subida cancelada';
  // Cloudinary responde { error: { message } }; nuestro backend, { message }.
  const cloudinaryMsg = isAxiosError(error)
    ? (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message
    : undefined;
  return cloudinaryMsg ? `Cloudinary rechazó el video: ${cloudinaryMsg}` : getErrorMessage(error);
}

/**
 * Formulario de Publicación — alta (`postId` ausente) y edición.
 *
 * Extiende el formulario anterior (una sola imagen) a una galería de imágenes
 * y videos, con orden. Los datos de la publicación siguen siendo los mismos:
 * solo la descripción.
 *
 * Cómo viaja cada cosa (ver `posts.service.ts`):
 *  - Imágenes → multipart al backend, como siempre (≤5 MB c/u).
 *  - Videos → directo del navegador a Cloudinary con una firma que da el
 *    backend; al guardar solo se manda su `publicId`, que el backend verifica.
 */
export default function PostForm({ postId }: { postId?: number }) {
  const router = useRouter();
  const isEdit = postId !== undefined;

  const [description, setDescription] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [limits, setLimits] = useState<PostMediaLimits>(DEFAULT_POST_MEDIA_LIMITS);
  const [loading, setLoading] = useState(isEdit);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  // Ref además del estado: dos clicks en el mismo frame verían `saving` todavía
  // en false. El ref corta el segundo envío en seco.
  const savingRef = useRef(false);

  // Espejo de `items` para la limpieza al desmontar (el efecto de cleanup no
  // ve el estado más reciente si se cierra sobre él).
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      for (const it of itemsRef.current) {
        if (it.kind !== 'existing') URL.revokeObjectURL(it.preview);
        if (it.kind === 'video' && it.status === 'uploading') it.abort.abort();
      }
    };
  }, []);

  // ── Edición: cargar la publicación ──
  useEffect(() => {
    if (!isEdit) return;
    postsService
      .getOne(postId)
      .then((post) => {
        setDescription(post.description ?? '');
        setItems((post.media ?? []).map((media) => ({ key: nextKey(), kind: 'existing', media })));
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [isEdit, postId]);

  const updateItem = useCallback((key: string, patch: Partial<Extract<DraftItem, { kind: 'video' }>>) => {
    setItems((prev) => prev.map((it) => (it.key === key && it.kind === 'video' ? { ...it, ...patch } : it)));
  }, []);

  /** Pide la firma y sube el video, informando el progreso en su tarjeta. */
  const startVideoUpload = useCallback(async (key: string, file: File, abort: AbortController) => {
    try {
      const sig = await postsService.getVideoSignature();
      setLimits(sig.limits);
      // El backend puede haber cambiado el límite: se revalida con el real.
      const error = validateVideoFile(file, sig.limits);
      if (error) throw new Error(error);

      const uploaded = await postsService.uploadVideo(
        file,
        sig,
        (progress) => updateItem(key, { progress }),
        abort.signal,
      );
      updateItem(key, { status: 'done', progress: 100, uploaded });
    } catch (error) {
      if (abort.signal.aborted) return; // lo quitó el admin: la tarjeta ya no existe
      updateItem(key, { status: 'error', error: uploadErrorMessage(error) });
    }
  }, [updateItem]);

  /**
   * ⚠️ Todo se decide FUERA del updater de `setItems`: en desarrollo React
   * (StrictMode) ejecuta los updaters dos veces, y si la subida arrancara ahí
   * adentro cada video se subiría dos veces a Cloudinary.
   */
  const addFiles = useCallback((list: FileList | File[]) => {
    const files = Array.from(list);
    if (files.length === 0) return;

    const current = itemsRef.current;
    let total = current.length;
    let videos = current.filter(isVideoItem).length;
    const added: DraftItem[] = [];
    const uploads: { key: string; file: File; abort: AbortController }[] = [];

    for (const file of files) {
      if (total >= limits.maxMediaPerPost) {
        toast.error(`Una publicación admite hasta ${limits.maxMediaPerPost} imágenes y videos.`);
        break;
      }

      if (isVideoFile(file)) {
        const error = validateVideoFile(file, limits);
        if (error) { toast.error(error); continue; }
        if (videos >= limits.maxVideosPerPost) {
          toast.error(`Una publicación admite hasta ${limits.maxVideosPerPost} videos.`);
          continue;
        }
        const key = nextKey();
        const abort = new AbortController();
        added.push({
          key, kind: 'video', file, preview: URL.createObjectURL(file),
          status: 'uploading', progress: 0, abort,
        });
        uploads.push({ key, file, abort });
        videos++;
      } else {
        const error = validateImageFile(file);
        if (error) { toast.error(error); continue; }
        added.push({ key: nextKey(), kind: 'image', file, preview: URL.createObjectURL(file) });
      }
      total++;
    }

    if (added.length === 0) return;
    // Se actualiza el ref en el acto: si llega otra tanda antes del próximo
    // render, los topes se cuentan sobre lo ya agregado.
    itemsRef.current = [...current, ...added];
    setItems((prev) => [...prev, ...added]);
    for (const u of uploads) startVideoUpload(u.key, u.file, u.abort);
  }, [limits, startVideoUpload]);

  /**
   * Quitar un medio de la galería. Uno EXISTENTE no se borra todavía: se borra
   * (de la base y de Cloudinary) recién al guardar, y solo ese — si el admin se
   * arrepiente y sale sin guardar, no se perdió nada.
   */
  const removeItem = (key: string) => {
    const it = itemsRef.current.find((i) => i.key === key);
    if (it && it.kind !== 'existing') URL.revokeObjectURL(it.preview);
    if (it?.kind === 'video' && it.status === 'uploading') it.abort.abort();
    itemsRef.current = itemsRef.current.filter((i) => i.key !== key);
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const moveItem = (key: string, dir: -1 | 1) => {
    setItems((prev) => {
      const i = prev.findIndex((it) => it.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const uploading = items.some((it) => it.kind === 'video' && it.status === 'uploading');
  const failed = items.some((it) => it.kind === 'video' && it.status === 'error');

  const handleSubmit = async () => {
    if (savingRef.current) return;
    if (items.length === 0) { toast.error('Agregá al menos una imagen o un video'); return; }
    if (!description.trim()) { toast.error('Escribí una descripción'); return; }
    if (uploading) { toast.info('Esperá a que terminen de subir los videos'); return; }
    if (failed) { toast.error('Quitá los videos que no se pudieron subir'); return; }

    // Galería final en orden + las imágenes nuevas que viajan como archivos.
    const newImages: File[] = [];
    const media: PostMediaSlot[] = items.map((it) => {
      if (it.kind === 'existing') return { kind: 'existing', id: it.media.id };
      if (it.kind === 'image') return { kind: 'image', index: newImages.push(it.file) - 1 };
      return { kind: 'video', publicId: it.uploaded!.publicId };
    });

    savingRef.current = true;
    setSaving(true);
    try {
      if (isEdit) {
        await postsService.update(postId, description.trim(), media, newImages);
        toast.success('Publicación actualizada ✓');
      } else {
        await postsService.create(description.trim(), media, newImages);
        toast.success('Publicación creada ✓');
      }
      router.push('/dashboardAdmin/publicaciones');
    } catch (error) {
      toast.error(getErrorMessage(error));
      savingRef.current = false;
      setSaving(false);
    }
  };

  const videoCount = items.filter(isVideoItem).length;

  return (
    // `width="form"` — el mismo ancho que el resto de los formularios del
    // dashboard.
    <DashboardPage width="form">
      <DashboardHeader
        back={{ href: '/dashboardAdmin/publicaciones', label: 'Volver a Publicaciones' }}
        icon={Megaphone}
        iconTone="publicacion"
        title={isEdit ? 'Editar publicación' : 'Nueva publicación'}
        subtitle={
          isEdit
            ? 'Los cambios no reinician el plazo: se elimina igual a los 7 días de publicada.'
            : 'Se elimina automáticamente a los 7 días de publicada.'
        }
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-gray-500">
          <Loader2 size={20} className="animate-spin" />Cargando publicación…
        </div>
      ) : (
        <>
          {/* ── MEDIOS ── */}
          <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-[0_1px_2px_rgba(10,12,11,0.04),0_8px_24px_-12px_rgba(10,12,11,0.12)]">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-gray-700">Imágenes y videos</p>
              <p className="text-xs text-gray-500">
                {items.length}/{limits.maxMediaPerPost} medios · {videoCount}/{limits.maxVideosPerPost} videos
              </p>
            </div>

            {items.length > 0 && (
              <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map((it, i) => (
                  <MediaTile
                    key={it.key}
                    item={it}
                    position={i}
                    total={items.length}
                    onRemove={() => removeItem(it.key)}
                    onMove={(dir) => moveItem(it.key, dir)}
                  />
                ))}
              </ul>
            )}

            {items.length < limits.maxMediaPerPost && (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 text-center transition-all duration-200 ${
                  items.length > 0 ? 'py-8' : 'py-16'
                } ${
                  dragging
                    ? 'border-[#0b7a4b] bg-[#0b7a4b]/5'
                    : 'border-gray-300 bg-gray-50 hover:border-[#0b7a4b]/50 hover:bg-[#0b7a4b]/5'
                }`}
              >
                <span className="flex items-center gap-2 text-[#0b7a4b]">
                  <ImagePlus size={30} />
                  <Film size={30} />
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  Arrastrá imágenes o videos, o hacé click para elegirlos
                </span>
                <span className="text-xs text-gray-500">
                  Imágenes JPG/PNG hasta {formatBytes(limits.maxImageBytes)} · Videos{' '}
                  {limits.videoFormats.map((f) => f.toUpperCase()).join(' o ')} hasta{' '}
                  {formatBytes(limits.maxVideoBytes)}
                </span>
                <input
                  type="file"
                  multiple
                  // Por MIME y también por EXTENSIÓN: si el sistema no tiene
                  // asociado `.mp4` (pasa con videos de WhatsApp Web en
                  // Windows), un `accept` solo por MIME los ocultaba del selector.
                  accept={[
                    'image/*',
                    ...limits.videoFormats.map((f) => `video/${f}`),
                    ...limits.videoFormats.map((f) => `.${f}`),
                  ].join(',')}
                  className="hidden"
                  onChange={(e) => { addFiles(e.target.files ?? []); e.target.value = ''; }}
                />
              </label>
            )}

            <p className="mt-3 text-xs text-gray-500">
              El primer elemento es la portada (la que se ve en el listado y al compartir el link).
              Usá las flechas para cambiar el orden.
            </p>
          </div>

          {/* ── DESCRIPCIÓN ── */}
          <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-[0_1px_2px_rgba(10,12,11,0.04),0_8px_24px_-12px_rgba(10,12,11,0.12)]">
            <label htmlFor="post-description" className="mb-3 block text-sm font-bold text-gray-700">
              Descripción
            </label>
            <textarea
              id="post-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
              rows={5}
              placeholder="Ej: Casa a estrenar en Villa Carlos Paz. Consultanos por WhatsApp."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 transition-all placeholder:text-gray-400 focus:border-[#0b7a4b] focus:bg-white focus:outline-none"
            />
            <p className="mt-2 text-right text-xs text-gray-500">
              {description.length}/{MAX_DESCRIPTION}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0b7a4b] py-4 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0f8b57] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 size={18} className="animate-spin" />{isEdit ? 'Guardando…' : 'Publicando…'}</>
            ) : uploading ? (
              <><Loader2 size={18} className="animate-spin" />Esperando que terminen los videos…</>
            ) : isEdit ? (
              <><Save size={18} />Guardar cambios</>
            ) : (
              <><Send size={18} />Publicar</>
            )}
          </button>
        </>
      )}
    </DashboardPage>
  );
}

// ── Tarjeta de un medio en el formulario ─────────────────────────────────────
function MediaTile({
  item, position, total, onRemove, onMove,
}: {
  item: DraftItem;
  position: number;
  total: number;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const video = isVideoItem(item);
  const duration =
    item.kind === 'existing'
      ? formatDuration(item.media.duration)
      : item.kind === 'video'
        ? formatDuration(item.uploaded?.duration)
        : null;

  return (
    <li className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-900">
      <div className="relative aspect-square w-full">
        {item.kind === 'existing' ? (
          // Para un video existente se muestra su fotograma inicial: no hace
          // falta descargar el video entero para armar la miniatura.
          <Image
            src={item.media.type === 'video' ? (item.media.posterUrl ?? item.media.url) : item.media.url}
            alt=""
            fill
            sizes="200px"
            className="object-cover"
          />
        ) : item.kind === 'image' ? (
          // `unoptimized`: es un blob: local, el optimizador de Next no aplica.
          <Image src={item.preview} alt="" fill unoptimized className="object-cover" />
        ) : (
          // Video local: `preload="metadata"` alcanza para el primer cuadro.
          <video src={item.preview} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        )}

        {/* Tipo + posición */}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
          {video ? <Film size={11} /> : <ImageIcon size={11} />}
          {video ? 'Video' : 'Imagen'}
          {duration && <span className="font-semibold text-white/75 normal-case">· {duration}</span>}
        </span>
        {position === 0 && (
          <span className="absolute top-2 right-2 rounded-md bg-[#0b7a4b] px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
            Portada
          </span>
        )}

        {/* Subida en curso */}
        {item.kind === 'video' && item.status === 'uploading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 px-3 text-white">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-xs font-bold">Subiendo {item.progress}%</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-[width] duration-200" style={{ width: `${item.progress}%` }} />
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="mt-1 inline-flex cursor-pointer items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[11px] font-bold hover:bg-white/25"
            >
              <X size={12} />Cancelar
            </button>
          </div>
        )}

        {/* Error de subida */}
        {item.kind === 'video' && item.status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-900/85 px-3 text-center text-white">
            <AlertTriangle size={20} />
            <span className="text-[11px] leading-snug font-semibold">{item.error}</span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between gap-1 bg-white px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={position === 0}
            aria-label="Mover antes"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="w-5 text-center text-xs font-bold text-gray-500">{position + 1}</span>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={position === total - 1}
            aria-label="Mover después"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={video ? 'Quitar video' : 'Quitar imagen'}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-red-500 hover:bg-red-50"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
}
