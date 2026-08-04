'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, X, ArrowRight, UserPlus, ClipboardList,
  Star, MessageSquare, Heart, TrendingDown, Megaphone,
} from 'lucide-react';
import { useAuth } from '@/modules/shared/context/AuthContext';
import api from '@/modules/shared/lib/axios';
import { PENDING_TOAST_KEY_PREFIX } from '@/modules/shared/lib/pendingNotifSession';
import { NotificationType } from '@/modules/shared/types/api';

/**
 * Banner de notificaciones pendientes al iniciar sesión (canal 3 de 4).
 *
 * Los otros tres canales son la sección de notificaciones del dashboard, la
 * campanita de la navbar y el email. Este cubre el aviso inmediato: apenas
 * entrás, te dice qué te quedó sin leer.
 *
 * ── Qué cambió respecto de la versión anterior ──────────────────────────────
 * Antes era UN toast de `sonner` con las 4 primeras notificaciones apiladas
 * dentro y `duration: Infinity` — no se iba nunca hasta que apretabas la X.
 * Ahora es un banner propio (sin `sonner`) que muestra las notificaciones
 * DE A UNA, en cola, cada una con su propio temporizador visible.
 *
 * ⚠️ La lógica de disparo NO cambió: mismo `useEffect` sobre `user`, misma
 * marca en `sessionStorage` (una vez por sesión, no por navegación), mismos
 * endpoints según rol, mismo filtro `!n.read`. Este componente sigue sin
 * marcar nada como leído — eso pasa solo en el panel de notificaciones.
 */

interface NotificacionMinima {
  id: number;
  title: string;
  message: string;
  read: boolean;
  /** Campo real del backend; opcional por las filas previas a la migración. */
  type?: NotificationType;
  createdAt: string;
}

/** Cuánto dura cada notificación en pantalla. Ajustar acá y listo. */
const DURACION_MS = 4000;

/** Cada cuánto se refresca la barra de progreso (~60fps). */
const TICK_MS = 16;

/** Tope de notificaciones que se encolan. Más que esto es spam, no aviso. */
const MAX_EN_COLA = 6;

/** Ícono y color por `NotificationType` del backend. */
const ESTILO_POR_TIPO: Record<NotificationType, { icon: React.ElementType; tono: string }> = {
  [NotificationType.ADMIN_NUEVO_USUARIO]:          { icon: UserPlus,      tono: 'bg-blue-50 text-blue-600' },
  [NotificationType.ADMIN_NUEVA_SOLICITUD]:        { icon: ClipboardList, tono: 'bg-amber-50 text-amber-600' },
  [NotificationType.ESTADO_SOLICITUD]:             { icon: ClipboardList, tono: 'bg-amber-50 text-amber-600' },
  [NotificationType.ADMIN_NUEVA_VALORACION]:       { icon: Star,          tono: 'bg-amber-50 text-amber-500' },
  [NotificationType.ADMIN_NUEVO_COMENTARIO]:       { icon: MessageSquare, tono: 'bg-sky-50 text-sky-600' },
  [NotificationType.ADMIN_COMENTARIO_PUBLICACION]: { icon: MessageSquare, tono: 'bg-sky-50 text-sky-600' },
  [NotificationType.RESPUESTA_COMENTARIO]:         { icon: MessageSquare, tono: 'bg-sky-50 text-sky-600' },
  [NotificationType.ADMIN_NUEVO_FAVORITO]:         { icon: Heart,         tono: 'bg-rose-50 text-rose-500' },
  [NotificationType.CAMBIO_PRECIO]:                { icon: TrendingDown,  tono: 'bg-emerald-50 text-emerald-600' },
  [NotificationType.NUEVA_PUBLICACION]:            { icon: Megaphone,     tono: 'bg-violet-50 text-violet-600' },
  [NotificationType.NUEVA_PROPIEDAD]:              { icon: Megaphone,     tono: 'bg-violet-50 text-violet-600' },
  [NotificationType.PROPIEDAD_MATCH]:              { icon: Star,          tono: 'bg-brand-50 text-brand-700' },
  [NotificationType.GENERICA]:                     { icon: Bell,          tono: 'bg-brand-50 text-brand-700' },
};

