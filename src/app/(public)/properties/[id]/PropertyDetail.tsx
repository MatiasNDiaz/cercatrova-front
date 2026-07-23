'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Star, Bed, Bath, Maximize, Car, TreePine,
  FileCheck, Hourglass, MapPin, Home, ChevronLeft,
  ChevronRight, User, Calendar, CheckCircle2, XCircle,
  Building2, Navigation, MessageCircle, Send, Pencil,
  Trash2, LogIn, MessageCircleMore, ShieldCheck,
} from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import { toast } from 'sonner';
import { confirmDialog } from '@/modules/shared/ui/ConfirmDialog';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { FavoriteButton } from '@/modules/shared/ui/Favoritebutton';
import { whatsappLink } from '@/modules/shared/lib/contact';
import { PropertyCard } from '@/modules/properties/components/PropertyCard';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { Property } from '@/modules/properties/interfaces/propertyInterface';
import { OperationType } from '@/modules/properties/interfaces/operation-type';

// ── INTERFACES ────────────────────────────────────────────────────────────────
interface PropertyImage { id: number; url: string; isCover?: boolean; }
interface Agent { id: number; name: string; email?: string; phone?: string; avatar?: string; }

interface Comment {
  id: number;
  message: string;
  created_at: string;
  user?: { id?: number; name: string; surname: string; photo?: string };
}

interface Rating {
  id: number;
  score: number;
  user?: { id?: number; name: string; photo?: string };
}

