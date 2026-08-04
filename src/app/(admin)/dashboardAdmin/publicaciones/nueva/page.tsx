'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { ImagePlus, Loader2, Send, Trash2, Megaphone } from 'lucide-react';
import { postsService } from '@/modules/posts/services/posts.service';
import { validateImageFile } from '@/modules/shared/lib/validateImage';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { DashboardPage, DashboardHeader } from '@/modules/shared/ui/DashboardPage';

const MAX_DESCRIPTION = 1000;

/**
 * Alta de una Publicación.
 *
 * Reutiliza el patrón de drag & drop de `PropertyForm` pero adaptado a UNA sola
 * imagen: la imagen ya viene editada por fuera (Canva) con todos los datos de la
 * propiedad adentro, así que acá no hay campos estructurados — solo la imagen y
 * un texto corto.
 */
export default function NuevaPublicacionPage() {
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  // Liberar el object URL al cambiar/desmontar (si no, queda en memoria).
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const acceptFile = useCallback((file?: File) => {
    if (!file) return;
    // Mismos límites que el backend (image/* y ≤5MB).
    const error = validateImageFile(file);
    if (error) { toast.error(error); return; }

    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    setImage(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    acceptFile(file);
  }, [acceptFile]);

  const clearImage = () => {
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setImage(null);
  };

  const handleSubmit = async () => {
    if (!image) { toast.error('Subí la imagen de la publicación'); return; }
    if (!description.trim()) { toast.error('Escribí una descripción'); return; }

    setSaving(true);
    try {
      await postsService.create(description.trim(), image);
      toast.success('Publicación creada ✓');
      router.push('/dashboardAdmin/publicaciones');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    // `width="form"` — el mismo ancho que el resto de los formularios del
    // dashboard. Antes era `max-w-3xl`, más angosto que cualquier otro, y el
    // link de volver estaba reimplementado inline con su propio estilo.
    <DashboardPage width="form">
      <DashboardHeader
        back={{ href: '/dashboardAdmin/publicaciones', label: 'Volver a Publicaciones' }}
        icon={Megaphone}
        iconTone="publicacion"
        title="Nueva publicación"
        subtitle="Se elimina automáticamente a los 7 días de publicada."
      />

      {/* ── IMAGEN ── */}
      <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-[0_1px_2px_rgba(10,12,11,0.04),0_8px_24px_-12px_rgba(10,12,11,0.12)]">
        <p className="mb-3 text-sm font-bold text-gray-700">Imagen de la publicación</p>

        {preview ? (
          <div className="relative overflow-hidden rounded-xl border border-gray-200">
            {/* `unoptimized`: es un blob: local, el optimizador de Next no aplica */}
            <Image
              src={preview}
              alt="Vista previa de la publicación"
              width={1200}
              height={1200}
              unoptimized
              className="max-h-125 w-full object-contain bg-gray-50"
            />
            <button
              type="button"
              onClick={clearImage}
              aria-label="Quitar imagen"
              className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-red-500 shadow-md backdrop-blur-sm transition-transform hover:scale-110"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-all duration-200 ${
              dragging
                ? 'border-[#0b7a4b] bg-[#0b7a4b]/5'
                : 'border-gray-300 bg-gray-50 hover:border-[#0b7a4b]/50 hover:bg-[#0b7a4b]/5'
            }`}
          >
            <ImagePlus size={34} className="text-[#0b7a4b]" />
            <span className="text-sm font-semibold text-gray-700">
              Arrastrá la imagen o hacé click para elegirla
            </span>
            <span className="text-xs text-gray-500">JPG o PNG, hasta 5 MB — una sola imagen</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
          </label>
        )}
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
        disabled={saving}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0b7a4b] py-4 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0f8b57] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? <><Loader2 size={18} className="animate-spin" />Publicando…</> : <><Send size={18} />Publicar</>}
      </button>
    </DashboardPage>
  );
}
