'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Star, Bed, Bath, Maximize, Car, TreePine,
  FileCheck, Hourglass, MapPin, Home, ChevronLeft,
  ChevronRight, User, Calendar, CheckCircle2, XCircle,
  Building2, Navigation, MessageCircle, Send, Pencil,
  Trash2, LogIn, MessageCircleMore, ShieldCheck, Landmark, Eye, EyeOff,
} from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import { toast } from 'sonner';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import { fechaLarga } from '@/modules/shared/lib/fecha';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { FavoriteButton } from '@/modules/shared/ui/Favoritebutton';
import { whatsappLink } from '@/modules/shared/lib/contact';
import { PropertyCard } from '@/modules/properties/components/PropertyCard';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { Property } from '@/modules/properties/interfaces/propertyInterface';
import { OperationType } from '@/modules/properties/interfaces/operation-type';
import {
  BADGE_BASE, operationBadgeColor, propertyTypeBadgeColor, statusBadgeColor, statusDotColor,
} from '@/modules/properties/lib/badgeStyles';

// ── INTERFACES ────────────────────────────────────────────────────────────────
interface PropertyImage { id: number; url: string; isCover?: boolean; }
/**
 * Agente de la propiedad.
 *
 * `phone` y `email` admiten `null` porque así los declara el contrato
 * (`User.phone: string | null`, y los usuarios creados por Google llegan con
 * `phone: ''`). Antes eran `string | undefined` y encajaba sólo porque la
 * página pasaba la propiedad sin tipar (`getOne` devolvía `any`); al tipar el
 * fetch en `page.tsx` quedó a la vista el desajuste.
 */
interface Agent { id: number; name: string; email?: string | null; phone?: string | null; avatar?: string | null; }

interface Comment {
  id: number;
  message: string;
  created_at: string;
  /** Moderación del admin: los usuarios comunes no lo reciben del backend. */
  isHidden?: boolean;
  user?: { id?: number; name: string; surname: string; photo?: string };
}

interface Rating {
  id: number;
  score: number;
  user?: { id?: number; name: string; photo?: string };
}

/**
 * Shape de la propiedad en el detalle.
 *
 * Los campos escalares se derivan del tipo canónico (`shared/types/api.ts`) para
 * que no haya una copia paralela que se desincronice al agregar columnas. Solo
 * se sobreescriben las relaciones, que en esta pantalla se consumen con los
 * shapes reducidos de arriba (`Agent`, `Comment`, `Rating`, `PropertyImage`).
 */
export type PropertyFull = Omit<
  Property,
  'agent' | 'comments' | 'ratings' | 'images' | 'typeOfProperty'
> & {
  typeOfProperty?: { id: number; name: string };
  images?: PropertyImage[];
  agent?: Agent;
  comments?: Comment[];
  ratings?: Rating[];
};

// ── ESTILOS DE LA BARRA DE ACCESOS RÁPIDOS ────────────────────────────────────
// Cada acceso se comporta como un chip: en hover se rellena de verde de marca
// con el texto y el ícono en blanco (`text-white` alcanza porque los íconos
// usan `currentColor`). Se sacó el subrayado animado que había antes: sobre un
// fondo lleno quedaba como un renglón suelto debajo del texto.
const QUICK_LINK_BASE =
  'group inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-300 ease-out hover:bg-brand-700 hover:text-white hover:shadow-[0_6px_16px_-8px_rgba(6,57,35,0.7)]';

// ── TARJETA DE SECCIÓN ────────────────────────────────────────────────────────
// El fondo de la página es el verde de sección (`bg-surface-mint`) — el mismo
// que el catálogo y el modal de filtros, para que las tres pantallas se lean
// como un solo sistema. Antes era `bg-surface`, un gris a ~2 puntos de
// luminancia del blanco de las tarjetas: no separaba nada.
// Con `shadow-sm` las tarjetas blancas casi no se despegaban y todo se leía plano. Esta sombra en dos capas
// (una corta de contacto + una larga difusa) las levanta del fondo sin
// ensuciar. Es el mismo criterio que ya usan las cards del catálogo.
const CARD =
  'rounded-3xl border border-ink-100 bg-white shadow-[0_2px_4px_-2px_rgba(10,12,11,0.06),0_14px_34px_-14px_rgba(10,12,11,0.20)]';

/**
 * Tonos semánticos de las pastillas de ícono del detalle.
 *
 * Antes TODAS eran verdes (`bg-brand-700/10 text-brand-700`): ubicación,
 * descripción, características y comentarios se veían idénticas, así que el
 * ícono no aportaba ninguna pista de qué sección era — solo decoraba.
 * Ahora cada tipo de contenido tiene su color, y ese color se repite en la
 * barra de accesos rápidos de arriba, de modo que el enlace y la sección a la
 * que lleva comparten la misma señal visual.
 */