/**
 * Ícono y color de una notificación.
 *
 * Usa el campo `type` del backend. El matcheo por texto que había antes queda
 * sólo como fallback para las filas anteriores a la migración (ver la nota en
 * `dashboardAdmin/notificaciones/notifShared.tsx` — es transitorio).
 */
function estiloDe(title: string, message: string, type?: NotificationType) {
  if (type && ESTILO_POR_TIPO[type]) return ESTILO_POR_TIPO[type];

  const t = `${title} ${message}`.toLowerCase();
  if (t.includes('usuario registrado') || t.includes('se registró'))
    return { icon: UserPlus, tono: 'bg-blue-50 text-blue-600' };
  if (t.includes('solicitud'))
    return { icon: ClipboardList, tono: 'bg-amber-50 text-amber-600' };
  if (t.includes('valoración') || t.includes('calificó') || t.includes('estrella'))
    return { icon: Star, tono: 'bg-amber-50 text-amber-500' };
  if (t.includes('comentó') || t.includes('comentario') || t.includes('respondió'))
    return { icon: MessageSquare, tono: 'bg-sky-50 text-sky-600' };
  if (t.includes('favorito') || t.includes('guardó'))
    return { icon: Heart, tono: 'bg-rose-50 text-rose-500' };
  if (t.includes('bajó') || t.includes('precio'))
    return { icon: TrendingDown, tono: 'bg-emerald-50 text-emerald-600' };
  if (t.includes('publicación') || t.includes('publicacion'))
    return { icon: Megaphone, tono: 'bg-violet-50 text-violet-600' };
  return { icon: Bell, tono: 'bg-brand-50 text-brand-700' };
}

