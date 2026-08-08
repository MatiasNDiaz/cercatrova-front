'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { validateImageFile } from '@/modules/shared/lib/validateImage';
import { Field } from '@/modules/shared/ui/Field';
import { Input, inputBaseClasses } from '@/modules/shared/ui/Input';
import { Select } from '@/modules/shared/ui/Select';
import { toast } from 'sonner';
import { DashboardPage, DashboardHeader } from '@/modules/shared/ui/DashboardPage';
import { useFormDraft, draftKey } from '@/modules/shared/hooks/useFormDraft';
import { revalidatePropertyCaches } from '@/modules/properties/actions/revalidate-properties';
import {
  Save, ArrowLeft, Upload, X, Star, ImagePlus, Building2,
  MapPin, Ruler, DollarSign, Info, FileWarning, Trash2, GripVertical
} from 'lucide-react';

// ── TIPOS ─────────────────────────────────────────────────────────────────────
interface PropertyType { id: number; name: string; }

/**
 * Una posición de la galería, sea una imagen ya subida o una todavía local.
 *
 * ── Por qué UNA sola lista y no dos ──────────────────────────────────────────
 * Antes había `existingImages` y `newImages` en estados separados, y la portada
 * era un `isCover` que había que mantener sincronizado a mano entre los dos
 * (cada `setExistingCover` tenía que acordarse de apagar el cover de las nuevas,
 * y al revés). Con el drag & drop eso ya no alcanza: el admin tiene que poder
 * arrastrar una foto nueva delante de una vieja, y dos listas separadas no
 * pueden representar ese orden intercalado.
 *
 * Además desaparece el estado `isCover` del formulario: **la portada es la
 * posición 0**, misma invariante que respeta el backend. Un dato derivado no se
 * puede desincronizar.
 */
type GalleryItem =
  | { kind: 'existing'; key: string; id: number; url: string }
  | { kind: 'new'; key: string; file: File; preview: string };

/** URL a mostrar, sea de Cloudinary o un `blob:` local. */
const itemSrc = (item: GalleryItem) => (item.kind === 'existing' ? item.url : item.preview);

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'pendiente',  label: 'Pendiente' },
  { value: 'vendida',    label: 'Vendida' },
  { value: 'alquilada',  label: 'Alquilada' },
  { value: 'en pausa',   label: 'En pausa' },
];

const OP_OPTIONS = [
  { value: 'venta',    label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'temporal', label: 'Alquiler temporal' },
];

/**
 * Monedas admitidas por `Property.currency` en el backend.
 *
 * `short` es lo que se muestra entre paréntesis en el label del input de precio,
 * para que el rótulo del campo también cambie al elegir la moneda (antes decía
 * "Precio (USD)" fijo).
 */
const CURRENCY_OPTIONS = [
  { value: 'ARS', label: 'Pesos (ARS)',   short: 'ARS' },
  { value: 'USD', label: 'Dólares (USD)', short: 'USD' },
] as const;

// ── HELPERS ───────────────────────────────────────────────────────────────────
// `Field`, `Input` y `Select` ahora vienen de shared/ui (antes estaban duplicados acá).
function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <h2 className="text-sm font-bold text-[#0b7a4b] uppercase tracking-wider flex items-center gap-2 mb-4">
      <Icon size={14} />{label}
    </h2>
  );
}

// ── PROPS del componente ──────────────────────────────────────────────────────
interface PropertyFormProps {
  propertyId?: number; // si viene = modo edición
}