const TONO_ICONO = {
  brand: { pastilla: 'bg-brand-700/10 text-brand-700',  texto: 'text-brand-700'  },
  rojo:  { pastilla: 'bg-red-100 text-red-600',         texto: 'text-red-600'    },
  azul:  { pastilla: 'bg-blue-100 text-blue-600',       texto: 'text-blue-600'   },
  ambar: { pastilla: 'bg-amber-100 text-amber-500',     texto: 'text-amber-500'  },
} as const;

export type TonoIcono = keyof typeof TONO_ICONO;

/** Encabezado de sección: ícono en pastilla tintada + título. */
function SectionHeader({
  icon: Icon, title, id, className = 'mb-6', tono = 'brand',
}: {
  icon: React.ElementType; title: string; id?: string; className?: string;
  tono?: TonoIcono;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONO_ICONO[tono].pastilla}`}>
        <Icon size={18} />
      </span>
      <h2 id={id} className="text-lg font-bold text-ink-900">{title}</h2>
    </div>
  );
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function StarRating({ score, size = 18 }: { score: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size}
          className={s <= Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-ink-200 fill-ink-200'}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return fechaLarga(dateStr);
}

// ── SLIDER ────────────────────────────────────────────────────────────────────
function ImageSlider({ images, title }: { images: PropertyImage[]; title: string }) {
  const [current, setCurrent] = useState(0);

  if (!images.length) return (
    <div className="flex h-96 w-full items-center justify-center rounded-3xl bg-ink-100">
      <Home size={48} className="text-ink-400" />
    </div>
  );

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    // Sombra aliviada: antes era `0_20px_50px_-24px` verde y caía como un
    // bloque pesado debajo de la galería.
    <div className="relative w-full overflow-hidden rounded-3xl border border-ink-100 bg-ink-950 shadow-[0_2px_4px_-2px_rgba(10,12,11,0.08),0_12px_28px_-16px_rgba(10,12,11,0.28)]">
      <div className="relative h-105 w-full md:h-130">
        {images.map((img, i) => (
          <div key={img.id} className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
            {/* Sin `sizes`, next/image asume 100vw y sirve la variante más
                grande en cualquier pantalla. Acá la galería llega como mucho a
                la columna principal del detalle (~62vw en desktop). */}
            <Image
              src={img.url}
              alt={`${title} - foto ${i + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 62vw"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-linear-to-t from-ink-950/50 via-transparent to-transparent" />
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute top-1/2 left-4 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-3 text-brand-700 shadow-lg backdrop-blur-sm transition-transform hover:scale-110" aria-label="Foto anterior">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-3 text-brand-700 shadow-lg backdrop-blur-sm transition-transform hover:scale-110" aria-label="Siguiente foto">
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <div className="absolute right-5 bottom-5 rounded-full bg-ink-950/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
          {current + 1} / {images.length}
        </div>
      </div>
      {images.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto bg-ink-950/80 p-3">
          {images.map((img, i) => (
            <button aria-label={`Ver foto ${i + 1}`} key={img.id} onClick={() => setCurrent(i)}
              className={`relative h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${i === current ? 'scale-105 border-brand-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <Image
                src={img.url}
                alt={`Ver foto ${i + 1} de ${title}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAPA ──────────────────────────────────────────────────────────────────────
function GoogleMapSection({ address }: { address: string }) {
  const encodedAddress = encodeURIComponent(address);
  const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  return (
    <div className={`scroll-mt-28 ${CARD} p-8`}>
      <SectionHeader icon={MapPin} title="Ubicación" id="mapa-ubicacion" className="mb-3" tono="rojo" />
      <p className="mb-6 flex items-center gap-2 text-sm font-medium text-ink-600">
        <Navigation size={14} className="shrink-0 text-brand-700" />{address}
      </p>
      <div className="overflow-hidden rounded-2xl border border-brand-700/15 shadow-lg transition-all duration-500 hover:shadow-[0_0_40px_-6px_rgba(11,122,75,0.25)]">
        <iframe
          src={mapUrl}
          width="100%"
          height="440"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full"
          title="Mapa de ubicación de la propiedad"
        />
      </div>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`} target="_blank" rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700/10 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-700/20">
        <Navigation size={16} />Abrir en Google Maps
      </a>
    </div>
  );
}

// ── STAR PICKER ───────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          className="cursor-pointer transition-transform hover:scale-125 active:scale-110" aria-label={`${s} estrellas`}>
          <Star size={28} className={s <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-ink-200 fill-ink-200'} />
        </button>
      ))}
    </div>
  );
}

// ── COMENTARIOS + RATINGS ─────────────────────────────────────────────────────
function CommentsAndRatings({
  propertyId,
  initialComments,
  initialRatings,
  initialAverage,
  onRatingsChange,
}: {
  propertyId: number;
  initialComments: Comment[];
  initialRatings: Rating[];
  initialAverage: number;
  onRatingsChange: (ratings: Rating[], average: number) => void;
}) {
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);
  const [ratingAverage, setRatingAverage] = useState(initialAverage);

  const [newMessage, setNewMessage] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const myRating = ratings.find((r) => r.user?.id === user?.id);
  const [selectedScore, setSelectedScore] = useState<number>(myRating?.score ?? 0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // ── FETCH INICIAL ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commentsRes, ratingsRes] = await Promise.all([
          api.get(`/properties/${propertyId}/comments`),
          api.get(`/ratings/${propertyId}`),
        ]);
        setComments(commentsRes.data);
        const ratingsData: Rating[] = ratingsRes.data;
        setRatings(ratingsData);
        if (ratingsData.length) {
          const sum = ratingsData.reduce((acc, r) => acc + r.score, 0);
          const avg = Number((sum / ratingsData.length).toFixed(2));
          setRatingAverage(avg);
          setTimeout(() => onRatingsChange(ratingsData, avg), 0);
        }
      } catch {}
    };
    fetchData();
  }, [propertyId, onRatingsChange]);

  // Sincroniza selectedScore cuando llegan los ratings frescos
  useEffect(() => {
    const my = ratings.find((r) => r.user?.id === user?.id);
    if (my) setSelectedScore(my.score);
  }, [ratings, user]);

  // ── PROMEDIO LOCAL ──
  const recalcAverage = (updated: Rating[]) => {
    if (!updated.length) {
      setRatingAverage(0);
      setTimeout(() => onRatingsChange(updated, 0), 0);
      return;
    }
    const sum = updated.reduce((acc, r) => acc + r.score, 0);
    const avg = Number((sum / updated.length).toFixed(2));
    setRatingAverage(avg);
    setTimeout(() => onRatingsChange(updated, avg), 0);
  };

  // ── SUBMIT COMENTARIO ──
  const handleCommentSubmit = async () => {
    if (!newMessage.trim()) return;
    setSubmittingComment(true);
    try {
      const { data: created } = await api.post<Comment>(
        `/properties/${propertyId}/comments`,
        { message: newMessage.trim() }
      );
      setComments((prev) => [
        {
          ...created,
          created_at: created.created_at ?? new Date().toISOString(),
          user: { name: user!.name, surname: '', photo: user!.photo ?? undefined, id: user!.id },
        },
        ...prev,
      ]);
      setNewMessage('');
      toast.success('Comentario publicado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingComment(false);
    }
  };

  // ── EDITAR COMENTARIO ──
  const handleEditSubmit = async (commentId: number) => {
    if (!editMessage.trim()) return;
    setSubmittingEdit(true);
    try {
      await api.patch(`/properties/${propertyId}/comments/${commentId}`, { message: editMessage.trim() });
      setComments((prev) =>
        prev.map((c) => c.id === commentId ? { ...c, message: editMessage.trim() } : c)
      );
      setEditingId(null);
      toast.success('Comentario editado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingEdit(false);
    }
  };

  // ── ELIMINAR COMENTARIO ──
  const handleDelete = (commentId: number) => {
    confirmDialog({
      title: '¿Eliminar comentario?',
      message: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/properties/${propertyId}/comments/${commentId}`);
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          toast.success('Comentario eliminado');
        } catch (error) {
          toast.error(getErrorMessage(error));
        }
      },
    });
  };

  // ── OCULTAR / MOSTRAR COMENTARIO (solo admin) ──
  // Moderación blanda: el comentario no se borra, deja de mostrarse al resto.
  const handleToggleHidden = async (commentId: number) => {
    try {
      const { data } = await api.patch(`/properties/${propertyId}/comments/${commentId}/hide`);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, isHidden: data.isHidden } : c)),
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // ── SUBMIT RATING ──
  const handleRatingSubmit = async () => {
    if (!selectedScore) return;
    setSubmittingRating(true);
    try {
      await api.post(`/ratings/${propertyId}`, { score: selectedScore });
      setRatings((prev) => {
        const exists = prev.find((r) => r.user?.id === user!.id);
        const updated = exists
          ? prev.map((r) => r.user?.id === user!.id ? { ...r, score: selectedScore } : r)
          : [...prev, { id: Date.now(), score: selectedScore, user: { name: user!.name, id: user!.id } }];
        recalcAverage(updated);
        return updated;
      });
      toast.success(myRating ? 'Valoración actualizada' : 'Valoración enviada');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <>
      {/* ── VALORACIONES ── */}
      <div id="valoracion" className={`scroll-mt-28 ${CARD} p-8`}>
        <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-ink-900">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-500">
            <Star size={18} className="fill-amber-400 text-amber-400" />
          </span>
          Valoraciones
          {ratings.length > 0 && (
            <span className="ml-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">
              {ratings.length}
            </span>
          )}
        </h2>

        {ratings.length > 0 && (
          <div className="mb-6 flex items-center gap-4 rounded-2xl bg-surface-mint p-5">
            <span className="text-5xl font-black text-brand-700">{ratingAverage.toFixed(1)}</span>
            <div>
              <StarRating score={ratingAverage} size={22} />
              <p className="mt-1 text-sm text-ink-500">
                Basado en {ratings.length} {ratings.length === 1 ? 'valoración' : 'valoraciones'}
              </p>
            </div>
          </div>
        )}

        {ratings.length > 0 && (
          <div className="mb-6 flex flex-col gap-1">
            {ratings.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-ink-50 py-3 last:border-none">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-700/10">
                    {r.user?.photo ? (
                      <Image src={r.user.photo} alt={r.user.name} width={32} height={32} className="rounded-full object-cover" />
                    ) : (
                      <User size={14} className="text-brand-700" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-ink-700">{r.user?.name || 'Anónimo'}</span>
                  {r.user?.id === user?.id && (
                    <span className="rounded-full bg-brand-700/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand-700 uppercase">
                      Tu valoración
                    </span>
                  )}
                </div>
                <StarRating score={r.score} size={16} />
              </div>
            ))}
          </div>
        )}

        {user?.role === 'admin' ? (
          /* Valorar es exclusivo de usuarios comunes: `POST /ratings/:id` lleva
             `@Roles(Role.USER)`, así que al admin le devolvería 403. Se le
             muestra el motivo en vez de un formulario que no puede usar. */
          <p className="rounded-2xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-500">
            Las valoraciones son de los usuarios: desde una cuenta de administrador no se puede valorar.
          </p>
        ) : user ? (
          <div className="rounded-2xl border border-brand-700/10 bg-brand-700/5 p-5">
            <p className="mb-3 text-sm font-bold text-ink-700">
              {myRating ? '✏️ Modificar tu valoración' : '⭐ Valorá esta propiedad'}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <StarPicker value={selectedScore} onChange={setSelectedScore} />
              <button onClick={handleRatingSubmit} disabled={!selectedScore || submittingRating}
                className="cursor-pointer rounded-xl px-5 py-2 text-sm font-bold text-white transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'var(--gradient-brand)' }}>
                {submittingRating ? 'Enviando...' : myRating ? 'Actualizar' : 'Enviar valoración'}
              </button>
            </div>
          </div>
        ) : (
          <Link href="/login"
            className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 p-4 text-sm text-ink-500 transition-all duration-300 hover:border-brand-700 hover:text-brand-700">
            <LogIn size={16} className="transition-transform group-hover:scale-110" />
            Iniciá sesión para valorar esta propiedad
          </Link>
        )}
      </div>

      {/* ── COMENTARIOS ── */}
      <div id="comentarios" className={`scroll-mt-28 ${CARD} p-8`}>
        <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-ink-900">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <MessageCircleMore size={18} />
          </span>
          Comentarios
          <span className="ml-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
            {comments.length}
          </span>
        </h2>

        {user ? (
          <div className="mb-8 flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700/10">
              {user.photo ? (
                <Image src={user.photo} alt={user.name} width={40} height={40} className="rounded-full object-cover" />
              ) : (
                <User size={18} className="text-brand-700" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribí tu comentario sobre esta propiedad..."
                maxLength={500} rows={3}
                className="w-full resize-none rounded-2xl border border-ink-200 bg-surface-mint px-4 py-3 text-sm text-ink-700 transition-all duration-200 placeholder:text-ink-500 focus:border-brand-700 focus:bg-white focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500">{newMessage.length}/500</span>
                <button onClick={handleCommentSubmit} disabled={!newMessage.trim() || submittingComment}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'var(--gradient-brand)' }}>
                  <Send size={14} />
                  {submittingComment ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link href="/login"
            className="group mb-8 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 p-4 text-sm text-ink-500 transition-all duration-300 hover:border-brand-700 hover:text-brand-700">
            <LogIn size={16} className="transition-transform group-hover:scale-110" />
            Iniciá sesión para dejar un comentario
          </Link>
        )}

        {comments.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center text-ink-500">
            <MessageCircle size={36} className="mb-3 text-ink-400" />
            <p className="text-sm font-medium">Todavía no hay comentarios.</p>
            <p className="mt-1 text-xs">¡Sé el primero en opinar!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {comments.map((comment) => {
              const isOwner = comment.user?.id === user?.id;
              const isAdmin = user?.role === 'admin';
              return (
                <div key={comment.id} className="group/comment flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700/10">
                    {comment.user?.photo ? (
                      <Image src={comment.user.photo} alt={comment.user.name} width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <User size={18} className="text-brand-700" />
                    )}
                  </div>
                  {/* Un comentario oculto solo lo recibe el admin (el backend lo
                      filtra para el resto); se marca en ámbar para que se note. */}
                  <div className={`flex-1 rounded-2xl px-5 py-4 ${comment.isHidden ? 'border border-amber-200 bg-amber-50' : 'bg-surface-mint'}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink-800">
                          {comment.user?.name ? `${comment.user.name} ${comment.user.surname || ''}` : 'Usuario'}
                        </span>
                        {isOwner && (
                          <span className="rounded-full bg-brand-700/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand-700 uppercase">
                            Tú
                          </span>
                        )}
                        {comment.isHidden && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                            <EyeOff size={9} />Oculto
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="mr-2 text-xs text-ink-500">{formatDate(comment.created_at)}</span>
                        {isAdmin && (
                          <button onClick={() => handleToggleHidden(comment.id)}
                            className="cursor-pointer rounded-lg p-1.5 text-ink-500 opacity-0 transition-all hover:bg-amber-50 hover:text-amber-600 group-hover/comment:opacity-100"
                            aria-label={comment.isHidden ? 'Mostrar comentario' : 'Ocultar comentario'}
                            title={comment.isHidden ? 'Mostrar' : 'Ocultar'}>
                            {comment.isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                        )}
                        {isOwner && editingId !== comment.id && (
                          <button onClick={() => { setEditingId(comment.id); setEditMessage(comment.message); }}
                            className="cursor-pointer rounded-lg p-1.5 text-ink-500 opacity-0 transition-all hover:bg-brand-700/10 hover:text-brand-700 group-hover/comment:opacity-100"
                            aria-label="Editar">
                            <Pencil size={13} />
                          </button>
                        )}
                        {(isOwner || isAdmin) && editingId !== comment.id && (
                          <button onClick={() => handleDelete(comment.id)}
                            className="cursor-pointer rounded-lg p-1.5 text-ink-500 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover/comment:opacity-100"
                            aria-label="Eliminar">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    {editingId === comment.id ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <textarea aria-label="comentario" value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          maxLength={500} rows={3}
                          className="w-full resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 transition-all focus:border-brand-700 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)}
                            className="cursor-pointer rounded-lg bg-ink-100 px-4 py-1.5 text-xs font-semibold text-ink-500 transition-colors hover:bg-ink-200">
                            Cancelar
                          </button>
                          <button onClick={() => handleEditSubmit(comment.id)} disabled={submittingEdit}
                            className="cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-40"
                            style={{ background: 'var(--gradient-brand)' }}>
                            {submittingEdit ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-ink-600">{comment.message}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ── PROPIEDADES SIMILARES ──────────────────────────────────────────────────────
function SimilarProperties({
  currentId, operationType, typeOfPropertyId,
}: {
  currentId: number; operationType: string; typeOfPropertyId?: number;
}) {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertiesService
      .getFilteredProperties({
        operationType: operationType as OperationType,
        typeOfPropertyId,
        page: 1,
        limit: 4,
      })
      .then((res) => setItems((res?.data || []).filter((p) => p.id !== currentId).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentId, operationType, typeOfPropertyId]);

  if (loading || items.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="mb-8">
        <span className="inline-block rounded-full bg-brand-700 px-4 py-1.5 text-xs font-bold tracking-[0.22em] text-white uppercase shadow-[0_4px_12px_-4px_rgba(11,122,75,0.6)]">
          También te puede interesar
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
          Propiedades <span className="text-brand-700">similares</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </section>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function PropertyDetail({ property }: { property: PropertyFull }) {
  const {
    title, description, direccion, localidad, barrio, zone,
    rooms, bathrooms, garage, patio, property_deed, tractoAbreviado, boleto,
    supTotal, supCubierta, antiquity, price, operationType, status,
    typeOfProperty, images = [], agent,
    comments = [], ratings = [], ratingAverage = 0,
    created_at,
  } = property;

  // ── Estado local para el título — se sincroniza con CommentsAndRatings ──
  const [liveRatingsCount, setLiveRatingsCount] = useState(ratings.length);
  const [liveAverage, setLiveAverage] = useState(ratingAverage);

  /**
   * `useCallback` con `[]`: sólo llama a dos setters de estado, que React
   * garantiza estables, así que la identidad de esta función no necesita
   * cambiar nunca.
   *
   * Importa porque `CommentsAndRatings` la recibe como prop y la usa dentro de
   * un `useEffect`. Sin memoizar, la función se recreaba en cada render del
   * padre y no se podía incluir en las dependencias del efecto sin provocar un
   * refetch infinito de comentarios y valoraciones — por eso estaba omitida y
   * ESLint lo marcaba. Memoizada, la dependencia se puede declarar de verdad.
   */
  const handleRatingsChange = useCallback((updatedRatings: Rating[], updatedAverage: number) => {
    setLiveRatingsCount(updatedRatings.length);
    setLiveAverage(updatedAverage);
  }, []);

  const sortedImages = [...images].sort((a, b) => a.isCover ? -1 : b.isCover ? 1 : 0);
  const isAvailable = status === 'disponible';

  // Query del mapa: ahora existe `direccion` (calle y número) como campo real.
  // Se completa con barrio/localidad para desambiguar la búsqueda en Google Maps.
  // Fallback a la ubicación sola en las propiedades cargadas antes del campo.
  const mapAddress = [direccion, barrio, localidad].filter(Boolean).join(', ');
  const wa = whatsappLink(`Hola! Estoy interesado en la propiedad: "${title}" (ID: ${property.id}). ¿Podría darme más información?`);

  const scrollTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen bg-surface-mint">
      <div className="mx-auto max-w-6xl px-4 pt-32 pb-20">

        {/* ── BARRA DE ACCESOS RÁPIDOS ── */}
        <div className={`mb-8 flex flex-wrap items-center justify-between gap-4 px-5 py-3 ${CARD} rounded-2xl`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/properties" className={`${QUICK_LINK_BASE} text-brand-700`}>
              <ArrowLeft size={16} className="shrink-0 transition-transform duration-300 ease-out group-hover:-translate-x-1" />
              Volver al catálogo
            </Link>
            <span className="text-ink-400">|</span>
            <a href="#mapa-ubicacion" onClick={scrollTo('mapa-ubicacion')} className={`${QUICK_LINK_BASE} text-ink-600 hover:!bg-red-600`}>
              <MapPin size={16} className="shrink-0 text-red-600 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:text-white" />
              Ver dirección exacta
            </a>
            <span className="text-ink-400">|</span>
            <a href="#comentarios" onClick={scrollTo('comentarios')} className={`${QUICK_LINK_BASE} text-ink-600 hover:!bg-blue-600`}>
              <MessageCircleMore size={16} className="shrink-0 text-blue-600 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:text-white" />
              Ver Comentarios
            </a>
            <span className="text-ink-400">|</span>
            <a href="#valoracion" onClick={scrollTo('valoracion')} className={`${QUICK_LINK_BASE} text-ink-600 hover:!bg-amber-500`}>
              <Star size={16} className="shrink-0 fill-amber-400 text-amber-500 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:fill-white group-hover:text-white" />
              Ver Valoraciones
            </a>
          </div>

          {/* ── FAVORITOS (reusa el componente compartido) ── */}
          <FavoriteButton propertyId={property.id} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── COLUMNA IZQUIERDA (2/3) ── */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            <ImageSlider images={sortedImages} title={title} />

            {/* ── ENCABEZADO ──
                Va en su propia tarjeta blanca (antes flotaba suelto sobre el
                gris y se leía como un bloque plano), con bastante más aire
                interno para que el título respire. */}
            <div className={`${CARD} px-8 py-9`}>
              <div className="mb-5 flex flex-wrap items-center gap-2.5">
                <span className={`${BADGE_BASE} ${operationBadgeColor(operationType)}`}>{operationType}</span>
                <span className={`${BADGE_BASE} ${propertyTypeBadgeColor(typeOfProperty?.name)}`}>
                  {typeOfProperty?.name || 'Propiedad'}
                </span>
                <span className={`${BADGE_BASE} gap-1.5 ${statusBadgeColor(status)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDotColor(status)}`} aria-hidden />
                  {isAvailable && <ShieldCheck size={13} />}{status}
                </span>
              </div>

              <h1 className="text-3xl leading-[1.15] font-bold tracking-tight text-ink-900 md:text-[2.6rem]">
                {title}
              </h1>

              {/* ── UBICACIÓN ──
                  Orden fijo: dirección → barrio → zona → localidad. Píldoras
                  (`rounded-full`) con el ícono en su propio círculo tintado, en
                  vez del bloque de texto plano separado por "·" que había antes.
                  `leading-none` en ambos textos: sin eso el label (10px) y el
                  valor (14px) arrastran line-heights distintos y cada píldora
                  centraba su contenido a una altura diferente.
                  Los datos vacíos no se renderizan. */}
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                {[
                  { icon: MapPin,     label: 'Dirección', value: direccion },
                  { icon: Building2,  label: 'Barrio',    value: barrio },
                  { icon: Navigation, label: 'Zona',      value: zone },
                  { icon: Landmark,   label: 'Localidad', value: localidad },
                ]
                  .filter((seg) => seg.value)
                  .map(({ icon: Icon, label, value }) => (
                    <span
                      key={label}
                      className="group inline-flex items-center gap-2.5 rounded-full border border-ink-100 bg-surface-mint py-1.5 pr-5 pl-1.5 transition-all duration-200 hover:border-brand-700/30 hover:bg-brand-50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700/10 text-brand-700 transition-colors duration-200 group-hover:bg-brand-700 group-hover:text-white">
                        <Icon size={15} />
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className="text-[10px] leading-none font-bold tracking-[0.12em] text-ink-500 uppercase">
                          {label}
                        </span>
                        <span className="text-sm leading-none font-semibold text-ink-800">{value}</span>
                      </span>
                    </span>
                  ))}
              </div>

              {/* ── liveAverage y liveRatingsCount se actualizan sin recargar ── */}
              {liveRatingsCount > 0 && (
                <div className="mt-7 flex items-center gap-3 border-t border-ink-100 pt-6">
                  <StarRating score={liveAverage} />
                  <span className="text-sm font-semibold text-ink-700">{liveAverage.toFixed(1)}</span>
                  <span className="text-sm text-ink-500">({liveRatingsCount} {liveRatingsCount === 1 ? 'valoración' : 'valoraciones'})</span>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className={`${CARD} p-8`}>
              <SectionHeader icon={Home} title="Descripción" className="mb-5" />
              <p className="leading-relaxed whitespace-pre-line text-ink-600">{description}</p>
            </div>

            {/* Características */}
            <div className={`${CARD} p-8`}>
              <SectionHeader icon={Building2} title="Características" />

              {/* Specs numéricas: tarjetas propias con el ícono en un círculo
                  tintado y el valor como dato protagonista. Antes eran cuadrados
                  planos con un fondo `brand-700/8` y todo el mismo peso. */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { icon: Bed,       value: rooms,               label: 'Habitaciones' },
                  { icon: Bath,      value: bathrooms,           label: 'Baños' },
                  { icon: Maximize,  value: supTotal != null ? `${supTotal} m²` : '—',       label: 'Sup. Total' },
                  { icon: Maximize,  value: supCubierta != null ? `${supCubierta} m²` : '—', label: 'Sup. Cubierta' },
                  { icon: Hourglass, value: `${antiquity} años`, label: 'Antigüedad' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-ink-100 bg-surface-mint px-3 py-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-700/30 hover:bg-brand-50 hover:shadow-[0_10px_24px_-12px_rgba(6,57,35,0.3)]"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700/10 text-brand-700 transition-colors duration-300 group-hover:bg-brand-700 group-hover:text-white">
                        <Icon size={20} />
                      </span>
                      <span className="text-lg leading-none font-bold text-ink-900">{item.value}</span>
                      <span className="text-center text-[10px] leading-none font-bold tracking-[0.1em] text-ink-500 uppercase">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Comodidades y documentación */}
              <p className="mt-8 mb-4 text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase">
                Comodidades y documentación
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Car,       label: 'Cochera',           value: garage },
                  { icon: TreePine,  label: 'Patio',             value: patio },
                  // Documentación legal: los tres son independientes y pueden
                  // convivir en la misma propiedad.
                  { icon: FileCheck, label: 'Apto Escritura',    value: property_deed },
                  { icon: FileCheck, label: 'Tracto abreviado',  value: tractoAbreviado },
                  { icon: FileCheck, label: 'Boleto',            value: boleto },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
                        item.value
                          ? 'border-brand-700/25 bg-brand-50 text-brand-800'
                          : 'border-ink-100 bg-surface-mint text-ink-500'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          item.value ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-500'
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="text-sm font-semibold">{item.label}</span>
                      {item.value
                        ? <CheckCircle2 size={17} className="ml-auto shrink-0 text-brand-600" />
                        : <XCircle size={17} className="ml-auto shrink-0 text-ink-500" />}
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 border-t border-ink-100 pt-5">
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <Calendar size={14} className="shrink-0 text-brand-700" />
                  <span>Publicada el: <strong className="text-ink-800">{formatDate(created_at)}</strong></span>
                </div>
              </div>
            </div>

            {/* ── COMENTARIOS + RATINGS ── */}
            <CommentsAndRatings
              propertyId={property.id}
              initialComments={comments}
              initialRatings={ratings}
              initialAverage={ratingAverage}
              onRatingsChange={handleRatingsChange}
            />

            <GoogleMapSection address={mapAddress} />
          </div>

          {/* ── COLUMNA DERECHA (1/3) - STICKY ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 flex flex-col gap-5">

              {/* Precio + CTA */}
              <div className={`overflow-hidden ${CARD}`}>
                {/* Franja de marca arriba: le da jerarquía a la tarjeta de
                    precio, que es el dato más importante del sidebar. */}
                <div className="h-1.5 w-full" style={{ background: 'var(--gradient-brand)' }} />
                {/* El precio es el dato más importante del sidebar, pero antes
                    era solo un número grande sobre blanco con un rótulo gris
                    encima — se leía como un dato más de la lista. Ahora vive en
                    su propio panel verde clarísimo: la etiqueta es una píldora
                    de marca, el monto está separado del sufijo USD en su propia
                    línea de base, y debajo va el tipo de operación, que antes
                    solo aparecía arriba en los badges del título. */}
                <div className="border-b border-brand-100 bg-brand-50/60 px-7 pt-6 pb-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-white uppercase">
                    <Landmark size={12} />
                    Precio
                  </span>
                  <p className="mt-3 flex items-baseline gap-1.5 leading-none">
                    <span className="text-[2.6rem] font-black tracking-tight text-brand-800">
                      ${price.toLocaleString('es-AR')}
                    </span>
                    <span className="text-sm font-bold tracking-wide text-brand-600">USD</span>
                  </p>
                  {operationType && (
                    <p className="mt-2.5 text-xs font-semibold text-ink-500">
                      Publicada en <span className="text-brand-700 capitalize">{operationType}</span>
                    </p>
                  )}
                </div>
                <div className="px-7 pb-7">
                  <a href={wa} target="_blank" rel="noopener noreferrer"
                    className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(6,57,35,0.6)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{ background: 'var(--gradient-brand)' }}>
                    <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                    <BsWhatsapp size={20} /><span className="relative">Consultar por WhatsApp</span>
                  </a>
                  <p className="mt-3 text-center text-xs text-ink-500">Respondemos en menos de 24hs</p>
                </div>
              </div>

              {/* Agente */}
              {agent && (
                <div className={`${CARD} p-7`}>
                  <p className="mb-4 text-[11px] font-bold tracking-[0.14em] text-brand-700 uppercase">Agente a cargo</p>
                  <div className="flex items-center gap-4">
                    {/* Circular, no `rounded-2xl`: es una CARA, y el cuadrado
                        redondeado la recortaba por las mejillas. Además el
                        <Image> no llenaba el contenedor — sin `h-full w-full`
                        una foto no cuadrada quedaba descentrada dentro de la
                        caja. El aro verde la separa del fondo blanco. */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700/10 ring-2 ring-brand-200 ring-offset-2 ring-offset-white">
                      {agent.avatar
                        ? <Image src={agent.avatar} alt={agent.name} width={64} height={64} className="h-full w-full object-cover" />
                        : <User size={26} className="text-brand-700" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-ink-900">{agent.name}</p>
                      {agent.email && (
                        <p className="mt-0.5 truncate text-xs text-ink-500" title={agent.email}>{agent.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className={`${CARD} p-7`}>
                <p className="mb-4 text-[11px] font-bold tracking-[0.14em] text-brand-700 uppercase">Resumen</p>
                <ul className="space-y-1 text-sm">
                  {[
                    { label: 'Tipo',       value: typeOfProperty?.name },
                    { label: 'Operación',  value: operationType },
                    { label: 'Localidad',     value: localidad },
                    { label: 'Barrio',        value: barrio },
                    { label: 'Dirección',     value: direccion },
                    { label: 'Zona',          value: zone },
                    // `.filter(i => i.value)` de abajo descarta solo los que no
                    // tienen dato, así que las superficies nulas no se muestran.
                    { label: 'Sup. Total',    value: supTotal != null ? `${supTotal} m²` : undefined },
                    { label: 'Sup. Cubierta', value: supCubierta != null ? `${supCubierta} m²` : undefined },
                    { label: 'Antigüedad',    value: `${antiquity} años` },
                  ].filter(i => i.value).map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-4 border-b border-ink-100 py-2.5 last:border-none">
                      <span className="shrink-0 font-medium text-ink-500">{item.label}</span>
                      <span className="text-right font-semibold text-ink-800 capitalize">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* ── PROPIEDADES SIMILARES ── */}
        <SimilarProperties
          currentId={property.id}
          operationType={operationType}
          typeOfPropertyId={typeOfProperty?.id}
        />
      </div>
    </main>
  );
}