export function PendingNotificationsToast() {
  const { user, isLoading } = useAuth();
  // Evita que un doble render (StrictMode en dev) dispare dos veces.
  const yaDisparado = useRef(false);

  const [cola, setCola] = useState<NotificacionMinima[]>([]);
  const [indice, setIndice] = useState(0);
  /** 100 → 0. Es lo que dibuja la barra inferior. */
  const [progreso, setProgreso] = useState(100);
  const [pausado, setPausado] = useState(false);
  const [destino, setDestino] = useState('/dashboard/notificaciones');

  const actual = cola[indice];

  /** Pasa a la siguiente de la cola (o termina si no queda ninguna). */
  const siguiente = useCallback(() => {
    setIndice((i) => i + 1);
    setProgreso(100);
  }, []);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  // Mismo disparo que antes: una vez por sesión, apenas hay `user`.
  useEffect(() => {
    if (isLoading || !user || yaDisparado.current) return;

    const clave = `${PENDING_TOAST_KEY_PREFIX}${user.id}`;
    if (sessionStorage.getItem(clave)) return;

    yaDisparado.current = true;
    sessionStorage.setItem(clave, '1');

    const esAdmin = user.role === 'admin';
    setDestino(esAdmin ? '/dashboardAdmin/notificaciones' : '/dashboard/notificaciones');

    (async () => {
      try {
        const { data } = await api.get<NotificacionMinima[]>(
          esAdmin ? '/notifications/admin' : '/notifications',
        );
        const pendientes = data.filter((n) => !n.read).slice(0, MAX_EN_COLA);
        if (pendientes.length > 0) setCola(pendientes);
      } catch {
        // Silencioso: si falla, el usuario igual tiene la campanita y el panel.
      }
    })();
  }, [user, isLoading]);

  // ── Temporizador ──────────────────────────────────────────────────────────
  // Un `setInterval` que descuenta el progreso. Se corta solo cuando no hay
  // notificación visible o cuando el mouse está encima (pausa).
  //
  // Se descuenta sobre el valor previo en vez de calcular contra un timestamp
  // de inicio: así pausar y reanudar no requiere recordar cuánto tiempo estuvo
  // pausado — simplemente el intervalo deja de correr y retoma donde estaba.
  useEffect(() => {
    if (!actual || pausado) return;

    const paso = (100 * TICK_MS) / DURACION_MS;
    const id = setInterval(() => {
      setProgreso((p) => {
        if (p - paso <= 0) return 0;
        return p - paso;
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [actual, pausado, indice]);

  // Al llegar a 0, avanza. Va en su propio efecto y no dentro del `setProgreso`
  // de arriba: actualizar otro estado dentro del updater de `useState` es un
  // efecto secundario en pleno render y React lo penaliza.
  useEffect(() => {
    if (!actual || progreso > 0) return;
    const id = setTimeout(siguiente, 180); // deja correr la animación de salida
    return () => clearTimeout(id);
  }, [progreso, actual, siguiente]);

  const { icon: Icono, tono } = estiloDe(actual?.title ?? '', actual?.message ?? '', actual?.type);
  const restantes = cola.length - indice - 1;

  return (
    <div
      // `pointer-events-none` en el contenedor + `auto` en el banner: el hueco
      // alrededor no bloquea clicks en la página de abajo.
      //
      // El contenedor queda SIEMPRE montado (aunque no haya nada que mostrar):
      // si el componente devolviera `null` al agotarse la cola, la última
      // notificación se cortaría de golpe en vez de animar su salida, porque
      // `AnimatePresence` necesita seguir montado para animar al hijo que se va.
      className="pointer-events-none fixed right-0 bottom-0 z-100 flex w-full justify-end p-4 sm:p-6"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {actual && (
        <motion.div
          // `key` por id: al cambiar de notificación React desmonta la anterior
          // y monta la nueva, así `AnimatePresence` hace salida + entrada.
          key={actual.id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          // Pausa también con foco de teclado, para quien navega con Tab.
          onFocusCapture={() => setPausado(true)}
          onBlurCapture={() => setPausado(false)}
          role="status"
          className="pointer-events-auto w-full max-w-md overflow-hidden rounded-xl border border-ink-200/70 bg-white shadow-[0_20px_50px_-12px_rgba(10,12,11,0.35)]"
        >
          <div className="flex items-start gap-3.5 p-4">
            {/* Ícono según el tipo de evento */}
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tono}`}>
              <Icono size={20} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-ink-900">{actual.title}</p>
                {/* Posición en la cola — solo si queda más de una. */}
                {cola.length > 1 && (
                  <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-ink-600">
                    {indice + 1}/{cola.length}
                  </span>
                )}
              </div>

              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">
                {actual.message}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <Link
                  href={destino}
                  onClick={() => setIndice(cola.length)} // cierra toda la cola
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-800 active:scale-95"
                >
                  Ver detalle <ArrowRight size={13} />
                </Link>
                {restantes > 0 && (
                  <span className="text-[11px] font-medium text-ink-400">
                    y {restantes} más
                  </span>
                )}
              </div>
            </div>

            {/* Cierre manual: adelanta a la siguiente sin esperar los 4s. */}
            <button
              type="button"
              onClick={siguiente}
              aria-label={restantes > 0 ? 'Siguiente notificación' : 'Cerrar aviso'}
              className="-mt-0.5 shrink-0 cursor-pointer rounded-lg p-1.5 text-ink-400 transition-colors duration-200 hover:bg-surface hover:text-ink-700"
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Barra de progreso ──
              Arranca llena y se vacía de izquierda a derecha. `transform` y no
              `width`: escalar es una propiedad compuesta, no dispara layout en
              cada uno de los ~250 ticks. `origin-left` hace que se consuma
              desde la derecha en vez de encogerse hacia el centro. */}
          <div className="h-1 w-full bg-ink-100">
            <div
              className="h-full origin-left rounded-r-full"
              style={{
                transform: `scaleX(${progreso / 100})`,
                background: 'var(--gradient-brand)',
                // Sin transición: el propio intervalo ya actualiza a 60fps y
                // una transición encima haría que la barra vaya "atrasada".
                opacity: pausado ? 0.5 : 1,
                transition: 'opacity 200ms ease-out',
              }}
            />
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PendingNotificationsToast;