export default function PropertyForm({ propertyId }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = !!propertyId;
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [dragging, setDragging] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);

  // Galería completa, EN EL ORDEN EN QUE SE VA A GUARDAR (posición 0 = portada).
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  /**
   * Ids que YA existían al abrir el formulario.
   *
   * Sirve para identificar, en la respuesta del PATCH, cuáles imágenes son las
   * recién creadas: son las que no están en este conjunto. Sin eso no habría
   * forma de saber qué id le tocó a cada archivo recién subido, y por lo tanto
   * tampoco de armar el orden final para mandarlo al endpoint de reorder.
   */
  const [originalImageIds, setOriginalImageIds] = useState<number[]>([]);

  // Contador para las `key` de React de las imágenes locales. Un índice del
  // array NO sirve como key acá: al reordenar cambia y React remonta el <img>,
  // lo que hace parpadear la miniatura justo durante el arrastre.
  const nextKeyRef = useRef(0);

  // Índices del arrastre en curso (origen y destino), para el feedback visual.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const [form, setForm] = useState({
    title:           '',
    description:     '',
    typeOfPropertyId: '',
    operationType:   'venta',
    status:          'disponible',
    provincia:       'Córdoba',
    localidad:       '',
    barrio:          '',
    direccion:       '',
    zone:            '',
    rooms:           '',
    bathrooms:       '',
    supTotal:        '',
    supCubierta:     '',
    antiquity:       '',
    price:           '',
    // Coincide con el default del backend (`CreatePropertyDto` deja 'USD' si el
    // campo no viene): el formulario de alta arranca en dólares porque es lo que
    // tiene todo el catálogo cargado.
    currency:        'USD',
    // Opcional. String vacío = "no informadas" → se manda `null` al backend.
    expensas:        '',
    property_deed:   false,
    tractoAbreviado: false,
    boleto:          false,
    garage:          false,
    patio:           false,
    aptoMascotas:    false
  });

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  /**
   * ── Borrador automático ──
   *
   * Clave separada por modo: `..._new` para el alta y `..._<id>` para cada
   * edición. Si compartieran clave, empezar una propiedad nueva pisaría el
   * borrador de la que se estaba editando (y al revés).
   *
   * En modo edición se espera a que termine el fetch (`disabled: loading`):
   * sin eso, el `useState` inicial vacío se guardaría encima del borrador
   * antes de que llegue la respuesta del backend.
   *
   * ⚠️ Sólo se guardan los 21 campos de `form`. Las imágenes NO — ver la nota
   * de limitación en `useFormDraft.ts`: los `File` no son serializables y una
   * sola foto en base64 desbordaría la cuota de `sessionStorage`.
   */
  const storageKey = draftKey('property', isEdit ? propertyId! : 'new');
  const { restored: draftRestored, discard: discardDraft } = useFormDraft({
    key: storageKey,
    value: form,
    onRestore: setForm,
    disabled: loading,
  });

  // ── Cargar tipos de propiedad ──
  useEffect(() => {
    api.get('/property-types').then(r => setPropertyTypes(r.data)).catch(() => {});
  }, []);

  // ── Cargar datos si es edición ──
  useEffect(() => {
    if (!isEdit) return;
    const fetch = async () => {
      try {
        const { data } = await api.get(`/properties/${propertyId}`);
        setForm({
          title:            data.title ?? '',
          description:      data.description ?? '',
          typeOfPropertyId: data.typeOfProperty?.id?.toString() ?? '',
          operationType:    data.operationType ?? 'venta',
          status:           data.status ?? 'disponible',
          provincia:        data.provincia ?? 'Córdoba',
          localidad:        data.localidad ?? '',
          barrio:           data.barrio ?? '',
          direccion:        data.direccion ?? '',
          zone:             data.zone ?? '',
          rooms:            data.rooms?.toString() ?? '',
          bathrooms:        data.bathrooms?.toString() ?? '',
          supTotal:         data.supTotal?.toString() ?? '',
          supCubierta:      data.supCubierta?.toString() ?? '',
          antiquity:        data.antiquity?.toString() ?? '',
          price:            data.price?.toString() ?? '',
          // La moneda guardada manda: al editar hay que poder pasar de dólares a
          // pesos y al revés. El `?? 'USD'` sólo cubre una respuesta cacheada de
          // antes de que la columna existiera.
          currency:         data.currency ?? 'USD',
          // `?? ''` y no `?.toString() ?? ''`: `expensas: 0` es un valor válido
          // ("no tiene expensas") y con `||` se perdería, quedando el input
          // vacío como si nunca se hubiera cargado.
          expensas:         data.expensas != null ? String(data.expensas) : '',
          property_deed:    data.property_deed ?? false,
          tractoAbreviado:  data.tractoAbreviado ?? false,
          boleto:           data.boleto ?? false,
          garage:           data.garage ?? false,
          patio:            data.patio ?? false,
          aptoMascotas:     data.aptoMascotas ?? false
        });
        // El backend ya devuelve las imágenes ordenadas por `order ASC, id ASC`
        // (ver §6 de API_CONTRACT.md), así que se toman tal cual: reordenarlas
        // acá pisaría justamente lo que el admin guardó la última vez.
        const imagenes: { id: number; url: string }[] = data.images ?? [];
        setGallery(imagenes.map(img => ({
          kind: 'existing' as const,
          key: `ex-${img.id}`,
          id: img.id,
          url: img.url,
        })));
        setOriginalImageIds(imagenes.map(img => img.id));
      } catch {
        toast.error('No se pudo cargar la propiedad');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isEdit, propertyId]);

  /**
   * Agrega archivos validados al FINAL de la galería.
   *
   * ⚠️ Va en `useCallback` con dependencias reales — no es cosmético. Antes era
   * una función suelta que se redefinía en cada render, y `handleDrop` la
   * capturaba en un `useCallback` con `[]`: el drag & drop de archivos quedaba
   * usando para siempre la versión del PRIMER render, con la galería vacía, así
   * que el cálculo del tope de 10 se hacía contra el estado inicial y
   * arrastrando imágenes se podía pasar del límite. Soltar archivos con el
   * explorador nunca tuvo el bug, porque ese camino llamaba a `addFiles` directo
   * desde el render actual.
   */
  const addFiles = useCallback((files: File[]) => {
    // Validación client-side (tipo image/* y ≤ 5MB, límites del backend)
    const validFiles: File[] = [];
    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
      } else {
        validFiles.push(file);
      }
    }
    if (validFiles.length === 0) return;

    const available = 10 - gallery.length;
    if (available <= 0) { toast.error('Máximo 10 imágenes'); return; }
    const toAdd = validFiles.slice(0, available);
    const mapped: GalleryItem[] = toAdd.map((file) => ({
      kind: 'new' as const,
      key: `new-${nextKeyRef.current++}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setGallery(prev => [...prev, ...mapped]);
  }, [gallery]);

  // ── Drop de ARCHIVOS sobre la zona de subida ──
  // Definido DESPUÉS de `addFiles` y con él en las dependencias, para que
  // siempre use la versión actual (ver la nota de arriba).
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addFiles(files);
  }, [addFiles]);

  // ── Reordenar por arrastre (API nativa de HTML5, sin librería) ──
  /**
   * Mueve el ítem de `from` a `to` conservando el resto del orden.
   *
   * No es un swap: arrastrar la 5ª foto al primer lugar tiene que empujar a las
   * otras cuatro una posición, no intercambiarla con la que estaba primera.
   */
  const moveItem = (from: number, to: number) => {
    if (from === to) return;
    setGallery(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const endDrag = () => { setDragIndex(null); setOverIndex(null); };

  // ── Eliminar una imagen de la galería ──
  const removeAt = (index: number) => {
    const item = gallery[index];
    if (item.kind === 'existing') {
      // El borrado real lo hace el backend con `deleteImages` en el PATCH.
      setDeletedImageIds(prev => [...prev, item.id]);
    } else {
      // Liberar el `blob:` — si no, el archivo queda retenido en memoria
      // mientras viva la pestaña.
      URL.revokeObjectURL(item.preview);
    }
    setGallery(prev => prev.filter((_, i) => i !== index));
    // La portada NO hay que recalcularla: es la posición 0, y si se borró la
    // primera, la que ocupa su lugar pasa a serlo sola.
  };

  /**
   * Manda el orden final de la galería al backend, después de un PATCH exitoso.
   *
   * ── El problema que resuelve ────────────────────────────────────────────────
   * El orden lo decide el admin arrastrando miniaturas, pero las fotos recién
   * subidas no tienen id hasta que el backend las crea. Así que el orden no se
   * puede mandar junto con el PATCH: primero hay que enterarse de qué id le tocó
   * a cada archivo.
   *
   * La respuesta del PATCH (`findOne`) trae la galería completa. Las imágenes
   * cuyo id NO estaba en `originalImageIds` son las recién creadas, y vienen en
   * el mismo orden en que se subieron los archivos: `createMany` las inserta en
   * el orden del array de `newImages`, y el `id` es un SERIAL, así que ordenar
   * por id ascendente reconstruye exactamente ese orden. Con eso se puede
   * recorrer la galería local y resolver cada posición a un id real.
   *
   * ── Por qué un fallo acá no revierte nada ──────────────────────────────────
   * La propiedad ya se guardó bien; lo único que puede quedar pendiente es el
   * orden. Tirar un error acá haría creer que se perdió TODO lo editado. Se
   * avisa con un toast de advertencia y se sigue: el admin puede volver a
   * entrar y reacomodar. La portada, además, ya viajó en `setCoverImageId`.
   */
  const persistirOrden = async (
    imagenesGuardadas: { id: number }[],
    cantidadNuevas: number,
  ) => {
    if (gallery.length === 0) return;

    const previos = new Set(originalImageIds);
    const idsNuevos = imagenesGuardadas
      .filter(img => !previos.has(img.id))
      .sort((a, b) => a.id - b.id)
      .map(img => img.id);

    // Si el backend no devolvió tantas imágenes nuevas como archivos se
    // mandaron, el mapeo posición→id no es confiable: mejor no mandar un orden
    // adivinado que dejaría fotos en lugares al azar.
    if (idsNuevos.length !== cantidadNuevas) return;

    let cursor = 0;
    const imageIds = gallery.map(item =>
      item.kind === 'existing' ? item.id : idsNuevos[cursor++]
    );

    try {
      await api.patch(`/property-images/${propertyId}/reorder`, { imageIds });
    } catch (error) {
      toast.warning(`Se guardaron los cambios, pero no se pudo aplicar el orden de las imágenes: ${getErrorMessage(error)}`);
    }
  };

  // ── Submit ──
  const handleSubmit = async () => {
    // `direccion` es obligatoria en el DTO de creación del backend
    // (@IsNotEmpty): sin este chequeo el submit se comía un 400 genérico.
    if (!form.title || !form.typeOfPropertyId || !form.price || !form.direccion) {
      toast.error('Completá título, tipo de propiedad, dirección y precio');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title:            form.title,
        description:      form.description,
        typeOfPropertyId: Number(form.typeOfPropertyId),
        operationType:    form.operationType,
        status:           form.status,
        provincia:        form.provincia,
        localidad:        form.localidad,
        barrio:           form.barrio,
        direccion:        form.direccion,
        zone:             form.zone,
        rooms:            Number(form.rooms) || 0,
        bathrooms:        Number(form.bathrooms) || 0,
        supTotal:         Number(form.supTotal) || 0,
        supCubierta:      Number(form.supCubierta) || 0,
        antiquity:        Number(form.antiquity) || 0,
        price:            Number(form.price),
        currency:         form.currency,
        // Campo vacío → `null`, no `0`: son cosas distintas ("no informadas" vs
        // "no tiene expensas"), y el detalle público solo muestra la tarjeta
        // cuando hay un valor real. En el PATCH, mandar `null` explícito es
        // además la ÚNICA forma de borrar unas expensas ya cargadas: omitir el
        // campo las dejaría intactas.
        expensas:         form.expensas === '' ? null : Number(form.expensas),
        property_deed:    form.property_deed,
        tractoAbreviado:  form.tractoAbreviado,
        boleto:           form.boleto,
        garage:           form.garage,
        patio:            form.patio,
        aptoMascotas:     form.aptoMascotas,
        ...(isEdit && deletedImageIds.length > 0 && { deleteImages: deletedImageIds }),
        // Portada: la primera de la galería, si es una imagen que YA existe.
        //
        // El reorder de más abajo también fija la portada, así que esto es
        // redundante en el camino feliz. Se manda igual como red: si el reorder
        // fallara (red caída entre las dos llamadas), la portada queda correcta
        // de todos modos, que es el dato que se ve en el catálogo. Si la primera
        // es una imagen nueva todavía no tiene id, y ahí sí depende del reorder.
        ...(isEdit && (() => {
          const primera = gallery[0];
          return primera?.kind === 'existing' ? { setCoverImageId: primera.id } : {};
        })())
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));

      // Los archivos nuevos van EN EL ORDEN DE LA GALERÍA (no en el orden en que
      // se seleccionaron): `createMany` del backend les asigna `order` según la
      // posición en este array, así que al CREAR una propiedad el orden queda
      // bien sin necesidad de ninguna llamada extra.
      const archivosNuevos = gallery.filter(item => item.kind === 'new');
      archivosNuevos.forEach(img => {
        formData.append(isEdit ? 'newImages' : 'images', img.file);
      });

      // La instancia de axios (`shared/lib/axios.ts`) trae `Content-Type:
      // application/json` como default para TODAS las requests. Para FormData
      // eso es doblemente incorrecto: además de faltarle el boundary, si el
      // Content-Type efectivo sigue siendo 'application/json' en este punto,
      // el propio transformRequest de axios intenta JSON.stringify el
      // FormData (perdiendo los archivos) en vez de enviarlo como multipart.
      // `Content-Type: undefined` borra el default SOLO para esta llamada, así
      // axios detecta el FormData real y delega en el browser el armado del
      // header con el boundary correcto al serializar la request.
      const multipartConfig = { headers: { 'Content-Type': undefined } };

      // `idGuardada` sirve para invalidar el detalle y la ficha de ESTA
      // propiedad puntual. Al crear sale del id que devuelve el backend.
      let idGuardada = propertyId;

      if (isEdit) {
        const { data: actualizada } = await api.patch(`/properties/${propertyId}`, formData, multipartConfig);
        await persistirOrden(actualizada?.images ?? [], archivosNuevos.length);
        toast.success('Propiedad actualizada ✓');
      } else {
        // Al CREAR no hace falta reordenar: las imágenes se subieron ya en el
        // orden de la galería y `createMany` les asigna `order = 0..n-1` en ese
        // mismo orden, con la primera como portada.
        const { data: creada } = await api.post('/properties', formData, multipartConfig);
        idGuardada = creada?.id;
        toast.success('Propiedad publicada ✓');
      }

      // ── Invalidación de cachés de Next ──
      //
      // Sin esto, el admin guardaba y seguía viendo los datos VIEJOS en el
      // detalle, el catálogo y las Destacadas hasta apretar F5. Next no puede
      // enterarse solo: el guardado va por axios a un backend externo, no por
      // una Server Action ni por el `fetch()` que Next instrumenta.
      //
      // Va DESPUÉS del `await` del guardado y ANTES del `router.push`, y con
      // `await`: si se navegara primero, la página destino podría montarse
      // leyendo todavía la versión cacheada. Ver el docstring de la acción para
      // el detalle de qué caché purga cada `revalidatePath`.
      //
      // Su fallo NO rompe el guardado, que ya sucedió: se avisa que puede hacer
      // falta refrescar y se sigue. Tirar un error acá haría creer que no se
      // guardó nada.
      try {
        await revalidatePropertyCaches(idGuardada);
      } catch {
        toast.warning('Se guardó todo, pero puede que necesites refrescar para ver los cambios reflejados en el sitio público.');
      }

      // El borrador se limpia SOLO acá: si el guardado falló, el `catch` de
      // abajo lo deja intacto para que el admin no pierda lo cargado y pueda
      // reintentar. Es todo el punto de tener borrador.
      discardDraft();

      router.push('/dashboardAdmin/propiedades');
    } catch (error) {
      // El backend ahora valida el JSON del campo `data`: un 400 puede traer el
      // detalle de qué campo falló (array de class-validator), un 404 si el tipo
      // de propiedad no existe, o un 502 si Cloudinary falló (con rollback).
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const totalImages = gallery.length;

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
          <div className="h-3 bg-gray-200 rounded-full w-1/4 mb-5" />
          {/* `grid-cols-1` de base: a 375px dos inputs con label lado a lado
              quedaban en ~150px cada uno. Recién se parte en dos a partir de sm. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-10 bg-gray-200 rounded-xl" />
            <div className="h-10 bg-gray-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    // `width="form"` — mismo ancho que "Nueva publicación" y que los perfiles.
    // Antes heredaba el `max-w-7xl` del layout y era el formulario más ancho del
    // panel, con filas de input de 80rem imposibles de recorrer con la vista.
    <DashboardPage width="form">
      <DashboardHeader
        // Sigue siendo `router.back()`: se llega acá desde el listado y también
        // desde el detalle de una propiedad.
        back={{ onClick: () => router.back(), label: 'Volver' }}
        icon={Building2}
        iconTone="propiedad"
        title={isEdit ? 'Editar propiedad' : 'Nueva propiedad'}
        subtitle={isEdit
          ? 'Modificá los datos y guardá los cambios'
          : 'Completá los datos y subí las imágenes'}
      />

      {/* ── AVISO DE BORRADOR RECUPERADO ──
          Sólo aparece si al montar había algo guardado. Es importante que sea
          explícito: si el formulario apareciera lleno sin decir por qué, el
          admin no sabría si son datos reales de la propiedad o restos de una
          carga anterior. Y menciona lo de las imágenes, que es la única parte
          que el borrador no puede recuperar. */}
      {draftRestored && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FileWarning size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Recuperamos lo que habías cargado
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                Los campos se restauraron desde un borrador automático.
                {totalImages === 0 && ' Las imágenes sí tenés que volver a seleccionarlas.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              discardDraft();
              setForm({
                title: '', description: '', typeOfPropertyId: '', operationType: 'venta',
                status: 'disponible', provincia: 'Córdoba', localidad: '', barrio: '',
                direccion: '', zone: '', rooms: '', bathrooms: '', supTotal: '',
                supCubierta: '', antiquity: '', price: '', currency: 'USD',
                expensas: '', property_deed: false,
                tractoAbreviado: false, boleto: false, garage: false, patio: false,
                aptoMascotas: false
              });
              toast.success('Borrador descartado');
            }}
            className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-95"
          >
            <Trash2 size={13} /> Descartar borrador
          </button>
        </div>
      )}

      {/* ── IMÁGENES ── */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={ImagePlus} label={`Imágenes (${totalImages}/10)`} />

        {/* Drop zone — SOLO para archivos.
            El `types.includes('Files')` distingue el arrastre de un archivo del
            sistema operativo del arrastre INTERNO de una miniatura para
            reordenar: sin ese chequeo, pasar una miniatura por encima de esta
            zona la iluminaba en verde y anunciaba "Soltá las imágenes acá",
            como si fuera a subirse de nuevo. */}
        <div
          ref={dropRef}
          onDragOver={e => {
            if (!e.dataTransfer.types.includes('Files')) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            dragging
              ? 'border-[#0b7a4b] bg-[#0b7a4b]/5'
              : 'border-gray-200 hover:border-[#0b7a4b]/50 hover:bg-gray-50'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#0b7a4b]/10 flex items-center justify-center">
            <Upload size={22} className="text-[#0b7a4b]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-700">
              {dragging ? 'Soltá las imágenes acá' : 'Arrastrá imágenes o hacé click para seleccionar'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, WEBP — máximo 10 imágenes</p>
          </div>
          <input
            aria-label='a'
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files ?? []);
              addFiles(files);
              e.target.value = '';
            }}
          />
        </div>

        {/* ── PREVISUALIZACIÓN ORDENABLE ──
            Drag & drop con la API nativa de HTML5 (`draggable` + los eventos
            `dragstart`/`dragover`/`drop`), sin sumar ninguna dependencia. Con
            un máximo de 10 miniaturas en una grilla, no hace falta una librería
            de listas virtualizadas ni animaciones de reflow.

            Ya NO hay botón de portada: la portada es la primera de la fila, la
            misma invariante que garantiza el backend. Antes eran dos controles
            que podían contradecirse (una portada marcada con la estrella podía
            quedar en cualquier posición de la galería). */}
        {totalImages > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Previsualización — arrastrá para reordenar
            </p>
            <p className="text-xs text-gray-500 mb-3">
              La primera imagen es la <strong className="text-[#0b7a4b]">portada</strong>: es la que se ve en el catálogo y la que abre el detalle.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {gallery.map((item, idx) => {
                const esPortada = idx === 0;
                const arrastrando = dragIndex === idx;
                const esDestino = overIndex === idx && dragIndex !== null && dragIndex !== idx;
                return (
                  <div
                    key={item.key}
                    draggable
                    onDragStart={(e) => {
                      setDragIndex(idx);
                      // Firefox no inicia el arrastre si no hay datos seteados.
                      // El valor no se usa: el índice de origen vive en el estado.
                      e.dataTransfer.setData('text/plain', String(idx));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      // Sin `preventDefault()` el navegador no permite soltar.
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (overIndex !== idx) setOverIndex(idx);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      // `stopPropagation` para que el drop no burbujee hasta la
                      // zona de subida de archivos, que también escucha drops.
                      e.stopPropagation();
                      if (dragIndex !== null) moveItem(dragIndex, idx);
                      endDrag();
                    }}
                    onDragEnd={endDrag}
                    className={`relative group rounded-xl overflow-hidden aspect-square bg-gray-100 cursor-grab active:cursor-grabbing transition-all ${
                      arrastrando ? 'opacity-40 scale-95' : ''
                    } ${
                      esDestino ? 'ring-2 ring-[#0b7a4b] ring-offset-2' : ''
                    } ${
                      esPortada ? 'ring-2 ring-amber-400' : ''
                    }`}
                  >
                    {/* `draggable={false}` en la imagen: si no, el navegador
                        arrastra la IMAGEN en vez del contenedor y el evento
                        `dragstart` del `<div>` nunca llega con el índice. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={itemSrc(item)}
                      alt={esPortada ? 'Portada de la propiedad' : `Imagen ${idx + 1} de la propiedad`}
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all pointer-events-none" />

                    {/* Número de posición: el orden tiene que ser legible sin
                        depender de la disposición de la grilla, que cambia con
                        el ancho de pantalla (2 a 5 columnas). */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
                      {esPortada ? (
                        <span className="flex items-center gap-1 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          <Star size={9} fill="white" /> Portada
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-[10px] font-black">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Badge "Nueva" solo en las que todavía no se subieron */}
                    {item.kind === 'new' && (
                      <div className="absolute bottom-2 left-2 bg-[#0b7a4b] text-white text-[9px] font-black px-2 py-0.5 rounded-full pointer-events-none">
                        Nueva
                      </div>
                    )}

                    {/* Asa visual de arrastre */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <GripVertical size={16} className="text-white drop-shadow" />
                    </div>

                    <button
                      type="button"
                      aria-label={`Quitar imagen ${idx + 1}`}
                      title="Quitar imagen"
                      onClick={() => removeAt(idx)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── INFO BÁSICA ── */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={Info} label="Información básica" />
        <div className="flex flex-col gap-4">
          <Field label="Título">
            <Input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Ej: Casa amplia con jardín en Nueva Córdoba" />
          </Field>
          <Field label="Descripción">
            {/* textarea: usa las clases base sueltas porque no hay componente <Textarea> */}
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={4} className={`${inputBaseClasses} border-gray-200 focus:border-brand-700 resize-none`}
              placeholder="Describí la propiedad en detalle..." />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Tipo de propiedad">
              <Select aria-label="Tipo de propiedad" value={form.typeOfPropertyId} onChange={e => set('typeOfPropertyId', e.target.value)}>
                <option value="">Seleccionar...</option>
                {propertyTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Operación">
              <Select aria-label="Operación" value={form.operationType} onChange={e => set('operationType', e.target.value)}>
                {OP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            <Field label="Estado">
              <Select aria-label="Estado" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>
          </div>
        </div>
      </div>

      {/* ── UBICACIÓN ── */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={MapPin} label="Ubicación" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Provincia">
            <Input value={form.provincia} onChange={e => set('provincia', e.target.value)}
              placeholder="Córdoba" />
          </Field>
          <Field label="Localidad">
            <Input value={form.localidad} onChange={e => set('localidad', e.target.value)}
              placeholder="Ej: Villa Carlos Paz" />
          </Field>
          <Field label="Barrio">
            <Input value={form.barrio} onChange={e => set('barrio', e.target.value)}
              placeholder="Ej: Nueva Córdoba" />
          </Field>
          {/* Dirección: es la que alimenta el mapa del detalle */}
          <Field label="Dirección">
            <Input value={form.direccion} onChange={e => set('direccion', e.target.value)}
              placeholder="Ej: Av. San Martín 1250" />
          </Field>
          <Field label="Zona">
            <Input value={form.zone} onChange={e => set('zone', e.target.value)}
              placeholder="Ej: sierras, norte, centro" />
          </Field>
        </div>
      </div>

      {/* ── CARACTERÍSTICAS ── */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={Ruler} label="Características" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Field label="Habitaciones">
            <Input type="number" min="0" value={form.rooms} onChange={e => set('rooms', e.target.value)}
              placeholder="0" />
          </Field>
          <Field label="Baños">
            <Input type="number" min="0" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)}
              placeholder="0" />
          </Field>
          <Field label="Sup. Total (m²)">
            <Input type="number" min="0" value={form.supTotal} onChange={e => set('supTotal', e.target.value)}
              placeholder="0" />
          </Field>
          <Field label="Sup. Cubierta (m²)">
            <Input type="number" min="0" value={form.supCubierta} onChange={e => set('supCubierta', e.target.value)}
              placeholder="0" />
          </Field>
          <Field label="Antigüedad (años)">
            <Input type="number" min="0" value={form.antiquity} onChange={e => set('antiquity', e.target.value)}
              placeholder="0" />
          </Field>
        </div>

        {/* Atributos booleanos */}
        <div className="flex flex-wrap gap-3 mt-5">
          {[
            // Documentación legal: independientes entre sí, se pueden combinar
            { key: 'property_deed',   label: 'Con escritura' },
            { key: 'tractoAbreviado', label: 'Tracto abreviado' },
            { key: 'boleto',          label: 'Con boleto' },
            { key: 'garage',          label: 'Con garage' },
            { key: 'patio',           label: 'Con patio' },
            { key: 'aptoMascotas',    label: 'Apto mascotas' },
          ].map(({ key, label }) => (
            <button key={key} type="button"
              onClick={() => set(key, !form[key as keyof typeof form])}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                form[key as keyof typeof form]
                  ? 'bg-[#0b7a4b]/10 border-[#0b7a4b]/40 text-[#0b7a4b]'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#0b7a4b]/30'
              }`}>
              <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                form[key as keyof typeof form] ? 'bg-[#0b7a4b] border-[#0b7a4b]' : 'border-gray-400'
              }`}>
                {form[key as keyof typeof form] && <span className="text-white text-[10px] font-black">✓</span>}
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRECIO ── */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <SectionTitle icon={DollarSign} label="Precio" />

        {/* El input de precio ocupaba el ancho completo. Ahora comparte fila con
            el selector de moneda: el monto sin la moneda no dice nada, y verlos
            juntos evita cargar 85000 pensando en dólares con "Pesos" tildado. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Field label={`Precio (${CURRENCY_OPTIONS.find(c => c.value === form.currency)?.short ?? 'USD'})`}>
            <div className="relative">
              {/* El símbolo sigue a la moneda elegida: con "Pesos" tildado
                  mostrar "US$" sería contradecir el propio formulario. */}
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0b7a4b] font-black text-sm">
                {form.currency === 'ARS' ? '$' : 'US$'}
              </span>
              {/* Único campo que NO usa <Input>: necesita pl-8 (no px-4) para dejar
                  lugar al símbolo superpuesto. Como el proyecto no usa tailwind-merge,
                  pasar pl-8 por className dejaría px-4 y pl-8 compitiendo y el
                  ganador dependería del orden del CSS generado. Se deja explícito.
                  `pl-12` con "US$", que es más ancho que "$". */}
              <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                className={`w-full ${form.currency === 'ARS' ? 'pl-8' : 'pl-12'} pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400`}
                placeholder={form.currency === 'ARS' ? 'Ej: 45000000' : 'Ej: 85000'} />
            </div>
          </Field>

          {/* ── MONEDA ──
              Son checkboxes por pedido explícito, pero el comportamiento es
              MUTUAMENTE EXCLUYENTE: `set('currency', value)` pisa el valor, no
              lo togglea, así que tildar uno destilda el otro sin lógica extra.
              Una propiedad no puede tener dos monedas, y un toggle real
              permitiría dejar las dos tildadas (o ninguna) y mandar un valor
              inválido al backend.

              `role="radiogroup"` + `aria-checked`: para un lector de pantalla
              esto ES un grupo de opciones excluyentes, aunque se dibuje con
              cuadraditos. Sin eso se anunciarían como casillas independientes. */}
          <Field label="Moneda">
            <div role="radiogroup" aria-label="Moneda del precio" className="flex flex-wrap gap-3">
              {CURRENCY_OPTIONS.map(({ value, label }) => {
                const active = form.currency === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set('currency', value)}
                    className={`flex flex-1 items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      active
                        ? 'bg-[#0b7a4b]/10 border-[#0b7a4b]/40 text-[#0b7a4b]'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#0b7a4b]/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                      active ? 'bg-[#0b7a4b] border-[#0b7a4b]' : 'border-gray-400'
                    }`}>
                      {active && <span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* ── EXPENSAS ──
              Va en la sección de Precio y no en Características porque es plata,
              no una característica edilicia. Opcional: una casa no paga
              expensas, y dejarlo vacío NO bloquea la publicación (el submit solo
              exige título, tipo, dirección y precio).
              Ocupa la fila entera en desktop: queda debajo del par
              precio/moneda, que es la información con la que se relaciona. */}
          <div className="lg:col-span-2">
            <Field
              label="Expensas (opcional)"
              hint="Monto mensual. Siempre en pesos, aunque el precio esté en dólares."
            >
              <div className="relative">
                {/* Siempre "$": las expensas no siguen a `currency`. */}
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0b7a4b] font-black text-sm">$</span>
                <input type="number" min="0" value={form.expensas} onChange={e => set('expensas', e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#0b7a4b] focus:bg-white transition-all placeholder:text-gray-400"
                  placeholder="Ej: 45000 — dejalo vacío si no tiene" />
              </div>
            </Field>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pb-4">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
          <ArrowLeft size={15} /> Cancelar
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0f8b57, #14a366)' }}>
          <Save size={15} />
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Publicar propiedad'}
        </button>
      </div>

    </DashboardPage>
  );
}