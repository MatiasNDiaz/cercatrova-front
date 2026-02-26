'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Star, Bed, Bath, Maximize, Car, TreePine,
  FileCheck, Hourglass, MapPin, Home, ChevronLeft,
  ChevronRight, User, Calendar, CheckCircle2, XCircle,
  Building2, Hash,
} from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';

// ── INTERFACES EXTENDIDAS ─────────────────────────────────────────────────────
interface PropertyImage {
  id: number;
  url: string;
  isCover?: boolean;
}

interface Agent {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
}



interface Comment {
  id: number;
  message: string; 
  createdAt: string;
  user?: { 
    name: string; 
    surname: string; // Añadido surname
    photo?: string;  // CAMBIADO: de avatar a photo para coincidir con el JSON
  };
}

interface Rating {
  id: number;
  score: number;
  user?: { name: string };
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
        <Star
          key={s}
          size={size}
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
      {/* Imagen principal */}
      <div className="relative h-105 md:h-130 w-full">
        {images.map((img, i) => (
          <div
            key={img.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={img.url}
              alt={`${title} - foto ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

        {/* Controles */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform text-[#0b7a4b]"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform text-[#0b7a4b]"
              aria-label="Siguiente foto"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Contador */}
        <div className="absolute bottom-5 right-5 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
          {current + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 p-3 bg-black/80 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button
            aria-label='a'
              key={img.id}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                i === current ? 'border-[#0b7a4b] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={img.url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
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

  const sortedImages = [...images].sort((a, b) =>
    a.isCover ? -1 : b.isCover ? 1 : 0
  );

  const whatsappMsg = encodeURIComponent(
    `Hola! Estoy interesado en la propiedad: "${title}" (Propiedad número: ${property.id}). ¿Podría darme más información?`
  );

  return (
    <main className="min-h-screen bg-[#f0f2f0]">
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">

        {/* ── BACK ── */}
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#179f64] hover:text-[#0f8c58] mb-6 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Volver al catálogo
        </Link>

        {/* ── GRID PRINCIPAL ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── COLUMNA IZQUIERDA (2/3) ── */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Slider */}
            <ImageSlider images={sortedImages} title={title} />

            {/* Título + badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-[#0b7a4b] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {operationType}
                </span>
                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {typeOfProperty?.name || 'Propiedad'}
                </span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                  status === 'disponible'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {status}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
                {title}
              </h1>

              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin size={16} className="text-[#0b7a4b] shrink-0" />
                <span>{barrio}, {localidad}, {provincia}</span>
                {zone && <span className="text-gray-300">·</span>}
                {zone && <span className="text-gray-500">Zona: {zone}</span>}
              </div>

              {/* Rating resumen */}
              {ratings.length > 0 && (
                <div className="flex items-center gap-3 mt-3">
                  <StarRating score={ratingAverage} />
                  <span className="text-sm font-semibold text-gray-700">
                    {ratingAverage.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({ratings.length} {ratings.length === 1 ? 'valoración' : 'valoraciones'})
                  </span>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Home size={18} className="text-[#0b7a4b]" />
                Descripción
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>

            {/* Características */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 size={18} className="text-[#0b7a4b]" />
                Características
              </h2>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: Bed,       value: rooms,          label: 'Habitaciones' },
                  { icon: Bath,      value: bathrooms,      label: 'Baños' },
                  { icon: Maximize, value: `${m2} m²`,     label: 'Superficie' },
                  { icon: Hourglass,value: `${antiquity} años`, label: 'Antigüedad' },
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

              {/* Booleans */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: Car,         label: 'Cochera',   value: garage },
                  { icon: TreePine,    label: 'Patio',     value: patio },
                  { icon: FileCheck,   label: 'Escritura', value: property_deed },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all ${
                        item.value
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-gray-50 border-gray-100 text-gray-500'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-semibold">{item.label}</span>
                      {item.value
                        ? <CheckCircle2 size={16} className="ml-auto text-emerald-500" />
                        : <XCircle size={16} className="ml-auto text-gray-300" />
                      }
                    </div>
                  );
                })}
              </div>

              {/* Info adicional */}
              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-[#0b7a4b]" />
                  <span>ID Propiedad numero: <strong className="text-gray-700">{property.id}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#0b7a4b]" />
                  <span>Publicado: <strong className="text-gray-700">{formatDate(created_at)}</strong></span>
                </div>
              </div>
            </div>

            {/* Comentarios */}
            {comments.length > 0 && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User size={18} className="text-[#0b7a4b]" />
                  Comentarios
                  <span className="ml-1 bg-[#0b7a4b]/10 text-[#0b7a4b] text-xs font-bold px-2 py-0.5 rounded-full">
                    {comments.length}
                  </span>
                </h2>

                <div className="flex flex-col gap-5">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      {/* Avatar corregido para usar photo */}
                      <div className="shrink-0 w-10 h-10 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center overflow-hidden">
                        {comment.user?.photo ? (
                          <Image
                            src={comment.user.photo}
                            alt={comment.user.name}
                            width={40} height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <User size={18} className="text-[#0b7a4b]" />
                        )}
                      </div>

                      <div className="flex-1 bg-gray-50 rounded-2xl px-5 py-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-gray-800">
                            {comment.user?.name ? `${comment.user.name} ${comment.user.surname || ''}` : 'Usuario'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        {/* Propiedad corregida: message */}
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {comment.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ratings individuales */}
            {ratings.length > 0 && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Star size={18} className="text-yellow-400 fill-yellow-400" />
                  Valoraciones
                </h2>

                {/* Promedio grande */}
                <div className="flex items-center gap-4 mb-6 p-5 bg-gray-50 rounded-2xl">
                  <span className="text-5xl font-black text-[#0b7a4b]">
                    {ratingAverage.toFixed(1)}
                  </span>
                  <div>
                    <StarRating score={ratingAverage} size={22} />
                    <p className="text-sm text-gray-500 mt-1">
                      Basado en {ratings.length} {ratings.length === 1 ? 'valoración' : 'valoraciones'}
                    </p>
                  </div>
                </div>

                {/* Lista */}
                <div className="flex flex-col gap-3">
                  {ratings.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-none">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0b7a4b]/10 flex items-center justify-center">
                          <User size={14} className="text-[#0b7a4b]" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {r.user?.name || 'Anónimo'}
                        </span>
                      </div>
                      <StarRating score={r.score} size={16} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── COLUMNA DERECHA (1/3) - STICKY ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 flex flex-col gap-5">

              {/* Precio + CTA */}
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">
                  Precio
                </p>
                <p className="text-4xl font-black text-[#0b7a4b] mb-1">
                  {price.toLocaleString('es-AR')}
                </p>
                <p className="text-sm text-gray-500 font-semibold mb-6">USD</p>

                <a
                  href={`https://wa.me/543513872817?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden w-full flex items-center justify-center gap-3 py-4 bg-linear-to-r from-[#0f8b57] to-[#14a366] hover:from-[#0d7a4d] hover:to-[#0f8b57] text-white font-bold text-base rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <BsWhatsapp size={20} />
                  Consultar por WhatsApp
                </a>

                <p className="text-center text-xs text-gray-500 mt-3">
                  Respondemos en menos de 24hs
                </p>
              </div>

              {/* Agente */}
              {agent && (
                <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-[#0b7a4b] uppercase tracking-wider mb-4">
                    Agente a cargo
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#0b7a4b]/10 flex items-center justify-center overflow-hidden shrink-0">
                      {agent.avatar ? (
                        <Image src={agent.avatar} alt={agent.name} width={56} height={56} className="object-cover" />
                      ) : (
                        <User size={24} className="text-[#0b7a4b]" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{agent.name}</p>
                      {agent.email && (
                        <p className="text-xs text-gray-500 mt-0.5">{agent.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen rápido */}
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-[#0b7a4b] uppercase tracking-wider mb-4">
                  Resumen
                </p>
                <ul className="space-y-3 text-sm">
                  {[
                    { label: 'Tipo',       value: typeOfProperty?.name },
                    { label: 'Operación',  value: operationType },
                    { label: 'Provincia',  value: provincia },
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