interface PropertyFull {
  id: number;
  title: string;
  description: string;
  provincia: string;
  localidad: string;
  barrio: string;
  zone: string;
  rooms: number;
  bathrooms: number;
  garage: boolean;
  patio: boolean;
  property_deed: boolean;
  m2: number;
  antiquity: number;
  price: number;
  operationType: string;
  status: string;
  typeOfProperty?: { id: number; name: string };
  images?: PropertyImage[];
  agent?: Agent;
  comments?: Comment[];
  ratings?: Rating[];
  ratingAverage?: number;
  created_at?: string;
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
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── SLIDER ────────────────────────────────────────────────────────────────────
function ImageSlider({ images, title }: { images: PropertyImage[]; title: string }) {
  const [current, setCurrent] = useState(0);

  if (!images.length) return (
    <div className="flex h-96 w-full items-center justify-center rounded-3xl bg-ink-100">
      <Home size={48} className="text-ink-300" />
    </div>
  );

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-ink-100 bg-ink-950 shadow-[0_20px_50px_-24px_rgba(6,57,35,0.5)]">
      <div className="relative h-105 w-full md:h-130">
        {images.map((img, i) => (
          <div key={img.id} className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
            <Image src={img.url} alt={`${title} - foto ${i + 1}`} fill className="object-cover" priority={i === 0} />
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
              <Image src={img.url} alt="" fill className="object-cover" />
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
    <div className="scroll-mt-28 rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
      <h2 id="mapa-ubicacion" className="mb-2 flex items-center gap-2 text-lg font-bold text-ink-900">
        <MapPin size={18} className="text-brand-700" />Ubicación
      </h2>
      <p className="mb-6 flex items-center gap-2 text-sm text-ink-500">
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
  }, [propertyId]);

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
      <div id="valoracion" className="scroll-mt-28 rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-ink-900">
          <Star size={18} className="fill-amber-400 text-amber-400" />
          Valoraciones
          {ratings.length > 0 && (
            <span className="ml-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">
              {ratings.length}
            </span>
          )}
        </h2>

        {ratings.length > 0 && (
          <div className="mb-6 flex items-center gap-4 rounded-2xl bg-surface p-5">
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

        {user ? (
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
            className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 p-4 text-sm text-ink-400 transition-all duration-300 hover:border-brand-700 hover:text-brand-700">
            <LogIn size={16} className="transition-transform group-hover:scale-110" />
            Iniciá sesión para valorar esta propiedad
          </Link>
        )}
      </div>

      {/* ── COMENTARIOS ── */}
      <div id="comentarios" className="scroll-mt-28 rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-ink-900">
          <MessageCircleMore size={18} className="text-brand-700" />
          Comentarios
          <span className="ml-1 rounded-full bg-brand-700/10 px-2 py-0.5 text-xs font-bold text-brand-700">
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
                className="w-full resize-none rounded-2xl border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-700 transition-all duration-200 placeholder:text-ink-400 focus:border-brand-700 focus:bg-white focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-400">{newMessage.length}/500</span>
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
            className="group mb-8 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 p-4 text-sm text-ink-400 transition-all duration-300 hover:border-brand-700 hover:text-brand-700">
            <LogIn size={16} className="transition-transform group-hover:scale-110" />
            Iniciá sesión para dejar un comentario
          </Link>
        )}

        {comments.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center text-ink-400">
            <MessageCircle size={36} className="mb-3 text-ink-200" />
            <p className="text-sm font-medium">Todavía no hay comentarios.</p>
            <p className="mt-1 text-xs">¡Sé el primero en opinar!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {comments.map((comment) => {
              const isOwner = comment.user?.id === user?.id;
              return (
                <div key={comment.id} className="group/comment flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700/10">
                    {comment.user?.photo ? (
                      <Image src={comment.user.photo} alt={comment.user.name} width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <User size={18} className="text-brand-700" />
                    )}
                  </div>
                  <div className="flex-1 rounded-2xl bg-surface px-5 py-4">
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
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="mr-2 text-xs text-ink-400">{formatDate(comment.created_at)}</span>
                        {isOwner && editingId !== comment.id && (
                          <>
                            <button onClick={() => { setEditingId(comment.id); setEditMessage(comment.message); }}
                              className="cursor-pointer rounded-lg p-1.5 text-ink-400 opacity-0 transition-all hover:bg-brand-700/10 hover:text-brand-700 group-hover/comment:opacity-100"
                              aria-label="Editar">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDelete(comment.id)}
                              className="cursor-pointer rounded-lg p-1.5 text-ink-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover/comment:opacity-100"
                              aria-label="Eliminar">
                              <Trash2 size={13} />
                            </button>
                          </>
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
    title, description, provincia, localidad, barrio, zone,
    rooms, bathrooms, garage, patio, property_deed,
    m2, antiquity, price, operationType, status,
    typeOfProperty, images = [], agent,
    comments = [], ratings = [], ratingAverage = 0,
    created_at,
  } = property;

  // ── Estado local para el título — se sincroniza con CommentsAndRatings ──
  const [liveRatingsCount, setLiveRatingsCount] = useState(ratings.length);
  const [liveAverage, setLiveAverage] = useState(ratingAverage);

  const handleRatingsChange = (updatedRatings: Rating[], updatedAverage: number) => {
    setLiveRatingsCount(updatedRatings.length);
    setLiveAverage(updatedAverage);
  };

  const sortedImages = [...images].sort((a, b) => a.isCover ? -1 : b.isCover ? 1 : 0);
  const isAvailable = status === 'disponible';

  // `provincia` guarda la dirección completa (calle + barrio + localidad +
  // provincia), así que es la mejor query para el mapa.
  const mapAddress = provincia;
  const wa = whatsappLink(`Hola! Estoy interesado en la propiedad: "${title}" (ID: ${property.id}). ¿Podría darme más información?`);

  const scrollTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-6xl px-4 pt-28 pb-16">

        {/* ── BARRA DE ACCESOS RÁPIDOS ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white px-5 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/properties" className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800">
              <ArrowLeft size={16} className="mt-0.5 transition-transform group-hover:-translate-x-1" />Volver al catálogo
            </Link>
            <span className="text-ink-200">|</span>
            <a href="#mapa-ubicacion" onClick={scrollTo('mapa-ubicacion')} className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-700">
              <MapPin size={16} className="transition-transform group-hover:scale-110" />Ver dirección exacta
            </a>
            <span className="text-ink-200">|</span>
            <a href="#comentarios" onClick={scrollTo('comentarios')} className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-700">
              <MessageCircleMore size={16} className="transition-transform group-hover:scale-110" />Ver Comentarios
            </a>
            <span className="text-ink-200">|</span>
            <a href="#valoracion" onClick={scrollTo('valoracion')} className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-700">
              <Star size={16} className="transition-transform group-hover:scale-110" />Ver Valoraciones
            </a>
          </div>

          {/* ── FAVORITOS (reusa el componente compartido) ── */}
          <FavoriteButton propertyId={property.id} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── COLUMNA IZQUIERDA (2/3) ── */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            <ImageSlider images={sortedImages} title={title} />

            {/* Título + badges */}
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-700 px-3 py-1.5 text-xs font-bold tracking-wider text-white uppercase">{operationType}</span>
                <span className="rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-semibold tracking-wider text-ink-700 uppercase">{typeOfProperty?.name || 'Propiedad'}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wider uppercase ${isAvailable ? 'bg-brand-700/10 text-brand-700' : 'bg-red-100 text-red-600'}`}>
                  {isAvailable && <ShieldCheck size={13} />}{status}
                </span>
              </div>
              <h1 className="mb-3 text-3xl leading-tight font-bold text-ink-900 md:text-4xl">{title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
                <MapPin size={16} className="shrink-0 text-brand-700" />
                <span>{barrio}, {localidad}</span>
                {zone && <><span className="text-ink-300">·</span><span>Zona: {zone}</span></>}
              </div>
              {/* ── liveAverage y liveRatingsCount se actualizan sin recargar ── */}
              {liveRatingsCount > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <StarRating score={liveAverage} />
                  <span className="text-sm font-semibold text-ink-700">{liveAverage.toFixed(1)}</span>
                  <span className="text-sm text-ink-500">({liveRatingsCount} {liveRatingsCount === 1 ? 'valoración' : 'valoraciones'})</span>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink-900">
                <Home size={18} className="text-brand-700" />Descripción
              </h2>
              <p className="leading-relaxed whitespace-pre-line text-ink-600">{description}</p>
            </div>

            {/* Características */}
            <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-ink-900">
                <Building2 size={18} className="text-brand-700" />Características
              </h2>
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { icon: Bed,       value: rooms,               label: 'Habitaciones' },
                  { icon: Bath,      value: bathrooms,           label: 'Baños' },
                  { icon: Maximize,  value: `${m2} m²`,         label: 'Superficie' },
                  { icon: Hourglass, value: `${antiquity} años`, label: 'Antigüedad' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-brand-700/8 py-5">
                      <Icon size={22} className="text-brand-700" />
                      <span className="text-xl font-bold text-brand-700">{item.value}</span>
                      <span className="text-[11px] font-medium tracking-wider text-ink-500 uppercase">{item.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: Car,       label: 'Cochera',        value: garage },
                  { icon: TreePine,  label: 'Patio',          value: patio },
                  { icon: FileCheck, label: 'Apto Escritura', value: property_deed },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`flex items-center gap-3 rounded-2xl border px-5 py-4 transition-all ${item.value ? 'border-brand-700/20 bg-brand-700/5 text-brand-700' : 'border-ink-100 bg-surface text-ink-500'}`}>
                      <Icon size={18} />
                      <span className="text-sm font-semibold">{item.label}</span>
                      {item.value ? <CheckCircle2 size={16} className="ml-auto text-brand-600" /> : <XCircle size={16} className="ml-auto text-ink-300" />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 border-t border-ink-100 pt-6">
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <Calendar size={14} className="text-brand-700" />
                  <span>Publicada el: <strong className="text-ink-700">{formatDate(created_at)}</strong></span>
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
              <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
                <div className="p-7">
                  <p className="mb-1 text-sm font-medium tracking-wider text-ink-500 uppercase">Precio</p>
                  <p className="text-4xl font-black text-brand-700">
                    ${price.toLocaleString('es-AR')}
                    <span className="ml-1.5 text-base font-semibold text-ink-500">USD</span>
                  </p>
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
                <div className="rounded-3xl border border-ink-100 bg-white p-7 shadow-sm">
                  <p className="mb-4 text-xs font-bold tracking-wider text-brand-700 uppercase">Agente a cargo</p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-700/10">
                      {agent.avatar
                        ? <Image src={agent.avatar} alt={agent.name} width={56} height={56} className="object-cover" />
                        : <User size={24} className="text-brand-700" />}
                    </div>
                    <div>
                      <p className="font-bold text-ink-800">{agent.name}</p>
                      {agent.email && <p className="mt-0.5 text-xs text-ink-500">{agent.email}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className="rounded-3xl border border-ink-100 bg-white p-7 shadow-sm">
                <p className="mb-4 text-xs font-bold tracking-wider text-brand-700 uppercase">Resumen</p>
                <ul className="space-y-1 text-sm">
                  {[
                    { label: 'Tipo',       value: typeOfProperty?.name },
                    { label: 'Operación',  value: operationType },
                    { label: 'Localidad',  value: localidad },
                    { label: 'Barrio',     value: barrio },
                    { label: 'Zona',       value: zone },
                    { label: 'Superficie', value: `${m2} m²` },
                    { label: 'Antigüedad', value: `${antiquity} años` },
                  ].filter(i => i.value).map((item) => (
                    <li key={item.label} className="flex items-center justify-between border-b border-ink-50 py-2 last:border-none">
                      <span className="font-medium text-ink-500">{item.label}</span>
                      <span className="font-semibold text-ink-700 capitalize">{item.value}</span>
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
