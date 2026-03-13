'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Star, Bed, Bath, Maximize, Car, TreePine,
  FileCheck, Hourglass, MapPin, Home, ChevronLeft,
  ChevronRight, User, Calendar, CheckCircle2, XCircle,
  Building2, Navigation, MessageCircle, Send, Pencil,
  Trash2, LogIn,
  MessageCircleMore,
} from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import { toast } from 'sonner';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios'; 

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
          className={s <= Math.round(score) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
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
    <div className="w-full h-96 bg-gray-100 rounded-3xl flex items-center justify-center">
      <Home size={48} className="text-gray-300" />
    </div>
  );

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-black">
      <div className="relative h-105 md:h-130 w-full">
        {images.map((img, i) => (
          <div key={img.id} className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
            <Image src={img.url} alt={`${title} - foto ${i + 1}`} fill className="object-cover" priority={i === 0} />
          </div>
        ))}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform text-[#0b7a4b]" aria-label="Foto anterior">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform text-[#0b7a4b]" aria-label="Siguiente foto">
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <div className="absolute bottom-5 right-5 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
          {current + 1} / {images.length}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 p-3 bg-black/80 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button aria-label={`Ver foto ${i + 1}`} key={img.id} onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all duration-200 ${i === current ? 'border-[#0b7a4b] scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}>
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
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 scroll-mt-28">
      <h2 id="mapa-ubicacion" className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
        <MapPin size={18} className="text-[#0b7a4b]" />Ubicación exacta
      </h2>
      <p className="text-sm text-gray-600 mb-6 flex items-center gap-2">
        <Navigation size={14} className="text-[#0b7a4b]" />{address}
      </p>
      <div className="rounded-3xl overflow-hidden border border-[#0b7a4b]/20 shadow-lg hover:shadow-[0_0_40px_rgba(11,122,75,0.2)] transition-all duration-500">
        <iframe src={mapUrl} width="100%" height="500" loading="lazy" className="w-full" title="Mapa de ubicación de la propiedad" />
      </div>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`} target="_blank" rel="noopener noreferrer"
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#0b7a4b]/10 hover:bg-[#0b7a4b]/20 text-[#0b7a4b] font-semibold text-sm rounded-xl transition-colors">
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
          className="transition-transform hover:scale-125 active:scale-110" aria-label={`${s} estrellas`}>
          <Star size={28} className={s <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
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
    } catch {
      toast.error('No se pudo publicar el comentario');
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
    } catch {
      toast.error('No se pudo editar el comentario');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // ── ELIMINAR COMENTARIO ──
  const handleDelete = (commentId: number) => {
    toast.custom((t) => (
      <div className="flex flex-col gap-4 bg-white rounded-3xl shadow-2xl border border-gray-100 px-6 py-5 w-85">
        <div className="flex flex-col gap-1">
          <p className="text-[15px] font-bold text-gray-800">¿Eliminar comentario?</p>
          <p className="text-[13px] text-gray-400">Esta acción no se puede deshacer.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast.dismiss(t)}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                await api.delete(`/properties/${propertyId}/comments/${commentId}`);
                setComments((prev) => prev.filter((c) => c.id !== commentId));
                toast.success('Comentario eliminado');
              } catch {
                toast.error('No se pudo eliminar');
              }
            }}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors cursor-pointer">
            Eliminar
          </button>
        </div>
      </div>
    ), { position: 'top-center', unstyled: true, style: { background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 } });
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
    } catch {
      toast.error('No se pudo enviar la valoración');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <>
      {/* ── VALORACIONES ── */}
      <div id="valoracion" className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Star size={18} className="text-yellow-400 fill-yellow-400" />
          Valoraciones
          {ratings.length > 0 && (
            <span className="ml-1 bg-yellow-50 text-yellow-600 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-200">
              {ratings.length}
            </span>
          )}
        </h2>

        {ratings.length > 0 && (
          <div className="flex items-center gap-4 mb-6 p-5 bg-gray-50 rounded-2xl">
            <span className="text-5xl font-black text-[#0b7a4b]">{ratingAverage.toFixed(1)}</span>
            <div>
              <StarRating score={ratingAverage} size={22} />
              <p className="text-sm text-gray-500 mt-1">
                Basado en {ratings.length} {ratings.length === 1 ? 'valoración' : 'valoraciones'}
              </p>
            </div>
          </div>
        )}

        {ratings.length > 0 && (
          <div className="flex flex-col gap-1 mb-6">
            {ratings.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-none">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center overflow-hidden">
                    {r.user?.photo ? (
                      <Image src={r.user.photo} alt={r.user.name} width={32} height={32} className="rounded-full object-cover" />
                    ) : (
                      <User size={14} className="text-[#0b7a4b]" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{r.user?.name || 'Anónimo'}</span>
                  {r.user?.id === user?.id && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0b7a4b] bg-[#0b7a4b]/10 px-2 py-0.5 rounded-full">
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
          <div className="bg-[#0b7a4b]/5 rounded-2xl p-5 border border-[#0b7a4b]/10">
            <p className="text-sm font-bold text-gray-700 mb-3">
              {myRating ? '✏️ Modificar tu valoración' : '⭐ Valorá esta propiedad'}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <StarPicker value={selectedScore} onChange={setSelectedScore} />
              <button onClick={handleRatingSubmit} disabled={!selectedScore || submittingRating}
                className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
                {submittingRating ? 'Enviando...' : myRating ? 'Actualizar' : 'Enviar valoración'}
              </button>
            </div>
          </div>
        ) : (
          <Link href="/login"
            className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-[#0b7a4b] hover:text-[#0b7a4b] transition-all duration-300 group">
            <LogIn size={16} className="group-hover:scale-110 transition-transform" />
            Iniciá sesión para valorar esta propiedad
          </Link>
        )}
      </div>

      {/* ── COMENTARIOS ── */}
      <div id="comentarios" className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageCircleMore size={18} className="text-[#0b7a4b]" />
          Comentarios
          <span className="ml-1 bg-[#0b7a4b]/10 text-[#0b7a4b] text-xs font-bold px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </h2>

        {user ? (
          <div className="flex gap-3 mb-8">
            <div className="shrink-0 w-10 h-10 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center overflow-hidden">
              {user.photo ? (
                <Image src={user.photo} alt={user.name} width={40} height={40} className="rounded-full object-cover" />
              ) : (
                <User size={18} className="text-[#0b7a4b]" />
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribí tu comentario sobre esta propiedad..."
                maxLength={500} rows={3}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all duration-200"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{newMessage.length}/500</span>
                <button onClick={handleCommentSubmit} disabled={!newMessage.trim() || submittingComment}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
                  <Send size={14} />
                  {submittingComment ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link href="/login"
            className="flex items-center justify-center gap-2 p-4 mb-8 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-[#0b7a4b] hover:text-[#0b7a4b] transition-all duration-300 group">
            <LogIn size={16} className="group-hover:scale-110 transition-transform" />
            Iniciá sesión para dejar un comentario
          </Link>
        )}

        {comments.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center text-gray-400">
            <MessageCircle size={36} className="mb-3 text-gray-200" />
            <p className="text-sm font-medium">Todavía no hay comentarios.</p>
            <p className="text-xs mt-1">¡Sé el primero en opinar!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {comments.map((comment) => {
              const isOwner = comment.user?.id === user?.id;
              return (
                <div key={comment.id} className="flex gap-4 group/comment">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center overflow-hidden">
                    {comment.user?.photo ? (
                      <Image src={comment.user.photo} alt={comment.user.name} width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <User size={18} className="text-[#0b7a4b]" />
                    )}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-2xl px-5 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">
                          {comment.user?.name ? `${comment.user.name} ${comment.user.surname || ''}` : 'Usuario'}
                        </span>
                        {isOwner && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0b7a4b] bg-[#0b7a4b]/10 px-2 py-0.5 rounded-full">
                            Tú
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 mr-2">{formatDate(comment.created_at)}</span>
                        {isOwner && editingId !== comment.id && (
                          <>
                            <button onClick={() => { setEditingId(comment.id); setEditMessage(comment.message); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#0b7a4b] hover:bg-[#0b7a4b]/10 transition-all opacity-0 group-hover/comment:opacity-100"
                              aria-label="Editar">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDelete(comment.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/comment:opacity-100"
                              aria-label="Eliminar">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {editingId === comment.id ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <textarea aria-label="comentario" value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          maxLength={500} rows={3}
                          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#0b7a4b] transition-all"
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingId(null)}
                            className="px-4 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                            Cancelar
                          </button>
                          <button onClick={() => handleEditSubmit(comment.id)} disabled={submittingEdit}
                            className="px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-all disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
                            {submittingEdit ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed">{comment.message}</p>
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
  const whatsappMsg = encodeURIComponent(`Hola! Estoy interesado en la propiedad: "${title}" (ID: ${property.id}). ¿Podría darme más información?`);

  const scrollToMap = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('mapa-ubicacion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToComments = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('comentarios')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToRatings = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('valoracion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen bg-[#f0f2f0]">
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">

        <div className="flex items-center gap-4 mb-6">
          <Link href="/properties" className="inline-flex items-center gap-2 text-sm font-semibold text-[#179f64] hover:text-[#0f8c58] group transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform mt-0.5" />Volver al catálogo
          </Link>
          <span className="text-gray-300">|</span>
          <a href="#mapa-ubicacion" onClick={scrollToMap} className="inline-flex items-center gap-2 text-sm font-semibold text-[#179f64] hover:text-[#0f8c58] group transition-colors">
            <MapPin size={16} className="group-hover:scale-110 transition-transform" />Ver dirección exacta
          </a>
          <span className="text-gray-300">|</span>
          <a href="#comentarios" onClick={scrollToComments} className="inline-flex items-center gap-2 text-sm font-semibold text-[#179f64] hover:text-[#0f8c58] group transition-colors">
            <MessageCircleMore size={16} className="group-hover:scale-110 transition-transform" />Ver Comentarios
          </a>
          <span className="text-gray-300">|</span>
          <a href="#valoracion" onClick={scrollToRatings} className="inline-flex items-center gap-2 text-sm font-semibold text-[#179f64] hover:text-[#0f8c58] group transition-colors">
            <Star size={16} className="group-hover:scale-110 transition-transform" />Ver Valoraciones
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── COLUMNA IZQUIERDA (2/3) ── */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <ImageSlider images={sortedImages} title={title} />

            {/* Título + badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-[#0b7a4b] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">{operationType}</span>
                <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">{typeOfProperty?.name || 'Propiedad'}</span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${status === 'disponible' ? 'bg-emerald-200 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{status}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">{title}</h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin size={16} className="text-[#0b7a4b] shrink-0" />
                <span>{barrio}, {localidad}</span>
                {zone && <><span className="text-gray-300">·</span><span className="text-gray-500">Zona: {zone}</span></>}
              </div>
              {/* ── liveAverage y liveRatingsCount se actualizan sin recargar ── */}
              {liveRatingsCount > 0 && (
                <div className="flex items-center gap-3 mt-3">
                  <StarRating score={liveAverage} />
                  <span className="text-sm font-semibold text-gray-700">{liveAverage.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({liveRatingsCount} {liveRatingsCount === 1 ? 'valoración' : 'valoraciones'})</span>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Home size={18} className="text-[#0b7a4b]" />Descripción
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
            </div>

            {/* Características */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 size={18} className="text-[#0b7a4b]" />Características
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: Bed,       value: rooms,               label: 'Habitaciones' },
                  { icon: Bath,      value: bathrooms,           label: 'Baños' },
                  { icon: Maximize,  value: `${m2} m²`,         label: 'Superficie' },
                  { icon: Hourglass, value: `${antiquity} años`, label: 'Antigüedad' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex flex-col items-center justify-center bg-[#0b7a4b]/8 rounded-2xl py-5 gap-2">
                      <Icon size={22} className="text-[#0b7a4b]" />
                      <span className="text-xl font-bold text-[#0b7a4b]">{item.value}</span>
                      <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: Car,       label: 'Cochera',        value: garage },
                  { icon: TreePine,  label: 'Patio',          value: patio },
                  { icon: FileCheck, label: 'Apto Escritura', value: property_deed },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all ${item.value ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                      <Icon size={18} />
                      <span className="text-sm font-semibold">{item.label}</span>
                      {item.value ? <CheckCircle2 size={16} className="ml-auto text-emerald-500" /> : <XCircle size={16} className="ml-auto text-gray-300" />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} className="text-[#0b7a4b]" />
                  <span>Publicada el: <strong className="text-gray-700">{formatDate(created_at)}</strong></span>
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

            <GoogleMapSection address={provincia} />
          </div>

          {/* ── COLUMNA DERECHA (1/3) - STICKY ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 flex flex-col gap-5">

              {/* Precio + CTA */}
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Precio</p>
                <p className="text-4xl font-black text-[#0b7a4b] mb-1">{price.toLocaleString('es-AR')}</p>
                <p className="text-sm text-gray-500 font-semibold mb-6">USD</p>
                <a href={`https://wa.me/543513872817?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                  className="group relative overflow-hidden w-full flex items-center justify-center gap-3 py-4 bg-linear-to-r from-[#0f8b57] to-[#14a366] hover:from-[#0d7a4d] hover:to-[#0f8b57] text-white font-bold text-base rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.98]">
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <BsWhatsapp size={20} />Consultar por WhatsApp
                </a>
                <p className="text-center text-xs text-gray-500 mt-3">Respondemos en menos de 24hs</p>
              </div>

              {/* Agente */}
              {agent && (
                <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-[#0b7a4b] uppercase tracking-wider mb-4">Agente a cargo</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#0b7a4b]/10 flex items-center justify-center overflow-hidden shrink-0">
                      {agent.avatar
                        ? <Image src={agent.avatar} alt={agent.name} width={56} height={56} className="object-cover" />
                        : <User size={24} className="text-[#0b7a4b]" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{agent.name}</p>
                      {agent.email && <p className="text-xs text-gray-500 mt-0.5">{agent.email}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-[#0b7a4b] uppercase tracking-wider mb-4">Resumen</p>
                <ul className="space-y-3 text-sm">
                  {[
                    { label: 'Tipo',       value: typeOfProperty?.name },
                    { label: 'Operación',  value: operationType },
                    { label: 'Localidad',  value: localidad },
                    { label: 'Barrio',     value: barrio },
                    { label: 'Zona',       value: zone },
                    { label: 'Superficie', value: `${m2} m²` },
                    { label: 'Antigüedad', value: `${antiquity} años` },
                  ].filter(i => i.value).map((item) => (
                    <li key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-none">
                      <span className="text-gray-500 font-medium">{item.label}</span>
                      <span className="font-semibold text-gray-700 capitalize">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}